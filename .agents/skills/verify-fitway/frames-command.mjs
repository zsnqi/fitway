// Capture the exact public frames a designer brief names, without state recipes.
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { openCaptureLifecycle } from "./capture-lifecycle.mjs";
import { requireForcedColors } from "./colors.mjs";
import { resolveConceptSide } from "./concept-source.mjs";
import {
	jsonOutput,
	outputFile,
	ReportedFailure,
	verificationPort,
} from "./core.mjs";
import { contextOptions } from "./drive-plan.mjs";
import { applyFrameActions, frameClip } from "./frame-actions.mjs";
import { framePlan } from "./frame-plan.mjs";
import { prepareViewport, saveViewport } from "./viewport-capture.mjs";

function frameEntry(frame, page) {
	return {
		file: frame.file,
		page,
		state: frame.state,
		language: frame.language,
		size: frame.size,
		cssWidth: frame.cssWidth,
		cssHeight: frame.cssHeight,
		density: frame.density,
		input: frame.input,
		motion: frame.motion,
		transport: frame.transport,
		colours: frame.colours,
		query: frame.query,
		...(frame.actions === undefined
			? {}
			: { actions: frame.actions.map((action) => action.step) }),
		...(frame.clip === undefined ? {} : { clip: frame.clip }),
		readiness: null,
		status: "capturing",
		errors: [],
	};
}

function pageEnvironment(page) {
	return page.evaluate(() => ({
		lang: document.documentElement.lang,
		direction: getComputedStyle(document.documentElement).direction,
		pointer: matchMedia("(pointer: coarse)").matches ? "coarse" : "fine",
	}));
}

function finishEntry(entry, errors) {
	entry.errors.push(...errors);
	entry.consoleErrors = entry.errors.filter((error) =>
		error.startsWith("console:"),
	);
	entry.pageErrors = entry.errors.filter((error) =>
		error.startsWith("pageerror:"),
	);
	entry.failures = entry.errors.filter(
		(error) => !error.startsWith("console:"),
	);
	entry.status = entry.failures.length ? "failed" : "captured";
}

// runtime is the capture lifecycle's origin and browser, and its cancelled().
async function captureFrame(options, setup, plan, ui, runtime, frame) {
	const { origin, browser, cancelled } = runtime;
	if (cancelled())
		throw new Error("Frame capture interrupted; owned resources cleaned up.");
	const size = plan.sizes.find((item) => item.name === frame.size);
	const current = await ui.newContext(
		browser,
		contextOptions({
			...size.dimensions,
			dsf: frame.density,
			input: frame.input,
			motion: frame.motion,
			color: frame.colours,
			language: frame.language,
		}),
	);
	current.page.setDefaultTimeout(5000);
	const entry = frameEntry(frame, plan.selected.page);
	try {
		const url = ui.withParams(
			frame.transport === "file"
				? pathToFileURL(resolve(setup.concept, plan.selected.page)).href
				: `${origin}/${plan.selected.page}`,
			frame.query,
		);
		entry.url = url;
		entry.readiness = await prepareViewport(
			ui,
			current.page,
			url,
			plan.selected.ready,
		);
		await applyFrameActions(ui, current.page, frame.actions, frame.input);
		Object.assign(entry, await pageEnvironment(current.page));
		const clip =
			frame.clip === undefined
				? undefined
				: await frameClip(current.page, frame.clip);
		Object.assign(
			entry,
			await saveViewport(
				ui,
				current.page,
				await outputFile(options.out, frame.file),
				{ clip },
			),
		);
	} catch (error) {
		entry.errors.push(error.message);
	} finally {
		finishEntry(entry, current.errors);
		await current.context.close();
	}
	console.log(
		`FRAME ${entry.status.toUpperCase()}: ${entry.file}${entry.errors.length ? `; ${entry.errors[0]}` : ""}`,
	);
	return entry;
}

async function finishFrames(options, manifest) {
	await jsonOutput(options.out, "manifest.json", manifest);
	const failed = manifest.items.filter((entry) => entry.status === "failed");
	console.log(
		`FRAMES ${failed.length ? "FAIL" : "PASS"}: ${manifest.items.length} frames; no state proof claimed; evidence ${options.out}/manifest.json`,
	);
	if (failed.length)
		throw new ReportedFailure(
			"Uncaught page errors; every frame was saved before exit.",
		);
	return manifest;
}

export async function framesCommand(options, { doctor }) {
	const source = resolveConceptSide(options, "build");
	try {
		const resolved = {
			...options,
			concept: source.concept,
			recipes: source.recipes,
		};
		const setup = await doctor({
			...resolved,
			framesOnly: true,
			quiet: true,
		});
		const plan = framePlan(setup.map, resolved);
		if (plan.frames.some((frame) => frame.colours === "forced"))
			await requireForcedColors(setup.tools);
		const port = verificationPort(options.port || 3176);
		const ui = await import(
			pathToFileURL(resolve(setup.tools, "scripts/web/lib.mjs")).href
		);
		const manifest = {
			schema: 2,
			...options.commandManifest,
			concept: setup.concept,
			page: plan.selected.page,
			items: [],
		};
		const capture = openCaptureLifecycle({
			concept: setup.concept,
			port,
			session: options.session,
			http: plan.frames.some((frame) => frame.transport === "http"),
			launch: () => ui.launchChromium(setup.loaded),
		});
		try {
			const runtime = await capture.start();
			for (const frame of plan.frames)
				manifest.items.push(
					await captureFrame(options, setup, plan, ui, runtime, frame),
				);
			return await finishFrames(options, manifest);
		} finally {
			await capture.close();
		}
	} finally {
		source.cleanup();
	}
}
