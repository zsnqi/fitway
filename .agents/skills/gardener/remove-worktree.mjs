import { realpath, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inside, key } from "./facts.mjs";
import {
	collectGit,
	collectRecords,
	filesystemPath,
	git,
	inspectWorktreeLinks,
	plainPath,
} from "./survey.mjs";

// User-run proposal only. Recheck the target at execution, never trust an old survey.
export async function removeWorktree(checkout, target) {
	if (!path.isAbsolute(checkout) || !path.isAbsolute(target))
		throw new Error("Checkout and worktree must be absolute paths");
	const context = await collectRecords({ checkout });
	const state = await collectGit(context.records, { current: checkout });
	const tree = state.worktrees.find((item) => key(item.path) === key(target));
	if (!tree) throw new Error(`Unregistered worktree: ${target}`);
	if (!tree.linksSafe)
		throw new Error(
			`unsafe worktree links: ${target}: ${JSON.stringify({ links: tree.links, errors: tree.linkErrors })}`,
		);
	if (!tree.candidate)
		throw new Error(`Worktree no longer qualifies for removal: ${target}`);
	// Git for Windows can follow directory links or leave dangling internal links.
	// unlink removes each link itself, never its target, after the whole tree qualifies.
	for (const link of tree.links) {
		if (
			!inside(
				tree.path,
				plainPath(await realpath(filesystemPath(path.dirname(link.path)))),
			)
		)
			throw new Error(`Link parent now aliases outside worktree: ${link.path}`);
		await unlink(filesystemPath(link.path));
	}
	const after = await inspectWorktreeLinks(tree.path);
	if (!after.linksMeasured || after.links.length || after.linkErrors.length)
		throw new Error(`Worktree links changed before removal: ${tree.path}`);
	// A tracked internal symlink is now a deletion made by this helper; the tree
	// was clean before unlinking, so allow only these known deletions through Git.
	const removed = git(
		["diff", "--name-only", "--diff-filter=D", "-z"],
		tree.path,
	)
		.split("\0")
		.filter(Boolean);
	const changed = git(["diff", "--name-only", "-z"], tree.path)
		.split("\0")
		.filter(Boolean);
	if (
		git(["diff", "--cached", "--name-only"], tree.path) ||
		git(["ls-files", "--others", "--exclude-standard"], tree.path) ||
		changed.some(
			(file) =>
				!removed.includes(file) ||
				!tree.links.some(
					(link) => key(path.resolve(tree.path, file)) === key(link.path),
				),
		)
	)
		throw new Error(`Worktree changed during removal checks: ${tree.path}`);
	git(
		[
			"worktree",
			"remove",
			...(removed.length ? ["--force"] : []),
			"--",
			tree.path,
		],
		checkout,
	);
	console.log(`REMOVED worktree: ${tree.path}`);
}

if (
	process.argv[1] &&
	path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
	const [checkoutFlag, checkout, worktreeFlag, target, ...extra] =
		process.argv.slice(2);
	if (
		checkoutFlag !== "--checkout" ||
		worktreeFlag !== "--worktree" ||
		extra.length ||
		!checkout ||
		!target
	) {
		console.error(
			"Usage: node remove-worktree.mjs --checkout <absolute-checkout> --worktree <absolute-worktree>",
		);
		process.exitCode = 1;
	} else {
		removeWorktree(checkout, target).catch((error) => {
			console.error(`REFUSED: ${error.message}`);
			process.exitCode = 1;
		});
	}
}
