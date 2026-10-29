// Codex launch, resume, process streaming, and snapshots.

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import {
	mkdir,
	open,
	readdir,
	readFile,
	realpath,
	stat,
	writeFile,
} from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { createInterface } from "node:readline";
import { recordedBriefDelivery } from "./brief-format.mjs";
import { briefTitle } from "./brief-markdown.mjs";
import { outcomeIdsFromBrief } from "./brief-readings.mjs";
import { checkBrief, formatBriefResult } from "./check-brief.mjs";
import {
	assertFresh,
	assertOutsideGit,
	codexEnvironment,
	DEEPSEEK_MODEL,
	decodeMessageFile,
	findCodex,
	readDeepSeekCatalog,
	repositoryRoot,
	resolvePath,
	sha256,
	validateModelLevel,
	writeCatalog,
} from "./codex-environment.mjs";
import {
	assertReviewSourcesAtLaunch,
	inspectBriefReview,
	optionalFile,
} from "./codex-review-launch.mjs";
import { readGit } from "./git-context.mjs";
import { samePath } from "./path-identity.mjs";

function briefIdentity(options, brief) {
	const round = briefTitle(brief.toString("utf8"));
	if (!round) throw new Error("brief has no Markdown title");
	const repository = readGit(path.dirname(options.brief), [
		"rev-parse",
		"--show-toplevel",
	]);
	return {
		briefPath: path.relative(repository, options.brief).replaceAll("\\", "/"),
		briefSha256: sha256(brief),
		round,
		report: path.join(options.run, "last-message.md"),
	};
}

function assertBriefTracked(options) {
	readGit(path.dirname(options.brief), [
		"ls-files",
		"--error-unmatch",
		options.brief,
	]);
}

async function prepareLaunch(options) {
	const environment = await codexEnvironment();
	// The checker is the first launch gate; it never fills or rewrites the brief.
	const result = await checkBrief({ repositoryRoot, briefPath: options.brief });
	if (!result.ok) {
		const failure = result.problems.find(
			(problem) => problem.severity === "FAIL",
		);
		throw new Error(
			`brief:check failed (${failure.rule}, line ${failure.line}): ${failure.message}`,
		);
	}
	if (result.role !== "codex") throw new Error("brief must have role: codex");
	options.level = validateModelLevel(options.model, options.level);
	const worktree = resolvePath(result.worktree);
	if (readGit(worktree, ["status", "--short"]))
		throw new Error("target worktree has uncommitted changes");
	assertBriefTracked(options);
	await assertFresh(options.run);
	const [executable, brief] = await Promise.all([
		findCodex(),
		readFile(options.brief),
	]);
	const identity = briefIdentity(options, brief);
	const outcomeIds = outcomeIdsFromBrief(brief);
	if (!outcomeIds.size)
		throw new Error(
			'brief has no outcome IDs; add each outcome and limit as a bullet such as "- **X1.**" outside its environment block',
		);
	const named = brief
		.toString("utf8")
		.replace(/<!--[\s\S]*?-->/g, "")
		.match(
			/^- \*\*Worktree:\*\* `[^`]+`, branch `[^`]+`, HEAD `([^`]+)`\s*$/m,
		)?.[1];
	const namedHead = readGit(worktree, ["rev-parse", `${named}^{commit}`]);
	const head = readGit(worktree, ["rev-parse", "HEAD"]);
	await assertReviewSourcesAtLaunch(brief, worktree, namedHead, head);
	const review = await inspectBriefReview(
		options,
		executable,
		brief,
		worktree,
		namedHead,
		environment,
	);
	if (review.refusal === "new-review") throw new Error(review.reason);
	if (review.refusal === "failed-review") throw new Error(review.reason);
	if (review.refusal === "unreadable-review") throw new Error(review.reason);
	if (review.refusal === "unanswered-readings") throw new Error(review.reason);
	if (review.refusal === "brief-hash") throw new Error(review.reason);
	const note =
		head === namedHead
			? Buffer.alloc(0)
			: Buffer.from(
					`Launch note: HEAD ${head} only adds this brief over the named HEAD.\n\n`,
				);
	const input = Buffer.concat([note, brief]);
	const metadata = {
		version: 1,
		worktree,
		head,
		...identity,
		level: options.level,
		model: options.model,
	};
	if (result.requiredChanges.length) {
		metadata.requiredChanges = [];
		for (const reference of result.requiredChanges) {
			const before = await contentSnapshot(reference.absolute);
			if (before.kind === "missing")
				throw new Error(
					`must change path disappeared before launch: ${reference.path}`,
				);
			metadata.requiredChanges.push({ ...reference, before });
		}
	}
	const catalog =
		options.model === DEEPSEEK_MODEL
			? await readDeepSeekCatalog(options.run)
			: undefined;
	if (catalog) metadata.catalogSha256 = catalog.sha256;
	await mkdir(options.run, { recursive: true });
	await assertFresh(options.run);
	await writeCatalog(catalog);
	// Exclusive creation also arbitrates simultaneous launches into an empty folder.
	await writeFile(
		path.join(options.run, "run.json"),
		`${JSON.stringify(metadata, null, 2)}\n`,
		{ flag: "wx" },
	);
	await writeFile(path.join(options.run, "input.md"), input, { flag: "wx" });
	for (const [name, bytes] of [
		["review-readings.md", review.readings],
		["review-dispositions.md", review.dispositions],
	]) {
		if (bytes !== undefined)
			await writeFile(path.join(options.run, name), bytes, {
				flag: "wx",
			});
	}
	console.log(formatBriefResult(result));
	return {
		metadata,
		input,
		brief,
		delivers: result.delivers,
		executable,
		environment,
		outcomeIds,
	};
}

// Compare bytes and file names, never Git status, timestamps, or the final report.
async function contentSnapshot(absolute, ancestors = new Set()) {
	let details;
	try {
		details = await stat(absolute);
	} catch (error) {
		if (error.code === "ENOENT" || error.code === "ENOTDIR")
			return { kind: "missing" };
		throw error;
	}
	if (details.isFile())
		return {
			kind: "file",
			sha256: createHash("sha256")
				.update(await readFile(absolute))
				.digest("hex"),
		};
	if (!details.isDirectory())
		throw new Error(`cannot record content of non-file path: ${absolute}`);
	const identity = await realpath(absolute);
	if (ancestors.has(identity))
		throw new Error(`cannot record recursive folder link: ${absolute}`);
	const nextAncestors = new Set([...ancestors, identity]);
	const files = [];
	for (const name of (await readdir(absolute)).sort()) {
		const content = await contentSnapshot(
			path.join(absolute, name),
			nextAncestors,
		);
		if (content.kind === "file") files.push([name, content.sha256]);
		else if (content.kind === "directory")
			for (const [file, hash] of Object.entries(content.files))
				files.push([`${name}/${file}`, hash]);
		else
			throw new Error(
				`path disappeared while recording content: ${path.join(absolute, name)}`,
			);
	}
	return { kind: "directory", files: Object.fromEntries(files) };
}

async function recordRequiredChanges(metadata, events) {
	if (!metadata.requiredChanges?.length) return;
	const comparisons = [];
	for (const { before, ...reference } of metadata.requiredChanges) {
		const after = await contentSnapshot(reference.absolute);
		const changed = JSON.stringify(before) !== JSON.stringify(after);
		comparisons.push({ ...reference, before, after, changed });
		if (!changed)
			console.log(
				`Required change unchanged: ${reference.path} (brief line ${reference.line}: ${reference.outcome})`,
			);
	}
	const target = path.join(
		path.dirname(events),
		path
			.basename(events)
			.replace(/^events/, "required-changes")
			.replace(/\.jsonl$/, ".json"),
	);
	await writeFile(target, `${JSON.stringify(comparisons, null, 2)}\n`, {
		flag: "wx",
	});
}

async function firstThread(run) {
	const file = await open(path.join(run, "events.jsonl"), "r");
	try {
		const buffer = Buffer.alloc(65536);
		const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
		const end = buffer.subarray(0, bytesRead).indexOf(10);
		if (end < 0) throw new Error("event stream has no complete first line");
		const event = JSON.parse(buffer.subarray(0, end).toString("utf8"));
		if (
			event.type !== "thread.started" ||
			!/^[\w-]+$/.test(event.thread_id ?? "")
		)
			throw new Error("first event has no thread id");
		return event.thread_id;
	} finally {
		await file.close();
	}
}

async function prepareResume(options) {
	const environment = await codexEnvironment();
	await assertOutsideGit(options.run);
	const metadata = JSON.parse(
		await readFile(path.join(options.run, "run.json"), "utf8"),
	);
	let level;
	try {
		level = validateModelLevel(metadata.model, metadata.level);
	} catch {
		throw new Error("invalid run metadata");
	}
	if (
		metadata.version !== 1 ||
		level !== metadata.level ||
		typeof metadata.worktree !== "string" ||
		!path.isAbsolute(metadata.worktree) ||
		!(await samePath(
			readGit(metadata.worktree, ["rev-parse", "--show-toplevel"]),
			metadata.worktree,
		))
	)
		throw new Error("invalid run metadata");
	let input;
	if (options.messageFile !== undefined) {
		try {
			input = await readFile(options.messageFile);
		} catch (error) {
			if (error.code === "ENOENT" || error.code === "ENOTDIR")
				throw new Error(`message file not found: ${options.messageFile}`);
			throw error;
		}
		input = decodeMessageFile(input, options.messageFile);
	} else {
		input =
			options.message === undefined
				? await readFile(path.join(options.run, "input.md"))
				: Buffer.from(options.message, "utf8");
	}
	const launchInput =
		options.message === undefined && options.messageFile === undefined
			? input
			: ((await optionalFile(path.join(options.run, "input.md"))) ??
				Buffer.alloc(0));
	const outcomeIds = outcomeIdsFromBrief(launchInput);
	if (!outcomeIds.size)
		throw new Error(
			'brief has no outcome IDs; add each outcome and limit as a bullet such as "- **X1.**" outside its environment block',
		);
	const delivers = recordedBriefDelivery(launchInput);
	if (!delivers)
		throw new Error(
			"brief has no delivers field; add delivers: commit or delivers: report to its first line",
		);
	const catalog =
		metadata.model === DEEPSEEK_MODEL
			? await readDeepSeekCatalog(options.run)
			: undefined;
	if (catalog) {
		await writeCatalog(catalog, "w");
		metadata.catalogSha256 = catalog.sha256;
		await writeFile(
			path.join(options.run, "run.json"),
			`${JSON.stringify(metadata, null, 2)}\n`,
		);
	}
	return {
		metadata,
		input,
		brief: launchInput,
		delivers,
		thread: await firstThread(options.run),
		executable: await findCodex(),
		catalog,
		environment,
		outcomeIds,
	};
}

async function capture(run, resume) {
	for (let index = 1; ; index += 1) {
		const suffix = !resume ? "" : `-resume${index === 1 ? "" : `-${index}`}`;
		const events = path.join(run, `events${suffix}.jsonl`);
		const stderr = path.join(run, `stderr${suffix}.txt`);
		try {
			const file = await open(events, "wx");
			return {
				file,
				events,
				stderr,
				last: path.join(run, "last-message.md"),
			};
		} catch (error) {
			if (!resume || error.code !== "EEXIST") throw error;
		}
	}
}

// The exec stream reports only the turn's total; Codex's session file has each
// request, and the first one is what the run carried before reading anything.
async function recordStartLoad(run, thread) {
	const target = path.join(run, "start-load.json");
	try {
		await stat(target);
		return;
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
	}
	const sessions = path.join(
		process.env.CODEX_HOME || path.join(homedir(), ".codex"),
		"sessions",
	);
	let names = [];
	try {
		names = await readdir(sessions, { recursive: true });
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
	}
	const name = names.find((entry) => {
		const base = path.basename(entry);
		return base.startsWith("rollout-") && base.endsWith(`-${thread}.jsonl`);
	});
	if (!name) {
		console.log(`Start load: no session file for thread ${thread}`);
		return;
	}
	const session = path.join(sessions, name);
	const input = createReadStream(session);
	try {
		for await (const line of createInterface({ input })) {
			let usage;
			try {
				const event = JSON.parse(line);
				if (event.type === "event_msg" && event.payload?.type === "token_count")
					usage = event.payload.info?.last_token_usage;
			} catch {
				continue;
			}
			if (!Number.isInteger(usage?.input_tokens)) continue;
			const record = {
				thread,
				session,
				input_tokens: usage.input_tokens,
				cached_input_tokens: usage.cached_input_tokens ?? null,
			};
			await writeFile(target, `${JSON.stringify(record, null, 2)}\n`, {
				flag: "wx",
			});
			console.log(
				`Start load: ${usage.input_tokens} input tokens in the first request`,
			);
			return;
		}
	} finally {
		input.destroy();
	}
	console.log(`Start load: no token count in ${session}`);
}

export {
	capture,
	prepareLaunch,
	prepareResume,
	recordRequiredChanges,
	recordStartLoad,
};
