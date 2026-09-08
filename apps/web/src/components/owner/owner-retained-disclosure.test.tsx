// @vitest-environment happy-dom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { OwnerRetainedDisclosure } from "./owner-retained-disclosure";

let container: HTMLDivElement;
let root: Root;

async function click(element: HTMLElement | null) {
	await act(async () => element?.click());
}

beforeEach(async () => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
	await act(async () => {
		root.render(
			<OwnerRetainedDisclosure className="test-disclosure" summary="Details">
				<button type="button">Inside</button>
			</OwnerRetainedDisclosure>,
		);
	});
});

afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	vi.restoreAllMocks();
});

it("hides closing content immediately and returns focus to its trigger", async () => {
	const trigger = container.querySelector<HTMLButtonElement>(
		".owner-retained-disclosure__trigger",
	);
	await click(trigger);
	const body = container.querySelector<HTMLElement>(
		".owner-retained-disclosure__body",
	);
	expect(trigger?.getAttribute("aria-expanded")).toBe("true");
	expect(body?.getAttribute("aria-hidden")).toBe("false");
	expect(body?.hasAttribute("inert")).toBe(false);

	const inside = body?.querySelector<HTMLButtonElement>("button");
	inside?.focus();
	await click(trigger);
	expect(trigger?.getAttribute("aria-expanded")).toBe("false");
	expect(body?.getAttribute("aria-hidden")).toBe("true");
	expect(body?.hasAttribute("inert")).toBe(true);
	expect(document.activeElement).toBe(trigger);
	expect(
		container.querySelector(".owner-retained-disclosure__body"),
	).not.toBeNull();
});

it("lets a rapid reopen win over a stale closing completion", async () => {
	const trigger = container.querySelector<HTMLButtonElement>(
		".owner-retained-disclosure__trigger",
	);
	await click(trigger);
	await click(trigger);
	await click(trigger);
	const clip = container.querySelector<HTMLElement>(
		".owner-retained-disclosure__clip",
	);
	await act(async () => {
		clip?.dispatchEvent(
			new globalThis.TransitionEvent("transitionend", {
				bubbles: true,
				propertyName: "block-size",
			}),
		);
	});
	expect(trigger?.getAttribute("aria-expanded")).toBe("true");
	expect(
		container.querySelector(".owner-retained-disclosure__body"),
	).not.toBeNull();
	expect(
		container
			.querySelector(".owner-retained-disclosure__body")
			?.hasAttribute("inert"),
	).toBe(false);
});

it("settles without a retained closing shell under reduced motion", async () => {
	vi.spyOn(window, "matchMedia").mockReturnValue({
		matches: true,
		media: "(prefers-reduced-motion: reduce)",
		onchange: null,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		addListener: vi.fn(),
		removeListener: vi.fn(),
		dispatchEvent: vi.fn(),
	});
	const trigger = container.querySelector<HTMLButtonElement>(
		".owner-retained-disclosure__trigger",
	);
	await click(trigger);
	await click(trigger);
	expect(
		container.querySelector(".owner-retained-disclosure__body"),
	).toBeNull();
});
