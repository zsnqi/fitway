// Validate chosen frame files and render them into one labelled contact sheet.
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { jsonOutput, outputFile } from "./core.mjs";
import { renderFrameSheet } from "./frame-sheet-render.mjs";
import { frameLayout, manifestDensity, parseSheetRows } from "./sheet-plan.mjs";

// Reads every frame's PNG bytes, refusing a missing or unreadable file by its path.
export async function readSheetFrames(rows) {
	return Promise.all(
		rows.map((row) =>
			Promise.all(
				row.map(async (frame) => ({
					...frame,
					png: await readFile(frame.path).catch((error) => {
						throw new Error(
							`${error.code === "ENOENT" ? "Missing" : "Unreadable"} sheet PNG ${frame.path}`,
							{ cause: error },
						);
					}),
				})),
			),
		),
	);
}

async function frameManifest(folder, cache) {
	if (!cache.has(folder))
		cache.set(
			folder,
			await readFile(resolve(folder, "manifest.json"), "utf8")
				.then(JSON.parse)
				.catch(() => null),
		);
	return cache.get(folder);
}

// Plans each read frame's drawn CSS size from its decoded PNG and its frames manifest's density.
export async function planSheetFrames(files, decodePng) {
	const manifests = new Map();
	return Promise.all(
		files.map((row) =>
			Promise.all(
				row.map(async (frame) => {
					let png;
					try {
						png = decodePng(frame.png);
					} catch (error) {
						throw new Error(`Unreadable PNG ${frame.path}: ${error.message}`, {
							cause: error,
						});
					}
					const folder = dirname(frame.path);
					const density = manifestDensity(
						await frameManifest(folder, manifests),
						frame.path,
					);
					return {
						...frameLayout({
							...frame,
							pngWidth: png.w,
							pngHeight: png.h,
							density,
						}),
						png: frame.png,
					};
				}),
			),
		),
	);
}

function measuredFrames(planned, measured) {
	return planned.flat().map((frame, index) => ({
		label: frame.label,
		path: frame.path,
		pngWidth: frame.pngWidth,
		pngHeight: frame.pngHeight,
		density: frame.density,
		cssWidth: frame.drawnWidth,
		cssHeight: frame.drawnHeight,
		labelFontSize: measured.frames[index].labelFontSize,
		labelBox: measured.frames[index].labelBox,
	}));
}

export async function sheetCommand(options, { browserHarness }) {
	const files = await readSheetFrames(parseSheetRows(options.extra));
	const runtime = await browserHarness();
	const ui = await import(
		pathToFileURL(resolve(runtime.tools, "scripts/web/lib.mjs")).href
	);
	const planned = await planSheetFrames(files, ui.decodePNG);
	const browser = await ui.launchChromium(runtime.loaded);
	try {
		const sheetPath = await outputFile(options.out, "sheet.png");
		const measured = await renderFrameSheet(
			browser,
			{ title: options.title, rows: planned },
			sheetPath,
		);
		const frames = measuredFrames(planned, measured);
		await jsonOutput(options.out, "manifest.json", {
			schema: 2,
			...options.commandManifest,
			title: options.title || null,
			sheet: {
				file: "sheet.png",
				width: measured.width,
				height: measured.height,
				density: 1,
			},
			frames,
		});
		console.log(
			`SHEET PASS: ${frames.length} frames; ${measured.width}x${measured.height}; evidence ${options.out}/sheet.png`,
		);
		return { ...measured, frames };
	} finally {
		await browser.close();
	}
}
