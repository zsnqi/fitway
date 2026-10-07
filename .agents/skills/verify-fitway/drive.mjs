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

async function performAction(ui, page, action, input, out, stem, entry) {
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
