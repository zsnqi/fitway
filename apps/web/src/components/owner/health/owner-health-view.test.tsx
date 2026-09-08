// @vitest-environment happy-dom

import type {
	HealthIncident,
	HealthIncidentSummary,
	HealthOfflinePeriod,
} from "@fitway/api/health/incidents";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { I18nProvider } from "@/i18n/provider";

import { ownerHealthMessages } from "./messages";
import {
	deliveryLabel,
	formatDuration,
	formatRatio,
	gymDayTime,
	OwnerHealthIncidentTable,
	OwnerHealthMetrics,
	OwnerHealthOfflineTable,
	OwnerHealthUnmonitored,
} from "./owner-health-view";

const GYM_TIME_ZONE = "Asia/Riyadh";

const periods: HealthOfflinePeriod[] = [
	{
		startedAtUtc: "2026-08-13T09:00:00.000Z",
		endedAtUtc: null,
		elapsedMinutes: 95,
		openMinutes: 95,
	},
	{
		startedAtUtc: "2026-08-12T22:00:00.000Z",
		endedAtUtc: "2026-08-13T00:00:00.000Z",
		elapsedMinutes: 120,
		openMinutes: 0,
	},
];

const incidents: HealthIncident[] = [
	{
		condition: "camera_failure",
		startedAtUtc: "2026-08-13T05:00:00.000Z",
		lastNoticeAtUtc: "2026-08-13T05:31:00.000Z",
		recoveredAtUtc: null,
		noticeCount: 2,
		delivered: 1,
		failed: 1,
		unconfirmed: 0,
	},
	{
		condition: "stale_push",
		startedAtUtc: "2026-08-11T05:00:00.000Z",
		lastNoticeAtUtc: "2026-08-11T05:01:00.000Z",
		recoveredAtUtc: "2026-08-11T05:40:00.000Z",
		noticeCount: 1,
		delivered: 1,
		failed: 0,
		unconfirmed: 0,
	},
];

const summary: HealthIncidentSummary = {
	window: {
		businessDayFrom: "2026-08-01",
		businessDayTo: "2026-08-14",
		businessDays: 14,
		timeZone: GYM_TIME_ZONE,
		generatedAtUtc: "2026-08-14T09:00:00.000Z",
	},
	connection: {
		expectedOpenMinutes: 12_840,
		monitoredOpenMinutes: 12_000,
		onlineOpenMinutes: 11_905,
		offlineOpenMinutes: 95,
		uptimeRatio: 11_905 / 12_000,
		monitoredRatio: 12_000 / 12_840,
		monitoringStartedAtUtc: "2026-08-01T06:00:00.000Z",
		offlinePeriodCount: 2,
		offlinePeriods: periods,
	},
	alerts: {
		noticeCount: 4,
		delivered: 3,
		failed: 1,
		unconfirmed: 0,
		incidentCount: 2,
		incidents,
	},
};

let container: HTMLElement;
let root: Root;

beforeEach(() => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});

afterEach(() => {
	act(() => root.unmount());
	container.remove();
	document.documentElement.lang = "";
	window.localStorage.clear();
});

function render(node: React.ReactNode, locale: "ar" | "en" = "en") {
	window.localStorage.setItem("fitway.locale", locale);
	document.documentElement.lang = locale;
	act(() => root.render(<I18nProvider>{node}</I18nProvider>));
}

describe("health formatting", () => {
	it("keeps a fraction of a percent visible instead of rounding to a clean whole", () => {
		expect(formatRatio(0.9992, "en")).toBe("99.9%");
		expect(formatRatio(1, "en")).toBe("100%");
		expect(formatRatio(0, "en")).toBe("0%");
	});

	it("uses Western digits in Arabic", () => {
		// Arabic keeps its own percent sign; only the digits must stay Western.
		expect(formatRatio(0.992, "ar")).toContain("99.2");
		expect(formatRatio(0.992, "ar")).not.toMatch(/[٠-٩۰-۹]/u);
		expect(formatDuration(95, "ar", ownerHealthMessages.ar)).not.toMatch(
			/[٠-٩]/u,
		);
	});

	it("labels a duration rather than emitting a bare number", () => {
		expect(formatDuration(95, "en", ownerHealthMessages.en)).toBe("1h 35m");
		expect(formatDuration(60, "en", ownerHealthMessages.en)).toBe("1h");
		expect(formatDuration(0, "en", ownerHealthMessages.en)).toBe("0m");
	});

	it("dates an instant in the configured gym zone, not the running zone", () => {
		// 21:30Z is already the next gym day at +03:00.
		expect(gymDayTime("2026-08-10T21:30:00.000Z", "en", GYM_TIME_ZONE)).toBe(
			"Aug 11 12:30 AM",
		);
	});

	it("names every non-delivered outcome instead of collapsing them", () => {
		expect(
			deliveryLabel(
				{ delivered: 2, failed: 1, unconfirmed: 3 },
				"en",
				ownerHealthMessages.en,
			),
		).toBe("2 delivered · 1 failed to send · 3 unconfirmed");
		expect(
			deliveryLabel(
				{ delivered: 0, failed: 0, unconfirmed: 0 },
				"en",
				ownerHealthMessages.en,
			),
		).toBe("None");
	});

	it("uses natural Arabic singular, dual, few, many, and general count forms", () => {
		const ar = ownerHealthMessages.ar;
		expect(ar.noticesSummary(0, "0")).toBe("لم يُرسل أي إشعار في هذه الفترة");
		expect(ar.noticesSummary(1, "1")).toBe("أُرسل إشعار واحد في هذه الفترة");
		expect(ar.noticesSummary(2, "2")).toBe("أُرسل إشعاران في هذه الفترة");
		expect(ar.noticesSummary(5, "5")).toBe("أُرسلت 5 إشعارات في هذه الفترة");
		expect(ar.noticesSummary(11, "11")).toBe("أُرسل 11 إشعاراً في هذه الفترة");
		expect(ar.noticesSummary(100, "100")).toBe("أُرسل 100 إشعار في هذه الفترة");
		expect(
			deliveryLabel({ delivered: 2, failed: 1, unconfirmed: 3 }, "ar", ar),
		).toBe("وصل إشعاران · فشل إرسال إشعار واحد · 3 إشعارات غير مؤكدة");
	});
});

describe("health metrics", () => {
	it("states the denominator of every figure it shows", () => {
		render(<OwnerHealthMetrics summary={summary} />);
		const text = container.textContent ?? "";
		expect(text).toContain("11,905 / 12,000 monitored open minutes online");
		expect(text).toContain("12,000 / 12,840 scheduled open minutes monitored");
		expect(text).toContain("3 delivered · 1 failed to send");
	});

	it("renders unmeasurable uptime as a named state, never as a percentage", () => {
		render(
			<OwnerHealthMetrics
				summary={{
					...summary,
					connection: {
						...summary.connection,
						monitoredOpenMinutes: 0,
						onlineOpenMinutes: 0,
						offlineOpenMinutes: 0,
						uptimeRatio: null,
						monitoredRatio: 0,
						monitoringStartedAtUtc: null,
						offlinePeriodCount: 0,
						offlinePeriods: [],
					},
				}}
			/>,
		);
		const text = container.textContent ?? "";
		expect(text).toContain("Not measurable");
		expect(text).not.toContain("100%");
		expect(container.querySelector('[data-tone="unknown"]')).not.toBeNull();
	});
});

describe("health tables", () => {
	it("marks an unrecovered outage in words, not by colour alone", () => {
		render(
			<OwnerHealthOfflineTable periods={periods} timeZone={GYM_TIME_ZONE} />,
		);
		const rows = container.querySelectorAll("tbody tr");
		expect(rows).toHaveLength(2);
		expect(rows[0]?.textContent).toContain("Not yet recovered");
		expect(rows[0]?.hasAttribute("data-ongoing")).toBe(true);
	});

	it("says a closed-hours outage affected no open minute rather than showing a zero", () => {
		render(
			<OwnerHealthOfflineTable periods={periods} timeZone={GYM_TIME_ZONE} />,
		);
		const closed = container.querySelectorAll("tbody tr")[1];
		expect(closed?.textContent).toContain("None — gym closed throughout");
		expect(closed?.hasAttribute("data-closed-only")).toBe(true);
	});

	it("isolates Arabic duration values so their numeric order stays readable", () => {
		render(
			<OwnerHealthOfflineTable periods={periods} timeZone={GYM_TIME_ZONE} />,
			"ar",
		);
		const durations = container.querySelectorAll('bdo[dir="ltr"]');
		expect(durations).toHaveLength(3);
		expect(durations[0]?.textContent).toBe("1س 35د");
	});

	it("shows one incident row per condition with its own delivery outcome", () => {
		render(
			<OwnerHealthIncidentTable
				incidents={incidents}
				timeZone={GYM_TIME_ZONE}
			/>,
		);
		const rows = container.querySelectorAll("tbody tr");
		expect(rows).toHaveLength(2);
		expect(rows[0]?.textContent).toContain("Camera issue");
		expect(rows[0]?.textContent).toContain("Not yet recovered");
		// Two notices for one condition, one of which never reached Telegram.
		expect(rows[0]?.textContent).toContain("1 delivered · 1 failed to send");
		expect(rows[1]?.textContent).toContain("Counter connection lost");
		expect(rows[1]?.textContent).toContain("All delivered");
	});

	it("gives each table a labeled, keyboard-reachable scroll region", () => {
		render(
			<OwnerHealthOfflineTable periods={periods} timeZone={GYM_TIME_ZONE} />,
		);
		const region = container.querySelector(".owner-health-region");
		expect(region?.getAttribute("aria-label")).toBe(
			ownerHealthMessages.en.offlineRegion,
		);
		expect(region?.getAttribute("tabindex")).toBe("0");
	});

	it("renders Arabic copy with Western digits and no device identity", () => {
		render(
			<OwnerHealthIncidentTable
				incidents={incidents}
				timeZone={GYM_TIME_ZONE}
			/>,
			"ar",
		);
		const text = container.textContent ?? "";
		expect(text).toContain(ownerHealthMessages.ar.stale_push);
		expect(text).not.toMatch(/[٠-٩۰-۹]/u);
		expect(text).not.toMatch(/device|جهاز رقم/i);
	});
});

describe("unmonitored state", () => {
	it("separates unknown coverage from a perfect record", () => {
		render(<OwnerHealthUnmonitored />);
		const state = container.querySelector(
			'[data-owner-health-state="unmonitored"]',
		);
		expect(state).not.toBeNull();
		expect(state?.getAttribute("role")).toBe("status");
		expect(state?.textContent).toContain(
			"This is not the same as a period with no downtime.",
		);
	});
});
