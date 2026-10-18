// Codex round execution, report evaluation, and tool entry.

import { access, appendFile, open } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline";
import { finished } from "node:stream/promises";
import {
	autoResumeMessage,
	claimResumeMessage,
	firstLine,
} from "./brief-readings.mjs";
import { recordTurn, reportClaimFailures } from "./codex-commit-records.mjs";
import {
	codexOptions,
	DEEPSEEK_MODEL,
	MAX_AUTO_RESUMES,
	modelArgs,
	sha256,
} from "./codex-environment.mjs";
import { startCodex } from "./codex-process.mjs";
import { appendReportCheck, parseReport } from "./codex-report.mjs";
import { optionalFile } from "./codex-review-launch.mjs";
import {
	capture,
	prepareLaunch,
	prepareResume,
	recordRequiredChanges,
	recordStartLoad,
} from "./codex-session.mjs";
import { resolveToolArguments, toolFailure } from "./tool-contract.mjs";

async function runCodex(options, prepared, input, resume) {
	const output = await capture(options.run, resume);
	const { environment, metadata, executable, thread } = prepared;
	const catalogPath =
		metadata.model === DEEPSEEK_MODEL
			? path.join(options.run, "model-catalog.json")
			: undefined;
	const args = [
		"exec",
		"--approve-for-me",
		"-C",
		metadata.worktree,
		...modelArgs(metadata.model, metadata.level, catalogPath),
		"--json",
		"-o",
		output.last,
		...(resume ? ["resume", thread] : []),
		"-",
	];
	console.log(`Run folder: ${options.run}`);
	const stream = output.file.createWriteStream();
	const errorFile = await open(output.stderr, "wx");
	const errorStream = errorFile.createWriteStream();
	const child = startCodex(
		executable,
		args,
		metadata.worktree,
		environment,
		"pipe",
	);
	let started = thread;
	let reported = false;
	const lines = createInterface({ input: child.stdout });
	lines.on("line", (line) => {
		try {
			const event = JSON.parse(line);
			if (
				!reported &&
				event.type === "thread.started" &&
				typeof event.thread_id === "string"
			) {
				console.log(`Thread id: ${event.thread_id}`);
				started ??= event.thread_id;
				reported = true;
			}
		} catch {
			// Preserve even incomplete or non-JSON output in the event stream.
		}
	});
	child.stdout.pipe(stream);
	child.stderr.pipe(process.stderr, { end: false });
	child.stderr.pipe(errorStream);
	child.stdin.on("error", (error) => {
		if (error.code !== "EPIPE") console.error(`codex-round: ${error.message}`);
	});
	const completion = new Promise((resolve, reject) => {
		child.once("error", reject);
		child.once("close", (code, signal) =>
			resolve(code ?? (signal === "SIGINT" ? 130 : 1)),
		);
	});
	child.stdin.end(input);
	let code;
	try {
		[code] = await Promise.all([
			completion,
			finished(stream),
			finished(errorStream),
		]);
	} finally {
		if (child.exitCode === null) child.kill();
		lines.close();
		stream.destroy();
		errorStream.destroy();
		await output.file.close();
		await errorFile.close();
	}
	await recordRequiredChanges(metadata, output.events);
	// A missing measurement never changes the run's exit code.
	if (started && /^[\w-]+$/.test(started))
		await recordStartLoad(options.run, started).catch((error) =>
			console.error(`codex-round: start load not recorded: ${error.message}`),
		);
	return {
		code,
		thread: started,
		events: output.events,
		stderr: output.stderr,
	};
}

async function evaluateReport(report, prepared, run, events) {
	if (!report.present) return [];
	const checked = await reportClaimFailures(
		report,
		prepared.brief,
		prepared.metadata,
		run,
		prepared.delivers,
		events,
	);
	checked.record.accepted = !checked.failures.length;
	await appendReportCheck(run, checked.record);
	return checked.failures;
}

async function execute(options, prepared) {
	let input = prepared.input;
	let resume = options.resume;
	let autoResumes = 0;
	for (;;) {
		const startedAt = new Date();
		const result = await runCodex(options, prepared, input, resume);
		if (result.code === 0 && result.thread && /^[\w-]+$/.test(result.thread))
			prepared.thread = result.thread;
		if (result.code !== 0) {
			await recordTurn(
				options.run,
				prepared.metadata.worktree,
				{ ...result, startedAt },
				"non-zero exit",
			);
			return result.code;
		}
		const last = await optionalFile(path.join(options.run, "last-message.md"));
		const message = last?.toString("utf8") ?? "";
		const report = parseReport(message, {
			delivers: prepared.delivers,
			outcomeIds: prepared.outcomeIds,
		});
		const claimFailures = await evaluateReport(
			report,
			prepared,
			options.run,
			result.events,
		);
		if (report.present && !claimFailures.length) {
			await recordTurn(
				options.run,
				prepared.metadata.worktree,
				{ ...result, startedAt },
				report.stopped ? "STOPPED" : "report accepted",
			);
			return 0;
		}
		if (autoResumes >= MAX_AUTO_RESUMES) {
			await recordTurn(
				options.run,
				prepared.metadata.worktree,
				{ ...result, startedAt },
				"resume limit",
			);
			console.error(
				`codex-round: run ended without a report after ${MAX_AUTO_RESUMES} automatic resumes`,
			);
			return 1;
		}
		const stopReason = claimFailures.length
			? "claim check failed"
			: "no report";
		await recordTurn(
			options.run,
			prepared.metadata.worktree,
			{ ...result, startedAt },
			stopReason,
		);
		const line = firstLine(message);
		await appendFile(
			path.join(options.run, "auto-resumes.log"),
			`${JSON.stringify({
				time: new Date().toISOString(),
				exitCode: result.code,
				firstLine: line,
				...(claimFailures.length ? { claimFailures } : {}),
			})}\n`,
		);
		autoResumes += 1;
		resume = true;
		input = Buffer.from(
			claimFailures.length
				? claimResumeMessage(claimFailures)
				: autoResumeMessage(line),
			"utf8",
		);
	}
}

export async function main(args) {
	let options;
	try {
		options = Array.isArray(args)
			? codexOptions(resolveToolArguments("codex:round", args))
			: codexOptions(args);
		const requiredPath = options.resume ? options.run : options.brief;
		try {
			await access(requiredPath);
			if (options.messageFile) await access(options.messageFile);
		} catch {
			throw new Error(
				`${options.resume ? "folder" : "brief file"} not found: ${requiredPath}`,
			);
		}
		const prepared = options.resume
			? await prepareResume(options)
			: await prepareLaunch(options);
		return await execute(options, prepared);
	} catch (error) {
		if (options?.brief) {
			const brief = await optionalFile(options.brief).catch(() => undefined);
			if (brief) console.log(`Current brief SHA-256: ${sha256(brief)}`);
		}
		const fix = /not found:/.test(error.message)
			? "pass an existing path; run pnpm codex:round --help"
			: "run pnpm codex:round --help";
		console.error(toolFailure("codex:round", error, fix));
		return 1;
	}
}
