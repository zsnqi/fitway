import { analyzeBelongingItems } from "./belonging-geometry.mjs";
import {
	clearBelongingOutlines,
	collectBelongingItems,
	installBelongingPageHelpers,
	outlineBelongingTokens,
} from "./belonging-page.mjs";
import {
	belongingSegments,
	belongingStates,
	heightForBelongingWidth,
	queryName,
} from "./belonging-plan.mjs";
import { safe } from "./capture-records.mjs";
import { outputFile } from "./core.mjs";
import { performAction, proveFeature } from "./drive.mjs";

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
	const current = await ui.newContext(browser, {
		viewport: {
			width,
			height: heightForBelongingWidth(width),
		},
		touch: input === "touch",
		mobile: input === "touch",
		reducedMotion: "reduce",
		colorScheme: "dark",
		locale: language === "ar" ? "ar-SA" : "en-US",
		timezoneId: "Asia/Riyadh",
	});
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
		if (state.actions.length) {
			const entry = { actions: [], problems: [] };
			for (const action of state.actions) {
				const resolved = action.replace(
					/^activate:/,
					input === "touch" ? "tap:" : "click:",
				);
				await performAction(
					ui,
					current.page,
					resolved,
					input,
					out,
					stem,
					entry,
				);
				entry.actions.push(resolved);
			}
			await proveFeature(current.page, state.proof, language, input);
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

async function cropFinding({ ui, page, finding, stem, out }) {
	const name = `${stem}-${safe(finding.item)}-${safe(finding.text).slice(0, 36)}.png`;
	await page.locator(finding.item).scrollIntoViewIfNeeded();
	await ui.twoFrames(page);
	await page.evaluate(outlineBelongingTokens, {
		selector: finding.item,
		pieceTokenIds: finding.tokenIds,
		columnTokenIds: finding.columnTokenIds,
	});
	try {
		const path = await outputFile(out, name);
		await page.locator(finding.item).screenshot({
			path,
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
		query: queryName(state.query),
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
	const { opened, page, state, language, width, anchor, ui, out, stem } = args;
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
	for (const finding of findings)
		finding.crop = await cropFinding({
			ui,
			page: opened.current.page,
			finding,
			stem,
			out,
		});
	const frame = {
		page: page.page,
		query: queryName(opened.query),
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

export async function runBelongingFrames({
	pages,
	languages,
	widths,
	options,
	runtime,
}) {
	const frames = [];
	for (const page of pages)
		for (const state of belongingStates(page, options))
			for (const language of languages) {
				const applicable = widths.filter(
					(width) => state.maxWidth === undefined || width <= state.maxWidth,
				);
				for (const [segmentIndex, segment] of belongingSegments(
					applicable,
				).entries())
					frames.push(
						...(await runSegment({
							...runtime,
							page,
							state,
							language,
							widths,
							segment,
							anchor: segment[0],
							segmentIndex,
							stem: `belonging-${safe(page.page)}-${safe(state.label)}-${language}-${segment[0]}-${segmentIndex}`,
						})),
					);
			}
	return frames;
}
