// Parse and apply the small action surface public frames expose to designers.
const STEP_KINDS = new Set(["click", "tap", "hover", "focus", "press", "wait"]);

export function parseFrameActions(value) {
	if (value === undefined) return undefined;
	const source = String(value);
	if (!source.trim())
		throw new Error(
			"Missing frame actions; use click=<css>;tap=<css>;hover=<css>;focus=<css>;press=<key>;wait=<0-5000>",
		);
	return source.split(";").map((step) => {
		const separator = step.indexOf("=");
		if (separator < 1 || separator === step.length - 1)
			throw new Error(
				`Invalid frame action ${step}; use <kind>=<value> with one of ${[...STEP_KINDS].join(", ")}`,
			);
		const kind = step.slice(0, separator);
		const argument = step.slice(separator + 1);
		if (kind === "wait") {
			const milliseconds = Number(argument);
			if (
				!Number.isInteger(milliseconds) ||
				milliseconds < 0 ||
				milliseconds > 5000
			)
				throw new Error(
					`Invalid frame action ${step}; wait=<ms> needs a whole number from 0 to 5000`,
				);
		}
		return { step, kind, argument };
	});
}

export async function applyFrameActions(ui, page, actions, input) {
	for (const action of actions || []) {
		if (!STEP_KINDS.has(action.kind))
			throw new Error(
				`Unknown frame action ${action.step}; use ${[...STEP_KINDS].join(", ")}`,
			);
		if (action.kind === "tap" && input !== "touch")
			throw new Error(
				`Frame action ${action.step} needs touch input; pass --inputs touch or use click=`,
			);
		try {
			await ui.runAction(page, `${action.kind}:${action.argument}`);
		} catch (error) {
			throw new Error(`Frame action ${action.step} failed: ${error.message}`);
		}
	}
	if (actions?.length) await ui.twoFrames(page);
}

// Screenshot clips are document coordinates. The selector's box is viewport
// geometry, so clamp it to the visible viewport before adding the scroll offset.
export async function frameClip(page, selector, padding = 8) {
	const locator = page.locator(selector).first();
	const box = await locator.boundingBox();
	if (!box)
		throw new Error(`Clip selector matched nothing visible: ${selector}`);
	const viewport = await page.evaluate(() => ({
		width: window.innerWidth,
		height: window.innerHeight,
		scrollX: window.scrollX,
		scrollY: window.scrollY,
	}));
	const left = Math.max(0, box.x - padding);
	const top = Math.max(0, box.y - padding);
	const right = Math.min(viewport.width, box.x + box.width + padding);
	const bottom = Math.min(viewport.height, box.y + box.height + padding);
	if (right <= left || bottom <= top)
		throw new Error(
			`Clip selector has no visible box inside the viewport: ${selector}`,
		);
	return {
		x: left + viewport.scrollX,
		y: top + viewport.scrollY,
		width: right - left,
		height: bottom - top,
	};
}
