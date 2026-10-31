// Render labelled frame rows in a browser at density one and return measured layout.
const text = (value) =>
	String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");

const SHEET_STYLES = `
        :root { color-scheme: dark; }
        * { box-sizing: content-box; }
        html, body { margin: 0; background: #111; }
        body { width: max-content; color: #fff; }
        .sheet {
                display: inline-block;
                padding: 40px;
                background: #111;
                font-family: "Segoe UI", "Noto Sans", "Noto Sans Arabic", Tahoma, Arial, sans-serif;
        }
        h1 {
                margin: 0 0 32px;
                color: #fff;
                font-family: inherit;
                font-size: 30px;
                font-weight: 600;
                line-height: 1.2;
        }
        .row { display: flex; align-items: flex-start; gap: 40px; margin: 0 0 48px; }
        .row:last-child { margin-bottom: 0; }
        figure { margin: 0; flex: none; width: max-content; }
        figcaption {
                display: block;
                width: max-content;
                max-width: none;
                margin: 0 0 12px;
                color: #fff;
                font-size: 40px;
                font-weight: 600;
                line-height: 1.2;
                white-space: nowrap;
                transform: none;
                zoom: 1;
        }
        img {
                display: block;
                max-width: none;
                max-height: none;
                outline: 1px solid #555;
                transform: none;
                zoom: 1;
        }
`;

function sheetHtml(spec) {
	let index = 0;
	const rows = spec.rows
		.map(
			(row) =>
				`<div class="row">${row
					.map((frame) => {
						const id = index++;
						const source = `data:image/png;base64,${frame.png.toString("base64")}`;
						return `<figure class="frame" data-index="${id}">
                                                <figcaption dir="auto">${text(frame.label)}</figcaption>
                                                <img src="${source}" data-width="${frame.drawnWidth}" data-height="${frame.drawnHeight}" style="width:${frame.drawnWidth}px;height:${frame.drawnHeight}px">
                                        </figure>`;
					})
					.join("")}</div>`,
		)
		.join("");
	return `<!doctype html><html lang="en" dir="ltr"><head><meta charset="utf-8"><style>${SHEET_STYLES}</style></head><body><main class="sheet">${spec.title ? `<h1 dir="auto">${text(spec.title)}</h1>` : ""}${rows}</main></body></html>`;
}

function validateLayout(frame) {
	if (
		frame.labelFontSize < 40 ||
		frame.labelBox.x < frame.sheet.x ||
		frame.labelBox.y < frame.sheet.y ||
		frame.labelBox.x + frame.labelBox.width >
			frame.sheet.x + frame.sheet.width ||
		frame.labelBox.y + frame.labelBox.height >
			frame.sheet.y + frame.sheet.height ||
		frame.labelBox.y + frame.labelBox.height > frame.imageBox.y ||
		frame.imageBox.x < frame.sheet.x ||
		frame.imageBox.y < frame.sheet.y ||
		frame.imageBox.x + frame.imageBox.width >
			frame.sheet.x + frame.sheet.width ||
		frame.imageBox.y + frame.imageBox.height >
			frame.sheet.y + frame.sheet.height ||
		Math.abs(frame.imageBox.width - frame.expectedWidth) > 0.01 ||
		Math.abs(frame.imageBox.height - frame.expectedHeight) > 0.01
	)
		throw new Error(
			`Sheet frame or label does not match its CSS layout: ${frame.label}`,
		);
}

async function measureSheet(page) {
	const measured = await page.evaluate(() => {
		const sheet = document.querySelector(".sheet").getBoundingClientRect();
		const frames = [...document.querySelectorAll(".frame")].map((cell) => {
			const label = cell.querySelector("figcaption");
			const image = cell.querySelector("img");
			const lb = label.getBoundingClientRect();
			const ib = image.getBoundingClientRect();
			return {
				label: label.textContent,
				labelFontSize: Number.parseFloat(getComputedStyle(label).fontSize),
				labelBox: {
					x: lb.x,
					y: lb.y,
					width: lb.width,
					height: lb.height,
				},
				imageBox: {
					x: ib.x,
					y: ib.y,
					width: ib.width,
					height: ib.height,
				},
				expectedWidth: Number(image.dataset.width),
				expectedHeight: Number(image.dataset.height),
				sheet: {
					x: sheet.x,
					y: sheet.y,
					width: sheet.width,
					height: sheet.height,
				},
			};
		});
		return {
			width: Math.ceil(sheet.width),
			height: Math.ceil(sheet.height),
			frames,
		};
	});
	for (const frame of measured.frames) validateLayout(frame);
	return measured;
}

export async function renderFrameSheet(browser, spec, outPath) {
	const html = sheetHtml(spec);
	const context = await browser.newContext({
		viewport: { width: 4000, height: 2000 },
		deviceScaleFactor: 1,
		colorScheme: "dark",
	});
	const page = await context.newPage();
	try {
		await page.setContent(html, { waitUntil: "load" });
		await page.evaluate(() =>
			Promise.all(
				[...document.images].map((image) =>
					image.complete
						? null
						: new Promise((done) => {
								image.onload = done;
								image.onerror = done;
							}),
				),
			).then(() => document.fonts.ready),
		);
		const measured = await measureSheet(page);
		await page.setViewportSize({
			width: Math.max(1, measured.width),
			height: Math.max(1, Math.min(measured.height, 16000)),
		});
		await page.screenshot({ path: outPath, fullPage: true });
		return measured;
	} finally {
		await context.close();
	}
}
