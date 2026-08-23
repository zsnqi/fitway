import { mkdir } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const owner = {
	principalId: "00000000-0000-4000-8000-000000000091",
	principalKind: "owner",
	role: "owner",
	sessionId: "00000000-0000-4000-8000-000000000092",
	expiresAt: "2026-08-22T00:00:00.000Z",
	active: true,
} as const;

const timeZone = "Asia/Riyadh";
const weekdays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

const daily = {
	businessDay: "2026-08-14",
	timeline: [
		{
			state: "value",
			minuteStartUtc: "2026-08-14T07:00:00.000Z",
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
		minuteStartUtc: "2026-08-14T07:00:00.000Z",
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

function heatmap() {
	return {
		startBusinessDay: "2026-07-18",
		endBusinessDay: "2026-08-14",
		cells: weekdays.flatMap((weekday) =>
			Array.from({ length: 24 }, (_unused, localHour) => {
				const special = `${weekday}:${localHour}`;
				if (special === "sun:6") {
					return {
						weekday,
						localHour,
						state: "value",
						averageOccupancy: 0,
						observedOpenMinutes: 60,
						expectedOpenMinutes: 60,
						sampleDayCount: 4,
					};
				}
				if (special === "mon:8") {
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
				if (special === "tue:9") {
					return {
						weekday,
						localHour,
						state: "closed",
						averageOccupancy: null,
						observedOpenMinutes: 0,
						expectedOpenMinutes: 0,
						sampleDayCount: 0,
					};
				}
				return {
					weekday,
					localHour,
					state: "value",
					averageOccupancy: localHour === 9 ? 40 : 12,
					observedOpenMinutes: 60,
					expectedOpenMinutes: 60,
					sampleDayCount: 4,
				};
			}),
		),
	};
}

const weeks = {
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
} as const;

const insufficient = {
	state: "insufficient_history",
	minimumCoverage: 0.8,
	...weeks,
	reasons: ["prior_week_coverage_below_minimum"],
} as const;

function rpcError(status: number) {
	return {
		json: null,
		error: {
			json: {
				status,
				code: "SERVICE_UNAVAILABLE",
				message: "Service Unavailable",
				data: null,
			},
		},
	};
}

async function captureReview(page: Page, name: string) {
	const reviewDirectory = process.env.FITWAY_PLAYWRIGHT_REVIEW_DIR;
	if (!reviewDirectory)
		throw new Error("FITWAY_PLAYWRIGHT_REVIEW_DIR is required");
	await mkdir(reviewDirectory, { recursive: true });
	await page.screenshot({
		path: path.join(reviewDirectory, name),
		fullPage: true,
	});
}

async function mockOwnerRoute(
	page: Page,
	options: {
		// The daily response stays unfulfilled until this resolves, so the
		// prerequisite pending state lasts exactly as long as the caller holds it.
		dailyHold?: Promise<void>;
		heatmapDelayMs?: number;
		heatmapStatus?: number;
		comparison?: typeof insufficient;
		csvMode?: "pending" | "ready" | "error";
		timeContextFailures?: number;
	} = {},
) {
	const calls = {
		daily: 0,
		timeContext: 0,
		heatmap: 0,
		weekOverWeek: 0,
		csv: 0,
	};
	await page.route("**/rpc/admin/session", (route) =>
		route.fulfill({ status: 200, json: { json: owner } }),
	);
	await page.route("**/rpc/admin/analytics/daily", async (route) => {
		calls.daily += 1;
		if (options.dailyHold) {
			await options.dailyHold;
		}
		await route.fulfill({ status: 200, json: { json: daily } });
	});
	await page.route("**/rpc/admin/analytics/timeContext", async (route) => {
		calls.timeContext += 1;
		if (calls.timeContext <= (options.timeContextFailures ?? 0)) {
			await route.fulfill({ status: 503, json: rpcError(503) });
			return;
		}
		await route.fulfill({
			status: 200,
			json: {
				json: {
					current: { settingsVersion: 11, timeZone },
					versions: (
						route.request().postDataJSON()?.json?.settingsVersions ?? []
					).map((settingsVersion: number) => ({ settingsVersion, timeZone })),
				},
			},
		});
	});
	// These are neighbours on /admin. Keeping them fulfilled proves the reporting
	// fixture does not get a green page by removing accepted owner surfaces.
	await page.route("**/rpc/admin/audit/list", (route) =>
		route.fulfill({
			status: 200,
			json: { json: { entries: [], nextCursor: null } },
		}),
	);
	await page.route("**/rpc/admin/health/summary", (route) =>
		route.fulfill({ status: 503, json: rpcError(503) }),
	);
	await page.route("**/rpc/admin/analytics/heatmap", async (route) => {
		calls.heatmap += 1;
		if (options.heatmapDelayMs) {
			await new Promise((resolve) =>
				setTimeout(resolve, options.heatmapDelayMs),
			);
		}
		if (options.heatmapStatus) {
			await route.fulfill({
				status: options.heatmapStatus,
				json: rpcError(options.heatmapStatus),
			});
			return;
		}
		await route.fulfill({ status: 200, json: { json: heatmap() } });
	});
	await page.route("**/rpc/admin/analytics/weekOverWeek", (route) => {
		calls.weekOverWeek += 1;
		return route.fulfill({
			status: 200,
			json: { json: options.comparison ?? insufficient },
		});
	});
	await page.route("**/rpc/admin/analytics/csv", async (route) => {
		calls.csv += 1;
		if (options.csvMode === "pending") {
			await new Promise(() => undefined);
			return;
		}
		if (options.csvMode === "ready") {
			await route.fulfill({
				status: 200,
				headers: { "content-type": "text/event-stream" },
				body: [
					'event: message\ndata: {"json":"﻿business_day,count\\r\\n"}\n\n',
					'event: message\ndata: {"json":"2026-08-14,12\\r\\n"}\n\n',
					"event: done\ndata: {}\n\n",
				].join(""),
			});
			return;
		}
		await route.fulfill({ status: 503, json: rpcError(503) });
	});
	return calls;
}

async function setLocale(page: Page, locale: "ar" | "en") {
	if ((await page.locator("html").getAttribute("lang")) !== locale) {
		await page.locator(".owner-rail__language").click();
	}
	await expect(page.locator("html")).toHaveAttribute("lang", locale);
	await expect(page.locator("html")).toHaveAttribute(
		"dir",
		locale === "ar" ? "rtl" : "ltr",
	);
}

async function expectNoOverflow(
	page: Page,
	allowReportingRegionOverflow = false,
) {
	const overflow = await page.evaluate(() => {
		const reporting = document.querySelector<HTMLElement>(".owner-reporting");
		return {
			document: document.documentElement.scrollWidth - window.innerWidth,
			body: document.body.scrollWidth - window.innerWidth,
			reporting: (reporting?.scrollWidth ?? 0) - (reporting?.clientWidth ?? 0),
		};
	});
	expect(overflow.document).toBeLessThanOrEqual(0);
	expect(overflow.body).toBeLessThanOrEqual(0);
	if (!allowReportingRegionOverflow) {
		expect(overflow.reporting).toBeLessThanOrEqual(0);
	}
}

function seriousViolations(
	results: Awaited<ReturnType<AxeBuilder["analyze"]>>,
) {
	return results.violations.filter(
		({ impact }) => impact === "serious" || impact === "critical",
	);
}

async function activateHistory(page: Page) {
	await page.locator("#owner-analytics-history-tab").click();
	await expect(page.locator("#owner-analytics-history-panel")).toBeVisible();
	await expect(page.locator(".owner-reporting")).toBeVisible();
}

/*
 * Default-state density and flow of the two control boards.
 *
 * The approved composition gives each board one heading line, a 12px gap, and then a
 * single field-and-action row; it does not stack a legend, a field block, a hint
 * paragraph and a divided action strip into four rows. The numbers asserted here are the
 * approved board's own: a 22px heading line, a 12px gap, a 63px control row, and — for a
 * board carrying no extra prose — a 131px board. They are read from the rendered boxes,
 * so a return to the stacked control flow fails here rather than only in a screenshot.
 */
async function expectBoardDensity(page: Page, width: number) {
	const boards = await page.evaluate(() => {
		const controls = document.querySelector(
			"[data-owner-reporting-controls]",
		) as HTMLElement;
		const measure = (selector: string) => {
			const board = controls.querySelector(selector) as HTMLElement;
			const box = (element: Element | null) => {
				if (!element) return null;
				const rect = element.getBoundingClientRect();
				return {
					top: Math.round(rect.top * 100) / 100,
					height: Math.round(rect.height * 100) / 100,
					width: Math.round(rect.width * 100) / 100,
				};
			};
			const actions = board.querySelector(".owner-reporting-range__actions");
			const actionStyle = actions ? getComputedStyle(actions) : null;
			const style = getComputedStyle(board);
			return {
				board: box(board),
				heading: box(board.querySelector(".owner-reporting-board__heading")),
				row: box(board.querySelector(".owner-reporting-board__row")),
				actions: box(actions),
				fields: Array.from(
					board.querySelectorAll(".owner-reporting-field"),
				).map((field) => box(field)),
				padding: `${style.paddingTop} ${style.paddingRight}`,
				actionDivider: actionStyle
					? `${actionStyle.borderTopWidth} ${actionStyle.paddingTop}`
					: null,
				// The old flow put the window hint in its own paragraph row. The
				// board still carries that sentence, but as the heading metadata.
				hintRows: board.querySelectorAll(".owner-reporting__hint").length,
				// The old flow stacked the CSV format and privacy sentences onto the
				// export board as a third supporting row; they now live as section
				// prose beneath the board pair.
				asideRows: board.querySelectorAll(".owner-reporting-board__aside")
					.length,
				noteRows: board.querySelectorAll(".owner-reporting__note").length,
			};
		};
		return {
			reporting: measure("[data-owner-reporting-range]"),
			csv: measure("[data-owner-reporting-export]"),
			csvNotes: (() => {
				const section = document.querySelector(".owner-reporting");
				const controls = document.querySelector(
					"[data-owner-reporting-controls]",
				);
				const prose = section?.querySelector<HTMLElement>(
					"[data-owner-reporting-csv-notes]",
				);
				if (!section || !controls || !prose) return null;
				return {
					inSection: section.contains(prose),
					outsideBoards: !controls.contains(prose),
					directlyAfterControls: prose.previousElementSibling === controls,
					visible: prose.getClientRects().length > 0,
					text: prose.textContent ?? "",
				};
			})(),
		};
	});

	const { csvNotes } = boards;
	if (!csvNotes) throw new Error("CSV section prose is missing");
	expect(csvNotes.inSection, "CSV prose sits inside the section").toBe(true);
	expect(csvNotes.outsideBoards, "CSV prose sits outside both boards").toBe(
		true,
	);
	expect(
		csvNotes.directlyAfterControls,
		"CSV prose directly follows the board pair",
	).toBe(true);
	expect(csvNotes.visible, "CSV prose is visible section text").toBe(true);

	for (const [name, board] of Object.entries(boards)) {
		if (name === "csvNotes") continue;
		const { heading, row, actions, fields } = board;
		if (!board.board || !heading || !row || !actions) {
			throw new Error(`${name} board is missing its heading, row, or actions`);
		}
		expect(board.hintRows, `${name} keeps no separate hint row`).toBe(0);
		expect(
			board.asideRows + board.noteRows,
			`${name} keeps no supporting prose row`,
		).toBe(0);
		expect(board.actionDivider, `${name} actions carry no divider`).toBe(
			"0px 0px",
		);
		expect(board.padding, `${name} board inset`).toBe(
			width <= 820 ? "16px 16px" : "16px 18px",
		);
		// The heading is the board's first row, one 12px gap above the controls.
		expect(
			Math.round(heading.top - board.board.top),
			`${name} heading starts inside the board inset`,
		).toBe(17);
		expect(
			Math.round(row.top - (heading.top + heading.height)),
			`${name} gap under the heading`,
		).toBe(12);
		expect(fields.length, `${name} keeps both date fields`).toBe(2);
		const [start, end] = fields;
		if (!start || !end) throw new Error(`${name} lost a date field`);
		expect(start.height, `${name} field row height`).toBe(63);
		expect(end.height, `${name} field row height`).toBe(63);
		expect(actions.height, `${name} action row height`).toBe(44);

		if (width === 1440) {
			// The approved desktop board: one heading line, one control row.
			expect(heading.height, `${name} heading line at 1440`).toBe(22);
			expect(row.height, `${name} control row at 1440`).toBe(63);
			expect(start.top, `${name} start field on the control row`).toBe(row.top);
			expect(end.top, `${name} end field on the control row`).toBe(row.top);
			expect(
				Math.round(actions.top + actions.height),
				`${name} action sits on the control row baseline`,
			).toBe(Math.round(row.top + row.height));
			expect(
				board.board.height,
				`${name} board is exactly the approved 131px at 1440`,
			).toBe(131);
		}

		if (width >= 721 && width <= 820) {
			// Stacked full-width boards are not stretched to a sibling, so the board
			// that carries no extra prose renders at exactly the approved 131px.
			expect(heading.height, `${name} heading line when stacked`).toBe(22);
			expect(row.height, `${name} control row when stacked`).toBe(63);
			if (name === "reporting") {
				expect(board.board.height, "reporting board height when stacked").toBe(
					131,
				);
			}
		}

		if (width >= 360 && width <= 720) {
			// Mobile keeps the two dates side by side and gives the action its own
			// full-width row, one 12px gap below them.
			expect(start.top, `${name} dates stay side by side at ${width}`).toBe(
				end.top,
			);
			expect(
				Math.round(actions.top - (start.top + start.height)),
				`${name} gap above the mobile action row`,
			).toBe(12);
			expect(
				Math.round(actions.width),
				`${name} mobile action row spans the board`,
			).toBe(Math.round(row.width));
		}
	}
}

async function expectControlLayout(page: Page, width: number) {
	const controls = page.locator("[data-owner-reporting-controls]");
	const reportingRange = controls.locator(
		":scope > [data-owner-reporting-range]",
	);
	const csvRange = controls.locator(":scope > [data-owner-reporting-export]");
	await expect(reportingRange).toHaveCount(1);
	await expect(csvRange).toHaveCount(1);
	const order = await controls
		.locator(":scope > *")
		.evaluateAll((children) =>
			children.map((child) =>
				child.hasAttribute("data-owner-reporting-range")
					? "reporting"
					: child.hasAttribute("data-owner-reporting-export")
						? "csv"
						: "other",
			),
		);
	expect(order).toEqual(["reporting", "csv"]);

	const reportingBox = await reportingRange.boundingBox();
	const csvBox = await csvRange.boundingBox();
	if (!reportingBox || !csvBox) throw new Error("Control boards have no boxes");
	if (width <= 820) {
		expect(csvBox.y).toBeGreaterThan(reportingBox.y + reportingBox.height);
		expect(Math.abs(csvBox.width - reportingBox.width)).toBeLessThanOrEqual(1);
	} else {
		expect(Math.abs(csvBox.y - reportingBox.y)).toBeLessThanOrEqual(1);
		expect(Math.abs(csvBox.width - reportingBox.width)).toBeLessThanOrEqual(1);
		expect(Math.abs(csvBox.height - reportingBox.height)).toBeLessThanOrEqual(
			1,
		);
		expect(Math.abs(csvBox.x - reportingBox.x) - reportingBox.width).toBe(16);
	}
	if (width === 1440) {
		expect(reportingBox.width).toBe(664);
		expect(csvBox.width).toBe(664);
	}
	const material = await reportingRange.evaluate((board) => {
		const style = getComputedStyle(board);
		const nestedFieldset = board.parentElement?.querySelector<HTMLElement>(
			"[data-owner-reporting-export] fieldset",
		);
		return {
			backdropFilter: style.backdropFilter,
			borderTopWidth: style.borderTopWidth,
			nestedBackground: nestedFieldset
				? getComputedStyle(nestedFieldset).backgroundColor
				: null,
			nestedBorderTopWidth: nestedFieldset
				? getComputedStyle(nestedFieldset).borderTopWidth
				: null,
		};
	});
	expect(material.backdropFilter).toBe(
		width <= 820 ? "blur(18px) saturate(1.12)" : "blur(22px) saturate(1.14)",
	);
	expect(material.borderTopWidth).toBe("1px");
	expect(material.nestedBorderTopWidth).toBe("0px");
	expect(material.nestedBackground).toBe("rgba(0, 0, 0, 0)");
}

async function expectHeadingLayout(
	page: Page,
	locale: "ar" | "en",
	width: number,
) {
	const heading = page.locator(".operations-page-heading--analytics");
	const title = heading.locator("h1");
	const tablist = heading.getByRole("tablist");
	const [headingBox, titleBox, tabsBox] = await Promise.all([
		heading.boundingBox(),
		title.boundingBox(),
		tablist.boundingBox(),
	]);
	if (!headingBox || !titleBox || !tabsBox) {
		throw new Error("Analytics heading and tabs require layout boxes");
	}
	expect(tabsBox.height).toBe(44);
	if (width <= 720) {
		expect(Math.abs(tabsBox.x - headingBox.x)).toBeLessThanOrEqual(1);
		expect(Math.abs(tabsBox.width - headingBox.width)).toBeLessThanOrEqual(1);
		expect(tabsBox.y).toBeGreaterThan(titleBox.y + titleBox.height);
	} else {
		expect(
			Math.abs(tabsBox.y + tabsBox.height - headingBox.y - headingBox.height),
		).toBeLessThanOrEqual(1);
		if (locale === "ar") expect(titleBox.x).toBeGreaterThan(tabsBox.x);
		else expect(titleBox.x).toBeLessThan(tabsBox.x);
	}
	const typography = await title.evaluate((element) => {
		const style = getComputedStyle(element);
		return { family: style.fontFamily, weight: Number(style.fontWeight) };
	});
	expect(typography.family).toMatch(/Cairo/u);
	expect(typography.weight).toBeGreaterThanOrEqual(400);
	expect(typography.weight).toBeLessThanOrEqual(700);

	// The copy wrapper nests the canonical eyebrow `<p>` and description
	// `<span>`; the canonical direct-child selectors no longer reach them, so
	// assert the restored computed treatment here rather than relying on
	// staff.css/owner-shell.css.
	const copyTreatment = await heading
		.locator(".operations-page-heading__copy")
		.evaluate((copy) => {
			const eyebrow = copy.querySelector("p");
			const description = copy.querySelector("span");
			if (!eyebrow || !description) {
				throw new Error("Heading copy requires an eyebrow and a description");
			}
			const eyebrowStyle = getComputedStyle(eyebrow);
			const descriptionStyle = getComputedStyle(description);
			const rawLetterSpacing = eyebrowStyle.letterSpacing;
			const letterSpacing =
				rawLetterSpacing === "normal" ? 0 : Number.parseFloat(rawLetterSpacing);
			const chProbe = document.createElement("span");
			chProbe.style.cssText =
				"position:absolute;visibility:hidden;pointer-events:none;";
			chProbe.style.font = descriptionStyle.font;
			chProbe.style.width = "64ch";
			description.appendChild(chProbe);
			const canonicalMaxInlineSize = Number.parseFloat(
				getComputedStyle(chProbe).width,
			);
			chProbe.remove();
			return {
				eyebrow: {
					margin: eyebrowStyle.margin,
					fontSize: eyebrowStyle.fontSize,
					color: eyebrowStyle.color,
					letterSpacing,
					textTransform: eyebrowStyle.textTransform,
				},
				description: {
					display: descriptionStyle.display,
					maxInlineSize: Number.parseFloat(descriptionStyle.maxInlineSize),
					canonicalMaxInlineSize,
					color: descriptionStyle.color,
				},
			};
		});
	expect(copyTreatment.eyebrow.margin).toBe("0px");
	expect(copyTreatment.eyebrow.fontSize).toBe("12px");
	expect(copyTreatment.eyebrow.color).toBe("rgb(255, 130, 149)");
	expect(copyTreatment.eyebrow.textTransform).toBe(
		locale === "ar" ? "none" : "uppercase",
	);
	expect(copyTreatment.eyebrow.letterSpacing).toBeCloseTo(
		locale === "ar" ? 0 : 0.48,
		1,
	);
	expect(copyTreatment.description.display).toBe("block");
	expect(copyTreatment.description.maxInlineSize).toBeCloseTo(
		copyTreatment.description.canonicalMaxInlineSize,
		0,
	);
	expect(copyTreatment.description.color).toBe("rgb(201, 195, 196)");
}

test("the lazy bilingual tabs keep exact prerequisite counts and stable panel shells", async ({
	page,
}) => {
	const calls = await mockOwnerRoute(page);
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/admin");
	const tablist = page.getByRole("tablist", { name: "عرض التحليلات" });
	const dailyTab = page.locator("#owner-analytics-daily-tab");
	const historyTab = page.locator("#owner-analytics-history-tab");
	const dailyPanel = page.locator("#owner-analytics-daily-panel");
	const historyPanel = page.locator("#owner-analytics-history-panel");
	const reporting = page.locator(".owner-reporting");

	await expect(tablist).toBeVisible();
	await expect(tablist.getByRole("tab")).toHaveText(["اليومي", "السجل"]);
	await expect(dailyTab).toHaveAttribute(
		"aria-controls",
		"owner-analytics-daily-panel",
	);
	await expect(historyTab).toHaveAttribute(
		"aria-controls",
		"owner-analytics-history-panel",
	);
	await expect(dailyPanel).toHaveAttribute(
		"aria-labelledby",
		"owner-analytics-daily-tab",
	);
	await expect(historyPanel).toHaveAttribute(
		"aria-labelledby",
		"owner-analytics-history-tab",
	);
	await expect(dailyTab).toHaveAttribute("aria-selected", "true");
	await expect(dailyTab).toHaveAttribute("tabindex", "0");
	await expect(historyTab).toHaveAttribute("tabindex", "-1");
	await expect(dailyPanel).toBeVisible();
	await expect(historyPanel).toBeHidden();
	await expect(historyPanel).toBeEmpty();
	await expect(reporting).toHaveCount(0);
	await expect.poll(() => calls.daily).toBe(1);
	await expect.poll(() => calls.timeContext).toBe(1);
	expect(calls.heatmap).toBe(0);
	expect(calls.weekOverWeek).toBe(0);
	expect(calls.csv).toBe(0);
	await expect(page.locator("[data-owner-chart]")).toBeVisible();
	await expect(page.locator(".owner-audit")).toBeVisible();
	await expect(page.locator(".owner-health")).toBeVisible();

	const tablistBox = await tablist.boundingBox();
	const dailyTabBox = await dailyTab.boundingBox();
	const historyTabBox = await historyTab.boundingBox();
	expect(tablistBox).toMatchObject({ width: 160, height: 44 });
	expect(dailyTabBox).toMatchObject({ width: 80, height: 44 });
	expect(historyTabBox).toMatchObject({ width: 80, height: 44 });
	await expectHeadingLayout(page, "ar", 1440);

	await historyTab.focus();
	await page.keyboard.press("ArrowLeft");
	await expect(dailyTab).toBeFocused();
	await expect(dailyTab).toHaveAttribute("aria-selected", "true");
	await page.keyboard.press("End");
	await expect(historyTab).toBeFocused();
	await expect(historyTab).toHaveAttribute("aria-selected", "true");
	await expect(historyPanel).toBeVisible();
	await expect(dailyPanel).toBeHidden();
	await expect(reporting).toBeVisible();
	await expect.poll(() => calls.heatmap).toBe(1);
	await expect.poll(() => calls.weekOverWeek).toBe(1);
	expect(calls.daily).toBe(1);
	expect(calls.timeContext).toBe(1);

	for (const locale of ["ar", "en"] as const) {
		await setLocale(page, locale);
		await expect(
			page.getByRole("tablist", {
				name: locale === "ar" ? "عرض التحليلات" : "Analytics view",
			}),
		).toBeVisible();
		await expect(page.getByRole("tablist").getByRole("tab")).toHaveText(
			locale === "ar" ? ["اليومي", "السجل"] : ["Daily", "History"],
		);
		const labels =
			locale === "ar"
				? ["مفتوحة وفارغة", "لا توجد بيانات", "مغلقة"]
				: ["Open and empty", "No data", "Closed"];
		for (const label of labels) {
			await expect(reporting.locator(".owner-reporting-cell")).toHaveCount(168);
			expect(
				await reporting
					.locator(`.owner-reporting-cell[aria-label*="${label}"]`)
					.count(),
			).toBeGreaterThan(0);
		}
		await expect(
			reporting.locator(
				"[data-owner-reporting-comparison='insufficient_history']",
			),
		).toBeVisible();
		await expect(
			reporting.locator("[data-owner-reporting-reading]"),
		).toHaveAttribute("aria-live", "polite");
		await captureReview(page, `phase10-reporting-${locale}-1440x900.png`);
	}

	await dailyTab.click();
	await expect(dailyPanel).toBeVisible();
	await expect(historyPanel).toBeHidden();
	await historyTab.click();
	await expect(reporting).toBeVisible();
	expect(calls.daily).toBe(1);
	expect(calls.timeContext).toBe(1);
	expect(calls.heatmap).toBe(1);
	expect(calls.weekOverWeek).toBe(1);
	expect(calls.csv).toBe(0);
});

test("History exposes prerequisite pending, error, and one deliberate retry chain", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	let releaseDaily!: () => void;
	const calls = await mockOwnerRoute(page, {
		dailyHold: new Promise<void>((resolve) => {
			releaseDaily = resolve;
		}),
		timeContextFailures: 1,
	});
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/admin");
	await page.locator("#owner-analytics-history-tab").click();
	const reporting = page.locator(".owner-reporting");
	const loading = reporting.locator("[data-owner-reporting-state='loading']");
	// The daily response is still withheld, so the prerequisite pending state is
	// held open until the release below instead of racing a mock delay.
	await expect(loading).toBeVisible();
	await expect(loading).toHaveAttribute("role", "status");
	expect(calls.heatmap).toBe(0);
	expect(calls.weekOverWeek).toBe(0);
	expect(calls.csv).toBe(0);

	releaseDaily();
	const error = reporting.locator("[data-owner-reporting-state='error']");
	await expect(error).toBeVisible();
	await expect(error).toHaveAttribute("role", "alert");
	await expect.poll(() => calls.daily).toBe(1);
	await expect.poll(() => calls.timeContext).toBe(1);
	await page.waitForTimeout(150);
	expect(calls.daily).toBe(1);
	expect(calls.timeContext).toBe(1);
	expect(calls.heatmap).toBe(0);
	expect(calls.weekOverWeek).toBe(0);

	await error.getByRole("button", { name: "Try again" }).click();
	await expect(reporting.locator("[data-owner-reporting-grid]")).toBeVisible();
	await expect.poll(() => calls.daily).toBe(2);
	await expect.poll(() => calls.timeContext).toBe(2);
	await expect.poll(() => calls.heatmap).toBe(1);
	await expect.poll(() => calls.weekOverWeek).toBe(1);
	expect(calls.csv).toBe(0);
});

test("loading, retryable error, insufficient history, and semantic-table parity are explicit", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await mockOwnerRoute(page, { heatmapDelayMs: 450 });
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/admin");
	await activateHistory(page);
	const reporting = page.locator(".owner-reporting");
	const controls = reporting.locator("[data-owner-reporting-controls]");
	// Daily remains mounted to preserve its query and UI state, but its accepted
	// siblings are correctly hidden while the History panel is selected.
	await expect(page.locator("[data-owner-health-state='error']")).toBeHidden();
	const loading = reporting.locator("[data-owner-reporting-state='loading']");
	await expect(loading).toBeVisible();
	await expect(loading).toHaveAttribute("role", "status");
	expect(
		await controls.evaluate((element) =>
			Boolean(
				element.compareDocumentPosition(
					element.parentElement?.querySelector(
						'[data-owner-reporting-state="loading"]',
					) as Node,
				) & Node.DOCUMENT_POSITION_FOLLOWING,
			),
		),
	).toBe(true);
	await expect(reporting.locator("[data-owner-reporting-grid]")).toBeVisible();

	await page.unroute("**/rpc/admin/analytics/heatmap");
	await page.route("**/rpc/admin/analytics/heatmap", (route) =>
		route.fulfill({ status: 503, json: rpcError(503) }),
	);
	const reportRange = reporting.locator("[data-owner-reporting-range]");
	await reportRange.getByLabel("Last business day").fill("2026-08-13");
	await reportRange.locator("button[type='submit']").click();
	const error = reporting.locator("[data-owner-reporting-state='error']");
	await expect(error).toBeVisible();
	await expect(error).toHaveAttribute("role", "alert");
	expect(
		await controls.evaluate((element) =>
			Boolean(
				element.compareDocumentPosition(
					element.parentElement?.querySelector(
						'[data-owner-reporting-state="error"]',
					) as Node,
				) & Node.DOCUMENT_POSITION_FOLLOWING,
			),
		),
	).toBe(true);

	await page.unroute("**/rpc/admin/analytics/heatmap");
	await page.route("**/rpc/admin/analytics/heatmap", (route) =>
		route.fulfill({ status: 200, json: { json: heatmap() } }),
	);
	await error.getByRole("button", { name: "Try again" }).click();
	await expect(reporting.locator("[data-owner-reporting-grid]")).toBeVisible();
	const selectedCell = reporting.locator(".owner-reporting-cell").nth(25);
	await selectedCell.click();
	const selectedLabel = await selectedCell.getAttribute("aria-label");
	await page.locator("#owner-analytics-daily-tab").click();
	await page.locator("#owner-analytics-history-tab").click();
	await expect(reportRange.getByLabel("Last business day")).toHaveValue(
		"2026-08-13",
	);
	await expect(
		reporting.locator(".owner-reporting-cell[data-active]"),
	).toHaveAttribute("aria-label", selectedLabel ?? "missing");

	await reporting.locator(".owner-reporting-disclosure summary").click();
	const table = reporting.locator("[data-owner-reporting-table]");
	await expect(table.locator("tbody tr")).toHaveCount(168);
	await expect(table.locator("tr[data-zero]")).toHaveCount(1);
	await expect(table.locator("tr[data-state='missing']")).toHaveCount(1);
	await expect(table.locator("tr[data-state='closed']")).toHaveCount(1);
	await captureReview(page, "phase10-reporting-states-en-390x844.png");
});

test("CSV export visibly starts, cancels without a file, and reports a transport failure", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	const calls = await mockOwnerRoute(page, { csvMode: "pending" });
	await page.setViewportSize({ width: 768, height: 1024 });
	await page.goto("/admin");
	await activateHistory(page);
	const reporting = page.locator(".owner-reporting");
	const exportBlock = reporting.locator("[data-owner-reporting-export]");
	await expect(exportBlock).toBeVisible();
	await exportBlock.getByLabel("First business day").fill("2026-08-10");
	await exportBlock.locator("[data-owner-reporting-export-start]").click();
	await expect(
		exportBlock.locator("[data-owner-reporting-export-abort]"),
	).toBeVisible();
	await expect(
		exportBlock.locator("[data-owner-reporting-state='loading']"),
	).toBeVisible();
	await page.locator("#owner-analytics-daily-tab").click();
	await expect(page.locator("#owner-analytics-history-panel")).toBeHidden();
	await page.locator("#owner-analytics-history-tab").click();
	await expect(
		exportBlock.locator("[data-owner-reporting-export-abort]"),
	).toBeVisible();
	await expect(exportBlock.getByLabel("First business day")).toHaveValue(
		"2026-08-10",
	);
	expect(calls.csv).toBe(1);
	await exportBlock.locator("[data-owner-reporting-export-abort]").click();
	await expect(
		exportBlock.locator("[data-owner-reporting-state='stopped']"),
	).toBeVisible();
	expect(
		await exportBlock.locator("[data-owner-reporting-download]").count(),
	).toBe(0);

	await page.unroute("**/rpc/admin/analytics/csv");
	await page.route("**/rpc/admin/analytics/csv", (route) =>
		route.fulfill({ status: 503, json: rpcError(503) }),
	);
	await exportBlock.getByRole("button", { name: "Start over" }).click();
	await exportBlock.locator("[data-owner-reporting-export-start]").click();
	await expect(
		exportBlock.locator("[data-owner-reporting-state='error']"),
	).toBeVisible();
	await expect(
		exportBlock.locator("[data-owner-reporting-download]"),
	).toHaveCount(0);

	await page.unroute("**/rpc/admin/analytics/csv");
	await page.route("**/rpc/admin/analytics/csv", (route) =>
		route.fulfill({
			status: 200,
			headers: { "content-type": "text/event-stream" },
			body: [
				'event: message\ndata: {"json":"﻿business_day,count\\r\\n"}\n\n',
				'event: message\ndata: {"json":"2026-08-14,12\\r\\n"}\n\n',
				"event: done\ndata: {}\n\n",
			].join(""),
		}),
	);
	await exportBlock.getByRole("button", { name: "Start over" }).click();
	await exportBlock.locator("[data-owner-reporting-export-start]").click();
	const download = exportBlock.locator("[data-owner-reporting-download]");
	await expect(download).toBeVisible();
	const preparedHref = await download.getAttribute("href");
	expect(preparedHref).toMatch(/^blob:/u);
	await page.locator("#owner-analytics-daily-tab").click();
	await page.locator("#owner-analytics-history-tab").click();
	await expect(download).toHaveAttribute("href", preparedHref ?? "missing");
	await captureReview(page, "phase10-reporting-export-en-768x1024.png");
});

test("reflow, focus, keyboard, live names, reduced motion, and automated accessibility hold", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await mockOwnerRoute(page);
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto("/admin");
	const dailyTab = page.locator("#owner-analytics-daily-tab");
	const historyTab = page.locator("#owner-analytics-history-tab");
	await dailyTab.focus();
	await page.keyboard.press("ArrowRight");
	await expect(historyTab).toBeFocused();
	await expect(historyTab).toHaveAttribute("aria-selected", "true");
	await expect(historyTab).toHaveAttribute("tabindex", "0");
	const focus = await historyTab.evaluate((element) => {
		const style = getComputedStyle(element);
		return style.outlineStyle !== "none" || style.boxShadow !== "none";
	});
	expect(focus).toBe(true);
	await page.keyboard.press("Tab");
	expect(
		await page
			.locator("#owner-analytics-history-panel")
			.evaluate((panel) => panel.contains(document.activeElement)),
	).toBe(true);
	const reporting = page.locator(".owner-reporting");
	const disclosure = reporting.locator(".owner-reporting-disclosure summary");
	await disclosure.click();
	for (const locale of ["en", "ar"] as const) {
		await setLocale(page, locale);
		for (const width of [320, 360, 390, 721, 768, 820, 1024, 1200, 1440]) {
			await page.setViewportSize({ width, height: 900 });
			await expect(
				reporting.locator("[data-owner-reporting-grid]"),
			).toBeVisible();
			await expectControlLayout(page, width);
			await expectBoardDensity(page, width);
			await expectHeadingLayout(page, locale, width);
			// The relocated CSV prose is ordinary in-flow section content, so the
			// section-level overflow check no longer needs its recorded bypass.
			await expectNoOverflow(page);
			const containedAction = await reporting
				.locator("[data-owner-reporting-export-start]")
				.boundingBox();
			if (!containedAction)
				throw new Error("Export action requires a layout box");
			expect(containedAction.x).toBeGreaterThanOrEqual(0);
			expect(containedAction.x + containedAction.width).toBeLessThanOrEqual(
				width,
			);
			const overflowingOrdinaryContent = await reporting
				.locator(
					".owner-reporting-disclosure summary, .owner-reporting__note, .owner-reporting__footnote",
				)
				.evaluateAll((elements) =>
					elements.flatMap((element) => {
						const box = element.getBoundingClientRect();
						return box.left >= 0 && box.right <= window.innerWidth
							? []
							: [
									{
										text: element.textContent,
										left: box.left,
										right: box.right,
									},
								];
					}),
				);
			expect(overflowingOrdinaryContent).toEqual([]);
		}
		if (locale === "ar") {
			await historyTab.focus();
			await page.keyboard.press("ArrowRight");
			await expect(dailyTab).toBeFocused();
			await page.keyboard.press("ArrowLeft");
			await expect(historyTab).toBeFocused();
		}
	}

	await page.setViewportSize({ width: 768, height: 1024 });
	const cells = reporting.locator(".owner-reporting-cell");
	async function expectFocusedCell(index: number) {
		const activeCell = cells.nth(index);
		await expect(
			reporting.locator(".owner-reporting-cell[tabindex='0']"),
		).toHaveCount(1);
		await expect(activeCell).toHaveAttribute("tabindex", "0");
		await expect(activeCell).toBeFocused();
	}

	await setLocale(page, "en");
	await cells.nth(9).focus();
	await expectFocusedCell(9);
	await cells.nth(9).press("ArrowRight");
	await expectFocusedCell(10);
	await cells.nth(10).press("ArrowDown");
	await expectFocusedCell(34);
	await cells.nth(34).press("Home");
	await expectFocusedCell(24);
	await cells.nth(24).press("ArrowLeft");
	await expectFocusedCell(24);
	await cells.nth(24).press("ArrowUp");
	await expectFocusedCell(0);
	await cells.nth(0).press("ArrowUp");
	await expectFocusedCell(0);
	await cells.nth(0).press("End");
	await expectFocusedCell(23);
	await cells.nth(23).press("ArrowRight");
	await expectFocusedCell(23);

	await page.locator("#owner-analytics-daily-tab").click();
	await page.locator("#owner-analytics-history-tab").click();
	await expect(cells.nth(23)).toHaveAttribute("tabindex", "0");
	await cells.nth(23).focus();
	await cells.nth(23).press("ArrowLeft");
	await expectFocusedCell(22);

	await setLocale(page, "ar");
	await cells.nth(9).focus();
	await cells.nth(9).press("ArrowRight");
	await expectFocusedCell(8);
	await cells.nth(8).press("ArrowLeft");
	await expectFocusedCell(9);
	await cells.nth(9).press("ArrowDown");
	await expectFocusedCell(33);
	await expect(
		reporting.locator("[data-owner-reporting-reading]"),
	).toContainText(/Average occupancy|متوسط الإشغال/u);
	const cellFocus = await cells.nth(33).evaluate((element) => {
		const style = getComputedStyle(element);
		return style.outlineStyle !== "none" || style.boxShadow !== "none";
	});
	expect(cellFocus).toBe(true);
	expect(
		await page.evaluate(
			() => matchMedia("(prefers-reduced-motion: reduce)").matches,
		),
	).toBe(true);

	await page.evaluate(() => {
		document.documentElement.style.zoom = "2";
	});
	await expectNoOverflow(page);
	await page.evaluate(() => {
		document.documentElement.style.zoom = "1";
	});

	const results = await new AxeBuilder({ page })
		.include(".owner-analytics-mode")
		.analyze();
	expect(seriousViolations(results)).toEqual([]);
	await captureReview(page, "phase10-reporting-a11y-reflow-ar-768x1024.png");
});
