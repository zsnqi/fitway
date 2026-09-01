import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const fromRoot = (path: string) => resolve(root, path);

describe("Phase 1 scaffold reset", () => {
	it("removes demo routes, sign-up, theme plumbing, and chat components", () => {
		const removed = [
			"apps/web/src/components/header.tsx",
			"apps/web/src/components/mode-toggle.tsx",
			"apps/web/src/components/theme-provider.tsx",
			"apps/web/src/components/sign-up-form.tsx",
			"apps/web/src/routes/_auth/dashboard.tsx",
			"apps/web/src/routes/_auth/route.tsx",
			"packages/ui/src/components/attachment.tsx",
			"packages/ui/src/components/bubble.tsx",
			"packages/ui/src/components/marker.tsx",
			"packages/ui/src/components/message.tsx",
			"packages/ui/src/components/message-scroller.tsx",
		];

		for (const path of removed) {
			expect(existsSync(fromRoot(path)), path).toBe(false);
		}
	});

	it("keeps Arabic document defaults, localized metadata, and real assets", () => {
		const html = readFileSync(fromRoot("apps/web/index.html"), "utf8");
		const favicon = readFileSync(fromRoot("apps/web/public/favicon.png"));
		const logo = readFileSync(fromRoot("apps/web/public/fitway-logo.png"));
		const brandLogo = readFileSync(fromRoot("brand/fitway-logo.png"));
		expect(html).toContain('<html lang="ar" dir="rtl">');
		expect(html).toContain('name="description"');
		expect(html).toContain("/favicon.png");
		expect(html).toContain('sizes="32x32"');
		expect([favicon.readUInt32BE(16), favicon.readUInt32BE(20)]).toEqual([
			32, 32,
		]);
		expect([logo.readUInt32BE(16), logo.readUInt32BE(20)]).toEqual([
			1024, 1024,
		]);
		expect(logo.equals(brandLogo)).toBe(true);
		expect(
			existsSync(
				fromRoot("apps/web/public/fonts/cairo-arabic-400-normal.woff2"),
			),
		).toBe(true);
		expect(
			existsSync(
				fromRoot("apps/web/public/fonts/cairo-latin-600-normal.woff2"),
			),
		).toBe(true);
	});

	it("contains no scaffold demo procedure or light-theme dependency", () => {
		const router = readFileSync(
			fromRoot("packages/api/src/routers/index.ts"),
			"utf8",
		);
		const webPackage = readFileSync(fromRoot("apps/web/package.json"), "utf8");
		const uiPackage = readFileSync(
			fromRoot("packages/ui/package.json"),
			"utf8",
		);

		expect(router).not.toContain("privateData");
		expect(router).not.toContain("healthCheck");
		expect(webPackage).not.toContain("next-themes");
		expect(uiPackage).not.toContain("next-themes");
	});
});
