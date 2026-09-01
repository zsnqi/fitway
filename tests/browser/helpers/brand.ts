import { expect, type Page } from "@playwright/test";

export async function expectOfficialBrandMark(page: Page, selector: string) {
	const brand = page.locator(selector);
	await expect(brand).toBeVisible();
	await expect(brand.locator("svg")).toHaveCount(0);

	const mark = brand.locator('img[src="/fitway-logo.png"]');
	await expect(mark).toHaveCount(1);
	await expect(mark).toBeVisible();
	const image = await mark.evaluate(async (element) => {
		await element.decode();
		await new Promise<void>((resolve) => {
			requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
		});
		const style = getComputedStyle(element);
		return {
			currentPath: new URL(element.currentSrc).pathname,
			naturalWidth: element.naturalWidth,
			naturalHeight: element.naturalHeight,
			opacity: style.opacity,
			visibility: style.visibility,
		};
	});
	expect(image).toEqual({
		currentPath: "/fitway-logo.png",
		naturalWidth: 1024,
		naturalHeight: 1024,
		opacity: "1",
		visibility: "visible",
	});
	return mark;
}
