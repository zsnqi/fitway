import type { Page, Route } from "@playwright/test";

export const OWNER_REVIEW_SCENARIOS = [
	"daily/full",
	"daily/loading",
	"daily/error",
	"daily/missing",
	"daily/closed",
	"reports/full",
	"reports/partial-loading",
	"reports/slow-loading",
	"reports/no-observations",
	"reports/insufficient",
	"reports/invalid-range",
	"reports/csv-preparing",
	"reports/csv-ready",
	"reports/csv-abort",
	"reports/csv-failure",
	"activity/loading",
	"activity/empty",
	"activity/error",
	"activity/long",
	"access/loading",
	"access/empty",
	"access/error",
	"access/generated-pin",
	"access/provisioning-refusal",
	"health/loading",
	"health/clear",
	"health/unmonitored",
	"health/degraded",
	"health/error",
	"settings/loading",
	"settings/dirty",
	"settings/saving",
	"settings/saved",
	"settings/validation",
	"settings/save-failure",
	"settings/conflict",
	"shell/session-failure",
	"shell/deep-link",
	"shell/back-forward",
	"shell/rapid-retarget",
	"shell/locale-round-trip",
] as const;

export type OwnerReviewScenario = (typeof OWNER_REVIEW_SCENARIOS)[number];
export type OwnerReviewSection =
	| "daily"
	| "history"
	| "access"
	| "audit"
	| "health"
	| "settings";

const ownerSession = {
	principalId: "00000000-0000-4000-8000-000000000091",
	principalKind: "owner",
	role: "owner",
	sessionId: "00000000-0000-4000-8000-000000000092",
	expiresAt: "2026-12-31T00:00:00.000Z",
	active: true,
} as const;

const timeZone = "Asia/Riyadh";
const weekdays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

const dailyValue = {
	businessDay: "2026-08-14",
	timeline: Array.from({ length: 180 }, (_, index) => ({
		state: "value" as const,
		minuteStartUtc: new Date(
			Date.parse("2026-08-14T07:00:00.000Z") + index * 60_000,
		).toISOString(),
		count: 18 + Math.round(Math.sin(index / 18) * 11) + Math.floor(index / 36),
		entries: index % 7 === 0 ? 2 : 0,
		exits: index % 11 === 0 ? 1 : 0,
		band: index > 120 ? ("moderate" as const) : ("quiet" as const),
		capacitySnapshot: 220,
		settingsVersion: 11,
		source: "live" as const,
	})),
	peak: {
		minuteStartUtc: "2026-08-14T09:59:00.000Z",
		count: 42,
		band: "moderate" as const,
		capacitySnapshot: 220,
		settingsVersion: 11,
	},
	dailyAverage: 27.4,
	estimatedEntranceCrossings: 52,
	observedOpenMinutes: 180,
	expectedOpenMinutes: 180,
	coverage: 1,
};

const dailyMissing = {
	...dailyValue,
	timeline: dailyValue.timeline.map((bucket) => ({
		state: "missing" as const,
		minuteStartUtc: bucket.minuteStartUtc,
	})),
	peak: null,
	dailyAverage: null,
	estimatedEntranceCrossings: 0,
	observedOpenMinutes: 0,
	coverage: 0,
};

const dailyClosed = {
	...dailyMissing,
	timeline: dailyValue.timeline.map((bucket) => ({
		state: "closed" as const,
		minuteStartUtc: bucket.minuteStartUtc,
	})),
	expectedOpenMinutes: 0,
	coverage: null,
};

function heatmap(noObservations = false) {
	return {
		startBusinessDay: "2026-07-18",
		endBusinessDay: "2026-08-14",
		cells: weekdays.flatMap((weekday) =>
			Array.from({ length: 24 }, (_unused, localHour) => {
				if (noObservations) {
					return {
						weekday,
						localHour,
						state: "missing",
						averageOccupancy: null,
						observedOpenMinutes: 0,
						expectedOpenMinutes: 60,
						sampleDayCount: 0,
					};
				}
				return {
					weekday,
					localHour,
					state: localHour < 6 ? "closed" : "value",
					averageOccupancy: localHour < 6 ? null : (localHour * 7) % 63,
					observedOpenMinutes: localHour < 6 ? 0 : 60,
					expectedOpenMinutes: localHour < 6 ? 0 : 60,
					sampleDayCount: localHour < 6 ? 0 : 4,
				};
			}),
		),
	};
}

const weekFacts = {
	currentWeek: {
		startBusinessDay: "2026-08-02",
		endBusinessDay: "2026-08-08",
		averageOccupancy: 34.6,
		estimatedEntranceCrossings: 3497,
		observedOpenMinutes: 3884,
		expectedOpenMinutes: 4200,
		coverage: 3884 / 4200,
	},
	priorWeek: {
		startBusinessDay: "2026-07-26",
		endBusinessDay: "2026-08-01",
		averageOccupancy: 31.8,
		estimatedEntranceCrossings: 3284,
		observedOpenMinutes: 3612,
		expectedOpenMinutes: 4200,
		coverage: 3612 / 4200,
	},
};

const comparable = {
	state: "comparable",
	minimumCoverage: 0.8,
	...weekFacts,
	changes: {
		averageOccupancy: { absolute: 2.8, percent: 0.088 },
		estimatedEntranceCrossings: { absolute: 213, percent: 0.065 },
	},
};

const insufficient = {
	state: "insufficient_history",
	minimumCoverage: 0.8,
	...weekFacts,
	reasons: ["prior_week_coverage_below_minimum"],
};

const staffPrincipal = {
	principalId: "00000000-0000-4000-8000-0000000000c1",
	principalKind: "shared_staff",
	role: "staff",
	displayName: "Front desk",
	ownerEmail: null,
	active: true,
	credentialVersion: 3,
	credentialActive: true,
};

const ownerPrincipal = {
	principalId: ownerSession.principalId,
	principalKind: "owner",
	role: "owner",
	displayName: "FITWAY Demo Owner",
	ownerEmail: "owner@demo.fitway.local",
	active: true,
	credentialVersion: null,
	credentialActive: null,
};

const auditEntry = {
	id: 26,
	eventClass: "command",
	action: "correction_absolute",
	actor: {
		principalId: ownerSession.principalId,
		kind: "owner",
		role: "owner",
		displayName:
			"A deliberately long bilingual owner name — اسم مالك طويل لاختبار الالتفاف",
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
	reason:
		"A deliberately expanded explanation for the recount after the entrance sensor obstruction — شرح عربي طويل لاختبار النص داخل الجدول.",
	createdAtUtc: "2026-08-10T21:30:00.000Z",
};

const healthDegraded = {
	window: {
		businessDayFrom: "2026-08-01",
		businessDayTo: "2026-08-14",
		businessDays: 14,
		timeZone,
		generatedAtUtc: "2026-08-14T09:00:00.000Z",
	},
	connection: {
		expectedOpenMinutes: 12_840,
		monitoredOpenMinutes: 12_000,
		onlineOpenMinutes: 11_905,
		offlineOpenMinutes: 95,
		uptimeRatio: 11_905 / 12_000,
		monitoredRatio: 12_000 / 12_840,
		monitoringStartedAtUtc: "2026-08-02T06:00:00.000Z",
		offlinePeriodCount: 1,
		offlinePeriods: [
			{
				startedAtUtc: "2026-08-13T21:30:00.000Z",
				endedAtUtc: null,
				elapsedMinutes: 95,
				openMinutes: 95,
			},
		],
	},
	alerts: {
		noticeCount: 2,
		delivered: 1,
		failed: 1,
		unconfirmed: 0,
		incidentCount: 1,
		incidents: [
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
		],
	},
};

const healthClear = {
	...healthDegraded,
	connection: {
		...healthDegraded.connection,
		monitoredOpenMinutes: 12_840,
		onlineOpenMinutes: 12_840,
		offlineOpenMinutes: 0,
		uptimeRatio: 1,
		monitoredRatio: 1,
		offlinePeriodCount: 0,
		offlinePeriods: [],
	},
	alerts: {
		noticeCount: 0,
		delivered: 0,
		failed: 0,
		unconfirmed: 0,
		incidentCount: 0,
		incidents: [],
	},
};

const healthUnmonitored = {
	...healthClear,
	connection: {
		...healthClear.connection,
		monitoredOpenMinutes: 0,
		onlineOpenMinutes: 0,
		uptimeRatio: null,
		monitoredRatio: 0,
		monitoringStartedAtUtc: null,
	},
};

const settingsSnapshot = {
	version: 7,
	effectiveFromUtc: "2026-07-01T00:00:00.000Z",
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
		timezone: timeZone,
		pushIntervalSeconds: 20,
		freshForSeconds: 90,
		operationalStaleAfterSeconds: 180,
		publicPollSeconds: 60,
	},
};

function rpcError(status: number, code = "SERVICE_UNAVAILABLE") {
	return {
		json: null,
		error: { json: { status, code, message: code, data: null } },
	};
}

function typedError(status: number, code: string, data: unknown = null) {
	return { json: { defined: false, code, status, message: code, data } };
}

async function holdRoute(_route: Route) {
	await new Promise(() => undefined);
}

export function ownerReviewSection(
	scenario: OwnerReviewScenario,
): OwnerReviewSection {
	const prefix = scenario.split("/")[0];
	if (prefix === "reports") return "history";
	if (prefix === "activity") return "audit";
	if (prefix === "access" || prefix === "health" || prefix === "settings") {
		return prefix;
	}
	return "daily";
}

export function isOwnerReviewScenario(
	value: string,
): value is OwnerReviewScenario {
	return (OWNER_REVIEW_SCENARIOS as readonly string[]).includes(value);
}

export async function installOwnerReviewScenario(
	page: Page,
	scenario: OwnerReviewScenario,
) {
	await page.route("**/rpc/admin/session", (route) =>
		scenario === "shell/session-failure"
			? route.fulfill({ status: 401, json: rpcError(401, "UNAUTHORIZED") })
			: route.fulfill({ status: 200, json: { json: ownerSession } }),
	);
	await page.route("**/api/auth/session", (route) =>
		route.fulfill({ status: 401, json: { error: "unauthorized" } }),
	);

	await page.route("**/rpc/admin/analytics/daily", async (route) => {
		if (scenario === "daily/loading") return holdRoute(route);
		if (scenario === "daily/error") {
			return route.fulfill({ status: 503, json: rpcError(503) });
		}
		const value =
			scenario === "daily/missing"
				? dailyMissing
				: scenario === "daily/closed"
					? dailyClosed
					: dailyValue;
		return route.fulfill({ status: 200, json: { json: value } });
	});
	await page.route("**/rpc/admin/analytics/timeContext", (route) => {
		const versions =
			route.request().postDataJSON()?.json?.settingsVersions ?? [];
		return route.fulfill({
			status: 200,
			json: {
				json: {
					current: { settingsVersion: 11, timeZone },
					versions: versions.map((settingsVersion: number) => ({
						settingsVersion,
						timeZone,
					})),
				},
			},
		});
	});

	await page.route("**/rpc/admin/analytics/heatmap", async (route) => {
		if (scenario === "reports/partial-loading") return holdRoute(route);
		if (scenario === "reports/slow-loading") {
			await new Promise((resolve) => setTimeout(resolve, 900));
		}
		return route.fulfill({
			status: 200,
			json: { json: heatmap(scenario === "reports/no-observations") },
		});
	});
	await page.route("**/rpc/admin/analytics/weekOverWeek", (route) =>
		route.fulfill({
			status: 200,
			json: {
				json: scenario === "reports/insufficient" ? insufficient : comparable,
			},
		}),
	);
	await page.route("**/rpc/admin/analytics/csv", async (route) => {
		if (
			scenario === "reports/csv-preparing" ||
			scenario === "reports/csv-abort"
		) {
			return holdRoute(route);
		}
		if (scenario === "reports/csv-failure") {
			return route.fulfill({ status: 503, json: rpcError(503) });
		}
		return route.fulfill({
			status: 200,
			headers: { "content-type": "text/event-stream" },
			body: [
				'event: message\ndata: {"json":"﻿business_day,count\\r\\n"}\n\n',
				'event: message\ndata: {"json":"2026-08-14,27\\r\\n"}\n\n',
				"event: done\ndata: {}\n\n",
			].join(""),
		});
	});

	await page.route("**/rpc/admin/audit/list", async (route) => {
		if (scenario === "activity/loading") return holdRoute(route);
		if (scenario === "activity/error") {
			return route.fulfill({ status: 503, json: rpcError(503) });
		}
		const entries =
			scenario === "activity/empty"
				? []
				: scenario === "activity/long"
					? Array.from({ length: 18 }, (_, index) => ({
							...auditEntry,
							id: auditEntry.id + index,
							createdAtUtc: new Date(
								Date.parse(auditEntry.createdAtUtc) - index * 61_000,
							).toISOString(),
						}))
					: [auditEntry];
		return route.fulfill({
			status: 200,
			json: { json: { entries, nextCursor: null } },
		});
	});

	await page.route("**/rpc/admin/access/list", async (route) => {
		if (scenario === "access/loading") return holdRoute(route);
		if (scenario === "access/error") {
			return route.fulfill({ status: 503, json: rpcError(503) });
		}
		return route.fulfill({
			status: 200,
			json: {
				json: {
					principals:
						scenario === "access/empty" ? [] : [staffPrincipal, ownerPrincipal],
				},
			},
		});
	});
	await page.route("**/rpc/admin/access/**", (route) => {
		if (route.request().url().endsWith("/list")) return route.fallback();
		if (scenario === "access/provisioning-refusal") {
			return route.fulfill({
				status: 400,
				json: typedError(400, "BAD_REQUEST", {
					code: "staff_pin_already_active",
				}),
			});
		}
		return route.fulfill({
			status: 200,
			json: {
				json: {
					auditId: 42,
					principal: staffPrincipal,
					revokedSessions: 0,
					revealedPin: "48291057",
				},
			},
		});
	});

	await page.route("**/rpc/admin/health/summary", async (route) => {
		if (scenario === "health/loading") return holdRoute(route);
		if (scenario === "health/error") {
			return route.fulfill({ status: 503, json: rpcError(503) });
		}
		const summary =
			scenario === "health/unmonitored"
				? healthUnmonitored
				: scenario === "health/degraded"
					? healthDegraded
					: healthClear;
		return route.fulfill({ status: 200, json: { json: summary } });
	});

	await page.route("**/rpc/admin/settings/read", async (route) => {
		if (scenario === "settings/loading") return holdRoute(route);
		return route.fulfill({
			status: 200,
			json: { json: settingsSnapshot },
		});
	});
	await page.route("**/rpc/admin/settings/update", async (route) => {
		if (scenario === "settings/saving") return holdRoute(route);
		if (scenario === "settings/save-failure") {
			return route.fulfill({
				status: 500,
				json: typedError(500, "INTERNAL_SERVER_ERROR"),
			});
		}
		if (scenario === "settings/conflict") {
			return route.fulfill({
				status: 409,
				json: typedError(409, "CONFLICT", {
					code: "settings_version_conflict",
				}),
			});
		}
		return route.fulfill({
			status: 200,
			json: {
				json: {
					settings: { ...settingsSnapshot, version: 8 },
					auditId: 43,
				},
			},
		});
	});
}
