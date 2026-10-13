import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { canonical, claimResource, inside } from "./core.mjs";

export async function removeCacheFolder(root, folder) {
	if (
		!inside(canonical(root), canonical(folder)) ||
		resolve(root) === resolve(folder)
	)
		throw new Error(`Cache cleanup escapes its root: ${folder}`);
	await rm(folder, { recursive: true, force: true });
}

// Serialize publication/eviction across CLI processes, including file fixtures.
export async function cacheLock(root) {
	const claim = await claimResource(resolve(root, ".publish-claims"));
	return claim.release;
}
