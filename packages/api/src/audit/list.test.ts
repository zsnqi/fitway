import { describe, expect, it } from "vitest";

import {
	AUDIT_PAGE_LIMIT_DEFAULT,
	AUDIT_PAGE_LIMIT_MAX,
	type AuditEntryView,
	auditCursorSchema,
	auditListFilterSchema,
	auditListInputSchema,
	auditListOutputSchema,
	type PersistedAuditRow,
	paginateAuditEntries,
	toAuditEntry,
} from "./list";

const ownerPrincipal = "00000000-0000-4000-8000-0000000000a1";
const staffPrincipal = "00000000-0000-4000-8000-0000000000b2";

function persisted(
	overrides: Partial<PersistedAuditRow> = {},
): PersistedAuditRow {
	return {
		id: 7,
		eventClass: "command",
		action: "correction_absolute",
		actorPrincipalId: ownerPrincipal,
		actorPrincipalKind: "owner",
		actorRole: "owner",
		actorDisplayName: "Nadia (owner)",
		targetPrincipalId: null,
		targetDisplayName: null,
		priorValue: 41,
		requestedDelta: null,
		requestedValue: 12,
		effectiveValue: 12,
		priorActive: null,
		newActive: null,
		priorCredentialVersion: null,
		newCredentialVersion: null,
		settingsVersion: null,
		reason: "Recount after the door jam",
		createdAt: new Date("2026-08-14T09:15:30.250Z"),
		...overrides,
	};
}

describe("audit transport input", () => {
	it("bounds the page, defaults the limit, and rejects unknown keys", () => {
		expect(auditListInputSchema.parse({})).toEqual({
			limit: AUDIT_PAGE_LIMIT_DEFAULT,
		});
		expect(
			auditListInputSchema.parse({ limit: AUDIT_PAGE_LIMIT_MAX }).limit,
		).toBe(AUDIT_PAGE_LIMIT_MAX);
		expect(
			auditListInputSchema.safeParse({ limit: AUDIT_PAGE_LIMIT_MAX + 1 })
				.success,
		).toBe(false);
		expect(auditListInputSchema.safeParse({ limit: 0 }).success).toBe(false);
		expect(auditListInputSchema.safeParse({ limit: 2.5 }).success).toBe(false);
		expect(auditListInputSchema.safeParse({ page: 2 }).success).toBe(false);
		expect(
			auditListInputSchema.safeParse({ filters: { unknown: 1 } }).success,
		).toBe(false);
	});

	it("accepts only a real ISO UTC instant plus safe identity in a cursor", () => {
		expect(
			auditCursorSchema.parse({
				createdAtUtc: "2026-08-14T09:15:30.250Z",
				id: 91,
			}),
		).toEqual({ createdAtUtc: "2026-08-14T09:15:30.250Z", id: 91 });
		for (const createdAtUtc of [
			"2026-08-14T09:15:30Z",
			"2026-08-14T09:15:30.250+03:00",
			"2026-02-30T09:15:30.250Z",
			"2026-08-14 09:15:30.250Z",
		]) {
			expect(
				auditCursorSchema.safeParse({ createdAtUtc, id: 91 }).success,
			).toBe(false);
		}
		expect(
			auditCursorSchema.safeParse({
				createdAtUtc: "2026-08-14T09:15:30.250Z",
				id: 0,
			}).success,
		).toBe(false);
	});
});

describe("the six audit filters", () => {
	it("accepts each filter and keeps missing distinct from zero and from absent", () => {
		const parsed = auditListFilterSchema.parse({
			actorPrincipalId: staffPrincipal,
			actorKind: "shared_staff",
			actions: ["correction_delta", "reset"],
			priorValue: 0,
			effectiveValue: 4,
			occurredFrom: "2026-08-01T00:00:00.000Z",
			occurredTo: "2026-08-31T23:59:59.999Z",
			reason: "door",
		});
		expect(parsed.priorValue).toBe(0);

		const missingPrior = auditListFilterSchema.parse({ priorValue: null });
		expect(missingPrior.priorValue).toBeNull();
		expect("priorValue" in missingPrior).toBe(true);

		const noPriorFilter = auditListFilterSchema.parse({});
		expect(noPriorFilter.priorValue).toBeUndefined();
		expect(auditListFilterSchema.parse({ reason: null }).reason).toBeNull();
	});

	it("rejects malformed filters rather than degrading them", () => {
		expect(auditListFilterSchema.safeParse({ actions: [] }).success).toBe(
			false,
		);
		expect(
			auditListFilterSchema.safeParse({ actions: ["reset", "reset"] }).success,
		).toBe(false);
		expect(
			auditListFilterSchema.safeParse({ actions: ["settings_change"] }).success,
		).toBe(false);
		expect(auditListFilterSchema.safeParse({ priorValue: -1 }).success).toBe(
			false,
		);
		expect(
			auditListFilterSchema.parse({ effectiveValue: null }).effectiveValue,
		).toBeNull();
		expect(
			auditListFilterSchema.safeParse({ reason: "  padded" }).success,
		).toBe(false);
		expect(
			auditListFilterSchema.safeParse({ reason: "x".repeat(241) }).success,
		).toBe(false);
		expect(
			auditListFilterSchema.safeParse({
				occurredFrom: "2026-08-31T00:00:00.000Z",
				occurredTo: "2026-08-01T00:00:00.000Z",
			}).success,
		).toBe(false);
		expect(
			auditListFilterSchema.safeParse({
				actorKind: "system",
				actorPrincipalId: ownerPrincipal,
			}).success,
		).toBe(false);
	});

	it("keeps the action filter additive-shaped for a later action set", () => {
		const single = auditListFilterSchema.parse({ actions: ["reset"] });
		expect(single.actions).toEqual(["reset"]);
		expect(
			auditListFilterSchema.parse({
				actions: ["correction_delta", "correction_absolute", "reset"],
			}).actions,
		).toHaveLength(3);
	});
});

describe("persisted row to transport entry", () => {
	it("maps actor attribution from the persisted principal only", () => {
		const entry = toAuditEntry(persisted());
		expect(entry.actor).toEqual({
			principalId: ownerPrincipal,
			kind: "owner",
			role: "owner",
			displayName: "Nadia (owner)",
		});
		expect(Object.keys(entry.actor).sort()).toEqual(
			["displayName", "kind", "principalId", "role"].sort(),
		);
		expect(JSON.stringify(entry)).not.toMatch(/@|pin|hash|session|token/i);
	});

	it("labels the one shared front-desk principal without inventing an identity", () => {
		const entry = toAuditEntry(
			persisted({
				actorPrincipalId: staffPrincipal,
				actorPrincipalKind: "shared_staff",
				actorRole: "staff",
				actorDisplayName: "Front desk",
			}),
		);
		expect(entry.actor.displayName).toBe("Front desk");
		expect(entry.actor.principalId).toBe(staffPrincipal);
	});

	it("emits a system actor with no principal and no borrowed label", () => {
		const entry = toAuditEntry(
			persisted({
				action: "reset",
				actorPrincipalId: null,
				actorPrincipalKind: "system",
				actorRole: null,
				actorDisplayName: null,
				priorValue: 18,
				requestedDelta: null,
				requestedValue: 0,
				effectiveValue: 0,
				reason: "Scheduled post-close reset",
			}),
		);
		expect(entry.actor).toEqual({
			principalId: null,
			kind: "system",
			role: null,
			displayName: null,
		});
	});

	it("keeps a null prior null and emits the server instant as ISO UTC", () => {
		const entry = toAuditEntry(
			persisted({ priorValue: null, requestedValue: 0, effectiveValue: 0 }),
		);
		expect(entry.priorValue).toBeNull();
		expect(entry.priorValue).not.toBe(0);
		expect(entry.createdAtUtc).toBe("2026-08-14T09:15:30.250Z");
	});

	it("keeps an absent reason absent", () => {
		expect(toAuditEntry(persisted({ reason: null })).reason).toBeNull();
	});

	it("preserves the floored delta result and absolute parity", () => {
		const floored = toAuditEntry(
			persisted({
				action: "correction_delta",
				priorValue: 2,
				requestedDelta: -9,
				requestedValue: null,
				effectiveValue: 0,
			}),
		);
		expect(floored.requestedDelta).toBe(-9);
		expect(floored.effectiveValue).toBe(0);
		expect(floored.priorValue).toBe(2);

		const absolute = toAuditEntry(persisted());
		expect(absolute.requestedValue).toBe(absolute.effectiveValue);
	});

	it("refuses incoherent rows instead of reshaping them", () => {
		expect(() =>
			toAuditEntry(
				persisted({
					action: "correction_delta",
					priorValue: 5,
					requestedDelta: 2,
					requestedValue: null,
					effectiveValue: 9,
				}),
			),
		).toThrow(/floor/i);
		expect(() =>
			toAuditEntry(persisted({ requestedValue: 11, effectiveValue: 12 })),
		).toThrow(/parity/i);
		expect(() =>
			toAuditEntry(
				persisted({
					action: "reset",
					requestedValue: 0,
					effectiveValue: 3,
					requestedDelta: null,
				}),
			),
		).toThrow(/reset/i);
		expect(() =>
			toAuditEntry(
				persisted({ actorPrincipalKind: "system", actorRole: "owner" }),
			),
		).toThrow(/system actor/i);
		expect(() => toAuditEntry(persisted({ actorRole: "staff" }))).toThrow(
			/principal actor/i,
		);
		expect(() => toAuditEntry(persisted({ actorDisplayName: null }))).toThrow(
			/unresolved actor/i,
		);
		expect(() =>
			toAuditEntry(
				persisted({
					targetPrincipalId: staffPrincipal,
					targetDisplayName: "Front desk",
				}),
			),
		).toThrow(/mixes command and governance state/i);
		expect(() =>
			toAuditEntry(persisted({ createdAt: new Date("nope") })),
		).toThrow(/server instant/i);
	});
});

function entry(
	id: number,
	createdAtUtc: string,
	overrides: Partial<AuditEntryView> = {},
): AuditEntryView {
	return toAuditEntry(
		persisted({ id, createdAt: new Date(createdAtUtc) }),
	) as AuditEntryView & typeof overrides;
}

describe("bounded keyset pagination", () => {
	const rows = [
		entry(9, "2026-08-14T09:15:30.250Z"),
		entry(8, "2026-08-14T09:15:30.250Z"),
		entry(7, "2026-08-14T09:15:30.249Z"),
		entry(3, "2026-08-13T22:00:00.000Z"),
	];

	it("emits exactly the page and a cursor at its last row", () => {
		const page = paginateAuditEntries(rows, 2);
		expect(page.entries.map((row) => row.id)).toEqual([9, 8]);
		expect(page.nextCursor).toEqual({
			createdAtUtc: "2026-08-14T09:15:30.250Z",
			id: 8,
		});
		expect(auditListOutputSchema.parse(page)).toEqual(page);
	});

	it("returns a null cursor when the page is the tail", () => {
		expect(paginateAuditEntries(rows, 4).nextCursor).toBeNull();
		expect(paginateAuditEntries(rows.slice(0, 1), 4).entries).toHaveLength(1);
		expect(paginateAuditEntries([], 4)).toEqual({
			entries: [],
			nextCursor: null,
		});
	});

	it("breaks equal timestamps by descending identity", () => {
		expect(rows[0]?.createdAtUtc).toBe(rows[1]?.createdAtUtc);
		expect(paginateAuditEntries(rows, 1).nextCursor).toEqual({
			createdAtUtc: "2026-08-14T09:15:30.250Z",
			id: 9,
		});
		expect(() =>
			paginateAuditEntries(
				[
					entry(8, "2026-08-14T09:15:30.250Z"),
					entry(9, "2026-08-14T09:15:30.250Z"),
				],
				2,
			),
		).toThrow(/newest-first/i);
	});

	it("refuses an unbounded or invalid page size", () => {
		expect(() => paginateAuditEntries(rows, 0)).toThrow(/bounded/i);
		expect(() => paginateAuditEntries(rows, AUDIT_PAGE_LIMIT_MAX + 1)).toThrow(
			/bounded/i,
		);
	});
});
