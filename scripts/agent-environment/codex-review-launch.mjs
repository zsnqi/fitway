// Review-source copying and pre-launch review inspection.

import { mkdir, open, readdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { finished } from "node:stream/promises";
import { parseReadings, reviewProcedure } from "./brief-readings.mjs";
import {
	isCredentialSource,
	namedReviewSourceEntries,
	reviewSourcePlan,
} from "./brief-review-sources.mjs";
import {
	assertOutsideGit,
	catalogPathFor,
	readDeepSeekCatalog,
	repositoryRoot,
	sha256,
	writeCatalog,
} from "./codex-environment.mjs";
import { startCodex } from "./codex-session.mjs";
import { pathKey } from "./path-identity.mjs";

async function optionalFile(filename) {
	try {
		return await readFile(filename);
	} catch (error) {
		if (error.code === "ENOENT") return undefined;
		throw error;
	}
}

async function reviewFolders(root, basename) {
	let entries;
	try {
		entries = await readdir(root, { withFileTypes: true });
	} catch (error) {
		if (error.code === "ENOENT") return [];
		throw error;
	}
	return entries
		.filter(
			(entry) => entry.isDirectory() && entry.name.startsWith(`${basename}-`),
		)
		.map((entry) => ({
			name: entry.name,
			number: Number(entry.name.slice(basename.length + 1)),
		}))
		.filter(
			(entry) =>
				/^[1-9]\d*$/.test(entry.name.slice(basename.length + 1)) &&
				Number.isSafeInteger(entry.number),
		)
		.sort((a, b) => b.number - a.number);
}

export async function copyReviewSources(folder, brief, worktree, head) {
	const sources = path.join(folder, "sources");
	await mkdir(sources, { recursive: true });
	const targets = new Map();
	for (const { value } of namedReviewSourceEntries(brief)) {
		const source = await reviewSourcePlan(value, {
			worktree,
			head,
			checkoutRoot: repositoryRoot,
		});
		if (isCredentialSource(value, source.bytes))
			throw new Error(`named review source holds credentials: ${value}`);
		const target = path.join(sources, ...source.target.split("/"));
		const targetKey = await pathKey(target);
		if (targets.has(targetKey))
			throw new Error(`two named review sources map to one file: ${value}`);
		targets.set(targetKey, value);
		await mkdir(path.dirname(target), { recursive: true });
		await writeFile(target, source.bytes, { flag: "wx" });
	}
}

async function assertReviewSourcesAtLaunch(brief, worktree, namedHead, head) {
	if (namedHead === head) return;
	for (const { value } of namedReviewSourceEntries(brief)) {
		const before = await reviewSourcePlan(value, {
			worktree,
			head: namedHead,
			checkoutRoot: repositoryRoot,
		});
		if (before.kind !== "repository") continue;
		let after;
		try {
			after = await reviewSourcePlan(value, {
				worktree,
				head,
				checkoutRoot: repositoryRoot,
			});
		} catch (error) {
			throw new Error(
				`repository review source changed before launch: ${value}; ${error.message}`,
			);
		}
		if (!before.bytes.equals(after.bytes))
			throw new Error(
				`repository review source differs between named HEAD ${namedHead} and launch HEAD ${head}: ${value}`,
			);
	}
}

async function runReview(
	folder,
	executable,
	brief,
	worktree,
	head,
	environment,
) {
	const catalog = await readDeepSeekCatalog(folder);
	const { args, prompt } = await reviewProcedure(
		folder,
		catalogPathFor(catalog),
	);
	await writeFile(path.join(folder, "brief.md"), brief, { flag: "wx" });
	await writeFile(path.join(folder, "prompt.md"), prompt, { flag: "wx" });
	await copyReviewSources(folder, brief, worktree, head);
	await writeCatalog(catalog);
	const record = path.join(folder, "review.json");
	await writeFile(
		record,
		`${JSON.stringify({
			status: "running",
			sha256: sha256(brief),
			catalogSha256: catalog.sha256,
		})}\n`,
		{ flag: "wx" },
	);
	const log = await open(path.join(folder, "review.log"), "wx");
	const stream = log.createWriteStream();
	const child = startCodex(executable, args, folder, environment);
	child.stdin.on("error", (error) => {
		if (error.code !== "EPIPE") console.error(`codex-round: ${error.message}`);
	});
	const completion = new Promise((resolve, reject) => {
		child.once("error", reject);
		child.once("close", (code, signal) =>
			resolve(code ?? (signal === "SIGINT" ? 130 : 1)),
		);
	});
	child.stdout.pipe(stream);
	child.stdin.end(Buffer.from(prompt, "utf8"));
	let code;
	try {
		[code] = await Promise.all([completion, finished(stream)]);
	} finally {
		if (child.exitCode === null) child.kill();
		stream.destroy();
		await log.close();
	}
	await writeFile(
		record,
		`${JSON.stringify({
			status: code === 0 ? "complete" : "failed",
			exitCode: code,
			sha256: sha256(brief),
			catalogSha256: catalog.sha256,
		})}\n`,
	);
}

async function inspectBriefReview(
	options,
	executable,
	brief,
	worktree,
	head,
	environment,
) {
	const root = path.resolve(
		process.env.FITWAY_BRIEF_REVIEW_ROOT ||
			path.join(
				process.platform === "win32" ? "D:/fitway-temp" : tmpdir(),
				"brief-review",
			),
	);
	const basename = path.basename(options.brief, path.extname(options.brief));
	const snapshot = {
		folder: undefined,
		readings: undefined,
		dispositions: undefined,
	};
	const refuse = (refusal, reason) => ({ ...snapshot, refusal, reason });
	try {
		await assertOutsideGit(root);
		const folders = await reviewFolders(root, basename);
		const fresh = options.newReview || !folders.length;
		snapshot.folder = path.join(
			root,
			fresh ? `${basename}-${(folders[0]?.number ?? 0) + 1}` : folders[0].name,
		);
		if (fresh) {
			await mkdir(root, { recursive: true });
			// Exclusive creation prevents simultaneous requests sharing a review.
			await mkdir(snapshot.folder);
			await assertOutsideGit(snapshot.folder);
			console.log(`Review folder: ${snapshot.folder}`);
			await runReview(
				snapshot.folder,
				executable,
				brief,
				worktree,
				head,
				environment,
			);
		} else {
			await assertOutsideGit(snapshot.folder);
			console.log(`Review folder: ${snapshot.folder}`);
		}
		snapshot.readings = await optionalFile(
			path.join(snapshot.folder, "last.md"),
		);
		snapshot.dispositions = await optionalFile(
			path.join(snapshot.folder, "dispositions.md"),
		);
		const record = await optionalFile(
			path.join(snapshot.folder, "review.json"),
		);
		if (record) {
			const status = JSON.parse(record.toString("utf8"));
			if (status.status !== "complete" || status.exitCode !== 0)
				return refuse(
					"failed-review",
					`review failed or is unfinished (Codex exit ${status.exitCode ?? "unknown"}); inspect ${snapshot.folder}`,
				);
		}
		const readings =
			snapshot.readings && parseReadings(snapshot.readings.toString("utf8"));
		if (!readings)
			return refuse(
				"unreadable-review",
				`review answer cannot be read as readings; inspect ${snapshot.folder}`,
			);
		if (fresh) {
			console.log(
				`Readings:\n${readings.length ? readings.map((reading) => `Reading ${reading.id}:\n${reading.text}`).join("\n\n") : "No such readings."}`,
			);
			console.log(
				`Write coordinator dispositions to: ${path.join(snapshot.folder, "dispositions.md")}`,
			);
			return refuse(
				"new-review",
				"review completed; record its dispositions before launching",
			);
		}
		const dispositions = snapshot.dispositions?.toString("utf8") ?? "";
		const missing = readings.filter((reading) => {
			const answers = [
				...dispositions.matchAll(
					new RegExp(`^Reading ${reading.id}: (.+)\\r?$`, "gm"),
				),
			];
			return (
				answers.length !== 1 ||
				!/^(?:closed(?:\s.*)?|left open\s*[:\u2014-]\s*\S.*)$/i.test(
					answers[0][1].trim(),
				)
			);
		});
		if (missing.length)
			return refuse(
				"unanswered-readings",
				`readings without a disposition: ${missing.map((reading) => `Reading ${reading.id} (${reading.text.split(/\r?\n/)[0]})`).join("; ")}; write ${path.join(snapshot.folder, "dispositions.md")}`,
			);
		const hashes = [
			...dispositions.matchAll(/^Brief SHA-256: ([a-fA-F0-9]{64})\r?$/gm),
		];
		if (hashes.length !== 1 || hashes[0][1].toLowerCase() !== sha256(brief))
			return refuse(
				"brief-hash",
				`dispositions must name the current brief SHA-256; write ${path.join(snapshot.folder, "dispositions.md")}`,
			);
		return snapshot;
	} catch (error) {
		return refuse(
			"failed-review",
			`review failed: ${error.message}; inspect ${snapshot.folder ?? root}`,
		);
	}
}

export { assertReviewSourcesAtLaunch, inspectBriefReview, optionalFile };
