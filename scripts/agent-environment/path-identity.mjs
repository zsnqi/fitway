import { realpath } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

// Resolve existing ancestors too: declared (new) paths can contain short aliases
// even though the final file or folder has not been created yet.
export async function pathKey(value) {
	let current = path.resolve(value);
	const missing = [];
	for (;;) {
		try {
			const existing = await realpath(current);
			const resolved = path.resolve(existing, ...missing.reverse());
			return process.platform === "win32" ? resolved.toLowerCase() : resolved;
		} catch (error) {
			if (error.code !== "ENOENT" && error.code !== "ENOTDIR") throw error;
			const parent = path.dirname(current);
			if (parent === current) throw error;
			missing.push(path.basename(current));
			current = parent;
		}
	}
}

export async function samePath(left, right) {
	const [leftKey, rightKey] = await Promise.all([
		pathKey(left),
		pathKey(right),
	]);
	return leftKey === rightKey;
}
