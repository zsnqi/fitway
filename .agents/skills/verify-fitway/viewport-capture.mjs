// Readiness and viewport capture shared by drive and recipe-free frame capture.
export function prepareViewport(ui, page, url, ready) {
	return ui.preparePage(page, url, {
		readyJs: ready,
		timeout: 15000,
	});
}

export function captureViewport(ui, page) {
	return ui.screenshot(page, {
		method: "playwright",
		fullPage: false,
		animations: "allow",
	});
}
