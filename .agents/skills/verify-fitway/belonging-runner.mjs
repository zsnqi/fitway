import { analyzeBelongingItems } from "./belonging-geometry.mjs";
import {
	clearBelongingOutlines,
	collectBelongingItems,
	installBelongingPageHelpers,
	outlineBelongingTokens,
} from "./belonging-page.mjs";
import {
	belongingSegments,
	heightForBelongingWidth,
} from "./belonging-plan.mjs";
import { safe } from "./capture-records.mjs";
import { outputFile } from "./core.mjs";
import { proveFeature, runFeatureActions } from "./drive.mjs";
import {
	contextOptions,
	featureUnreachable,
	stateName,
} from "./drive-plan.mjs";

const ITEM_SELECTOR = "li, tr, [role='row'], [role='listitem']";

async function openPage({
	ui,
	browser,
	origin,
	page,
	state,
	language,
	width,
	probes,
	out,
	stem,
}) {
	const input = width <= 720 ? "touch" : "mouse";
	const current = await ui.newContext(
		browser,
		contextOptions({
			width,
			height: heightForBelongingWidth(width),
			input,
			motion: "reduce",
			language,
		}),
	);
	current.page.setDefaultTimeout(5000);
	const query = { ...state.query, lang: language, motion: "off" };
	const url = ui.withParams(`${origin}/${page.page}`, query);
	try {
		await ui.preparePage(current.page, url, {
			readyJs: page.ready,
			timeout: 15000,
		});
		await current.page.evaluate(installBelongingPageHelpers);
		if (page.page === "index.html") await probes.introSettled(current.page);
		if (state.recipe) {
			await runFeatureActions({
				ui,
				page: current.page,
				recipe: state.recipe,
				input,
				out,
				stem,
			});
			await proveFeature(current.page, state.recipe.proof, language, input);
		}
		return { current, input, query, url };
	} catch (error) {
		await current.context.close();
		throw error;
	}
}

async function measurePage(page) {
	const raw = await page.evaluate(collectBelongingItems, {
		itemSelector: ITEM_SELECTOR,
	});
	const items = analyzeBelongingItems(raw);
	return {
		itemCount: items.length,
		itemsWithColumn: items.filter((item) => item.hasColumn).length,
		findings: items.flatMap((item) =>
			item.findings.map((finding) => ({
				...finding,
				item: item.selector,
			})),
		),
	};
}

const findingKey = (finding) =>
	[
		finding.item,
		finding.text,
		finding.columnText,
		Math.round(finding.reach * 10),
	].join("|");

// One file per finding: its frame (page, state, language, width) and its place in that frame.
export const findingCropName = ({ page, state, language, width }, index) =>
	`belonging-${safe(page.page)}-${safe(state.label)}-${language}-${width}-finding-${index + 1}.png`;

async function cropFinding({ ui, page, finding, name, out }) {
	await page.locator(finding.item).scrollIntoViewIfNeeded();
	await ui.twoFrames(page);
	await page.evaluate(outlineBelongingTokens, {
		selector: finding.item,
		pieceTokenIds: finding.tokenIds,
		columnTokenIds: finding.columnTokenIds,
	});
	try {
		const path = await outputFile(out, name);
		// A margin round the item keeps the piece's outline whole where the piece meets the item's edge.
		const box = await page.locator(finding.item).boundingBox();
		const left = Math.max(0, box.x - 4);
		const top = Math.max(0, box.y - 4);
		await page.screenshot({
			path,
			clip: {
				x: left,
				y: top,
				width: box.x + box.width + 4 - left,
				height: box.y + box.height + 4 - top,
			},
			animations: "allow",
			caret: "hide",
		});
		return path;
	} finally {
		await page.evaluate(clearBelongingOutlines).catch(() => undefined);
	}
}

function frameLine(frame) {
	const prefix =
		frame.status === "no-items"
			? "NO ITEMS"
			: `FRAME ${frame.status.toUpperCase()}`;
	const details = [
		`page=${frame.page}`,
		`query=${JSON.stringify(frame.query)}`,
		`state=${JSON.stringify(frame.state)}`,
		`language=${frame.language}`,
		`width=${frame.width}`,
		`items=${frame.items}`,
		`columns=${frame.itemsWithColumn}`,
		`findings=${frame.findings.length}`,
	];
	if (frame.error) details.push(`error=${JSON.stringify(frame.error)}`);
	return `${prefix}: ${details.join(" ")}`;
}

function startFailureFrame({ page, state, language, width, error }) {
	return {
		page: page.page,
		query: stateName(state.query),
		state: state.label,
		feature: state.feature,
		language,
		width,
		items: 0,
		itemsWithColumn: 0,
		findings: [],
		resizeOnly: [],
		status: "fail",
		error: error.message,
	};
}

async function confirmResize(args) {
	let fresh;
	try {
		fresh = await openPage({
			...args,
			stem: `${args.stem}-fresh`,
		});
		const reproduced = new Set(
			(await measurePage(fresh.current.page)).findings.map(findingKey),
		);
		return {
			findings: args.findings.filter((finding) =>
				reproduced.has(findingKey(finding)),
			),
			resizeOnly: args.findings.filter(
				(finding) => !reproduced.has(findingKey(finding)),
			),
		};
	} finally {
		await fresh?.current.context.close();
	}
}

async function frameAtWidth(args) {
	const { opened, page, state, language, width, anchor, ui, out } = args;
	if (width !== anchor) {
		await opened.current.page.setViewportSize({
			width,
			height: heightForBelongingWidth(width),
		});
		await ui.twoFrames(opened.current.page);
	}
	const measured = await measurePage(opened.current.page);
	let findings = measured.findings;
	let resizeOnly = [];
	if (width !== anchor && findings.length) {
		const confirmed = await confirmResize({
			...args,
			findings,
		});
		findings = confirmed.findings;
		resizeOnly = confirmed.resizeOnly;
	}
	for (const [index, finding] of findings.entries())
		finding.crop = await cropFinding({
			ui,
			page: opened.current.page,
			finding,
			name: findingCropName({ page, state, language, width }, index),
			out,
		});
	const frame = {
		page: page.page,
		query: stateName(opened.query),
		state: state.label,
		feature: state.feature,
		language,
		width,
		input: opened.input,
		url: opened.url,
		items: measured.itemCount,
		itemsWithColumn: measured.itemsWithColumn,
		findings,
		resizeOnly,
		status:
			measured.itemCount === 0 ? "no-items" : findings.length ? "fail" : "pass",
	};
	console.log(frameLine(frame));
	for (const finding of findings)
		console.log(
			`FINDING: page=${page.page} query=${JSON.stringify(frame.query)} language=${language} width=${width} item=${JSON.stringify(finding.item)} text=${JSON.stringify(finding.text)} column=${JSON.stringify(finding.columnText)} reach=${finding.reach.toFixed(2)}px crop=${JSON.stringify(finding.crop)}`,
		);
	for (const finding of resizeOnly)
		console.log(
			`RESIZE-ONLY: page=${page.page} query=${JSON.stringify(frame.query)} language=${language} width=${width} item=${JSON.stringify(finding.item)} text=${JSON.stringify(finding.text)}`,
		);
	return frame;
}

async function runSegment(args) {
	const { segment, anchor } = args;
	const frames = [];
	let opened;
	let measuredWidths = 0;
	try {
		opened = await openPage({
			...args,
			width: anchor,
		});
		for (const width of segment) {
			frames.push(
				await frameAtWidth({
					...args,
					opened,
					width,
				}),
			);
			measuredWidths++;
		}
	} catch (error) {
		for (const width of segment.slice(measuredWidths)) {
			const frame = startFailureFrame({
				page: args.page,
				state: args.state,
				language: args.language,
				width,
				error,
			});
			frames.push(frame);
			console.log(frameLine(frame));
		}
	} finally {
		await opened?.current.context.close();
	}
	return frames;
}

// A feature state runs only at the widths where drive's recipe rule reaches its feature.
const reachedWidths = (widths, state, language) =>
	state.recipe
		? widths.filter(
				(width) =>
					!featureUnreachable(state.recipe, width, state.query, language),
			)
		: widths;

export async function runBelongingFrames({ plan, languages, widths, runtime }) {
	const frames = [];
	for (const { page, states } of plan)
		for (const state of states)
			for (const language of languages)
				for (const segment of belongingSegments(
					reachedWidths(widths, state, language),
				))
					frames.push(
						...(await runSegment({
							...runtime,
							page,
							state,
							language,
							segment,
							anchor: segment[0],
							stem: `belonging-${safe(page.page)}-${safe(state.label)}-${language}-${segment[0]}`,
						})),
					);
	return frames;
}
