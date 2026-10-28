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
		const maxScroll = geometry.documentHeight - geometry.viewportHeight;
		for (
			let documentTop = 0;
			documentTop < geometry.documentHeight;
			documentTop += geometry.viewportHeight
		) {
			const target = Math.min(documentTop, maxScroll);
			const actual = await page.evaluate(
				({ left, top }) => {
					const root = document.scrollingElement || document.documentElement;
					root.scrollLeft = left;
					root.scrollTop = top;
					return { scrollX: root.scrollLeft, scrollY: root.scrollTop };
				},
				{ left: geometry.scrollX, top: target },
			);
			await page.evaluate(
				() => new Promise((resolve) => requestAnimationFrame(resolve)),
			);
			await page.evaluate(
				() => new Promise((resolve) => requestAnimationFrame(resolve)),
			);
			await settleComparison(page);
			const sourceTop = Math.max(0, Math.round(documentTop - actual.scrollY));
			const height = Math.min(
				Math.round(geometry.viewportHeight - sourceTop),
				Math.round(geometry.documentHeight - documentTop),
			);
			if (height <= 0)
				throw new ComparisonCaptureError(
					`Comparison capture produced no frame for document y ${documentTop}`,
				);
			const image = await screenshotViewport(page);
			frames.push({
				image: image.toString("base64"),
				documentTop,
				sourceTop,
				height,
			});
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
		if (typeof page.evaluateHandle !== "function")
			return await screenshotViewport(page);
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
