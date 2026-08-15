// @vitest-environment happy-dom

import type { AuditEntryView } from "@fitway/api/audit/list";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { I18nProvider } from "@/i18n/provider";

import { ownerAuditMessages } from "./messages";
import {
	actorLabel,
	OwnerAuditEmpty,
	OwnerAuditError,
	OwnerAuditLoading,
	OwnerAuditTable,
} from "./owner-audit-view";

const ownerPrincipal = "00000000-0000-4000-8000-0000000000a1";
const staffPrincipal = "00000000-0000-4000-8000-0000000000b2";

const entries: AuditEntryView[] = [
	{
		id: 9,
		action: "correction_absolute",
		actor: {
			principalId: ownerPrincipal,
			kind: "owner",
			role: "owner",
			displayName: "Real owner",
		},
		priorValue: 41,
		effectiveValue: 12,
		requestedDelta: null,
		requestedValue: 12,
		reason: "Recount after the door jam",
		createdAtUtc: "2026-08-10T21:30:00.000Z",
	},
	{
		id: 8,
		action: "correction_delta",
		actor: {
			principalId: staffPrincipal,
			kind: "shared_staff",
			role: "staff",
			displayName: "Shared front desk",
		},
		priorValue: 2,
		effectiveValue: 0,
		requestedDelta: -9,
		requestedValue: null,
		reason: null,
		createdAtUtc: "2026-08-10T05:15:00.000Z",
	},
	{
		id: 7,
		action: "reset",
		actor: {
			principalId: null,
			kind: "system",
			role: null,
			displayName: null,
		},
		priorValue: null,
		effectiveValue: 0,
		requestedDelta: null,
		requestedValue: 0,
		reason: "Scheduled post-close reset",
		createdAtUtc: "2026-08-09T21:05:00.000Z",
	},
];

let root: Root | undefined;
let container: HTMLDivElement;

async function render(node: React.ReactNode, locale: "ar" | "en") {
	document.documentElement.lang = locale;
	await act(async () => {
		root?.render(<I18nProvider>{node}</I18nProvider>);
	});
}

function rows() {
	return [...container.querySelectorAll("tbody tr")].map((row) =>
		[...row.querySelectorAll("td")].map((cell) => cell.textContent ?? ""),
	);
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

describe("owner audit states", () => {
	it("announces loading politely with assistive text", async () => {
		await render(<OwnerAuditLoading />, "en");
		const status = container.querySelector(
			'[data-owner-audit-state="loading"]',
		);
		expect(status?.getAttribute("role")).toBe("status");
		expect(status?.getAttribute("aria-live")).toBe("polite");
		expect(status?.textContent).toContain(ownerAuditMessages.en.loading);
	});

	it("raises an error alert that offers a retry and substitutes no record", async () => {
		let retried = 0;
		await render(<OwnerAuditError onRetry={() => (retried += 1)} />, "en");
		const alert = container.querySelector('[data-owner-audit-state="error"]');
		expect(alert?.getAttribute("role")).toBe("alert");
		expect(container.querySelector("table")).toBeNull();
		await act(async () => {
			container
				.querySelector("button")
				?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});
		expect(retried).toBe(1);
	});

	it("explains an empty result without pretending a record exists", async () => {
		await render(<OwnerAuditEmpty />, "en");
		expect(
			container.querySelector('[data-owner-audit-state="empty"]')?.textContent,
		).toContain(ownerAuditMessages.en.emptyTitle);
		expect(container.querySelector("table")).toBeNull();
	});
});

describe("owner audit table", () => {
	it("renders every persisted instant in the configured gym timezone", async () => {
		await render(
			<OwnerAuditTable entries={entries} timeZone="Asia/Riyadh" />,
			"en",
		);
		const [first] = rows();
		// 21:30Z is the next gym day at +03:00, and the row must say so.
		expect(first?.[0]).toContain("Aug 11");
		expect(first?.[0]).toContain("12:30 AM");
		expect(first?.[0]).not.toMatch(/[٠-٩]/u);
	});

	it("does not follow the device timezone", async () => {
		await render(<OwnerAuditTable entries={entries} timeZone="UTC" />, "en");
		expect(rows()[0]?.[0]).toContain("Aug 10");
		expect(rows()[0]?.[0]).toContain("9:30 PM");
	});

	it("keeps Western digits and mirrors only the change arrow in Arabic", async () => {
		await render(
			<OwnerAuditTable entries={entries} timeZone="Asia/Riyadh" />,
			"ar",
		);
		const table = container.querySelector("table");
		expect(table?.textContent).not.toMatch(/[٠-٩]/u);
		expect(table?.textContent).toContain("←");
		expect(table?.textContent).not.toContain("→");
	});

	it("shows a missing prior and a missing reason as states, never as zero or blank", async () => {
		await render(
			<OwnerAuditTable entries={entries} timeZone="Asia/Riyadh" />,
			"en",
		);
		const system = rows()[2];
		expect(system?.[3]).toContain(ownerAuditMessages.en.notRecorded);
		expect(system?.[3]).not.toMatch(/\b0\s*→\s*0\b/u);
		const staff = rows()[1];
		expect(staff?.[5]).toBe(ownerAuditMessages.en.noReason);
	});

	it("shows the floored delta result alongside the amount actually requested", async () => {
		await render(
			<OwnerAuditTable entries={entries} timeZone="Asia/Riyadh" />,
			"en",
		);
		const staff = rows()[1];
		expect(staff?.[3]).toContain("2");
		expect(staff?.[3]).toContain("0");
		expect(staff?.[4]).toContain("-9");
		expect(staff?.[4]).toContain(ownerAuditMessages.en.flooredNote);
	});

	it("labels persisted principals and the automatic issuer without inventing identity", async () => {
		await render(
			<OwnerAuditTable entries={entries} timeZone="Asia/Riyadh" />,
			"en",
		);
		const rendered = rows();
		expect(rendered[0]?.[1]).toContain("Real owner");
		expect(rendered[1]?.[1]).toContain("Shared front desk");
		expect(rendered[2]?.[1]).toBe(ownerAuditMessages.en.actorSystem);
		expect(container.querySelector("table")?.textContent).not.toMatch(/@/u);
	});

	it("labels a system actor from the catalog in both locales", () => {
		for (const locale of ["ar", "en"] as const) {
			const messages = ownerAuditMessages[locale];
			expect(
				actorLabel(
					{ principalId: null, kind: "system", role: null, displayName: null },
					messages,
				),
			).toBe(messages.actorSystem);
			expect(
				actorLabel(
					{
						principalId: staffPrincipal,
						kind: "shared_staff",
						role: "staff",
						displayName: "Shared front desk",
					},
					messages,
				),
			).toContain("Shared front desk");
		}
	});

	it("presents the dense table as a labeled keyboard-reachable scroll region", async () => {
		await render(
			<OwnerAuditTable entries={entries} timeZone="Asia/Riyadh" />,
			"en",
		);
		const region = container.querySelector(".owner-audit-region");
		expect(region?.getAttribute("tabindex")).toBe("0");
		expect(region?.getAttribute("aria-label")).toBe(
			ownerAuditMessages.en.tableRegion,
		);
		expect(container.querySelectorAll("thead th[scope='col']")).toHaveLength(6);
	});
});
