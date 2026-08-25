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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

function mutationSpy<TInput>(
	overrides: Partial<OwnerAccessMutation<TInput>> = {},
): OwnerAccessMutation<TInput> & {
	submitSpy: ReturnType<typeof vi.fn>;
	resetSpy: ReturnType<typeof vi.fn>;
} {
	const submitSpy = vi.fn();
	const resetSpy = vi.fn();
	return {
		outcome: { phase: "idle" },
		submit: submitSpy,
		reset: resetSpy,
		submitSpy,
		resetSpy,
		...overrides,
	};
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
		root?.render(<I18nProvider key={locale}>{node}</I18nProvider>);
	});
}

function setControlledValue(input: HTMLInputElement, value: string) {
	Object.getOwnPropertyDescriptor(
		HTMLInputElement.prototype,
		"value",
	)?.set?.call(input, value);
	input.dispatchEvent(new Event("input", { bubbles: true }));
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
	it("keeps two desktop summaries above one owners table and exposes a collapsed provisioning action", async () => {
		await render(
			<OwnerAccessLive {...liveProps([staffPrincipal(), ownerPrincipal()])} />,
			"en",
		);
		const summaries = container.querySelectorAll(
			".owner-access-summary-grid > *",
		);
		expect(summaries).toHaveLength(2);
		expect(
			summaries[0]?.getAttribute("data-owner-access-staff-pin"),
		).not.toBeNull();
		expect(
			summaries[1]?.getAttribute("data-owner-access-owners-summary"),
		).not.toBeNull();
		expect(
			container.querySelector(".owner-access-owners-board table"),
		).not.toBeNull();
		expect(
			container.querySelector(".owner-access-owners-board th")?.textContent,
		).toBe(ownerAccessMessages.en.ownerColumnLabel);
		const trigger = container.querySelector<HTMLButtonElement>(
			"[data-owner-access-provision-trigger]",
		);
		const provisionForm = container.querySelector<HTMLFormElement>(
			".owner-access-provision",
		);
		expect(trigger?.textContent).toContain(
			ownerAccessMessages.en.provisionOwner,
		);
		expect(provisionForm?.hasAttribute("data-open")).toBe(false);
		await act(async () => trigger?.click());
		expect(provisionForm?.hasAttribute("data-open")).toBe(true);
	});

	it("announces a secret-free owner-created success until Done clears it", async () => {
		const provision = mutationSpy<OwnerProvisionInput>({
			outcome: {
				phase: "success",
				output: {
					auditId: 21,
					principal: ownerPrincipal(),
					revokedSessions: 0,
				},
			},
		});
		await render(
			<OwnerAccessLive
				{...liveProps([staffPrincipal(), ownerPrincipal()])}
				provisionOwner={provision}
			/>,
			"en",
		);
		const success = container.querySelector(
			"[data-owner-access-owner-created]",
		);
		expect(success?.getAttribute("role")).toBe("status");
		expect(success?.textContent).toContain("Owner created");
		expect(success?.textContent).toContain("No credential returned");
		expect(success?.textContent).not.toMatch(
			/password|PIN|copy|returned secret/iu,
		);
		await act(async () => {
			container
				.querySelector<HTMLButtonElement>(
					"[data-owner-access-owner-created] button",
				)
				?.click();
		});
		expect(provision.resetSpy).toHaveBeenCalledTimes(1);
	});

	it("validates provision and reset passwords locally in English and Arabic", async () => {
		for (const locale of ["en", "ar"] as const) {
			const provision = mutationSpy<OwnerProvisionInput>();
			const reset = mutationSpy<OwnerCredentialResetInput>();
			await render(
				<OwnerAccessLive
					{...liveProps([staffPrincipal(), ownerPrincipal()])}
					provisionOwner={provision}
					resetOwnerCredential={reset}
				/>,
				locale,
			);
			const provisionForm = container.querySelector(
				".owner-access-provision",
			) as HTMLFormElement;
			const provisionPassword = provisionForm.querySelector(
				'input[type="password"]',
			) as HTMLInputElement;
			for (const [value, error] of [
				["", "required"],
				["a".repeat(11), "min"],
				["a".repeat(201), "max"],
			] as const) {
				await act(async () => {
					setControlledValue(provisionPassword, value);
					provisionForm.dispatchEvent(
						new Event("submit", { bubbles: true, cancelable: true }),
					);
				});
				expect(provision.submitSpy).not.toHaveBeenCalled();
				expect(provisionPassword.getAttribute("aria-invalid")).toBe("true");
				expect(provisionPassword.getAttribute("aria-describedby")).toContain(
					"error",
				);
				expect(container.textContent).toContain(
					ownerAccessMessages[locale].ownerPasswordErrors[error],
				);
			}
			for (const value of ["a".repeat(12), "a".repeat(200)]) {
				await act(async () => {
					setControlledValue(provisionPassword, value);
					provisionForm.dispatchEvent(
						new Event("submit", { bubbles: true, cancelable: true }),
					);
				});
			}
			expect(provision.submitSpy).toHaveBeenCalledTimes(2);

			const resetButton = [...container.querySelectorAll(".owner-access-owner")]
				.flatMap((row) => [
					...row.querySelectorAll<HTMLButtonElement>("button"),
				])
				.find((button) =>
					button.textContent?.includes(
						ownerAccessMessages[locale].resetCredential,
					),
				);
			expect(resetButton).toBeDefined();
			await act(async () => resetButton?.click());
			const resetForm = container.querySelector(
				".owner-access-inline--reset",
			) as HTMLFormElement;
			const resetPassword = resetForm.querySelector(
				'input[type="password"]',
			) as HTMLInputElement;
			const resetSubmit = resetForm.querySelector<HTMLButtonElement>(
				'button[type="submit"]',
			);
			expect(resetSubmit?.disabled).toBe(false);
			for (const [value, error] of [
				["", "required"],
				["a".repeat(11), "min"],
				["a".repeat(201), "max"],
			] as const) {
				await act(async () => {
					setControlledValue(resetPassword, value);
					resetForm.dispatchEvent(
						new Event("submit", { bubbles: true, cancelable: true }),
					);
				});
				expect(reset.submitSpy).not.toHaveBeenCalled();
				expect(resetPassword.getAttribute("aria-invalid")).toBe("true");
				expect(resetPassword.getAttribute("aria-describedby")).toContain(
					"error",
				);
				expect(container.textContent).toContain(
					ownerAccessMessages[locale].ownerPasswordErrors[error],
				);
			}
			for (const value of ["a".repeat(12), "a".repeat(200)]) {
				await act(async () => {
					setControlledValue(resetPassword, value);
					resetForm.dispatchEvent(
						new Event("submit", { bubbles: true, cancelable: true }),
					);
				});
			}
			expect(reset.submitSpy).toHaveBeenCalledTimes(2);
		}
	});

	it("clears the reset draft and mutation state on cancel and target switch", async () => {
		const resetSpy = vi.fn();
		function ResetHost() {
			const [outcome, setOutcome] = useState<
				OwnerAccessMutation<OwnerCredentialResetInput>["outcome"]
			>({ phase: "refused", code: "owner_already_inactive" });
			return (
				<OwnerAccessLive
					{...liveProps([
						ownerPrincipal(),
						ownerPrincipal({
							principalId: "00000000-0000-4000-8000-0000000000a2",
							displayName: "Samir",
						}),
					])}
					resetOwnerCredential={{
						outcome,
						submit: () => {},
						reset: () => {
							resetSpy();
							setOutcome({ phase: "idle" });
						},
					}}
				/>
			);
		}
		await render(<ResetHost />, "en");
		const resetButton = [...container.querySelectorAll(".owner-access-owner")]
			.flatMap((row) => [...row.querySelectorAll<HTMLButtonElement>("button")])
			.find((button) =>
				button.textContent?.includes(ownerAccessMessages.en.resetCredential),
			);
		expect(resetButton).toBeDefined();
		await act(async () => resetButton?.click());
		let password = container.querySelector<HTMLInputElement>(
			".owner-access-inline--reset input",
		);
		await act(async () => {
			if (!password) return;
			setControlledValue(password, "a-draft-that-must-clear");
			[
				...container.querySelectorAll<HTMLButtonElement>(
					".owner-access-inline--reset button",
				),
			]
				.find((button) => button.textContent === ownerAccessMessages.en.cancel)
				?.click();
		});
		expect(resetSpy).toHaveBeenCalledTimes(2);
		const secondResetButton = [
			...container.querySelectorAll(".owner-access-owner"),
		]
			.filter((row) => row.textContent?.includes("Samir"))
			.flatMap((row) => [...row.querySelectorAll<HTMLButtonElement>("button")])
			.find((button) =>
				button.textContent?.includes(ownerAccessMessages.en.resetCredential),
			);
		expect(secondResetButton).toBeDefined();
		await act(async () => secondResetButton?.click());
		password = container.querySelector<HTMLInputElement>(
			".owner-access-inline--reset input",
		);
		expect(password?.value).toBe("");
		expect(container.textContent).not.toContain(
			ownerAccessMessages.en.refusals.owner_already_inactive,
		);
	});

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
