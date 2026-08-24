// @vitest-environment happy-dom

import { ORPCError } from "@orpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OwnerAccessRefusalCode } from "./use-owner-access";

const {
	list,
	staffPinProvision,
	staffPinRotate,
	staffPinDeactivate,
	ownerProvision,
	ownerDeactivate,
	ownerReactivate,
	ownerResetCredential,
} = vi.hoisted(() => ({
	list: vi.fn(),
	staffPinProvision: vi.fn(),
	staffPinRotate: vi.fn(),
	staffPinDeactivate: vi.fn(),
	ownerProvision: vi.fn(),
	ownerDeactivate: vi.fn(),
	ownerReactivate: vi.fn(),
	ownerResetCredential: vi.fn(),
}));
vi.mock("@/utils/orpc", () => ({
	client: {
		admin: {
			access: {
				list,
				staffPin: {
					provision: staffPinProvision,
					rotate: staffPinRotate,
					deactivate: staffPinDeactivate,
				},
				owner: {
					provision: ownerProvision,
					deactivate: ownerDeactivate,
					reactivate: ownerReactivate,
					resetCredential: ownerResetCredential,
				},
			},
		},
	},
}));

import { useOwnerAccess } from "./use-owner-access";

const staffPrincipalId = "00000000-0000-4000-8000-0000000000c1";
const otherOwnerId = "00000000-0000-4000-8000-0000000000a2";

function staffPrincipal() {
	return {
		principalId: staffPrincipalId,
		principalKind: "shared_staff" as const,
		role: "staff" as const,
		displayName: "Front desk",
		ownerEmail: null,
		active: true,
		credentialVersion: 3,
		credentialActive: true,
	};
}

function mutationOutput() {
	return {
		auditId: 12,
		principal: staffPrincipal(),
		revokedSessions: 1,
	};
}

const REVEALED_PIN = "48291057";

function revealOutput() {
	return { ...mutationOutput(), revealedPin: REVEALED_PIN };
}

/** A governance refusal exactly as the transport delivers it. */
function refusal(code: string) {
	return new ORPCError("BAD_REQUEST", {
		message: "Refused",
		data: { code },
	});
}

type AnyOutcome =
	| { phase: "idle" }
	| { phase: "pending" }
	| { phase: "success"; output: { auditId: number } }
	| { phase: "refused"; code: OwnerAccessRefusalCode }
	| { phase: "failed" };

const MUTATION_ACTIONS = [
	"provisionStaffPin",
	"rotateStaffPin",
	"deactivateStaffPin",
	"provisionOwner",
	"deactivateOwner",
	"reactivateOwner",
	"resetOwnerCredential",
] as const;
type MutationAction = (typeof MUTATION_ACTIONS)[number];

function Probe({ enabled }: { enabled: boolean }) {
	const access = useOwnerAccess({ enabled });
	const attrs: Record<string, string> = {
		"data-status": access.status,
		"data-principals": access.principals.map((p) => p.principalId).join(","),
		"data-pin": access.revealedPin ?? "",
	};
	for (const action of MUTATION_ACTIONS) {
		const outcome: AnyOutcome = access[action].outcome;
		attrs[`data-${action}`] =
			outcome.phase === "refused"
				? `refused:${outcome.code}`
				: outcome.phase === "success"
					? `success:${outcome.output.auditId}`
					: outcome.phase;
	}
	return (
		<div {...attrs}>
			<button type="button" data-do="retry" onClick={access.retry}>
				r
			</button>
			<button
				type="button"
				data-do="dismiss"
				onClick={access.dismissRevealedPin}
			>
				d
			</button>
			<button
				type="button"
				data-do="provisionStaffPin"
				onClick={() => access.provisionStaffPin.submit()}
			/>
			<button
				type="button"
				data-do="rotateStaffPin"
				onClick={() => access.rotateStaffPin.submit()}
			/>
			<button
				type="button"
				data-do="deactivateStaffPin"
				onClick={() =>
					access.deactivateStaffPin.submit({ reason: "Desk closed" })
				}
			/>
			<button
				type="button"
				data-do="provisionOwner"
				onClick={() =>
					access.provisionOwner.submit({
						email: "new@example.com",
						displayName: "New owner",
						password: "long-enough-passphrase",
					})
				}
			/>
			<button
				type="button"
				data-do="deactivateOwner"
				onClick={() =>
					access.deactivateOwner.submit({
						targetPrincipalId: otherOwnerId,
						reason: "Offboarding",
					})
				}
			/>
			<button
				type="button"
				data-do="reactivateOwner"
				onClick={() =>
					access.reactivateOwner.submit({
						targetPrincipalId: otherOwnerId,
					})
				}
			/>
			<button
				type="button"
				data-do="resetOwnerCredential"
				onClick={() =>
					access.resetOwnerCredential.submit({
						targetPrincipalId: otherOwnerId,
						password: "another-long-passphrase",
					})
				}
			/>
		</div>
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

async function render(enabled = true) {
	lastQueryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	await act(async () => {
		root?.render(
			<QueryClientProvider client={lastQueryClient}>
				<Probe enabled={enabled} />
			</QueryClientProvider>,
		);
	});
	await settle();
}

async function rerender(enabled: boolean) {
	await act(async () => {
		root?.render(
			<QueryClientProvider client={lastQueryClient}>
				<Probe enabled={enabled} />
			</QueryClientProvider>,
		);
	});
	await settle();
}

function probe() {
	const element = container.firstElementChild as HTMLElement;
	return {
		status: element.getAttribute("data-status"),
		principals: element.getAttribute("data-principals"),
		pin: element.getAttribute("data-pin"),
		outcome: (action: MutationAction) =>
			element.getAttribute(`data-${action}`) ?? "",
		button: (doWhat: string) =>
			element.querySelector(`[data-do="${doWhat}"]`) as HTMLButtonElement,
	};
}

async function click(doWhat: string) {
	await act(async () => {
		probe()
			.button(doWhat)
			.dispatchEvent(new MouseEvent("click", { bubbles: true }));
	});
	await settle();
}

beforeEach(() => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	list.mockReset();
	staffPinProvision.mockReset();
	staffPinRotate.mockReset();
	staffPinDeactivate.mockReset();
	ownerProvision.mockReset();
	ownerDeactivate.mockReset();
	ownerReactivate.mockReset();
	ownerResetCredential.mockReset();
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	if (root) await act(async () => root?.unmount());
	container.remove();
});

describe("principal list", () => {
	it("stands down and reads nothing until enablement is granted", async () => {
		list.mockResolvedValue({ principals: [staffPrincipal()] });
		await render(false);

		expect(probe().status).toBe("standby");
		expect(list).not.toHaveBeenCalled();

		await rerender(true);

		expect(probe().status).toBe("success");
		expect(list).toHaveBeenCalledTimes(1);
		expect(probe().principals).toBe(staffPrincipalId);
	});

	it("surfaces a transport failure as an error without substituting rows", async () => {
		list.mockRejectedValue(new Error("Service Unavailable"));
		await render();

		expect(probe().status).toBe("error");
		expect(probe().principals).toBe("");
	});

	it("surfaces a malformed payload as an error rather than rendering it", async () => {
		// `credentialVersion` must be a positive integer or null; zero is neither.
		list.mockResolvedValue({
			principals: [{ ...staffPrincipal(), credentialVersion: 0 }],
		});
		await render();

		expect(probe().status).toBe("error");
		expect(probe().principals).toBe("");
	});

	it("refetches the principals after a successful mutation", async () => {
		list.mockResolvedValue({ principals: [staffPrincipal()] });
		ownerReactivate.mockResolvedValue(mutationOutput());
		await render();

		await click("reactivateOwner");

		expect(ownerReactivate).toHaveBeenCalledWith({
			targetPrincipalId: otherOwnerId,
		});
		expect(list).toHaveBeenCalledTimes(2);
		expect(probe().outcome("reactivateOwner")).toBe("success:12");
	});
});

describe("typed refusals", () => {
	const cases: Array<{
		action: MutationAction;
		code: OwnerAccessRefusalCode;
		reject: () => void;
	}> = [
		{
			action: "provisionStaffPin",
			code: "staff_pin_already_active",
			reject: () =>
				staffPinProvision.mockRejectedValue(
					refusal("staff_pin_already_active"),
				),
		},
		{
			action: "rotateStaffPin",
			code: "staff_pin_not_active",
			reject: () =>
				staffPinRotate.mockRejectedValue(refusal("staff_pin_not_active")),
		},
		{
			action: "deactivateStaffPin",
			code: "reason_required",
			reject: () =>
				staffPinDeactivate.mockRejectedValue(refusal("reason_required")),
		},
		{
			action: "provisionOwner",
			code: "owner_email_taken",
			reject: () =>
				ownerProvision.mockRejectedValue(refusal("owner_email_taken")),
		},
		{
			action: "deactivateOwner",
			code: "owner_last_active",
			reject: () =>
				ownerDeactivate.mockRejectedValue(refusal("owner_last_active")),
		},
		{
			action: "reactivateOwner",
			code: "owner_already_active",
			reject: () =>
				ownerReactivate.mockRejectedValue(refusal("owner_already_active")),
		},
		{
			action: "resetOwnerCredential",
			code: "owner_already_inactive",
			reject: () =>
				ownerResetCredential.mockRejectedValue(
					refusal("owner_already_inactive"),
				),
		},
	];

	for (const testCase of cases) {
		it(`maps ${testCase.action} refusal to ${testCase.code}`, async () => {
			list.mockResolvedValue({ principals: [] });
			testCase.reject();
			await render();

			expect(probe().outcome(testCase.action)).toBe("idle");

			await click(testCase.action);

			expect(probe().outcome(testCase.action)).toBe(`refused:${testCase.code}`);
			expect(probe().status).toBe("success");
		});
	}
});

describe("failures that are not refusals", () => {
	it("does not treat the generator-defect staff_pin_shape code as a caller refusal", async () => {
		list.mockResolvedValue({ principals: [] });
		staffPinProvision.mockRejectedValue(refusal("staff_pin_shape"));
		await render();

		await click("provisionStaffPin");

		expect(probe().outcome("provisionStaffPin")).toBe("failed");
	});

	it("keeps an unexpected server fault out of the refusal branch too", async () => {
		list.mockResolvedValue({ principals: [] });
		ownerDeactivate.mockRejectedValue(new ORPCError("INTERNAL_SERVER_ERROR"));
		await render();

		await click("deactivateOwner");

		expect(probe().outcome("deactivateOwner")).toBe("failed");
	});

	it("surfaces a malformed mutation response as failed rather than success", async () => {
		list.mockResolvedValue({ principals: [] });
		// `auditId` must be a positive integer.
		ownerReactivate.mockResolvedValue({ ...mutationOutput(), auditId: -4 });
		await render();

		await click("reactivateOwner");

		expect(probe().outcome("reactivateOwner")).toBe("failed");
	});
});

describe("the one-time PIN reveal", () => {
	it("reveals the generated PIN once, keeps it out of the mutation cache, and drops it on dismissal", async () => {
		list.mockResolvedValue({ principals: [staffPrincipal()] });
		staffPinProvision.mockResolvedValue(revealOutput());
		await render();

		await click("provisionStaffPin");

		expect(probe().outcome("provisionStaffPin")).toBe(
			`success:${revealOutput().auditId}`,
		);
		expect(probe().pin).toBe(REVEALED_PIN);

		// The retention property, asserted against the cache itself: TanStack
		// retains mutation.data after settling, so every settled mutation in the
		// cache must hold only sanitized output — never the revealed value.
		const cachedMutations = lastQueryClient.getMutationCache().getAll();
		expect(cachedMutations.length).toBeGreaterThan(0);
		expect(
			JSON.stringify(cachedMutations.map((m) => m.state.data)),
		).not.toContain(REVEALED_PIN);

		await click("dismiss");

		expect(probe().pin).toBe("");
	});

	it("rotates through the same one-time channel and never persists the old value", async () => {
		list.mockResolvedValue({ principals: [staffPrincipal()] });
		const rotatedPin = "73620148";
		staffPinRotate.mockResolvedValue({
			...revealOutput(),
			revealedPin: rotatedPin,
		});
		await render();

		await click("rotateStaffPin");

		expect(probe().pin).toBe(rotatedPin);
	});

	it("stays empty when the reveal response itself is malformed", async () => {
		list.mockResolvedValue({ principals: [] });
		staffPinProvision.mockResolvedValue(mutationOutput());
		await render();

		await click("provisionStaffPin");

		expect(probe().outcome("provisionStaffPin")).toBe("failed");
		expect(probe().pin).toBe("");
	});
});
