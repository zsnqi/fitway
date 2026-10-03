import {
	mkdirSync,
	mkdtempSync,
	realpathSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pathKey, samePath } from "./path-identity.mjs";

let root: string;
let long: string;

beforeAll(() => {
	root = mkdtempSync(path.join(tmpdir(), "fitway-path-identity-test-"));
	long = realpathSync.native(root);
	mkdirSync(path.join(root, "existing"));
	writeFileSync(path.join(root, "existing/entry.mjs"), "// Fixture\n");
});

afterAll(() => {
	if (!root) return;
	const relative = path.relative(realpathSync.native(tmpdir()), long);
	if (
		relative.includes(path.sep) ||
		!relative.startsWith("fitway-path-identity-test-")
	)
		throw new Error(`Unsafe fixture cleanup: ${root}`);
	rmSync(root, { recursive: true, force: true });
});

describe("Q2: filesystem path identity (short TEMP exercises 8.3 aliases)", () => {
	it("matches existing folders and entry files across short and long ancestors", async () => {
		for (const suffix of ["", "existing/", "existing/entry.mjs"])
			await expect(
				samePath(path.join(root, suffix), path.join(long, suffix)),
			).resolves.toBe(true);
	});
	it("matches uncreated descendants across short and long ancestors", async () => {
		await expect(
			samePath(
				path.join(root, "existing/new/deeper/file.md"),
				path.join(long, "existing/new/deeper/file.md"),
			),
		).resolves.toBe(true);
	});
	it.skipIf(process.platform !== "win32")(
		"folds Windows letter case for existing and new paths",
		async () => {
			for (const suffix of [
				"existing/entry.mjs",
				"existing/New/Deeper/file.md",
			])
				await expect(
					samePath(
						path.join(root, suffix),
						path.join(long, suffix).toUpperCase(),
					),
				).resolves.toBe(true);
		},
	);
	it("keeps different existing and missing paths distinct", async () => {
		await expect(samePath(root, path.join(long, "existing"))).resolves.toBe(
			false,
		);
		await expect(
			samePath(
				path.join(root, "first/file.md"),
				path.join(long, "second/file.md"),
			),
		).resolves.toBe(false);
	});
	it.skipIf(process.platform === "win32")(
		"preserves case in uncreated POSIX paths",
		async () => {
			await expect(pathKey(path.join(root, "New/file.md"))).resolves.not.toBe(
				await pathKey(path.join(root, "new/file.md")),
			);
		},
	);
});
