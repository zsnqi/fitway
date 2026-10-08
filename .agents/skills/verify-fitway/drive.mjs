import { outputFile } from "./core.mjs";

async function prove(page, proof, language) {
	if (proof.allOf) {
		for (const item of proof.allOf) await prove(page, item, language);
		return;
	}
	if (proof.expression) {
		await page.waitForFunction(proof.expression, undefined, { timeout: 5000 });
		return;
	}
	if (proof.ready) return;
	if (proof.path)
		await page.waitForURL((url) => url.pathname.endsWith(`/${proof.path}`));
	if (proof.oneOf) {
		const results = await Promise.allSettled(
			proof.oneOf.map((alternative) => prove(page, alternative, language)),
		);
		if (!results.some((result) => result.status === "fulfilled"))
			throw new Error("No alternative end state was observed");
		return;
	}
	if (proof.download) return;
	if (proof.language) {
		await page.waitForFunction(
			(lang) => document.documentElement.lang === lang,
			proof.language,
		);
		return;
	}
	if (proof.query) {
		await page.waitForFunction(
			(expected) =>
				Object.entries(expected).every(
					([key, value]) =>
						new URL(location.href).searchParams.get(key) === value,
				),
			proof.query,
		);
		return;
	}
	if (proof.languageChanged) {
		await page.waitForFunction(
			(old) => document.documentElement.lang !== old,
			language,
		);
		return;
	}
	const target = page.locator(proof.selector).first();
	if (
		proof.textContains &&
		!(await target.textContent()).includes(proof.textContains)
	)
		throw new Error(
			`State text missing: ${proof.selector} must contain ${proof.textContains}`,
		);
	if (proof.disabled && !(await target.isDisabled()))
		throw new Error(`Expected disabled control: ${proof.selector}`);
	if (
		proof.focused &&
		!(await target.evaluate((element) => element === document.activeElement))
	)
		throw new Error(`Expected user focus: ${proof.selector}`);
	if (
		proof.checked !== undefined &&
		(await target.isChecked()) !== proof.checked
	)
		throw new Error(`Wrong checked state: ${proof.selector}`);
	if (proof.hidden) await target.waitFor({ state: "hidden", timeout: 5000 });
	if (proof.visible) await target.waitFor({ state: "visible", timeout: 5000 });
	if (proof.attribute) {
		await page.waitForFunction(
			({ selector, attribute, value, nonempty }) => {
				const actual = document
					.querySelector(selector)
					?.getAttribute(attribute);
				return nonempty ? Boolean(actual) : actual === value;
			},
			{
				selector: proof.selector,
				attribute: proof.attribute,
				value: proof.value,
				nonempty: proof.nonempty,
			},
			{ timeout: 10000 },
		);
		const value = await target.getAttribute(proof.attribute);
		if ((proof.nonempty && !value) || (proof.value && value !== proof.value))
			throw new Error(
				`End state failed: ${proof.selector} ${proof.attribute}=${value}`,
			);
	}
	if (proof.nonemptyText)
		await page.waitForFunction(
			(selector) =>
				Boolean(document.querySelector(selector)?.textContent.trim()),
			proof.selector,
			{ timeout: 10000 },
		);
	if (
		proof.inputValue !== undefined &&
		(await target.inputValue()) !== proof.inputValue
	)
		throw new Error(`Wrong input value: ${proof.selector}`);
	if (proof.rangeStep) {
		const correct = await target.evaluate(
			(element) =>
				Math.abs(
					Number(element.value) - (Number(element.min) + Number(element.step)),
				) < 0.000001,
		);
		if (!correct)
			throw new Error(
				`Range did not respond to its user keys: ${proof.selector}`,
			);
	}
}

export class KeyboardReachError extends Error {}

export async function proveFeature(page, proof, language, input) {
	try {
		await prove(page, proof, language);
	} catch (error) {
		if (input === "keyboard")
			throw new KeyboardReachError(
				`Not reachable by keyboard via the recorded sequence: ${proof.selector || "feature result"}; focus stopped at ${(await focusedElement(page)).selector}; ${error.message}`,
			);
		throw error;
	}
}

export async function focusedElement(page) {
	return page.evaluate(() => {
		const element = document.activeElement;
		if (!element) return { selector: "<none>" };
		const parts = [];
		for (let node = element; node?.nodeType === 1; node = node.parentElement) {
			if (node.id) {
				parts.unshift(`#${CSS.escape(node.id)}`);
				break;
			}
			const siblings = [...(node.parentElement?.children || [node])].filter(
				(s) => s.tagName === node.tagName,
			);
			parts.unshift(
				`${node.localName}:nth-of-type(${siblings.indexOf(node) + 1})`,
			);
		}
		return {
			selector: parts.join(" > "),
			tag: element.localName,
			role: element.getAttribute("role"),
			text: (element.getAttribute("aria-label") || element.textContent || "")
				.replace(/\s+/g, " ")
				.trim()
				.slice(0, 120),
			tabindex: element.getAttribute("tabindex"),
		};
	});
}

export async function keyboardStep(page, key, entry, action) {
	const before = await focusedElement(page);
	await page.keyboard.press(key);
	const after = await focusedElement(page);
	entry.focusSteps ||= [];
	entry.focusSteps.push({ action, key, before, after });
}

export async function reachByKeyboard(page, selector, entry, action) {
	const target = page.locator(selector).first();
	const seen = new Set();
	for (let step = 0; step < 200; step++) {
		const focused = await focusedElement(page);
		if (
			(await target.count()) &&
			(await target.evaluate((e) => e === document.activeElement))
		)
			return target;
		if (seen.has(focused.selector))
			throw new KeyboardReachError(
				`Not reachable by keyboard: ${selector}; focus stopped at ${focused.selector} (${focused.text}); Tab cycle repeated`,
			);
		seen.add(focused.selector);
		await keyboardStep(page, "Tab", entry, action);
	}
	const focused = await focusedElement(page);
	throw new KeyboardReachError(
		`Not reachable by keyboard: ${selector}; focus stopped at ${focused.selector} (${focused.text}); 200-key limit`,
	);
}

async function performAction(ui, page, action, input, out, stem, entry) {
	if (input === "keyboard") {
		const split = action.indexOf(":");
		const kind = action.slice(0, split);
		const argument = action.slice(split + 1);
		if (kind === "press") return keyboardStep(page, argument, entry, action);
		if (
			[
				"activate",
				"click",
				"tap",
				"focus",
				"download",
				"type",
				"select",
			].includes(kind)
		) {
			const valueStart = argument.lastIndexOf("=");
			const selector = ["type", "select"].includes(kind)
				? argument.slice(0, valueStart)
				: argument;
			const target = await reachByKeyboard(page, selector, entry, action);
			if (kind === "focus") return;
			if (kind === "type") {
				await keyboardStep(page, "ControlOrMeta+A", entry, action);
				for (const character of argument.slice(valueStart + 1)) {
					const before = await focusedElement(page);
					await page.keyboard.type(character);
					entry.focusSteps ||= [];
					entry.focusSteps.push({
						action,
						key: character,
						before,
						after: await focusedElement(page),
					});
				}
				return;
			}
			if (kind === "select") {
				const choices = await target.evaluate((e) =>
					[...e.options].filter((o) => !o.disabled).map((o) => o.value),
				);
				const index = choices.indexOf(argument.slice(valueStart + 1));
				if (index < 0)
					throw new KeyboardReachError(
						`Not reachable by keyboard: option ${argument}; focus stopped at ${(await focusedElement(page)).selector}`,
					);
				await keyboardStep(page, "Home", entry, action);
				for (let i = 0; i < index; i++)
					await keyboardStep(page, "ArrowDown", entry, action);
				await keyboardStep(page, "Enter", entry, action);
				return;
			}
			if (kind === "download") {
				const [download] = await Promise.all([
					page.waitForEvent("download"),
					keyboardStep(page, "Enter", entry, action),
				]);
				const file = `${stem}-download.csv`;
				await download.saveAs(await outputFile(out, file));
				entry.download = {
					file,
					suggestedFilename: download.suggestedFilename(),
					failure: await download.failure(),
				};
				if (entry.download.failure)
					throw new Error(`Download failed: ${entry.download.failure}`);
				return;
			}
			return keyboardStep(page, "Enter", entry, action);
		}
		if (!["wait", "waitFor"].includes(kind))
			throw new KeyboardReachError(
				`Not reachable by keyboard: ${action} needs an authored keyboardActions sequence; focus stopped at ${(await focusedElement(page)).selector}`,
			);
	}
	if (action.startsWith("gesture:"))
		return ui.runAction(
			page,
			action.replace(/^gesture:/, input === "touch" ? "touchdrag:" : "drag:"),
		);
	if (action.startsWith("select:")) {
		const valueStart = action.lastIndexOf("=");
		await page
			.locator(action.slice(7, valueStart))
			.selectOption(action.slice(valueStart + 1));
	} else if (action.startsWith("download:")) {
		const selector = action.slice(9);
		await page.locator(selector).waitFor({ state: "visible", timeout: 10000 });
		const [download] = await Promise.all([
			page.waitForEvent("download"),
			ui.runAction(page, `${input === "touch" ? "tap" : "click"}:${selector}`),
		]);
		const file = `${stem}-download.csv`;
		await download.saveAs(await outputFile(out, file));
		entry.download = {
			file,
			suggestedFilename: download.suggestedFilename(),
			failure: await download.failure(),
		};
		if (entry.download.failure)
			throw new Error(`Download failed: ${entry.download.failure}`);
	} else await ui.runAction(page, action);
}

export { performAction, prove };
