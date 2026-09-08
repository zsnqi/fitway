// @vitest-environment happy-dom

import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { I18nProvider } from "@/i18n/provider";

import { OwnerDateField } from "./owner-date-field";

let root: Root;
let container: HTMLDivElement;

function Harness({ onValidity }: { onValidity: (valid: boolean) => void }) {
	const [value, setValue] = useState("2024-02-28");
	return (
		<OwnerDateField
			id="day"
			label="Date"
			value={value}
			onChange={setValue}
			onValidityChange={onValidity}
		/>
	);
}

async function click(element: HTMLElement) {
	await act(async () => {
		element.click();
	});
}

beforeEach(async () => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	window.localStorage.setItem("fitway.locale", "en");
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
	await act(async () => {
		root.render(
			<I18nProvider>
				<Harness onValidity={vi.fn()} />
			</I18nProvider>,
		);
	});
});

afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
});

it("accepts a leap day and clears it instead of clamping when the year changes", async () => {
	const field = container.querySelector("[data-owner-date-field]");
	const value = field?.querySelector<HTMLInputElement>(
		"[data-owner-date-value]",
	);
	const day = field?.querySelector<HTMLButtonElement>(
		'button[aria-label="Day"]',
	);
	if (!day || !value) throw new Error("Missing localized date controls");

	await click(day);
	const leapDay = [
		...document.querySelectorAll<HTMLElement>(
			'.owner-date-field__popup[data-open] [role="option"]',
		),
	].find((option) => option.textContent?.trim() === "29");
	if (!leapDay) throw new Error("Missing leap-day option");
	await click(leapDay);
	expect(value.value).toBe("2024-02-29");

	const year = field?.querySelector<HTMLButtonElement>(
		'button[aria-label="Year"]',
	);
	if (!year) throw new Error("Missing year control");
	await click(year);
	const priorYear = [
		...document.querySelectorAll<HTMLElement>(
			'.owner-date-field__popup[data-open] [role="option"]',
		),
	].find((option) => option.textContent?.trim() === "2023");
	if (!priorYear) throw new Error("Missing year option");
	await click(priorYear);
	expect(value.value).toBe("2024-02-29");
	expect(day.textContent).toContain("—");
	expect(day.getAttribute("aria-invalid")).toBe("true");
});

it("uses one roving year option and supports keyboard selection", async () => {
	const field = container.querySelector("[data-owner-date-field]");
	const value = field?.querySelector<HTMLInputElement>(
		"[data-owner-date-value]",
	);
	const year = field?.querySelector<HTMLButtonElement>(
		'button[aria-label="Year"]',
	);
	if (!year || !value) throw new Error("Missing year controls");

	await click(year);
	const options = [
		...document.querySelectorAll<HTMLElement>(
			'.owner-date-field__popup[data-open] [role="option"]',
		),
	];
	const current = options.find(
		(option) => option.textContent?.trim() === "2024",
	);
	const next = options.find((option) => option.textContent?.trim() === "2025");
	if (!current || !next) throw new Error("Missing expected year options");

	expect(current.tabIndex).toBe(0);
	expect(next.tabIndex).toBe(-1);
	await act(async () => {
		current.focus();
		current.dispatchEvent(
			new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
		);
		await new Promise<void>((resolve) =>
			requestAnimationFrame(() => resolve()),
		);
	});
	expect(current.tabIndex).toBe(-1);
	expect(next.tabIndex).toBe(0);
	expect(document.activeElement).toBe(next);

	await act(async () => {
		next.dispatchEvent(
			new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
		);
	});
	expect(value.value).toBe("2025-02-28");
});
