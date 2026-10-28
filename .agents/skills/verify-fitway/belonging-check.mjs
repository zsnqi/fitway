import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { ToolStartupError } from "../../../scripts/agent-environment/tool-contract.mjs";
import { belongingStates, belongingWidths } from "./belonging-plan.mjs";
import { runBelongingFrames } from "./belonging-runner.mjs";
import {
	canonical,
	freshEmptyOutput,
	freshOutput,
	jsonOutput,
	preview,
	ReportedFailure,
	verificationPort,
} from "./core.mjs";
import { extractDeclaredConcept } from "./drift-tree.mjs";
import { axis } from "./drive-plan.mjs";
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
	} else {
		extracted = extractDeclaredConcept(repository);
		concept = extracted.concept;
		recipes = options.recipes
			? canonical(resolve(options.recipes))
			: extracted.recipes;
		commit = extracted.commit;
	}
	return { extracted, concept, commit, recipes };
}

const startupValue = (fix, parse) => {
	try {
		return parse();
	} catch (error) {
		if (error instanceof ToolStartupError) throw error;
		throw new ToolStartupError(error.message, fix);
	}
};

// Every page the recipes name, or the one --page names, with its states.
function belongingPlan(map, options) {
	const pages =
		options.page && options.page !== "all"
			? map.pages.filter((page) => page.page === options.page)
			: map.pages;
	if (!pages.length)
		throw new ToolStartupError(
			`Page not named by the recipes: ${options.page}`,
			"run verify:owner list --page all",
		);
	return startupValue("pass --states default, all or a mapped query", () =>
		pages.map((page) => ({ page, states: belongingStates(page, options) })),
	);
}

async function startRuntime(options, setup, source, out) {
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
	const out = freshEmptyOutput(options.out || freshOutput(), "belonging-check");
	const languages = startupValue("pass --languages ar,en, ar or en", () =>
		axis(options.languages, "ar,en", ["ar", "en"]),
	);
	const widths = belongingWidths(options.widths);
	const source = conceptSource(options);
	try {
		const setup = await services.doctor({
			...options,
			concept: source.concept,
			recipes: source.recipes,
			quiet: true,
			transports: "http",
		});
		const plan = belongingPlan(setup.map, options);
		console.log(
			source.commit
				? `CONCEPT: commit=${source.commit} folder=${source.concept}`
				: `CONCEPT: folder=${source.concept}`,
		);
		const running = await startRuntime(options, setup, source, out);
		let frames;
		try {
			frames = await runBelongingFrames({
				plan,
				languages,
				widths,
				runtime: running.runtime,
			});
		} finally {
			await Promise.allSettled([
				running.browser.close(),
				running.server.close(),
			]);
		}
		const summary = resultSummary(source, widths, languages, frames, startedAt);
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
