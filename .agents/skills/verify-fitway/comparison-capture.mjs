// Comparison measures a reproducible picture after the user flow. Ordinary drive
// keeps its original capture timing, including frames taken during movement.
class ComparisonCaptureError extends Error {}

export function observeComparisonFrames() {
	const request = window.requestAnimationFrame.bind(window);
	const cancel = window.cancelAnimationFrame.bind(window);
	const pending = new Set();
	Object.defineProperty(window, "__verifyFitwayFrames", {
		value: {
			get pending() {
				return pending.size;
			},
		},
	});
	window.requestAnimationFrame = (callback) => {
		if (typeof callback !== "function") return request(callback);
		const id = request((time) => {
			pending.delete(id);
			callback.call(window, time);
		});
		pending.add(id);
		return id;
	};
	window.cancelAnimationFrame = (id) => {
		pending.delete(id);
		return cancel(id);
	};
}

export async function settleComparison(page) {
	try {
		await page.waitForFunction(
			() => {
				if (!window.__verifyFitwayFrames)
					throw new Error("Comparison frame observer was not installed");
				return (
					window.__verifyFitwayFrames.pending === 0 &&
					document
						.getAnimations()
						.every(
							(animation) =>
								["finished", "idle"].includes(animation.playState) ||
								!Number.isFinite(animation.effect.getComputedTiming().endTime),
						)
				);
			},
			undefined,
			{ timeout: 5000 },
		);
	} catch (error) {
		throw new ComparisonCaptureError(
			`Comparison capture did not settle (5000 ms bound): ${error.message}`,
		);
	}
	await page.evaluate(() => {
		for (const animation of document.getAnimations()) {
			if (!Number.isFinite(animation.effect.getComputedTiming().endTime)) {
				animation.pause();
				animation.currentTime = 0;
			}
		}
	});
}

async function comparisonGeometry(page) {
	return page.evaluate(() => {
		const root = document.scrollingElement || document.documentElement;
		return {
			scrollX: window.scrollX,
			scrollY: window.scrollY,
			viewportWidth: window.innerWidth,
			viewportHeight: window.innerHeight,
			documentHeight: Math.max(
				window.innerHeight,
				Math.ceil(root.scrollHeight),
			),
		};
	});
}

// The viewport-sized parts that cover a document. The last part scrolls only as
// far as the document allows, so its rows start at sourceTop in its screenshot.
export function comparisonParts({ viewportHeight, documentHeight }) {
	const parts = [];
	for (
		let documentTop = 0;
		documentTop < documentHeight;
		documentTop += viewportHeight
	) {
		const scrollTop = Math.min(documentTop, documentHeight - viewportHeight);
		parts.push({
			documentTop,
			scrollTop,
			sourceTop: documentTop - scrollTop,
			height: Math.min(viewportHeight, documentHeight - documentTop),
		});
	}
	return parts;
}

async function screenshotViewport(page) {
	return page.screenshot({
		fullPage: false,
		animations: "allow",
		caret: "hide",
	});
}

async function comparisonInteraction(page) {
	return page.evaluateHandle(() => {
		const active = document.activeElement;
		const selection = document.getSelection();
		return {
			active,
			scrollX: window.scrollX,
			scrollY: window.scrollY,
			anchorNode: selection?.anchorNode || null,
			anchorOffset: selection?.anchorOffset || 0,
			focusNode: selection?.focusNode || null,
			focusOffset: selection?.focusOffset || 0,
			textSelection:
				active &&
				typeof active.selectionStart === "number" &&
				typeof active.setSelectionRange === "function"
					? {
							start: active.selectionStart,
							end: active.selectionEnd,
							direction: active.selectionDirection,
						}
					: null,
		};
	});
}

async function captureDocumentFrames(page, geometry) {
	const interaction = await comparisonInteraction(page);
	const frames = [];
	try {
		for (const part of comparisonParts(geometry)) {
			await page.evaluate(
				({ left, top }) => window.scrollTo({ left, top, behavior: "instant" }),
				{ left: geometry.scrollX, top: part.scrollTop },
			);
			await page.evaluate(
				() => new Promise((resolve) => requestAnimationFrame(resolve)),
			);
			await settleComparison(page);
			const measured = await comparisonGeometry(page);
			const expected = {
				scrollY: part.scrollTop,
				viewportWidth: geometry.viewportWidth,
				viewportHeight: geometry.viewportHeight,
				documentHeight: geometry.documentHeight,
			};
			measured.scrollY = Math.round(measured.scrollY);
			for (const [name, value] of Object.entries(expected))
				if (measured[name] !== value)
					throw new ComparisonCaptureError(
						`Comparison capture of document y ${part.documentTop} expected ${name} ${value}, measured ${measured[name]}`,
					);
			const image = await screenshotViewport(page);
			frames.push({ ...part, image: image.toString("base64") });
		}
	} finally {
		await interaction.evaluate((state) => {
			const root = document.scrollingElement || document.documentElement;
			if (state.active?.isConnected && state.active !== document.activeElement)
				state.active.focus({ preventScroll: true });
			if (state.textSelection && state.active?.isConnected)
				state.active.setSelectionRange(
					state.textSelection.start,
					state.textSelection.end,
					state.textSelection.direction,
				);
			if (state.anchorNode?.isConnected && state.focusNode?.isConnected) {
				const selection = document.getSelection();
				selection?.setBaseAndExtent(
					state.anchorNode,
					state.anchorOffset,
					state.focusNode,
					state.focusOffset,
				);
			}
			root.scrollLeft = state.scrollX;
			root.scrollTop = state.scrollY;
		});
		await interaction.dispose();
	}
	return frames;
}

async function stitchDocumentFrames(page, frames, geometry) {
	const stitcher = await page.context().newPage();
	try {
		const dataUrl = await stitcher.evaluate(
			async ({ frames, viewportWidth, documentHeight }) => {
				const canvas = document.createElement("canvas");
				const context = canvas.getContext("2d");
				let first;
				let scale;
				for (const frame of frames) {
					const blob = await (
						await fetch(`data:image/png;base64,${frame.image}`)
					).blob();
					const bitmap = await createImageBitmap(blob);
					first ||= bitmap;
					if (scale === undefined) {
						scale = bitmap.width / viewportWidth;
						canvas.width = bitmap.width;
						canvas.height = Math.round(documentHeight * scale);
					}
					const sourceY = Math.round(frame.sourceTop * scale);
					const targetY = Math.round(frame.documentTop * scale);
					const height = Math.round(frame.height * scale);
					context.drawImage(
						bitmap,
						0,
						sourceY,
						bitmap.width,
						height,
						0,
						targetY,
						canvas.width,
						height,
					);
					if (bitmap !== first) bitmap.close();
				}
				first?.close();
				return canvas.toDataURL("image/png");
			},
			{
				frames,
				viewportWidth: geometry.viewportWidth,
				documentHeight: geometry.documentHeight,
			},
		);
		return Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
	} finally {
		await stitcher.close();
	}
}

export async function captureComparison(page) {
	await settleComparison(page);
	try {
		const geometry = await comparisonGeometry(page);
		if (
			!Number.isFinite(geometry.viewportWidth) ||
			!Number.isFinite(geometry.viewportHeight) ||
			!Number.isFinite(geometry.documentHeight)
		)
			throw new ComparisonCaptureError(
				"Comparison capture could not measure the document",
			);
		if (geometry.documentHeight <= geometry.viewportHeight)
			return await screenshotViewport(page);
		const frames = await captureDocumentFrames(page, geometry);
		return await stitchDocumentFrames(page, frames, geometry);
	} catch (error) {
		throw new ComparisonCaptureError(
			`Comparison capture failed: ${error.message}`,
		);
	}
}

export { ComparisonCaptureError };
