// @vitest-environment happy-dom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { list, daily, timeContext } = vi.hoisted(() => ({
	list: vi.fn(),
	daily: vi.fn(),
	timeContext: vi.fn(),
}));
vi.mock("@/utils/orpc", () => ({
	client: {
		admin: { audit: { list }, analytics: { daily, timeContext } },
	},
}));

import {
	emptyOwnerAuditSelection,
	gymDayStartUtc,
	type OwnerAuditFilterSelection,
	toAuditFilters,
	useOwnerAudit,
} from "./use-owner-audit";

const ownerPrincipal = "00000000-0000-4000-8000-0000000000a1";

function entry(id: number, createdAtUtc: string) {
	return {
		id,
		eventClass: "command" as const,
		action: "correction_absolute" as const,
		actor: {
			principalId: ownerPrincipal,
			kind: "owner" as const,
			role: "owner" as const,
			displayName: "Real owner",
		},
		target: null,
		priorValue: 41,
		effectiveValue: 12,
		requestedDelta: null,
		requestedValue: 12,
		priorActive: null,
		newActive: null,
		priorCredentialVersion: null,
		newCredentialVersion: null,
		settingsVersion: null,
		reason: "Recount",
		createdAtUtc,
	};
}

function selection(
	overrides: Partial<OwnerAuditFilterSelection> = {},
): OwnerAuditFilterSelection {
	return { ...emptyOwnerAuditSelection, ...overrides };
}

describe("gym-day boundaries", () => {
	it("anchors a calendar day to the configured gym timezone, not the device", () => {
		expect(gymDayStartUtc("2026-08-10", "Asia/Riyadh").toISOString()).toBe(
			"2026-08-09T21:00:00.000Z",
		);
		expect(gymDayStartUtc("2026-08-10", "UTC").toISOString()).toBe(
			"2026-08-10T00:00:00.000Z",
		);
		expect(gymDayStartUtc("2026-08-10", "America/New_York").toISOString()).toBe(
			"2026-08-10T04:00:00.000Z",
		);
	});

	it("settles the offset across a daylight-saving transition", () => {
		expect(gymDayStartUtc("2026-03-29", "Europe/London").toISOString()).toBe(
			"2026-03-29T00:00:00.000Z",
		);
		expect(gymDayStartUtc("2026-03-30", "Europe/London").toISOString()).toBe(
			"2026-03-29T23:00:00.000Z",
		);
	});

	it("refuses a value that is not an ISO calendar day", () => {
		expect(() => gymDayStartUtc("10-08-2026", "UTC")).toThrow(/calendar day/i);
	});
});

describe("selection to transport filters", () => {
	it("sends no filter object when nothing is selected", () => {
		expect(toAuditFilters(selection(), "Asia/Riyadh")).toBeUndefined();
	});

	it("maps the action and actor selections", () => {
		expect(toAuditFilters(selection({ action: "reset" }), "UTC")).toEqual({
			actions: ["reset"],
		});
		expect(toAuditFilters(selection({ actor: "system" }), "UTC")).toEqual({
			actorKind: "system",
		});
	});

	it("keeps a missing prior null and an exact zero prior zero", () => {
		expect(
			toAuditFilters(selection({ priorMode: "missing" }), "UTC")?.priorValue,
		).toBeNull();
		const zero = toAuditFilters(
			selection({ priorMode: "value", priorValue: "0" }),
			"UTC",
		);
		expect(zero?.priorValue).toBe(0);
		expect(zero?.priorValue).not.toBeNull();
	});

	it("uses effective mode for missing governance values and ignores unusable numeric entries", () => {
		expect(
			toAuditFilters(
				selection({ priorMode: "value", priorValue: "-3" }),
				"UTC",
			),
		).toBeUndefined();
		expect(
			toAuditFilters(
				selection({ effectiveMode: "value", effectiveValue: "abc" }),
				"UTC",
			),
		).toBeUndefined();
		expect(
			toAuditFilters(
				selection({ effectiveMode: "value", effectiveValue: "7" }),
				"UTC",
			),
		).toEqual({
			effectiveValue: 7,
		});
		expect(
			toAuditFilters(selection({ effectiveMode: "missing" }), "UTC"),
		).toEqual({
			effectiveValue: null,
		});
	});

	it("converts a gym-day range to inclusive UTC instants", () => {
		expect(
			toAuditFilters(
				selection({
					occurredFromDay: "2026-08-10",
					occurredToDay: "2026-08-11",
				}),
				"Asia/Riyadh",
			),
		).toEqual({
			occurredFrom: "2026-08-09T21:00:00.000Z",
			occurredTo: "2026-08-11T20:59:59.999Z",
		});
	});

	it("drops an inverted range rather than sending an invalid one", () => {
		expect(
			toAuditFilters(
				selection({
					occurredFromDay: "2026-08-20",
					occurredToDay: "2026-08-01",
				}),
				"UTC",
			),
		).toEqual({ occurredFrom: "2026-08-20T00:00:00.000Z" });
	});

	it("maps the reason mode, trimming text and keeping absent absent", () => {
		expect(
			toAuditFilters(selection({ reasonMode: "missing" }), "UTC")?.reason,
		).toBeNull();
		expect(
			toAuditFilters(
				selection({ reasonMode: "contains", reasonText: "  door  " }),
				"UTC",
			),
		).toEqual({ reason: "door" });
		expect(
			toAuditFilters(
				selection({ reasonMode: "contains", reasonText: "   " }),
				"UTC",
			),
		).toBeUndefined();
	});
});

let root: Root | undefined;
let container: HTMLDivElement;

function Probe({
	filters = emptyOwnerAuditSelection,
}: {
	filters?: OwnerAuditFilterSelection;
}) {
	const audit = useOwnerAudit(filters);
	return (
		<div data-status={audit.status} data-zone={audit.timeZone ?? ""}>
			<span data-ids={audit.entries.map((row) => row.id).join(",")} />
			<button
				type="button"
				data-next={String(audit.hasNextPage)}
				onClick={audit.fetchNextPage}
			>
				more
			</button>
		</div>
	);
}

async function settle() {
	for (let pass = 0; pass < 4; pass += 1) {
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});
	}
}

async function render(filters?: OwnerAuditFilterSelection) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	await act(async () => {
		root?.render(
			<QueryClientProvider client={queryClient}>
				<Probe filters={filters} />
			</QueryClientProvider>,
		);
	});
	await settle();
}

function probe() {
	const element = container.firstElementChild;
	return {
		status: element?.getAttribute("data-status"),
		zone: element?.getAttribute("data-zone"),
		ids: element?.querySelector("[data-ids]")?.getAttribute("data-ids"),
		hasNext: element?.querySelector("button")?.getAttribute("data-next"),
		more: element?.querySelector("button"),
	};
}

/** The day payload `/admin` already fetches; its versions drive the time context. */
const dailyPayload = {
	businessDay: "2026-08-10",
	timeline: [
		{
			state: "value",
			minuteStartUtc: "2026-08-10T07:00:00.000Z",
			count: 12,
			entries: 12,
			exits: 0,
			band: "quiet",
			capacitySnapshot: 100,
			settingsVersion: 11,
			source: "live",
		},
	],
	peak: {
		minuteStartUtc: "2026-08-10T07:00:00.000Z",
		count: 12,
		band: "quiet",
		capacitySnapshot: 100,
		settingsVersion: 11,
	},
	dailyAverage: 12,
	estimatedEntranceCrossings: 12,
	observedOpenMinutes: 1,
	expectedOpenMinutes: 1,
	coverage: 1,
} as const;

const timeContextPayload = {
	current: { settingsVersion: 11, timeZone: "Asia/Riyadh" },
	versions: [{ settingsVersion: 11, timeZone: "Asia/Riyadh" }],
} as const;

function mockAnalytics() {
	daily.mockResolvedValue(dailyPayload);
	timeContext.mockResolvedValue(timeContextPayload);
}

beforeEach(() => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	list.mockReset();
	daily.mockReset();
	timeContext.mockReset();
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	if (root) await act(async () => root?.unmount());
	container.remove();
});

describe("owner audit query", () => {
	it("reads the gym timezone from the analytics query instead of asking again", async () => {
		mockAnalytics();
		list.mockResolvedValue({ entries: [], nextCursor: null });
		await render();

		// The regression this pins: the audit section must add no request of its
		// own for the timezone, and must not reshape the Phase 9 time-context call.
		expect(timeContext).toHaveBeenCalledTimes(1);
		expect(timeContext).toHaveBeenCalledWith({ settingsVersions: [11] });
		expect(timeContext).not.toHaveBeenCalledWith({ settingsVersions: [] });
		expect(daily).toHaveBeenCalledTimes(1);
		expect(daily).toHaveBeenCalledWith({});
		expect(probe().zone).toBe("Asia/Riyadh");
		expect(probe().status).toBe("success");
	});

	it("reports the prerequisite as pending and reads no history until the timezone resolves", async () => {
		let resolveDaily: (value: unknown) => void = () => {};
		daily.mockReturnValue(
			new Promise((resolve) => {
				resolveDaily = resolve;
			}),
		);
		timeContext.mockResolvedValue(timeContextPayload);
		list.mockResolvedValue({ entries: [], nextCursor: null });
		await render();
		expect(probe().status).toBe("pending");
		expect(probe().zone).toBe("");
		expect(list).not.toHaveBeenCalled();

		await act(async () => {
			resolveDaily(dailyPayload);
		});
		await settle();
		expect(probe().status).toBe("success");
		expect(list).toHaveBeenCalledTimes(1);
	});

	it("exposes the shared prerequisite failure under the Activity Log identity", async () => {
		daily.mockRejectedValue(new Error("Service Unavailable"));
		timeContext.mockResolvedValue(timeContextPayload);
		list.mockResolvedValue({ entries: [], nextCursor: null });
		await render();
		expect(probe().status).toBe("error");
		expect(list).not.toHaveBeenCalled();
	});

	it("requests a bounded first page and exposes an empty result", async () => {
		mockAnalytics();
		list.mockResolvedValue({ entries: [], nextCursor: null });
		await render();
		expect(list).toHaveBeenCalledWith({ limit: 25, cursor: null });
		expect(probe().status).toBe("success");
		expect(probe().ids).toBe("");
		expect(probe().hasNext).toBe("false");
	});

	it("appends the next keyset page without duplicating a row", async () => {
		mockAnalytics();
		list
			.mockResolvedValueOnce({
				entries: [entry(9, "2026-08-14T09:15:30.250Z")],
				nextCursor: { createdAtUtc: "2026-08-14T09:15:30.250Z", id: 9 },
			})
			.mockResolvedValueOnce({
				entries: [entry(8, "2026-08-13T09:15:30.250Z")],
				nextCursor: null,
			});
		await render();
		expect(probe().ids).toBe("9");
		expect(probe().hasNext).toBe("true");

		await act(async () => {
			probe().more?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});
		await settle();
		expect(list).toHaveBeenLastCalledWith({
			limit: 25,
			cursor: { createdAtUtc: "2026-08-14T09:15:30.250Z", id: 9 },
		});
		expect(probe().ids).toBe("9,8");
		expect(probe().hasNext).toBe("false");
	});

	it("passes applied filters to the transport", async () => {
		mockAnalytics();
		list.mockResolvedValue({ entries: [], nextCursor: null });
		await render(selection({ action: "reset", reasonMode: "missing" }));
		expect(list).toHaveBeenCalledWith({
			limit: 25,
			cursor: null,
			filters: { actions: ["reset"], reason: null },
		});
	});

	it("surfaces a transport failure as an error without substituting rows", async () => {
		mockAnalytics();
		list.mockRejectedValue(new Error("Service Unavailable"));
		await render();
		expect(probe().status).toBe("error");
		expect(probe().ids).toBe("");
	});

	it("surfaces a malformed page as an error rather than rendering it", async () => {
		mockAnalytics();
		list.mockResolvedValue({
			entries: [
				{ ...entry(9, "2026-08-14T09:15:30.250Z"), effectiveValue: -2 },
			],
			nextCursor: null,
		});
		await render();
		expect(probe().status).toBe("error");
	});

	it("reports an error when the shared time context cannot be mapped", async () => {
		daily.mockResolvedValue(dailyPayload);
		// A mapping that omits the day's settings version is exactly what the
		// analytics contract rejects; the audit section must not read history from
		// a timezone it never received.
		timeContext.mockResolvedValue({
			current: { settingsVersion: 11, timeZone: "Asia/Riyadh" },
			versions: [],
		});
		list.mockResolvedValue({ entries: [], nextCursor: null });
		await render();
		expect(probe().status).toBe("error");
		expect(list).not.toHaveBeenCalled();
	});
});
