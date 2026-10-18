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

export async function captureComparison(page) {
	await settleComparison(page);
	try {
		return await page.screenshot({
			fullPage: false,
			animations: "allow",
			caret: "hide",
		});
	} catch (error) {
		throw new ComparisonCaptureError(
			`Comparison capture failed: ${error.message}`,
		);
	}
}

export { ComparisonCaptureError };
