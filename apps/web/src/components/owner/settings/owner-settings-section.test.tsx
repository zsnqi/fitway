// @vitest-environment happy-dom

import { ORPCError } from "@orpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider, useI18n } from "@/i18n/provider";

const { read, update } = vi.hoisted(() => ({
	read: vi.fn(),
	update: vi.fn(),
}));
vi.mock("@/utils/orpc", () => ({
	client: {
		admin: {
			settings: { read, update },
		},
	},
}));

const { dailyAnalytics } = vi.hoisted(() => ({
	dailyAnalytics: { isPending: false, isError: false, isFetching: false },
}));
vi.mock("@/hooks/use-owner-daily-analytics", () => ({
	useOwnerDailyAnalytics: () => dailyAnalytics,
}));

import { ownerSettingsMessages } from "./messages";
import { OwnerSettingsSection } from "./owner-settings-section";

const snapshot = {
	version: 7,
	effectiveFromUtc: "2026-08-30T12:00:00.000Z",
	editable: {
		capacity: 220,
		thresholds: {
			quietMaxPercent: 30,
			moderateMaxPercent: 55,
			busyMaxPercent: 80,
		},
		weeklySchedule: {
			sun: { open: "06:00", close: "23:00" },
			mon: { open: "06:00", close: "23:00" },
			tue: { open: "06:00", close: "23:00" },
			wed: { open: "06:00", close: "23:00" },
			thu: { open: "06:00", close: "23:00" },
			fri: { open: "13:00", close: "01:00" },
			sat: null,
		},
		businessDayBoundary: "04:00",
		resetBufferMinutes: 15,
	},
	operational: {
		timezone: "Asia/Riyadh",
		pushIntervalSeconds: 20,
		freshForSeconds: 90,
		operationalStaleAfterSeconds: 180,
		publicPollSeconds: 60,
	},
};

function saveOutput(version = 8, capacity = 240) {
	return {
		settings: {
			...snapshot,
			version,
			editable: { ...snapshot.editable, capacity },
		},
		auditId: 42,
	};
}

/** Wraps the section with a real locale toggle, exactly like the shell does. */
function LocaleProbe() {
	const { toggleLocale } = useI18n();
	return (
		<>
			<button type="button" data-do="toggle-locale" onClick={toggleLocale}>
				locale
			</button>
			<OwnerSettingsSection enabled />
		</>
	);
}

let root: Root | undefined;
let container: HTMLDivElement;
let lastQueryClient: QueryClient;

async function settle() {
	for (let pass = 0; pass < 4; pass += 1) {
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});
	}
}

async function render(locale: "ar" | "en" = "en") {
	lastQueryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	document.documentElement.lang = locale;
	await act(async () => {
		root?.render(
			<I18nProvider key={locale}>
				<QueryClientProvider client={lastQueryClient}>
					<OwnerSettingsSection enabled />
				</QueryClientProvider>
			</I18nProvider>,
		);
	});
	await settle();
}

function q<K extends Element = HTMLElement>(selector: string): K | null {
	return (container.querySelector(selector) as K) ?? null;
}

function all<K extends Element = HTMLElement>(selector: string): K[] {
	return [...container.querySelectorAll(selector)] as K[];
}

function setControlledValue(input: HTMLInputElement | null, value: string) {
	if (!input) return;
	Object.getOwnPropertyDescriptor(
		HTMLInputElement.prototype,
		"value",
	)?.set?.call(input, value);
	input.dispatchEvent(new Event("input", { bubbles: true }));
}

function clickButton(element: Element | null) {
	element?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

function setChecked(checkbox: HTMLInputElement | null, checked: boolean) {
	// A controlled checkbox changes through a click, which toggles the native
	// value and lets React's onChange observe the new state.
	if (checkbox && checkbox.checked !== checked) checkbox.click();
}

function submitForm() {
	const form = q<HTMLFormElement>("form.owner-settings__form");
	form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
}

function field(name: string) {
	return q<HTMLInputElement>(`input[data-testid='${name}']`);
}

function checkboxes() {
	return all<HTMLInputElement>("input[data-testid$='-toggle']");
}

function timeInputs() {
	return all<HTMLInputElement>(
		"input[data-testid$='-open'], input[data-testid$='-close']",
	);
}

function saveButton(): HTMLButtonElement | undefined {
	return all<HTMLButtonElement>("button")
		.filter((b) => b.getAttribute("type") === "submit")
		.at(0);
}

function statusText() {
	return q("p.owner-settings__status")?.textContent ?? "";
}

beforeEach(() => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	read.mockReset();
	update.mockReset();
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	if (root) await act(async () => root?.unmount());
	container.remove();
	document.documentElement.lang = "";
});

describe("owner settings section", () => {
	it("keeps unknown configured timezone identifiers exact", () => {
		expect(ownerSettingsMessages.en.timezoneValue("Europe/London")).toBe(
			"Europe/London",
		);
		expect(ownerSettingsMessages.ar.timezoneValue("Europe/London")).toBe(
			"Europe/London",
		);
	});

	it("renders the form once the prerequisite settles and populates the fixture", async () => {
		read.mockResolvedValue(snapshot);
		await render();

		expect(read).toHaveBeenCalledTimes(1);
		expect(q("h1")?.textContent).toBe("Settings");
		expect(field("capacity")?.value).toBe("220");
		expect(field("boundary")?.value).toBe("04:00");
		expect(field("reset")?.value).toBe("15");
		expect(field("quietMaxPercent")?.value).toBe("30");
		expect(checkboxes()).toHaveLength(7);
		expect(container.textContent).toContain("Riyadh time (Asia/Riyadh)");
		expect(container.textContent).toContain("20 seconds");
		// The status chip carries the save state only; a revision numeral would
		// read as internal versioning.
		expect(q(".owner-settings__version bdi")?.textContent).toBe("Saved");
		expect(q(".owner-settings__version")?.textContent).not.toContain("7");
		expect(field("boundary")?.placeholder).toBe("04:00");
	});

	it("shows a load failure with Retry and no fabricated settings", async () => {
		read.mockRejectedValue(new Error("Service Unavailable"));
		await render();

		expect(q("h1")?.textContent).toBe("Settings");
		const state = q('[data-owner-settings-state="error"]');
		expect(state?.getAttribute("role")).toBe("alert");
		expect(state?.textContent).toContain(ownerSettingsMessages.en.errorTitle);
		expect(state?.querySelector("svg")).not.toBeNull();
		expect(q("[data-owner-async-swap]")).not.toBeNull();
		expect(timeInputs()).toHaveLength(0);
		const retry = all("button").find((b) => b.textContent === "Try again");
		expect(retry).toBeDefined();

		read.mockResolvedValue(snapshot);
		await act(async () => {
			clickButton(retry ?? null);
		});
		await settle();
		expect(field("capacity")?.value).toBe("220");
	});

	it("shows the shared state card while the settings read is pending", async () => {
		read.mockReturnValue(new Promise(() => undefined));
		await render();

		expect(q("h1")?.textContent).toBe("Settings");
		const state = q('[data-owner-settings-state="loading"]');
		expect(state?.getAttribute("role")).toBe("status");
		expect(state?.getAttribute("aria-live")).toBe("polite");
		expect(state?.querySelector("svg")).not.toBeNull();
		expect(
			state?.querySelector(".owner-settings__loading-bars"),
		).not.toBeNull();
		expect(q("[data-owner-async-swap]")).not.toBeNull();
		expect(timeInputs()).toHaveLength(0);
	});

	it("keys the settled form inside the heading-preserving entry seam", async () => {
		read.mockResolvedValue(snapshot);
		await render();

		const swap = q("[data-owner-async-swap]");
		expect(swap).not.toBeNull();
		expect(swap?.classList).toContain("owner-async-swap--settings");
		expect(
			swap?.querySelector(".owner-async-swap__current .owner-settings"),
		).not.toBeNull();
		expect(swap?.querySelector(".owner-settings__top h1")?.textContent).toBe(
			"Settings",
		);
	});

	it("stays clean and locks Save until a value changes; Discard restores the server values", async () => {
		read.mockResolvedValue(snapshot);
		await render();

		expect(saveButton()?.disabled).toBe(true);
		expect(container.textContent).not.toContain("Discard changes");

		await act(async () => {
			setControlledValue(field("capacity") ?? null, "240");
		});
		expect(saveButton()?.disabled).toBe(false);
		expect(container.textContent).toContain("Discard changes");
		expect(container.textContent).toContain("Unsaved changes");
		expect(q(".owner-settings__version bdi")?.textContent).toBe("Unsaved");

		await act(async () => {
			clickButton(
				all("button").find((b) => b.textContent === "Discard changes") ?? null,
			);
		});
		await settle();
		expect(field("capacity")?.value).toBe("220");
		expect(saveButton()?.disabled).toBe(true);
		expect(q(".owner-settings__version bdi")?.textContent).toBe("Saved");
	});

	it("announces the created version through the polite status region", async () => {
		read.mockResolvedValue(snapshot);
		update.mockResolvedValue(saveOutput(8));
		await render();

		await act(async () => {
			setControlledValue(field("capacity") ?? null, "240");
		});
		await act(async () => {
			submitForm();
		});
		await settle();

		expect(update).toHaveBeenCalledTimes(1);
		expect(update.mock.calls[0]?.[0]).toMatchObject({
			expectedVersion: 7,
			editable: { ...snapshot.editable, capacity: 240 },
		});
		expect(statusText()).toContain(
			"Settings saved. The change is recorded in Activity Log.",
		);
		expect(field("capacity")?.value).toBe("240");
	});

	it("preserves the draft on an atomic failure and unlocks Save for retry", async () => {
		read.mockResolvedValue(snapshot);
		update.mockRejectedValueOnce(new Error("insert failed"));
		await render();

		await act(async () => {
			setControlledValue(field("capacity") ?? null, "260");
		});
		await act(async () => {
			submitForm();
		});
		await settle();

		expect(field("capacity")?.value).toBe("260");
		expect(statusText()).toContain("Nothing was changed.");
		expect(saveButton()?.disabled).toBe(false);
		expect(q(".owner-settings__version bdi")?.textContent).toBe("Not saved");

		// Editing after a failure leaves the old outcome behind. Validation and
		// clean-state truth take precedence over an obsolete retry message.
		await act(async () => {
			setControlledValue(field("capacity") ?? null, "5000000000");
		});
		expect(saveButton()?.disabled).toBe(true);
		expect(statusText()).toContain("Save stays locked until they are fixed.");
		expect(statusText()).not.toContain("Nothing was changed.");

		await act(async () => {
			setControlledValue(field("capacity") ?? null, "220");
		});
		expect(saveButton()?.disabled).toBe(true);
		expect(container.textContent).not.toContain("Discard changes");
		expect(statusText()).toBe("");

		await act(async () => {
			setControlledValue(field("capacity") ?? null, "260");
		});
		expect(saveButton()?.disabled).toBe(false);

		update.mockResolvedValueOnce(saveOutput(9, 260));
		await act(async () => {
			submitForm();
		});
		await settle();
		expect(update).toHaveBeenCalledTimes(2);
		expect(statusText()).toContain(
			"Settings saved. The change is recorded in Activity Log.",
		);
	});

	it("keeps the draft on a version conflict, disables Save, and reloads on Discard", async () => {
		read.mockResolvedValue(snapshot);
		update.mockRejectedValueOnce(
			new ORPCError("CONFLICT", {
				message: "Settings were updated by someone else",
				data: { code: "settings_version_conflict" },
			}),
		);
		await render();

		await act(async () => {
			setControlledValue(field("capacity") ?? null, "260");
		});
		await act(async () => {
			submitForm();
		});
		await settle();

		expect(statusText()).toContain("Settings changed elsewhere.");
		expect(saveButton()?.disabled).toBe(true);

		read.mockResolvedValue({
			...snapshot,
			version: 11,
			editable: { ...snapshot.editable, capacity: 300 },
		});
		await act(async () => {
			clickButton(
				all("button").find((b) => b.textContent === "Discard changes") ?? null,
			);
		});
		await settle();

		expect(statusText()).not.toContain("Settings changed elsewhere.");
		expect(field("capacity")?.value).toBe("300");
		expect(saveButton()?.disabled).toBe(true);
	});

	it("blocks Save while a field is invalid and names each field error", async () => {
		read.mockResolvedValue(snapshot);
		await render();

		await act(async () => {
			setControlledValue(field("capacity") ?? null, "5000000000");
		});
		await act(async () => {
			setControlledValue(field("boundary") ?? null, "25:00");
		});

		expect(saveButton()?.disabled).toBe(true);
		expect(field("capacity")?.parentElement?.classList).toContain(
			"owner-settings__control",
		);
		expect(field("capacity")?.parentElement?.classList).toContain(
			"owner-settings__control--error",
		);
		expect(container.textContent).toContain("Enter a number of people.");
		expect(container.textContent).toContain(
			"Use 24-hour time, for example 04:00.",
		);

		await act(async () => {
			setControlledValue(field("boundary") ?? null, "03:00");
		});
		await act(async () => {
			setControlledValue(field("capacity") ?? null, "240");
		});
		expect(saveButton()?.disabled).toBe(false);
	});

	it("keeps each value and its unit together in one control sized to the value", async () => {
		read.mockResolvedValue(snapshot);
		await render();

		for (const [name, width, unitText] of [
			["capacity", "6ch", "people"],
			["boundary", "6ch", "Riyadh time"],
			["reset", "5ch", "minutes"],
			["quietMaxPercent", "5ch", "%"],
		] as const) {
			const input = field(name);
			const control = input?.parentElement;
			expect(control?.getAttribute("data-width")).toBe(width);
			const unit = control?.querySelector(".owner-settings__unit");
			expect(unit?.textContent).toBe(unitText);
			expect(input?.nextElementSibling).toBe(unit);
		}
	});

	it("orders thresholds Quiet, Moderate, Busy and reports an order error on Moderate", async () => {
		read.mockResolvedValue(snapshot);
		await render();

		expect(field("quietMaxPercent")?.value).toBe("30");
		expect(field("moderateMaxPercent")?.value).toBe("55");
		expect(field("busyMaxPercent")?.value).toBe("80");

		await act(async () => {
			setControlledValue(field("moderateMaxPercent") ?? null, "10");
		});
		expect(container.textContent).toContain(
			"Moderate must be greater than Quiet (30%).",
		);
	});

	it("serializes an unchecked day as null, restores its draft-only pair on recheck, and starts a persisted closed day empty", async () => {
		read.mockResolvedValue(snapshot);
		update.mockResolvedValue(saveOutput(8));
		await render();

		expect(timeInputs()[0]?.value).toBe("06:00");
		expect(timeInputs()[1]?.value).toBe("23:00");
		const toggles = checkboxes();
		expect(toggles[0]?.checked).toBe(true);
		expect(toggles[6]?.checked).toBe(false);

		await act(async () => {
			setChecked(toggles[0] ?? null, false);
		});
		expect(timeInputs()).toHaveLength(10);
		expect(container.textContent).toContain(
			"Open and close unavailable while closed",
		);

		await act(async () => {
			setChecked(checkboxes()[0] ?? null, true);
		});
		expect(timeInputs()[0]?.value).toBe("06:00");
		expect(timeInputs()[1]?.value).toBe("23:00");

		// Open the persisted closed Saturday: empty required times, Save locked.
		await act(async () => {
			setChecked(checkboxes()[6] ?? null, true);
		});
		expect(timeInputs().filter((input) => input.value === "")).toHaveLength(2);
		expect(saveButton()?.disabled).toBe(true);
		expect(container.textContent).toContain("Enter a time.");
		expect(field("sat-open")?.parentElement?.classList).toContain(
			"owner-settings__time",
		);
		expect(field("sat-open")?.parentElement?.classList).toContain(
			"owner-settings__time--error",
		);
	});

	it("keeps a next-day close hint on the Friday fixture and preserves the draft across a locale switch", async () => {
		read.mockResolvedValue(snapshot);
		update.mockResolvedValue(saveOutput(8));
		document.documentElement.lang = "en";
		lastQueryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		await act(async () => {
			root?.render(
				<I18nProvider>
					<QueryClientProvider client={lastQueryClient}>
						<LocaleProbe />
					</QueryClientProvider>
				</I18nProvider>,
			);
		});
		await settle();

		await act(async () => {
			setControlledValue(field("capacity") ?? null, "240");
		});
		expect(container.textContent).toContain("Closes next day");

		// A real locale switch re-renders in place; it never remounts the
		// section, so the loaded snapshot and the draft both survive.
		await act(async () => {
			clickButton(q("button[data-do='toggle-locale']"));
		});
		await settle();

		expect(q("h1")?.textContent).toBe("الإعدادات");
		expect(field("capacity")?.value).toBe("240");
		expect(container.textContent).toContain("بداية يوم العمل");
		expect(container.textContent).toContain("توقيت الرياض (Asia/Riyadh)");
		expect(container.textContent).toContain("20 ثانية");
		expect(q(".owner-settings__version bdi")?.textContent).toBe("غير محفوظ");
	});
});
