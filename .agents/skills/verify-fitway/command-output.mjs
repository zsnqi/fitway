// Create command output manifests with checkout and runtime metadata.
import { execFileSync } from "node:child_process";
import { finishOutputManifest, freshEmptyOutput } from "./core.mjs";
import { repository } from "./discover.mjs";

function git(root, args) {
	return execFileSync("git", ["-C", root, ...args], {
		encoding: "utf8",
		windowsHide: true,
	}).trim();
}

export function checkoutIdentity(root = repository) {
	try {
		return {
			commit: git(root, ["rev-parse", "HEAD"]),
			branch: git(root, ["branch", "--show-current"]) || null,
		};
	} catch {
		return { commit: null, branch: null };
	}
}

export async function withOutputCommand(target, details, task) {
	const metadata = {
		...details,
		checkout: details.checkout || (() => checkoutIdentity()),
		startedAt: details.startedAt || new Date().toISOString(),
	};
	const out = freshEmptyOutput(target, details.command, metadata);
	let exitStatus = 0;
	try {
		return await task(out, metadata);
	} catch (error) {
		exitStatus = 1;
		throw error;
	} finally {
		await finishOutputManifest(out, exitStatus);
	}
}
