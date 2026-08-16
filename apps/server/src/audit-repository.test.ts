import {
	AUDIT_PAGE_LIMIT_DEFAULT,
	type AuditListInput,
	auditListInputSchema,
} from "@fitway/api/audit/list";
import { getTableName, type SQL, type Table } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import {
	auditListConditions,
	auditListFilterConditions,
	auditListKeysetCondition,
	createAuditListRepository,
} from "./audit-repository";

const dialect = new PgDialect();
const staffPrincipal = "00000000-0000-4000-8000-0000000000b2";

function render(condition: SQL | undefined) {
	if (!condition) return { sql: null, params: [] as unknown[] };
	const query = dialect.sqlToQuery(condition);
	return { sql: query.sql, params: query.params };
}

function input(overrides: Partial<AuditListInput> = {}): AuditListInput {
	return auditListInputSchema.parse({ ...overrides });
}

describe("audit list filter translation", () => {
	it("adds no predicate when no filter is supplied", () => {
		expect(auditListFilterConditions(undefined)).toEqual([]);
		expect(auditListConditions(input())).toBeUndefined();
		expect(auditListConditions(input({ filters: {} }))).toBeUndefined();
	});

	it("translates each of the six filters to an exact predicate", () => {
		const rendered = render(
			auditListConditions(
				input({
					filters: {
						actorPrincipalId: staffPrincipal,
						actorKind: "shared_staff",
						actions: ["correction_delta", "reset"],
						priorValue: 0,
						effectiveValue: 12,
						occurredFrom: "2026-08-01T00:00:00.000Z",
						occurredTo: "2026-08-31T23:59:59.999Z",
						reason: "door",
					},
				}),
			),
		);
		expect(rendered.sql).toContain('"actor_principal_id" = $1');
		expect(rendered.sql).toContain('"actor_principal_kind" = $2');
		expect(rendered.sql).toContain('"action" in ($3, $4)');
		expect(rendered.sql).toContain('"prior_value" = $5');
		expect(rendered.sql).toContain('"effective_value" = $6');
		expect(rendered.sql).toContain('"created_at" >= $7');
		expect(rendered.sql).toContain('"created_at" <= $8');
		expect(rendered.sql).toContain('"reason" ilike $9');
		expect(rendered.params).toEqual([
			staffPrincipal,
			"shared_staff",
			"correction_delta",
			"reset",
			0,
			12,
			"2026-08-01T00:00:00.000Z",
			"2026-08-31T23:59:59.999Z",
			"%door%",
		]);
	});

	it("matches an exactly-zero prior by value and a missing prior by nullness", () => {
		const zero = render(
			auditListConditions(input({ filters: { priorValue: 0 } })),
		);
		expect(zero.sql).toContain('"prior_value" = $1');
		expect(zero.params).toEqual([0]);

		const missing = render(
			auditListConditions(input({ filters: { priorValue: null } })),
		);
		expect(missing.sql).toContain('"prior_value" is null');
		expect(missing.params).toEqual([]);
	});

	it("keeps a zero effective value distinct from a missing governance value", () => {
		const zero = render(
			auditListConditions(input({ filters: { effectiveValue: 0 } })),
		);
		expect(zero.sql).toContain('"effective_value" = $1');
		expect(zero.params).toEqual([0]);

		const missing = render(
			auditListConditions(input({ filters: { effectiveValue: null } })),
		);
		expect(missing.sql).toContain('"effective_value" is null');
		expect(missing.params).toEqual([]);
	});

	it("matches a missing reason by nullness and a present reason case-insensitively", () => {
		expect(
			render(auditListConditions(input({ filters: { reason: null } }))).sql,
		).toContain('"reason" is null');
		expect(
			render(auditListConditions(input({ filters: { reason: "Door" } })))
				.params,
		).toEqual(["%Door%"]);
	});

	it("escapes pattern metacharacters so a reason search stays a substring search", () => {
		expect(
			render(auditListConditions(input({ filters: { reason: "100%_off\\x" } })))
				.params,
		).toEqual(["%100\\%\\_off\\\\x%"]);
	});
});

describe("audit list keyset seek", () => {
	it("compares the composite key as a row value in index order", () => {
		const rendered = render(
			auditListKeysetCondition({
				createdAtUtc: "2026-08-14T09:15:30.250Z",
				id: 91,
			}),
		);
		expect(rendered.sql).toContain('"created_at", "audit_log"."id") < (cast(');
		expect(rendered.sql).toContain("as timestamptz)");
		expect(rendered.sql).toContain("as bigint)");
		expect(rendered.params).toEqual(["2026-08-14T09:15:30.250Z", 91]);
	});

	it("conjoins the seek with the active filters", () => {
		const rendered = render(
			auditListConditions(
				input({
					cursor: { createdAtUtc: "2026-08-14T09:15:30.250Z", id: 91 },
					filters: { actions: ["reset"] },
				}),
			),
		);
		expect(rendered.sql).toContain('"action" in ($1)');
		expect(rendered.sql).toContain(" and ");
		expect(rendered.params).toEqual(["reset", "2026-08-14T09:15:30.250Z", 91]);
	});
});

type RecordedQuery = {
	columns: string[];
	joins: string[];
	ordered: unknown[];
	limit: number;
};

function recordingDatabase(rows: unknown[]) {
	const recorded: RecordedQuery = {
		columns: [],
		joins: [],
		ordered: [],
		limit: 0,
	};
	const builder = {
		from() {
			return builder;
		},
		leftJoin(table: Table) {
			recorded.joins.push(getTableName(table));
			return builder;
		},
		where() {
			return builder;
		},
		orderBy(...order: unknown[]) {
			recorded.ordered = order;
			return builder;
		},
		limit(value: number) {
			recorded.limit = value;
			return Promise.resolve(rows);
		},
	};
	return {
		recorded,
		database: {
			select(columns: Record<string, unknown>) {
				recorded.columns = Object.keys(columns);
				return builder;
			},
		} as never,
	};
}

function persistedRow(id: number, createdAt: string) {
	return {
		id,
		eventClass: "command" as const,
		action: "reset" as const,
		actorPrincipalId: null,
		actorPrincipalKind: "system" as const,
		actorRole: null,
		actorDisplayName: null,
		targetPrincipalId: null,
		targetDisplayName: null,
		priorValue: 9,
		requestedDelta: null,
		requestedValue: 0,
		effectiveValue: 0,
		priorActive: null,
		newActive: null,
		priorCredentialVersion: null,
		newCredentialVersion: null,
		settingsVersion: null,
		reason: "Scheduled post-close reset",
		createdAt: new Date(createdAt),
	};
}

describe("audit list repository", () => {
	it("projects only non-sensitive columns and joins principals for the label alone", async () => {
		const { database, recorded } = recordingDatabase([]);
		await createAuditListRepository(database).listAuditEntries(input());
		expect(recorded.columns.sort()).toEqual(
			[
				"action",
				"actorDisplayName",
				"actorPrincipalId",
				"actorPrincipalKind",
				"actorRole",
				"createdAt",
				"effectiveValue",
				"eventClass",
				"id",
				"newActive",
				"newCredentialVersion",
				"priorActive",
				"priorCredentialVersion",
				"priorValue",
				"reason",
				"requestedDelta",
				"requestedValue",
				"settingsVersion",
				"targetDisplayName",
				"targetPrincipalId",
			].sort(),
		);
		expect(recorded.columns).not.toContain("ownerEmail");
		expect(recorded.joins).toEqual(["auth_principals", "target_principal"]);
	});

	it("orders newest-first on the composite key and reads one bounding row", async () => {
		const { database, recorded } = recordingDatabase([]);
		await createAuditListRepository(database).listAuditEntries(input());
		expect(recorded.limit).toBe(AUDIT_PAGE_LIMIT_DEFAULT + 1);
		expect(recorded.ordered).toHaveLength(2);
		const [first, second] = recorded.ordered.map(
			(clause) => dialect.sqlToQuery(clause as SQL).sql,
		);
		expect(first).toContain('"created_at" desc');
		expect(second).toContain('"id" desc');
	});

	it("emits the bounded page and a cursor without leaking the bounding row", async () => {
		const { database } = recordingDatabase([
			persistedRow(9, "2026-08-14T09:15:30.250Z"),
			persistedRow(8, "2026-08-14T09:15:30.250Z"),
			persistedRow(7, "2026-08-13T10:00:00.000Z"),
		]);
		const page = await createAuditListRepository(database).listAuditEntries(
			input({ limit: 2 }),
		);
		expect(page.entries.map((row) => row.id)).toEqual([9, 8]);
		expect(page.nextCursor).toEqual({
			createdAtUtc: "2026-08-14T09:15:30.250Z",
			id: 8,
		});
	});

	it("returns a null cursor at the tail", async () => {
		const { database } = recordingDatabase([
			persistedRow(9, "2026-08-14T09:15:30.250Z"),
		]);
		const page = await createAuditListRepository(database).listAuditEntries(
			input({ limit: 2 }),
		);
		expect(page.entries).toHaveLength(1);
		expect(page.nextCursor).toBeNull();
	});
});
