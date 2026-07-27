import { mkdir } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const now = "2026-07-22T12:00:00.000Z";

const staffAuth = {
	principalId: "00000000-0000-4000-8000-000000000001",
	principalKind: "shared_staff",
	role: "staff",
	sessionId: "00000000-0000-4000-8000-000000000002",
	expiresAt: "2026-08-22T12:00:00.000Z",
	active: true,
} as const;

const liveSnapshot = {
	schemaVersion: 1,
	computedAt: now,
	occupancy: {
		schemaVersion: 2,
		freshness: "fresh",
		timeZone: "Asia/Riyadh",
		band: "moderate",
		count: 37,
		lastUpdatedAt: "2026-07-22T11:59:30.000Z",
		freshUntil: "2026-07-22T12:01:00.000Z",
		source: "edge",
		computedAt: now,
		trend: null,
	},
	capacity: 100,
	source: "edge",
	health: {
		freshness: "current",
		condition: "healthy",
		process: "ok",
		camera: "ok",
		feed: "ok",
		detectorFps: 7.5,
		edgeObservedAt: "2026-07-22T11:59:29.000Z",
		receivedAt: "2026-07-22T11:59:30.000Z",
		lastSeenAt: "2026-07-22T11:59:30.000Z",
		staleAt: "2026-07-22T12:04:30.000Z",
	},
} as const;

const unavailableSnapshot = {
	schemaVersion: 1,
	computedAt: now,
	occupancy: {
		schemaVersion: 2,
		freshness: "unavailable",
		computedAt: now,
		trend: null,
	},
	capacity: 100,
	source: null,
	health: {
		freshness: "unavailable",
		condition: "unknown",
		process: null,
		camera: null,
		feed: null,
		detectorFps: null,
		edgeObservedAt: null,
		receivedAt: null,
		lastSeenAt: "2026-07-22T11:45:00.000Z",
		staleAt: null,
	},
} as const;

const staleSnapshot = {
	...liveSnapshot,
	occupancy: { ...liveSnapshot.occupancy, freshness: "stale" },
	health: { ...liveSnapshot.health, freshness: "stale" },
} as const;

const closedSnapshot = {
	...liveSnapshot,
	occupancy: {
		schemaVersion: 2,
		freshness: "closed",
		timeZone: "Asia/Riyadh",
		nextOpenAt: "2026-07-22T15:00:00.000Z",
		computedAt: now,
		trend: null,
	},
	source: null,
} as const;

function commandResult(options: {
	id: number;
	targetValue: number | null;
	type?: "set_count" | "reset_zero";
	reason?: string | null;
	issuedAt?: string;
}) {
	return {
		command: {
			id: options.id,
			type: options.type ?? "set_count",
			targetValue: options.targetValue,
			status: "pending",
			reason: options.reason ?? null,
			issuedAt: options.issuedAt ?? "2026-07-22T12:00:10.000Z",
		},
		auditId: options.id + 100,
	};
}

function recentCommand(options: {
	id: number;
	targetValue: number | null;
	status: "pending" | "applied" | "superseded";
	type?: "set_count" | "reset_zero";
	reason?: string | null;
	deliveredAt?: string | null;
	appliedAt?: string | null;
	supersededAt?: string | null;
	supersededByCommandId?: number | null;
}) {
	return {
		id: options.id,
		type: options.type ?? "set_count",
		targetValue: options.targetValue,
		status: options.status,
		reason: options.reason ?? null,
		issuedAt: "2026-07-22T12:00:10.000Z",
		deliveredAt: options.deliveredAt ?? null,
		appliedAt: options.appliedAt ?? null,
		supersededAt: options.supersededAt ?? null,
		supersededByCommandId: options.supersededByCommandId ?? null,
	};
}

function rpcError(status: number, code: string, message: string) {
	return {
		json: {
			defined: false,
			code,
			status,
			message,
			data: null,
		},
	};
}

async function mockSession(page: Page) {
	await page.route("**/api/auth/session", (route) =>
		route.fulfill({ status: 200, json: { auth: staffAuth } }),
	);
}

async function useEnglish(page: Page) {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
}

async function captureReview(page: Page, name: string) {
	const reviewDirectory = process.env.FITWAY_PLAYWRIGHT_REVIEW_DIR;
	if (!reviewDirectory) {
		throw new Error("FITWAY_PLAYWRIGHT_REVIEW_DIR is required");
	}
	await mkdir(reviewDirectory, { recursive: true });
	await page.screenshot({
		path: path.join(reviewDirectory, name),
		fullPage: true,
	});
}

function requestInput(pageData: unknown) {
	if (typeof pageData === "object" && pageData !== null && "json" in pageData) {
		return (pageData as { json: unknown }).json;
	}
	return pageData;
}

test.beforeEach(async ({ page }) => {
	await page.route("**/rpc/staff/recentCommands", (route) =>
		route.fulfill({ status: 200, json: { json: [] } }),
	);
});

test("step correction, floor-at-zero, direct entry, validation, and pending issuance stay honest", async ({
	page,
}) => {
	await useEnglish(page);
	await mockSession(page);
	const correctionInputs: unknown[] = [];
	let lifecycleRows: ReturnType<typeof recentCommand>[] = [];

	await page.route("**/rpc/staff/operationalSnapshot", (route) =>
		route.fulfill({ status: 200, json: { json: liveSnapshot } }),
	);
	await page.route("**/rpc/staff/recentCommands", (route) =>
		route.fulfill({ status: 200, json: { json: lifecycleRows } }),
	);
	await page.route("**/rpc/staff/issueCorrection", async (route) => {
		const input = requestInput(route.request().postDataJSON());
		correctionInputs.push(input);
		const isDirect = correctionInputs.length === 2;
		lifecycleRows = isDirect
			? [
					recentCommand({
						id: 42,
						targetValue: 40,
						status: "superseded",
						reason: "Verified door count",
						supersededAt: "2026-07-22T12:00:30.000Z",
						supersededByCommandId: 43,
					}),
					recentCommand({
						id: 41,
						targetValue: 0,
						status: "applied",
						reason: "Empty-floor check",
						deliveredAt: "2026-07-22T12:00:15.000Z",
						appliedAt: "2026-07-22T12:00:20.000Z",
					}),
				]
			: [
					recentCommand({
						id: 41,
						targetValue: 0,
						status: "applied",
						reason: "Empty-floor check",
						deliveredAt: "2026-07-22T12:00:15.000Z",
						appliedAt: "2026-07-22T12:00:20.000Z",
					}),
				];
		await route.fulfill({
			status: 200,
			json: {
				json: commandResult({
					id: isDirect ? 42 : 41,
					targetValue: isDirect ? 40 : 0,
					reason: isDirect ? "Verified door count" : "Empty-floor check",
					issuedAt: isDirect
						? "2026-07-22T12:00:20.000Z"
						: "2026-07-22T12:00:10.000Z",
				}),
			},
		});
	});

	await page.goto("/staff");
	await expect(
		page.getByRole("heading", { name: "Count correction controls" }),
	).toBeVisible();
	for (let press = 0; press < 40; press += 1) {
		await page
			.getByRole("button", { name: "Decrease the adjustment by 1" })
			.click();
	}
	await page
		.getByLabel("Short reason (optional)")
		.first()
		.fill(" Empty-floor check ");
	await page.getByRole("button", { name: "Apply adjustment" }).click();
	await expect(
		page.getByText("Applied by the edge", { exact: true }),
	).toBeVisible();
	await expect(page.getByText("Set count to 0")).toBeVisible();

	const directInput = page.getByLabel("New count");
	await directInput.fill("٣٧");
	await page.getByRole("button", { name: "Set count" }).click();
	await expect(page.getByText("Use Western digits only")).toBeVisible();
	await expect.poll(() => correctionInputs.length).toBe(1);

	await directInput.fill("40");
	await page
		.getByLabel("Short reason (optional)")
		.nth(1)
		.fill("Verified door count");
	await page.getByRole("button", { name: "Set count" }).click();

	expect(correctionInputs).toEqual([
		{ delta: -37, reason: "Empty-floor check" },
		{ absolute: 40, reason: "Verified door count" },
	]);
	await expect(
		page.locator(".command-history li", {
			hasText: "Waiting for edge application",
		}),
	).toHaveCount(0);
	await expect(
		page.locator(".command-history li", { hasText: "Applied by the edge" }),
	).toHaveCount(1);
	await expect(
		page.locator(".command-history li", {
			hasText: "Superseded by a newer command",
		}),
	).toHaveCount(1);
	await expect(page.getByText("Set count to 40")).toBeVisible();
	await expect(
		page.getByText(
			"Status is read from the server. Delivery time is metadata, not a lifecycle state.",
		),
	).toBeVisible();
	await captureReview(page, "staff-commands-lifecycle-en-1440.png");
});

test("unavailable state disables delta but preserves validated direct-set", async ({
	page,
}) => {
	await useEnglish(page);
	await mockSession(page);
	await page.route("**/rpc/staff/operationalSnapshot", (route) =>
		route.fulfill({ status: 200, json: { json: unavailableSnapshot } }),
	);
	let directInput: unknown = null;
	let lifecycleRows: ReturnType<typeof recentCommand>[] = [];
	await page.route("**/rpc/staff/recentCommands", (route) =>
		route.fulfill({ status: 200, json: { json: lifecycleRows } }),
	);
	await page.route("**/rpc/staff/issueCorrection", async (route) => {
		directInput = requestInput(route.request().postDataJSON());
		lifecycleRows = [
			recentCommand({
				id: 51,
				targetValue: 12,
				status: "pending",
				deliveredAt: "2026-07-22T12:00:15.000Z",
			}),
		];
		await route.fulfill({
			status: 200,
			json: { json: commandResult({ id: 51, targetValue: 12 }) },
		});
	});

	await page.goto("/staff");
	await expect(
		page.getByText("A step correction needs a usable current count"),
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Apply adjustment" }),
	).toBeDisabled();
	await page.getByLabel("New count").fill("12");
	await page.getByRole("button", { name: "Set count" }).click();
	expect(directInput).toEqual({ absolute: 12 });
	await expect(
		page.getByText("Waiting for edge application", { exact: true }),
	).toBeVisible();
});

test("stale, closed, loading, and transport-error states keep command availability honest", async ({
	page,
}) => {
	await useEnglish(page);
	await mockSession(page);
	let state: "stale" | "closed" | "error" = "stale";
	await page.route("**/rpc/staff/operationalSnapshot", async (route) => {
		if (state === "error") {
			await new Promise((resolve) => setTimeout(resolve, 500));
			await route.fulfill({
				status: 503,
				json: rpcError(503, "SERVICE_UNAVAILABLE", "Service unavailable"),
			});
			return;
		}
		await route.fulfill({
			status: 200,
			json: { json: state === "stale" ? staleSnapshot : closedSnapshot },
		});
	});

	await page.goto("/staff");
	await expect(
		page.getByText("Last-known reading", { exact: true }),
	).toBeVisible();
	await page
		.getByRole("button", { name: "Decrease the adjustment by 1" })
		.click();
	await expect(
		page.getByRole("button", { name: "Apply adjustment" }),
	).toBeEnabled();

	state = "closed";
	await page.reload();
	await expect(
		page.getByText("Gym closed now", { exact: true }).first(),
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Apply adjustment" }),
	).toBeDisabled();
	await expect(page.getByRole("button", { name: "Set count" })).toBeEnabled();

	state = "error";
	await page.reload();
	await expect(page.getByRole("status")).toContainText(
		"Loading operational status",
	);
	await expect(
		page.getByRole("heading", { name: "Count correction controls" }),
	).toHaveCount(0);
	await expect(page.getByRole("alert")).toContainText(
		"Operational status could not be loaded",
	);
	await expect(
		page.getByRole("heading", { name: "Count correction controls" }),
	).toHaveCount(0);
});

test("reset requires modal confirmation, traps focus, closes on Escape, restores focus, and queues only after confirm", async ({
	page,
}) => {
	await useEnglish(page);
	await mockSession(page);
	await page.route("**/rpc/staff/operationalSnapshot", (route) =>
		route.fulfill({ status: 200, json: { json: liveSnapshot } }),
	);
	const resetInputs: unknown[] = [];
	let lifecycleRows: ReturnType<typeof recentCommand>[] = [];
	await page.route("**/rpc/staff/recentCommands", (route) =>
		route.fulfill({ status: 200, json: { json: lifecycleRows } }),
	);
	await page.route("**/rpc/staff/issueReset", async (route) => {
		resetInputs.push(requestInput(route.request().postDataJSON()));
		lifecycleRows = [
			recentCommand({
				id: 61,
				type: "reset_zero",
				targetValue: null,
				status: "pending",
				reason: "Closing verification",
			}),
		];
		await route.fulfill({
			status: 200,
			json: {
				json: commandResult({
					id: 61,
					type: "reset_zero",
					targetValue: null,
					reason: "Closing verification",
				}),
			},
		});
	});

	await page.goto("/staff");
	const trigger = page.getByRole("button", { name: "Reset to 0" });
	await trigger.click();
	const dialog = page.getByRole("dialog", { name: "Confirm reset to 0" });
	await expect(dialog).toBeVisible();
	await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();
	await page.keyboard.press("Escape");
	await expect(dialog).toBeHidden();
	await expect(trigger).toBeFocused();
	expect(resetInputs).toEqual([]);

	await trigger.click();
	await page
		.getByLabel("Short reason (optional)")
		.nth(2)
		.fill("Closing verification");
	await captureReview(page, "staff-reset-confirm-en-1440.png");
	await page.getByRole("button", { name: "Queue reset" }).click();
	expect(resetInputs).toEqual([{ reason: "Closing verification" }]);
	await expect(dialog).toBeHidden();
	await expect(page.getByText("Reset count to 0")).toBeVisible();
	await expect(
		page.getByText("Waiting for edge application", { exact: true }),
	).toBeVisible();
});

test("command failures stay actionable and an expired mutation session redirects", async ({
	page,
}) => {
	await useEnglish(page);
	let expired = false;
	await page.route("**/api/auth/session", (route) =>
		route.fulfill(
			expired
				? { status: 401, json: { error: "unauthorized" } }
				: { status: 200, json: { auth: staffAuth } },
		),
	);
	await page.route("**/rpc/staff/operationalSnapshot", (route) =>
		route.fulfill({ status: 200, json: { json: liveSnapshot } }),
	);
	let attempts = 0;
	await page.route("**/rpc/staff/issueCorrection", async (route) => {
		attempts += 1;
		if (attempts === 3) expired = true;
		await route.fulfill(
			attempts === 1
				? {
						status: 400,
						json: rpcError(400, "BAD_REQUEST", "Bad Request"),
					}
				: attempts === 2
					? {
							status: 403,
							json: rpcError(403, "FORBIDDEN", "Forbidden"),
						}
					: {
							status: 401,
							json: rpcError(401, "UNAUTHORIZED", "Unauthorized"),
						},
		);
	});

	await page.goto("/staff");
	await page.getByLabel("New count").fill("9");
	await page.getByRole("button", { name: "Set count" }).click();
	await expect(page.getByRole("alert")).toContainText(
		"The command could not be queued",
	);
	await page.getByRole("button", { name: "Set count" }).click();
	await expect(page.getByRole("alert")).toContainText(
		"This session is not allowed",
	);
	await page.getByRole("button", { name: "Set count" }).click();
	await expect(page).toHaveURL(/\/login$/u);
});

test("Arabic RTL and English LTR are accessible and recompose at every required width", async ({
	page,
}) => {
	await mockSession(page);
	await page.route("**/rpc/staff/operationalSnapshot", (route) =>
		route.fulfill({ status: 200, json: { json: liveSnapshot } }),
	);
	await page.route("**/rpc/staff/recentCommands", (route) =>
		route.fulfill({
			status: 200,
			json: {
				json: [
					recentCommand({
						id: 73,
						targetValue: 39,
						status: "pending",
						deliveredAt: "2026-07-22T12:00:15.000Z",
					}),
					recentCommand({
						id: 72,
						targetValue: 38,
						status: "superseded",
						supersededAt: "2026-07-22T12:00:20.000Z",
						supersededByCommandId: 73,
					}),
					recentCommand({
						id: 71,
						type: "reset_zero",
						targetValue: null,
						status: "applied",
						deliveredAt: "2026-07-22T12:00:05.000Z",
						appliedAt: "2026-07-22T12:00:10.000Z",
					}),
				],
			},
		}),
	);
	await page.goto("/staff");
	await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
	await expect(
		page.getByRole("heading", { name: "أدوات تصحيح العدد" }),
	).toBeVisible();

	for (const width of [320, 360, 390, 721, 768, 820, 1024, 1200, 1440]) {
		await page.setViewportSize({ width, height: width < 721 ? 844 : 900 });
		await expect(
			page.getByRole("heading", { name: "أدوات تصحيح العدد" }),
		).toBeVisible();
		const overflow = await page.evaluate(
			() =>
				document.documentElement.scrollWidth >
				document.documentElement.clientWidth,
		);
		expect(overflow, `document overflow at ${width}px`).toBe(false);
		if (width === 390 || width === 768 || width === 1440) {
			await captureReview(page, `staff-commands-ar-${width}.png`);
		}
	}

	let results = await new AxeBuilder({ page }).analyze();
	expect(
		results.violations.filter(
			({ impact }) => impact === "serious" || impact === "critical",
		),
	).toEqual([]);

	await page
		.getByRole("button", { name: "التبديل إلى اللغة الإنجليزية" })
		.click();
	await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
	await expect(
		page.getByRole("heading", { name: "Count correction controls" }),
	).toBeVisible();
	for (const width of [320, 360, 390, 721, 768, 820, 1024, 1200, 1440]) {
		await page.setViewportSize({ width, height: width < 721 ? 844 : 900 });
		const overflow = await page.evaluate(
			() =>
				document.documentElement.scrollWidth >
				document.documentElement.clientWidth,
		);
		expect(overflow, `English document overflow at ${width}px`).toBe(false);
	}
	results = await new AxeBuilder({ page }).analyze();
	expect(
		results.violations.filter(
			({ impact }) => impact === "serious" || impact === "critical",
		),
	).toEqual([]);
	await captureReview(page, "staff-commands-en-1440.png");
});

test("keyboard focus, targets, reduced motion, and 200% reflow remain usable", async ({
	page,
}) => {
	await useEnglish(page);
	await mockSession(page);
	await page.route("**/rpc/staff/operationalSnapshot", (route) =>
		route.fulfill({ status: 200, json: { json: liveSnapshot } }),
	);
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/staff");

	const skipLink = page.getByRole("link", {
		name: "Skip to operational status",
	});
	await expect(skipLink).toBeAttached();
	const firstFocusableName = await page.evaluate(() => {
		const candidates = document.querySelectorAll<HTMLElement>(
			'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
		);
		return Array.from(candidates).find(
			(element) => !element.closest("dialog:not([open])"),
		)?.textContent;
	});
	expect(firstFocusableName).toContain("Skip to operational status");
	await skipLink.focus();
	await expect(skipLink).toBeFocused();
	await page.keyboard.press("Enter");
	await expect(page.locator("main")).toBeFocused();

	const increase = page.getByRole("button", {
		name: "Increase the adjustment by 1",
	});
	await increase.focus();
	await expect(increase).toBeFocused();
	await expect
		.poll(() =>
			increase.evaluate((element) => getComputedStyle(element).boxShadow),
		)
		.not.toBe("none");
	expect(
		await increase.evaluate((element) =>
			getComputedStyle(element)
				.transitionDuration.split(",")
				.every((value) => Number.parseFloat(value) <= 0.001),
		),
	).toBe(true);

	for (const control of [
		increase,
		page.getByLabel("New count"),
		page.getByRole("button", { name: "Reset to 0" }),
	]) {
		const box = await control.boundingBox();
		expect(box?.height).toBeGreaterThanOrEqual(44);
		expect(box?.width).toBeGreaterThanOrEqual(44);
	}

	await page.getByRole("button", { name: "Reset to 0" }).click();
	await page.keyboard.press("Tab");
	await expect(page.getByRole("button", { name: "Queue reset" })).toBeFocused();
	await page.keyboard.press("Tab");
	expect(
		await page
			.getByRole("dialog", { name: "Confirm reset to 0" })
			.evaluate((element) => element.contains(document.activeElement)),
	).toBe(true);
	await page.keyboard.press("Escape");

	// A 1280px browser viewport at 200% page zoom exposes a 640 CSS-pixel
	// layout viewport. Exercise that reflow width directly so media queries
	// follow the same layout path as real browser zoom.
	await page.setViewportSize({ width: 640, height: 900 });
	const overflow = await page.evaluate(
		() =>
			document.documentElement.scrollWidth >
			document.documentElement.clientWidth,
	);
	expect(overflow).toBe(false);
	await expect(
		page.getByRole("heading", { name: "Count correction controls" }),
	).toBeVisible();
	await captureReview(page, "staff-commands-en-200-percent-reflow.png");
});
