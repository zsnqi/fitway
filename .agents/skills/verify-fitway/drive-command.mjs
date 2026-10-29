// Resolve a concept and run verify-fitway page captures into command output.
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { resolveConceptSide } from "./concept-source.mjs";
import { jsonOutput, ReportedFailure } from "./core.mjs";
import { drive } from "./runner.mjs";

export async function driveCommand(options, { doctor }) {
	const out = options.out;
	const source = resolveConceptSide(options, "build");
	try {
		const resolved = {
			...options,
			concept: source.concept,
			recipes: source.recipes,
		};
		const setup = await doctor(resolved);
		if (options.page !== "all") return drive({ ...resolved, ...setup, out });

		const combined = {
			schema: 1,
			...options.commandManifest,
			concept: setup.concept,
			items: [],
		};
		let failed = false;
		for (const page of setup.map.pages) {
			const pageOut = resolve(out, page.page.replace(".html", ""));
			try {
				await drive({
					...resolved,
					...setup,
					page: page.page,
					out: pageOut,
				});
			} catch (error) {
				failed = true;
				if (!(error instanceof ReportedFailure))
					console.error(`PAGE FAIL: ${page.page}: ${error.message}`);
			}
			if (existsSync(resolve(pageOut, "manifest.json"))) {
				const result = JSON.parse(
					await readFile(resolve(pageOut, "manifest.json"), "utf8"),
				);
				combined.items.push(
					...result.items.map((item) => ({
						...item,
						folder: pageOut,
					})),
				);
			}
		}
		await jsonOutput(out, "manifest.json", combined);
		if (failed)
			throw new Error(`Page sweep had findings; evidence ${out}/manifest.json`);
		return console.log(
			`DRIVE PASS: ${combined.items.length} items across all pages; evidence ${out}/manifest.json`,
		);
	} finally {
		source.cleanup();
	}
}
