// @vitest-environment happy-dom

import {
	ACCESS_REASON_MAX_LENGTH,
	type OwnerCredentialResetInput,
	type OwnerDeactivateInput,
	type OwnerProvisionInput,
	type OwnerReactivateInput,
	type PrincipalGovernance,
	type StaffPinDeactivateInput,
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

	it("nests every state in the shared async entry seam", async () => {
		await render(<OwnerAccessLoading />, "en");
		expect(container.querySelector("[data-owner-async-swap]")).not.toBeNull();
		expect(
			container.querySelector(".owner-async-swap__current"),
		).not.toBeNull();

		await render(<OwnerAccessError onRetry={() => undefined} />, "en");
		expect(container.querySelector("[data-owner-async-swap]")).not.toBeNull();

		await render(<OwnerAccessEmpty />, "en");
		expect(container.querySelector("[data-owner-async-swap]")).not.toBeNull();

		await render(<OwnerAccessLive {...liveProps([staffPrincipal()])} />, "en");
		expect(container.querySelectorAll("[data-owner-async-swap]")).toHaveLength(
			2,
		);
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
		expect(success?.textContent).toContain(
			ownerAccessMessages.en.ownerCreatedDescription,
		);
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

	it("toggles both owner password fields without losing the value or validation wiring", async () => {
		for (const locale of ["en", "ar"] as const) {
			await render(
				<OwnerAccessLive
					{...liveProps([staffPrincipal(), ownerPrincipal()])}
				/>,
				locale,
			);

			await act(async () => {
				container
					.querySelector<HTMLButtonElement>(
						"[data-owner-access-provision-trigger]",
					)
					?.click();
			});

			const assertToggle = async (scope: string, value: string) => {
				const input = container.querySelector<HTMLInputElement>(
					`${scope} .owner-access-password input`,
				);
				const toggle = container.querySelector<HTMLButtonElement>(
					`${scope} .owner-access-password__toggle`,
				);
				expect(input).not.toBeNull();
				expect(toggle).not.toBeNull();
				if (input === null || toggle === null) return;
				expect(input.type).toBe("password");
				expect(input.getAttribute("autocomplete")).toBe("new-password");
				expect(input.nextElementSibling).toBe(toggle);
				expect(toggle.getAttribute("type")).toBe("button");
				expect(toggle.getAttribute("aria-label")).toBe(
					ownerAccessMessages[locale].showPassword,
				);
				const describedBy = input.getAttribute("aria-describedby");

				await act(async () => {
					setControlledValue(input, value);
					toggle.click();
				});
				expect(input.type).toBe("text");
				expect(input.value).toBe(value);
				expect(input.getAttribute("aria-describedby")).toBe(describedBy);
				expect(toggle.getAttribute("aria-label")).toBe(
					ownerAccessMessages[locale].hidePassword,
				);

				await act(async () => toggle.click());
				expect(input.type).toBe("password");
				expect(input.value).toBe(value);
				expect(input.getAttribute("aria-describedby")).toBe(describedBy);
				expect(toggle.getAttribute("aria-label")).toBe(
					ownerAccessMessages[locale].showPassword,
				);
			};

			await assertToggle(".owner-access-provision", "a-typed-secret");

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
			await assertToggle(".owner-access-inline--reset", "a-reset-secret");
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

	it("refuses a deactivation reason past what the audit log stores, with its own message", async () => {
		expect(ACCESS_REASON_MAX_LENGTH).toBe(240);
		for (const locale of ["en", "ar"] as const) {
			const messages = ownerAccessMessages[locale];
			expect(messages.reasonTooLong).toContain(
				String(ACCESS_REASON_MAX_LENGTH),
			);
			const deactivateStaffPin = mutationSpy<StaffPinDeactivateInput>();
			const deactivateOwner = mutationSpy<OwnerDeactivateInput>();
			await render(
				<OwnerAccessLive
					{...liveProps([staffPrincipal(), ownerPrincipal()])}
					deactivateStaffPin={deactivateStaffPin}
					deactivateOwner={deactivateOwner}
				/>,
				locale,
			);
			const openButton = (label: string) =>
				[...container.querySelectorAll<HTMLButtonElement>("button")].find(
					(button) => button.textContent?.trim() === label,
				);

			await act(async () => openButton(messages.deactivateStaffPin)?.click());
			await act(async () => openButton(messages.deactivateOwner)?.click());

			for (const [selector, spy] of [
				['input[id$="staff-pin-reason"]', deactivateStaffPin.submitSpy],
				[`input[id$="reason-${ownerAId}"]`, deactivateOwner.submitSpy],
			] as const) {
				const input = container.querySelector(selector) as HTMLInputElement;
				expect(input, selector).not.toBeNull();
				const form = input.form as HTMLFormElement;
				// The browser must not cut the reason off without a word.
				expect(input.hasAttribute("maxlength")).toBe(false);

				await act(async () => {
					setControlledValue(input, "r".repeat(241));
					form.dispatchEvent(
						new Event("submit", { bubbles: true, cancelable: true }),
					);
				});
				expect(spy).not.toHaveBeenCalled();
				expect(input.getAttribute("aria-invalid")).toBe("true");
				const errorId = (input.getAttribute("aria-describedby") ?? "")
					.split(" ")
					.find((id) => id.includes("error"));
				const error = errorId ? document.getElementById(errorId) : null;
				expect(error?.textContent).toBe(messages.reasonTooLong);
				expect(error?.getAttribute("role")).toBe("alert");

				// Editing clears the message; 240 after trimming is sent as typed.
				await act(async () => {
					setControlledValue(input, `  ${"r".repeat(240)}  `);
				});
				expect(input.getAttribute("aria-invalid")).toBe("false");
				expect(form.textContent).not.toContain(messages.reasonTooLong);
				await act(async () => {
					form.dispatchEvent(
						new Event("submit", { bubbles: true, cancelable: true }),
					);
				});
				expect(spy).toHaveBeenCalledTimes(1);
				expect(spy.mock.calls[0]?.[0]).toMatchObject({
					reason: "r".repeat(240),
				});
			}
		}
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
		expect(ownerAccessMessages.ar.staffPinDetail).toContain("6-12");
		expect(ownerAccessMessages.ar.staffPinDetail).not.toContain("\u2013");
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
		const reveal = container.querySelector("[data-owner-access-reveal]");
		expect(reveal).not.toBeNull();
		expect(container.textContent).toContain("48291057");
		// The one-time reveal keeps its instant appearance: it never rides the
		// data-entry seam.
		for (const swap of container.querySelectorAll("[data-owner-async-swap]")) {
			expect(swap.contains(reveal)).toBe(false);
		}
	});
});

describe("the one-time reveal", () => {
	it("returns focus to the same primary action when the staff list refreshes before dismissal", async () => {
		let refreshStaff: (() => void) | undefined;
		function RefreshingRevealHost() {
			const [staffActive, setStaffActive] = useState(false);
			const [pin, setPin] = useState<string | null>(null);
			refreshStaff = () => setStaffActive(true);
			return (
				<OwnerAccessLive
					{...liveProps([
						{
							...staffPrincipal(),
							credentialVersion: staffActive ? 4 : null,
							credentialActive: staffActive,
						},
					])}
					revealedPin={pin}
					dismissRevealedPin={() => setPin(null)}
					provisionStaffPin={{
						outcome: { phase: "idle" },
						submit: () => setPin("48291057"),
						reset: () => {},
					}}
				/>
			);
		}

		await render(<RefreshingRevealHost />, "en");
		const primary = [
			...container.querySelectorAll<HTMLButtonElement>(
				"[data-owner-access-staff-pin] button",
			),
		].find((button) =>
			button.textContent?.includes(ownerAccessMessages.en.provisionStaffPin),
		);
		expect(primary).not.toBeNull();
		primary?.focus();
		await act(async () => primary?.click());
		expect(document.activeElement).toBe(
			container.querySelector(".owner-access-reveal__dismiss"),
		);

		await act(async () => refreshStaff?.());
		const refreshedPrimary = [
			...container.querySelectorAll<HTMLButtonElement>(
				"[data-owner-access-staff-pin] button",
			),
		].find((button) =>
			button.textContent?.includes(ownerAccessMessages.en.rotateStaffPin),
		);
		expect(refreshedPrimary).toBe(primary);
		expect(refreshedPrimary?.textContent).toContain(
			ownerAccessMessages.en.rotateStaffPin,
		);

		await act(async () => {
			container
				.querySelector<HTMLButtonElement>(".owner-access-reveal__dismiss")
				?.click();
		});
		expect(document.activeElement).toBe(primary);
		expect(container.querySelector("[data-owner-access-reveal]")).toBeNull();
	});

	it("keeps focus in the reveal for Tab and Shift+Tab, then dismisses with Escape", async () => {
		const onDismiss = vi.fn();
		await render(
			<OwnerAccessReveal
				pin="48291057"
				returnFocus={null}
				onDismiss={onDismiss}
			/>,
			"en",
		);
		const dismiss = container.querySelector<HTMLButtonElement>(
			".owner-access-reveal__dismiss",
		);
		expect(dismiss).not.toBeNull();
		expect(document.activeElement).toBe(dismiss);

		await act(async () => {
			dismiss?.dispatchEvent(
				new KeyboardEvent("keydown", { key: "Tab", bubbles: true }),
			);
		});
		expect(document.activeElement).toBe(dismiss);

		await act(async () => {
			dismiss?.dispatchEvent(
				new KeyboardEvent("keydown", {
					key: "Tab",
					shiftKey: true,
					bubbles: true,
				}),
			);
		});
		expect(document.activeElement).toBe(dismiss);

		await act(async () => {
			dismiss?.dispatchEvent(
				new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
			);
		});
		expect(onDismiss).toHaveBeenCalledTimes(1);
	});

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
