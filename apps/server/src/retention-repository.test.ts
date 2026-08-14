import * as applicationSchema from "@fitway/db/schema/application";
import { drizzle } from "drizzle-orm/pg-proxy";
import { describe, expect, it, vi } from "vitest";
import { createRetentionRepository } from "./retention-repository";

/**
 * These run against a stubbed driver, which enforces **no** database
 * constraint. They prove statement shape and transaction framing only. Every
 * referential-integrity claim is proved in
 * `phase8-integration.integration.test.ts` against real PostgreSQL.
 */
function harness() {
	const statements: { sql: string; params: unknown[] }[] = [];
	const proxy = drizzle(
		async (sql, params) => {
			statements.push({ sql: sql.replaceAll(/\s+/g, " ").trim(), params });
			return { rows: [] };
		},
		{ schema: applicationSchema },
	);
	const transaction = vi.fn(async (run: (tx: typeof proxy) => Promise<void>) =>
		run(proxy),
	);
	const repository = createRetentionRepository({ transaction } as never);
	return { statements, transaction, repository };
}

const now = new Date("2026-08-14T12:34:56.789Z");
const cutoff = new Date("2025-08-14T00:00:00.000Z");

describe("retention repository", () => {
	it("runs every deletion inside exactly one transaction", async () => {
		const { transaction, repository, statements } = harness();

		await repository.purgeExpired(now);

		expect(transaction).toHaveBeenCalledOnce();
		expect(statements).toHaveLength(3);
	});

	it("deletes each table by its own governing timestamp, strictly older than the cutoff", async () => {
		const { statements, repository } = harness();

		await repository.purgeExpired(now);

		expect(statements[0]?.sql).toMatch(
			/^delete from "audit_log" where "audit_log"\."created_at" < \$1$/,
		);
		expect(statements[1]?.sql).toMatch(
			/^delete from "edge_health_log" where "edge_health_log"\."occurred_at" < \$1$/,
		);
		expect(statements[2]?.sql).toMatch(/^delete from "alert_log" where /);
		expect(statements[2]?.sql).toContain('"alert_log"."sent_at" < $1');
	});

	it("passes the day-quantized cutoff, not the raw clock value", async () => {
		const { statements, repository } = harness();

		await repository.purgeExpired(now);

		// Asserted explicitly so the loop below cannot pass on empty bindings: the
		// two unconstrained tables bind the cutoff once, alert_log binds it again
		// for the retained-recovery guard.
		expect(statements.map((statement) => statement.params.length)).toEqual([
			1, 1, 2,
		]);
		for (const statement of statements) {
			for (const parameter of statement.params) {
				expect(new Date(parameter as string)).toEqual(cutoff);
			}
		}
	});

	it("guards the alert_log self-reference so a retained recovery keeps its parent", async () => {
		const { statements, repository } = harness();

		await repository.purgeExpired(now);

		const alerts = statements[2]?.sql ?? "";
		expect(alerts).toContain("not exists");
		expect(alerts).toContain('"recovery_of_alert_id" = "alert_log"."id"');
		// The guard retains a parent only for a recovery that is itself retained,
		// so an expired parent and its expired child still go in one statement.
		expect(alerts).toMatch(/"sent_at" >= \$2/);
	});

	it("touches only the three retention targets", async () => {
		const { statements, repository } = harness();

		await repository.purgeExpired(now);

		const combined = statements.map((statement) => statement.sql).join("\n");
		for (const table of [
			"occupancy_minutes",
			"settings_versions",
			"current_state",
			"edge_devices",
			"edge_commands",
			"scheduled_reset_issuances",
			"edge_current_health",
		]) {
			expect(combined).not.toContain(table);
		}
		expect(combined).not.toContain("update ");
		expect(combined).not.toContain("insert ");
	});

	it("rejects an invalid instant rather than deleting against a bad cutoff", async () => {
		const { statements, repository } = harness();

		await expect(repository.purgeExpired(new Date(Number.NaN))).rejects.toThrow(
			RangeError,
		);
		expect(statements).toHaveLength(0);
	});
});
