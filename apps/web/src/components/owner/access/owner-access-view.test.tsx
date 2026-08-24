// @vitest-environment happy-dom

import type {
	OwnerCredentialResetInput,
	OwnerDeactivateInput,
	OwnerProvisionInput,
	OwnerReactivateInput,
	PrincipalGovernance,
	StaffPinDeactivateInput,
} from "@fitway/api/access/contracts";
import { act, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { OwnerAccessMutation } from "@/hooks/use-owner-access";
import { I18nProvider } from "@/i18n/provider";

import { ownerAccessMessages } from "./messages";
import {
	OwnerAccessEmpty,
	OwnerAccessError,
	OwnerAccessLive,
	OwnerAccessLoading,
	OwnerAccessRefusal,
	OwnerAccessReveal,
} from "./owner-access-view";

const staffPrincipalId = "00000000-0000-4000-8000-0000000000c1";
const ownerAId = "00000000-0000-4000-8000-0000000000a1";

const REFUSAL_CODES = [
	"staff_pin_already_active",
	"staff_pin_not_active",
	"owner_self_deactivation",
	"owner_last_active",
	"owner_already_inactive",
	"owner_already_active",
	"owner_email_taken",
	"not_an_owner",
	"reason_required",
] as const;

function staffPrincipal(): PrincipalGovernance {
	return {
		principalId: staffPrincipalId,
		principalKind: "shared_staff",
		role: "staff",
		displayName: "Shared front desk",
		ownerEmail: null,
		active: true,
		credentialVersion: 3,
		credentialActive: true,
	};
}

function ownerPrincipal(
	overrides: Partial<PrincipalGovernance> = {},
): PrincipalGovernance {
	return {
		principalId: ownerAId,
		principalKind: "owner",
		role: "owner",
		displayName: "Nadia",
		ownerEmail: "nadia@example.com",
		active: true,
		credentialVersion: 2,
		credentialActive: true,
		...overrides,
	};
}

function idleMutation<TInput>(): OwnerAccessMutation<TInput> {
	return { outcome: { phase: "idle" }, submit: () => {}, reset: () => {} };
}

function liveProps(principals: readonly PrincipalGovernance[]) {
	return {
		principals,
		revealedPin: null,
		dismissRevealedPin: () => {},
		provisionStaffPin: idleMutation<void>(),
		rotateStaffPin: idleMutation<void>(),
		deactivateStaffPin: idleMutation<StaffPinDeactivateInput>(),
		provisionOwner: idleMutation<OwnerProvisionInput>(),
		deactivateOwner: idleMutation<OwnerDeactivateInput>(),
		reactivateOwner: idleMutation<OwnerReactivateInput>(),
		resetOwnerCredential: idleMutation<OwnerCredentialResetInput>(),
	};
}

let root: Root | undefined;
let container: HTMLDivElement;

async function render(node: React.ReactNode, locale: "ar" | "en") {
	document.documentElement.lang = locale;
	await act(async () => {
		root?.render(<I18nProvider>{node}</I18nProvider>);
	});
}

beforeEach(() => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	if (root) await act(async () => root?.unmount());
	container.remove();
	document.documentElement.lang = "";
});

describe("owner access states", () => {
	it("announces loading politely with assistive text", async () => {
		await render(<OwnerAccessLoading />, "en");
		const state = container.querySelector(
			'[data-owner-access-state="loading"]',
		);
		expect(state?.getAttribute("role")).toBe("status");
		expect(state?.getAttribute("aria-live")).toBe("polite");
		expect(state?.textContent).toContain(ownerAccessMessages.en.loading);
	});

	it("raises an error alert that offers a retry and substitutes no account", async () => {
		let retried = 0;
		await render(<OwnerAccessError onRetry={() => (retried += 1)} />, "en");
		const alert = container.querySelector('[data-owner-access-state="error"]');
		expect(alert?.getAttribute("role")).toBe("alert");
		expect(container.textContent).not.toContain("@");
		await act(async () => {
			container
				.querySelector("button")
				?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});
		expect(retried).toBe(1);
	});

	it("explains an empty list without pretending an account exists", async () => {
		await render(<OwnerAccessEmpty />, "en");
		expect(
			container.querySelector('[data-owner-access-state="empty"]')?.textContent,
		).toContain(ownerAccessMessages.en.emptyTitle);
		expect(container.textContent).not.toContain("@");
	});
});

describe("typed refusals", () => {
	it("has copy for every refusal code in both locales", () => {
		for (const locale of ["en", "ar"] as const) {
			for (const code of REFUSAL_CODES) {
				expect(ownerAccessMessages[locale].refusals[code]).toBeTruthy();
			}
		}
	});

	it("renders each refusal with its own copy, never the generic line", async () => {
		for (const code of REFUSAL_CODES) {
			await render(
				<OwnerAccessRefusal outcome={{ phase: "refused", code }} />,
				"en",
			);
			const note = container.querySelector(
				`[data-owner-access-refusal="${code}"]`,
			);
			expect(note?.getAttribute("role")).toBe("alert");
			expect(note?.textContent).toBe(ownerAccessMessages.en.refusals[code]);
			expect(note?.textContent).not.toContain(
				ownerAccessMessages.en.failedToApply,
			);
		}
	});

	it("renders the same refusal in Arabic with Western digits only", async () => {
		for (const code of REFUSAL_CODES) {
			await render(
				<OwnerAccessRefusal outcome={{ phase: "refused", code }} />,
				"ar",
			);
			expect(container.textContent).toBe(ownerAccessMessages.ar.refusals[code]);
			expect(container.textContent).not.toMatch(/[٠-٩۰-۹]/u);
		}
	});

	it("renders an unnamed failure as the generic retry line", async () => {
		await render(<OwnerAccessRefusal outcome={{ phase: "failed" }} />, "en");
		expect(
			container.querySelector("[data-owner-access-failure]")?.textContent,
		).toBe(ownerAccessMessages.en.failedToApply);
	});

	it("renders nothing for idle, pending, and success", async () => {
		for (const phase of ["idle", "pending", "success"] as const) {
			await render(
				<OwnerAccessRefusal
					outcome={
						phase === "success"
							? {
									phase,
									output: {
										auditId: 1,
										principal: staffPrincipal(),
										revokedSessions: 0,
									},
								}
							: { phase }
					}
				/>,
				"en",
			);
			expect(container.textContent).toBe("");
		}
	});
});

describe("owner access live", () => {
	it("shows an active staff PIN with rotate and deactivate, not provision", async () => {
		await render(<OwnerAccessLive {...liveProps([staffPrincipal()])} />, "en");
		const card = container.querySelector("[data-owner-access-staff-pin]");
		expect(card?.textContent).toContain(ownerAccessMessages.en.staffPinActive);
		expect(card?.textContent).toContain(ownerAccessMessages.en.rotateStaffPin);
		expect(card?.textContent).toContain(
			ownerAccessMessages.en.deactivateStaffPin,
		);
		expect(card?.textContent).not.toContain(
			ownerAccessMessages.en.provisionStaffPin,
		);
	});

	it("shows an unprovisioned PIN with only the provision action", async () => {
		await render(
			<OwnerAccessLive
				{...liveProps([
					{
						...staffPrincipal(),
						credentialVersion: null,
						credentialActive: null,
					},
				])}
			/>,
			"en",
		);
		const card = container.querySelector("[data-owner-access-staff-pin]");
		expect(card?.textContent).toContain(
			ownerAccessMessages.en.staffPinNotProvisioned,
		);
		expect(card?.textContent).toContain(
			ownerAccessMessages.en.provisionStaffPin,
		);
		expect(card?.textContent).not.toContain(
			ownerAccessMessages.en.rotateStaffPin,
		);
	});

	it("shows a deactivated PIN as a named state that can be provisioned again", async () => {
		await render(
			<OwnerAccessLive
				{...liveProps([{ ...staffPrincipal(), credentialActive: false }])}
			/>,
			"en",
		);
		const card = container.querySelector("[data-owner-access-staff-pin]");
		expect(card?.textContent).toContain(
			ownerAccessMessages.en.staffPinInactive,
		);
		expect(card?.textContent).toContain(
			ownerAccessMessages.en.provisionStaffPin,
		);
	});

	it("lists each owner with its name, email, and active state", async () => {
		await render(
			<OwnerAccessLive
				{...liveProps([
					staffPrincipal(),
					ownerPrincipal(),
					ownerPrincipal({
						principalId: "00000000-0000-4000-8000-0000000000a2",
						displayName: "Samir",
						ownerEmail: "samir@example.com",
						active: false,
						credentialActive: false,
					}),
				])}
			/>,
			"en",
		);
		const text = container.textContent ?? "";
		expect(text).toContain("Nadia");
		expect(text).toContain("nadia@example.com");
		expect(text).toContain("Samir");
		expect(text).toContain(ownerAccessMessages.en.ownerInactive);
		expect(text).toContain(ownerAccessMessages.en.reactivateOwner);
	});

	it("offers deactivate and reset for an active owner, only reactivate for an inactive one", async () => {
		await render(
			<OwnerAccessLive
				{...liveProps([
					ownerPrincipal(),
					ownerPrincipal({
						principalId: "00000000-0000-4000-8000-0000000000a2",
						active: false,
						credentialActive: false,
					}),
				])}
			/>,
			"en",
		);
		const rows = [...container.querySelectorAll(".owner-access-owner")];
		const [activeRow, inactiveRow] = rows;
		const buttonLabels = (row: Element | undefined) =>
			[...(row?.querySelectorAll("button") ?? [])].map(
				(button) => button.textContent?.trim() ?? "",
			);
		expect(buttonLabels(activeRow)).toContain(
			ownerAccessMessages.en.deactivateOwner,
		);
		expect(buttonLabels(activeRow)).toContain(
			ownerAccessMessages.en.resetCredential,
		);
		expect(buttonLabels(activeRow)).not.toContain(
			ownerAccessMessages.en.reactivateOwner,
		);
		expect(buttonLabels(inactiveRow)).toContain(
			ownerAccessMessages.en.reactivateOwner,
		);
		expect(buttonLabels(inactiveRow)).not.toContain(
			ownerAccessMessages.en.deactivateOwner,
		);
	});

	it("renders Arabic with Western digits and a plain-hyphen 6-12 range", async () => {
		await render(
			<OwnerAccessLive {...liveProps([staffPrincipal(), ownerPrincipal()])} />,
			"ar",
		);
		const text = container.textContent ?? "";
		expect(text).toContain(ownerAccessMessages.ar.staffPinTitle);
		expect(text).not.toMatch(/[٠-٩۰-۹]/u);
		expect(ownerAccessMessages.ar.staffPinDescription).toContain("6-12");
		expect(ownerAccessMessages.ar.staffPinDescription).not.toContain("\u2013");
		expect(text).toContain(ownerAccessMessages.ar.staffPinActive);
	});

	it("renders a non-null reveal inside the live view", async () => {
		await render(
			<OwnerAccessLive
				{...liveProps([staffPrincipal()])}
				revealedPin="48291057"
			/>,
			"en",
		);
		expect(
			container.querySelector("[data-owner-access-reveal]"),
		).not.toBeNull();
		expect(container.textContent).toContain("48291057");
	});
});

describe("the one-time reveal", () => {
	it("places focus on the dismiss control and returns it on dismissal", async () => {
		function RevealHost() {
			const [pin, setPin] = useState<string | null>(null);
			const triggerRef = useRef<HTMLButtonElement>(null);
			return (
				<div>
					<button
						ref={triggerRef}
						type="button"
						onClick={() => setPin("48291057")}
					>
						provision
					</button>
					{pin !== null ? (
						<OwnerAccessReveal
							pin={pin}
							returnFocus={triggerRef.current}
							onDismiss={() => setPin(null)}
						/>
					) : null}
				</div>
			);
		}

		await render(<RevealHost />, "en");
		const trigger = container.querySelector("button");
		expect(trigger).not.toBeNull();
		trigger?.focus();

		await act(async () => {
			trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});

		const dismiss = container.querySelector(
			".owner-access-reveal__dismiss",
		) as HTMLButtonElement;
		expect(dismiss).not.toBeNull();
		expect(document.activeElement).toBe(dismiss);

		await act(async () => {
			dismiss.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});

		expect(document.activeElement).toBe(trigger);
		expect(container.textContent).not.toContain("48291057");
	});

	it("keeps the pin out of the DOM after dismissal and reads it in an LTR run", async () => {
		function RevealHost() {
			const [pin, setPin] = useState<string | null>("48291057");
			return (
				<div>
					{pin !== null ? (
						<OwnerAccessReveal
							pin={pin}
							returnFocus={null}
							onDismiss={() => setPin(null)}
						/>
					) : null}
				</div>
			);
		}

		await render(<RevealHost />, "ar");
		const bdi = container.querySelector(
			"[data-owner-access-reveal] dd bdi",
		) as HTMLElement;
		expect(bdi?.getAttribute("dir")).toBe("ltr");
		expect(bdi?.textContent).toBe("48291057");

		await act(async () => {
			container
				.querySelector(".owner-access-reveal__dismiss")
				?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});

		expect(container.textContent).not.toContain("48291057");
		expect(container.querySelector("[data-owner-access-reveal]")).toBeNull();
	});
});
