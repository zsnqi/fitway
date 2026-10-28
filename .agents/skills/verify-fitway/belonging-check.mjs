import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { ToolStartupError } from "../../../scripts/agent-environment/tool-contract.mjs";
import { belongingWidths } from "./belonging-plan.mjs";
import { runBelongingFrames } from "./belonging-runner.mjs";
import {
	assertOutsideGit,
	canonical,
	freshOutput,
	jsonOutput,
	preview,
	ReportedFailure,
	verificationPort,
} from "./core.mjs";
import { extractDeclaredConcept } from "./drift-tree.mjs";
import { repository } from "./map.mjs";
import { loadProbes } from "./probes.mjs";

function conceptSource(options) {
	let extracted;
	let concept;
	let commit;
	let recipes;
	if (options.concept) {
		concept = canonical(options.concept);
		recipes = options.recipes
			? canonical(resolve(options.recipes))
			: resolve(concept, "verification-recipes.json");
		console.log(`CONCEPT: folder=${concept}`);
	} else {
		extracted = extractDeclaredConcept(repository);
		concept = extracted.concept;
		recipes = options.recipes
			? canonical(resolve(options.recipes))
			: extracted.recipes;
		commit = extracted.commit;
		console.log(`CONCEPT: commit=${commit} folder=${concept}`);
	}
	return { extracted, concept, commit, recipes };
}

function selectedLanguages(value) {
	const languages = String(value || "ar,en")
		.split(",")
		.filter(Boolean);
	for (const language of languages)
		if (!["ar", "en"].includes(language))
			throw new ToolStartupError(
				`Unsupported language: ${language}`,
				"pass --languages ar,en",
			);
	return languages;
}

function selectedPages(map, value) {
	const pages =
		value && value !== "all"
			? map.pages.filter((page) => page.page === value)
			: map.pages;
	if (!pages.length)
		throw new ToolStartupError(
			`Page not named by the recipes: ${value}`,
			"run verify:owner list --page all",
		);
	return pages;
}

async function startRuntime(options, source, out) {
	const setup = await options.doctor({
		...options,
		concept: source.concept,
		recipes: source.recipes,
		quiet: true,
		transports: "http",
	});
	const pages = selectedPages(setup.map, options.page);
	const ui = await import(
		pathToFileURL(resolve(setup.tools, "scripts/web/lib.mjs")).href
	);
	const probes = await loadProbes(source.concept);
	const port = verificationPort(options.port || 3176);
	const server = await preview({
		concept: source.concept,
		port,
		cache: "no-store",
	});
	let browser;
	try {
		browser = await ui.launchChromium(setup.loaded);
	} catch (error) {
		await server.close();
		throw error;
	}
	return {
		setup,
		pages,
		server,
		browser,
		runtime: {
			ui,
			browser,
			origin: server.origin,
			probes,
			out,
		},
	};
}

function resultSummary(source, widths, languages, frames, startedAt) {
	const findings = frames.flatMap((frame) =>
		frame.findings.map((finding) => ({
			page: frame.page,
			query: frame.query,
			language: frame.language,
			width: frame.width,
			item: finding.item,
			text: finding.text,
			column: finding.columnText,
			reach: finding.reach,
			crop: finding.crop,
		})),
	);
	const resizeOnly = frames.flatMap((frame) => frame.resizeOnly);
	const failed = frames.filter((frame) => frame.status === "fail");
	return {
		schema: 1,
		concept: {
			folder: source.concept,
			commit: source.commit,
			declared: source.extracted?.declaredConcept ?? null,
		},
		widths,
		languages,
		frames,
		findings,
		resizeOnly,
		totals: {
			frames: frames.length,
			pass: frames.filter((frame) => frame.status === "pass").length,
			fail: failed.length,
			noItems: frames.filter((frame) => frame.status === "no-items").length,
			findings: findings.length,
			resizeOnly: resizeOnly.length,
			runtimeMs: Date.now() - startedAt,
		},
	};
}

export async function belongingCheck(options, services) {
	const startedAt = Date.now();
	const out = assertOutsideGit(options.out || freshOutput());
	if (existsSync(out) && readdirSync(out).length)
		throw new ToolStartupError(
			`Belonging check requires a fresh empty output folder: ${out}`,
			"pass --out a new or empty folder outside Git",
		);
	const source = conceptSource(options);
	try {
		const running = await startRuntime(
			{ ...options, doctor: services.doctor },
			source,
			out,
		);
		let frames;
		try {
			frames = await runBelongingFrames({
				pages: running.pages,
				languages: selectedLanguages(options.languages),
				widths: belongingWidths(options.widths),
				options,
				runtime: running.runtime,
			});
		} finally {
			await Promise.allSettled([
				running.browser.close(),
				running.server.close(),
			]);
		}
		const summary = resultSummary(
			source,
			belongingWidths(options.widths),
			selectedLanguages(options.languages),
			frames,
			startedAt,
		);
		await jsonOutput(out, "belonging-check.json", summary);
		console.log(
			`BELONGING SUMMARY: frames=${summary.totals.frames} pass=${summary.totals.pass} fail=${summary.totals.fail} no-items=${summary.totals.noItems} findings=${summary.totals.findings} resize-only=${summary.totals.resizeOnly} runtime=${(summary.totals.runtimeMs / 1000).toFixed(1)}s`,
		);
		if (summary.findings.length || summary.totals.fail)
			throw new ReportedFailure(
				`Belonging check found ${summary.findings.length} finding(s) or ${summary.totals.fail} failed frame(s); evidence ${out}`,
			);
	} finally {
		source.extracted?.cleanup();
	}
}
