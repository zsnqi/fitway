// Validate a fresh gardener survey output folder outside worktrees and temp root.
import { existsSync, realpathSync } from "node:fs";
import path from "node:path";
import { ToolStartupError } from "../../../scripts/agent-environment/tool-contract.mjs";
import { inside, key } from "./facts.mjs";

// The survey's --out is a value it cannot use unless it is a fresh folder under the temp root,
// outside every worktree; each refusal is a start-up failure printed as C4's line.
export function validateOutput(out, worktrees, tempRoot) {
	const fix = `pass --out a fresh absolute folder under ${tempRoot}, such as ${path.join(tempRoot, "gardener-<date>")}`;
	if (
		!path.isAbsolute(out) ||
		!inside(tempRoot, out) ||
		key(out) === key(tempRoot)
	)
		throw new ToolStartupError(
			`--out must be an absolute fresh directory under ${tempRoot}`,
			fix,
		);
	if (existsSync(out))
		throw new ToolStartupError(`Output directory already exists: ${out}`, fix);
	let ancestor = path.dirname(out);
	while (!existsSync(ancestor)) ancestor = path.dirname(ancestor);
	const resolved = path.join(
		realpathSync.native(ancestor),
		path.relative(ancestor, out),
	);
	if (
		!inside(realpathSync.native(tempRoot), resolved) ||
		worktrees.some((worktree) => inside(worktree.path, resolved))
	)
		throw new ToolStartupError(
			"Output aliases a worktree or escapes the temp root",
			fix,
		);
}
