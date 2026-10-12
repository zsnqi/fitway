import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { canonical, inside } from "./core.mjs";

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
	const folder = resolve(root, ".publish-lock");
	const deadline = Date.now() + 60000;
	for (;;) {
		try {
			await mkdir(folder);
			await writeFile(
				resolve(folder, "owner.json"),
				JSON.stringify({ pid: process.pid }),
			);
			return () => removeCacheFolder(root, folder);
		} catch (error) {
			if (error.code !== "EEXIST") throw error;
			let alive = true;
			try {
				const { pid } = JSON.parse(
					await readFile(resolve(folder, "owner.json"), "utf8"),
				);
				if (!Number.isInteger(pid) || pid < 1)
					throw new Error("Invalid cache lock owner");
				try {
					process.kill(pid, 0);
				} catch (cause) {
					alive = cause.code !== "ESRCH";
				}
			} catch {
				const info = await stat(folder).catch(() => null);
				alive = info && Date.now() - info.mtimeMs < 60000;
			}
			if (!alive) {
				await removeCacheFolder(root, folder);
				continue;
			}
			if (Date.now() >= deadline)
				throw new Error("Baseline cache publication lock timed out");
			await new Promise((done) => setTimeout(done, 50));
		}
	}
}
