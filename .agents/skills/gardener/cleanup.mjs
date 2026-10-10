import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import { changedRecords, classifyFolders, key, references } from "./facts.mjs";
import {
	collectFolderRecords,
	collectGit,
	collectRecords,
	measureFolder,
	root,
	safeDeletionPath,
} from "./survey.mjs";

// This module is called only by the user-run script emitted outside the checkout.
export async function cleanup(snapshot, { checkout = root } = {}) {
	if (
		key(snapshot.root) !== key(checkout) ||
		!path.isAbsolute(snapshot.tempRoot)
	)
		throw new Error("Cleanup snapshot has a different checkout or temp root");
	const tempRoot = path.resolve(snapshot.tempRoot);
	// Lazily collect once at execution time, even if collection fails. Never reuse
	// the survey's citations, and never rescan all tracked text for each proposal.
	let collected;
	const currentRecords = () =>
		(collected ??= (async () => {
			const context = await collectRecords({ checkout });
			const folderRecords = await collectFolderRecords(context.records, {
				checkout,
				tempRoot,
			});
			return { context, folderRecords };
		})());
	let failed = 0;
	for (const candidate of snapshot.folders) {
		try {
			const target = safeDeletionPath(candidate.path, tempRoot);
			if (!target) {
				console.log(`SKIP absent: ${candidate.path}`);
				continue;
			}
			const { context, folderRecords } = await currentRecords();
			const citations = references(candidate.path, folderRecords, { tempRoot });
			if (citations.length)
				throw new Error(
					`Folder cited by ${citations.map((citation) => `${citation.source}:${citation.line}: ${citation.text}`).join("; ")}`,
				);
			const changed = changedRecords(snapshot.records, context.records);
			if (changed.length)
				throw new Error(
					`Open records changed: ${changed.join(", ")}; run a fresh survey`,
				);
			const state = await collectGit(context.records, {
				current: checkout,
				worktreeRoot: candidate.path,
			});
			const measured = await measureFolder(candidate.path);
			const [current] = classifyFolders(
				[measured],
				folderRecords,
				state.worktrees,
				tempRoot,
				Date.now(),
			);
			if (!current.candidate)
				throw new Error(
					"Folder is too young, referenced, linked, unreadable, or contains a protected/dirty worktree",
				);
			if (
				current.bytes !== candidate.bytes ||
				current.files !== candidate.files ||
				current.modifiedAt !== candidate.modifiedAt
			)
				throw new Error("Folder changed since survey; run a fresh survey");
			if (process.platform === "win32")
				execFileSync(
					process.env.ComSpec ?? "C:/Windows/System32/cmd.exe",
					["/d", "/s", "/c", `rmdir /s /q "${target}"`],
					{
						windowsHide: true,
						windowsVerbatimArguments: true,
						stdio: "inherit",
					},
				);
			else rmSync(target, { recursive: true });
			if (existsSync(target)) throw new Error("rmdir left the folder in place");
			console.log(`REMOVED: ${candidate.path}`);
		} catch (error) {
			failed++;
			console.error(`FAILED: ${candidate.path}: ${error.message}`);
		}
	}
	console.log(
		`CLEANUP ${failed ? "FAIL" : "PASS"}: ${snapshot.folders.length} proposed folders, ${failed} failures; continued after each failure`,
	);
	process.exitCode = failed ? 1 : 0;
}
