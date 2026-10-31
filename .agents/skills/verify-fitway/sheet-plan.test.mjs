import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import {
	planSheetFrames,
	readSheetFrames,
	sheetCommand,
} from "./sheet-command.mjs";
import { frameLayout, manifestDensity, parseSheetRows } from "./sheet-plan.mjs";

test("sheet rows keep order and split only at --row", () => {
	const rows = parseSheetRows([
		"quiet=quiet.png",
		"packed=packed.png",
		"--row",
		"desktop=desktop.png",
	]);
	assert.deepEqual(
		rows.map((row) => row.map(({ label }) => label)),
		[["quiet", "packed"], ["desktop"]],
	);
});

test("sheet density comes from the frames manifest or falls back to one", () => {
	const path = resolve("frames", "en-phone.png");
	assert.equal(
		manifestDensity(
			{
				items: [{ file: "en-phone.png", density: 3 }],
			},
			path,
		),
		3,
	);
	assert.equal(manifestDensity({ items: [] }, path), 1);
	assert.equal(manifestDensity(null, path), 1);
});

test("sheet layout divides both PNG dimensions by density", () => {
	const layout = frameLayout({
		label: "phone",
		path: "phone.png",
		pngWidth: 1170,
		pngHeight: 2532,
		density: 3,
	});
	assert.equal(layout.drawnWidth, 390);
	assert.equal(layout.drawnHeight, 844);
});

test("sheet tokens refuse an empty label, missing separator and missing PNG", async () => {
	assert.throws(() => parseSheetRows(["=phone.png"]), /Empty sheet label/);
	assert.throws(() => parseSheetRows(["phone"]), /Invalid sheet frame/);
	const root = await mkdtemp(resolve(tmpdir(), "verify-fitway-sheet-"));
	try {
		const missing = resolve(root, "missing.png");
		await assert.rejects(
			sheetCommand(
				{
					extra: [`phone=${missing}`],
					out: root,
					commandManifest: {},
				},
				{
					browserHarness: () => {
						throw new Error("browser must not start");
					},
				},
			),
			/Missing sheet PNG .*missing\.png/,
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test("unreadable PNG bytes are refused before a browser starts", async () => {
	const root = await mkdtemp(resolve(tmpdir(), "verify-fitway-sheet-"));
	try {
		const file = resolve(root, "broken.png");
		await writeFile(file, "not a png");
		const files = await readSheetFrames(parseSheetRows([`broken=${file}`]));
		await assert.rejects(
			planSheetFrames(files, () => {
				throw new Error("not a PNG");
			}),
			/Unreadable PNG .*broken\.png/,
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});
