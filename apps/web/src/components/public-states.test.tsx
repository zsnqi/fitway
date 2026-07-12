// @vitest-environment happy-dom

import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { localeConfig } from "@/i18n/locale";
import { I18nProvider } from "@/i18n/provider";

import { PublicStatusSkeleton } from "./public-status-skeleton";
import { UnavailableState } from "./unavailable-state";

let root: Root | undefined;
let container: HTMLDivElement;

async function render(element: ReactNode) {
	root = createRoot(container);
	await act(async () => {
		root?.render(<I18nProvider>{element}</I18nProvider>);
	});
}

beforeEach(() => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	window.localStorage.clear();
	document.documentElement.lang = "ar";
	document.documentElement.dir = "rtl";
	container = document.createElement("div");
	document.body.append(container);
});

afterEach(async () => {
	if (root) {
		await act(async () => root?.unmount());
	}
	root = undefined;
	container.remove();
});

describe("public occupancy states", () => {
	it("renders an icon and localized unavailable label without live data", async () => {
		await render(<UnavailableState />);

		const status = container.querySelector('[role="status"]');
		expect(status?.querySelector("svg")).not.toBeNull();
		expect(status?.textContent).toContain(
			localeConfig.ar.messages.publicPage.unavailableTitle,
		);
		expect(container.querySelector('[role="meter"]')).toBeNull();
		expect(container.querySelector(".fw-occupancy-number")).toBeNull();
	});

	it("renders an accessible, visually hidden loading announcement", async () => {
		await render(<PublicStatusSkeleton />);

		const busyRegion = container.querySelector('[aria-busy="true"]');
		const loadingStatus = container.querySelector('[role="status"]');
		expect(busyRegion).not.toBeNull();
		expect(busyRegion?.querySelector('[aria-hidden="true"]')).not.toBeNull();
		expect(loadingStatus?.textContent).toContain(
			localeConfig.ar.messages.publicPage.loading,
		);
	});
});
