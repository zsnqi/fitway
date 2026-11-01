// Readiness and viewport capture shared by drive and recipe-free frame capture.
export function prepareViewport(ui, page, url, ready) {
	return ui.preparePage(page, url, {
		readyJs: ready,
		timeout: 15000,
	});
}

// `run.waitFor` uses this after the script navigates, so it does not navigate a
// second time and discard state the script already established.
export async function waitForViewport(ui, page, ready) {
	await page.waitForFunction(ready, null, { timeout: 15000 });
	await page.evaluate(() => document.fonts.ready.then(() => true));
	await ui.twoFrames(page);
}

export function captureViewport(ui, page, { clip } = {}) {
	return ui.screenshot(page, {
		method: "playwright",
		...(clip ? { clip } : {}),
		fullPage: false,
		animations: "allow",
	});
}
