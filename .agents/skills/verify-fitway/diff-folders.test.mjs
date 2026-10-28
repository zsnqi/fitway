import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, resolve } from "node:path";
import test from "node:test";
import { diffFolders } from "./diff-folders.mjs";

async function fakeDiff(_command, args) {
	const a = args[1];
	const b = args[2];
	const json = args[args.indexOf("--json") + 1];
	const left = await readFile(a);
	const right = await readFile(b);
	if (basename(a) === "size.png") {
		await writeFile(
			json,
			JSON.stringify({
				tool: "diff_map",
				a,
				b,
				sameSize: false,
				ok: false,
				sizeA: [1, 1],
				sizeB: [2, 1],
			}),
		);
		throw new Error("diff_map exited 2");
	}
	await writeFile(
		json,
		JSON.stringify({
			tool: "diff_map",
			a,
			b,
			sameSize: true,
			identical: left.equals(right),
			bbox: [1, 2, 4, 5],
			changedPixels: 1,
		}),
	);
}

test("diff-folders reports nested equal, changed, size and only-a PNGs", async () => {
	const root = await mkdtemp(resolve(tmpdir(), "verify-fitway-diff-folders-"));
	const a = resolve(root, "a");
	const b = resolve(root, "b");
	const out = resolve(root, "out");
	const lines = [];
	const original = console.log;
	try {
		await mkdir(resolve(a, "nested"), { recursive: true });
		await mkdir(resolve(b, "nested"), { recursive: true });
		await writeFile(resolve(a, "nested/equal.png"), Buffer.from([1]));
		await writeFile(resolve(b, "nested/equal.png"), Buffer.from([1]));
		await writeFile(resolve(a, "nested/pixel.png"), Buffer.from([0]));
		await writeFile(resolve(b, "nested/pixel.png"), Buffer.from([1]));
		await writeFile(resolve(a, "nested/size.png"), Buffer.from([0]));
		await writeFile(resolve(b, "nested/size.png"), Buffer.from([0, 0]));
		await writeFile(resolve(a, "nested/only-a.png"), Buffer.from([2]));
		console.log = (line) => lines.push(line);
		await assert.rejects(
			diffFolders(
				{ a, b, out },
				{
					tools: dirname(a),
					child: fakeDiff,
				},
			),
			/PNG folders differ/,
		);
	} finally {
		console.log = original;
		await rm(root, { recursive: true, force: true });
	}
	assert.deepEqual(lines.slice(0, 4), [
		"EQUAL nested/equal.png",
		"ONLY-A nested/only-a.png",
		"DIFFERENT nested/pixel.png; region [1,2,4,5]; changed pixels 1",
		"SIZE nested/size.png; a 1x1; b 2x1",
	]);
	assert.match(
		lines.at(-1),
		/DIFF-FOLDERS SUMMARY: 1 equal; 1 different; 1 size; 1 only-a; 0 only-b/,
	);
});
