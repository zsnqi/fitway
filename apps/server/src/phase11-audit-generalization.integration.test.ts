import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { buildAccessAuditEntry } from "@fitway/api/audit/governance";
import * as applicationSchema from "@fitway/db/schema/application";
import * as authSchema from "@fitway/db/schema/auth";
import { authStaffCredentials } from "@fitway/db/schema/auth";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool, type QueryResult } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { appendAuditEntry } from "./audit-repository";
import { assertDisposableIntegrationDatabase } from "./test-support/integration-database-safety";

const connectionString = process.env.TEST_DATABASE_URL;
assertDisposableIntegrationDatabase({
	connectionString,
	resetMarker: process.env.FITWAY_INTEGRATION_RESET_DATABASE,
	runId: process.env.FITWAY_RUN_ID,
});

const pool = new Pool({ connectionString });
const database = drizzle(pool, {
	schema: { ...applicationSchema, ...authSchema },
});
const migrationsFolder = path.resolve("packages/db/src/migrations");

let fullMigrationCommitted = false;
let settingsVersion = "";
let deviceId = "";
let staffPrincipalId = "";
let ownerPrincipalId = "";
let targetOwnerPrincipalId = "";
let legacyBefore: unknown[] = [];
let legacyAfter: unknown[] = [];

type AuditValues = Record<string, unknown>;
type PgFailure = Error & { code?: string; constraint?: string };

async function resetSchemas() {
	await pool.query("drop schema if exists drizzle cascade");
	await pool.query("drop schema if exists public cascade");
	await pool.query("create schema public");
}

async function migrationFiles() {
	return (await readdir(migrationsFolder))
		.filter((name) => /^\d{4}_.+\.sql$/.test(name))
		.sort();
}

async function applyMigration(filename: string) {
	const source = await readFile(path.join(migrationsFolder, filename), "utf8");
	for (const statement of source.split("--> statement-breakpoint")) {
		const sql = statement.trim();
		if (sql.length > 0) await pool.query(sql);
	}
}

async function applyMigrationAtomically(filename: string) {
	const source = await readFile(path.join(migrationsFolder, filename), "utf8");
	const client = await pool.connect();
	try {
		await client.query("begin");
		for (const statement of source.split("--> statement-breakpoint")) {
			const sql = statement.trim();
			if (sql.length > 0) await client.query(sql);
		}
		await client.query("commit");
	} catch (error) {
		await client.query("rollback");
		throw error;
	} finally {
		client.release();
	}
}

async function insertAudit(values: AuditValues): Promise<QueryResult> {
	const entries = Object.entries(values);
	const columns = entries.map(([column]) => `"${column}"`).join(", ");
	const placeholders = entries.map((_, index) => `$${index + 1}`).join(", ");
	return pool.query(
		`insert into audit_log (${columns}) values (${placeholders}) returning id`,
		entries.map(([, value]) => value),
	);
}

function accessAudit(overrides: AuditValues = {}): AuditValues {
	return {
		event_class: "access",
		actor_principal_id: ownerPrincipalId,
		actor_principal_kind: "owner",
		actor_role: "owner",
		command_id: null,
		command_issuer_class: null,
		action: "staff_pin_provisioned",
		prior_value: null,
		requested_delta: null,
		requested_value: null,
		effective_value: null,
		target_principal_id: staffPrincipalId,
		prior_active: null,
		new_active: null,
		prior_credential_version: null,
		new_credential_version: null,
		settings_version: null,
		reason: null,
		...overrides,
	};
}

function settingsAudit(overrides: AuditValues = {}): AuditValues {
	return {
		event_class: "settings",
		actor_principal_id: ownerPrincipalId,
		actor_principal_kind: "owner",
		actor_role: "owner",
		command_id: null,
		command_issuer_class: null,
		action: "settings_updated",
		prior_value: null,
		requested_delta: null,
		requested_value: null,
		effective_value: null,
		target_principal_id: null,
		prior_active: null,
		new_active: null,
		prior_credential_version: null,
		new_credential_version: null,
		settings_version: settingsVersion,
		reason: null,
		...overrides,
	};
}

async function createCommand(input: {
	issuerClass?: "human" | "system";
	principalId?: string | null;
	type?: "set_count" | "reset_zero";
	targetValue?: number | null;
}) {
	const issuerClass = input.issuerClass ?? "human";
	const type = input.type ?? "reset_zero";
	const result = await pool.query<{ id: string }>(
		`insert into edge_commands (
			device_id, type, target_value, issuer_class, issued_by_principal_id
		) values ($1, $2, $3, $4, $5) returning id`,
		[
			deviceId,
			type,
			input.targetValue ?? (type === "set_count" ? 12 : null),
			issuerClass,
			issuerClass === "system" ? null : (input.principalId ?? ownerPrincipalId),
		],
	);
	const id = result.rows[0]?.id;
	if (!id) throw new Error("Command fixture was not created");
	return id;
}

function commandAudit(
	commandId: string | null,
	overrides: AuditValues = {},
): AuditValues {
	return {
		event_class: "command",
		actor_principal_id: ownerPrincipalId,
		actor_principal_kind: "owner",
		actor_role: "owner",
		command_id: commandId,
		command_issuer_class: "human",
		action: "reset",
		prior_value: 12,
		requested_delta: null,
		requested_value: 0,
		effective_value: 0,
		target_principal_id: null,
		prior_active: null,
		new_active: null,
		prior_credential_version: null,
		new_credential_version: null,
		settings_version: null,
		reason: null,
		...overrides,
	};
}

async function expectPgFailure(
	operation: () => Promise<unknown>,
	code: string,
	constraint?: string,
) {
	try {
		await operation();
		throw new Error("Expected PostgreSQL to reject the statement");
	} catch (error) {
		const failure = error as PgFailure;
		expect(failure.code).toBe(code);
		if (constraint) expect(failure.constraint).toBe(constraint);
	}
}

async function seedLegacyRows() {
	const staffCommand = await createCommand({
		principalId: staffPrincipalId,
		type: "set_count",
		targetValue: 12,
	});
	await pool.query(
		`insert into audit_log (
			actor_principal_id, actor_principal_kind, actor_role, command_id,
			action, requested_value, effective_value, created_at
		) values ($1, 'shared_staff', 'staff', $2, 'correction_absolute', 12, 12, $3)`,
		[staffPrincipalId, staffCommand, "2026-08-12T12:00:00.000Z"],
	);

	const ownerCommand = await createCommand({ principalId: ownerPrincipalId });
	await pool.query(
		`insert into audit_log (
			actor_principal_id, actor_principal_kind, actor_role, command_id,
			action, prior_value, requested_value, effective_value, created_at
		) values ($1, 'owner', 'owner', $2, 'reset', 12, 0, 0, $3)`,
		[ownerPrincipalId, ownerCommand, "2026-08-12T12:01:00.000Z"],
	);

	const systemCommand = await createCommand({
		issuerClass: "system",
		principalId: null,
	});
	await pool.query(
		`insert into audit_log (
			actor_principal_id, actor_principal_kind, actor_role, command_id,
			command_issuer_class, action, prior_value, requested_value,
			effective_value, reason, created_at
		) values (null, 'system', null, $1, 'system', 'reset', 9, 0, 0, $2, $3)`,
		[systemCommand, "Scheduled post-close reset", "2026-08-12T12:02:00.000Z"],
	);
}

beforeAll(async () => {
	await resetSchemas();
	await migrate(database, { migrationsFolder });
	fullMigrationCommitted = true;

	await resetSchemas();
	const files = await migrationFiles();
	const legacyFiles = files.filter((name) => name < "0007_");
	const generalizationFiles = files.filter((name) => name.startsWith("0007_"));
	expect(legacyFiles).toHaveLength(7);
	expect(generalizationFiles).toHaveLength(1);
	for (const filename of legacyFiles) await applyMigration(filename);

	const settings = await pool.query<{ version: string }>(
		`insert into settings_versions (
			capacity, quiet_max_percent, moderate_max_percent, busy_max_percent
		) values (100, 25, 50, 75) returning version`,
	);
	settingsVersion = settings.rows[0]?.version ?? "";

	const device = await pool.query<{ id: string }>(
		`insert into edge_devices (name, token_hash)
		 values ('phase11-audit-generalization', $1) returning id`,
		["a".repeat(64)],
	);
	deviceId = device.rows[0]?.id ?? "";

	const staff = await pool.query<{ id: string }>(
		`insert into auth_principals (principal_kind, role, display_name)
		 values ('shared_staff', 'staff', 'Front desk') returning id`,
	);
	staffPrincipalId = staff.rows[0]?.id ?? "";
	await pool.query(
		`insert into auth_staff_credentials (
			principal_id, pin_hash, pin_salt, credential_version
		) values ($1, 'fixture-hash', 'fixture-salt', 3)`,
		[staffPrincipalId],
	);

	const owner = await pool.query<{ id: string }>(
		`insert into auth_principals (
			principal_kind, role, owner_email, display_name
		) values ('owner', 'owner', 'actor@example.test', 'Owner actor') returning id`,
	);
	ownerPrincipalId = owner.rows[0]?.id ?? "";
	const targetOwner = await pool.query<{ id: string }>(
		`insert into auth_principals (
			principal_kind, role, owner_email, display_name
		) values ('owner', 'owner', 'target@example.test', 'Owner target') returning id`,
	);
	targetOwnerPrincipalId = targetOwner.rows[0]?.id ?? "";

	await seedLegacyRows();
	legacyBefore = (
		await pool.query(
			`select id, actor_principal_id, actor_principal_kind, actor_role,
				command_id, command_issuer_class, action, prior_value,
				requested_delta, requested_value, effective_value, reason,
				created_at::text
			 from audit_log order by id`,
		)
	).rows;

	await applyMigrationAtomically(generalizationFiles[0] ?? "");
	legacyAfter = (
		await pool.query(
			`select id, actor_principal_id, actor_principal_kind, actor_role,
				command_id, command_issuer_class, action, prior_value,
				requested_delta, requested_value, effective_value, reason,
				created_at::text
			 from audit_log order by id`,
		)
	).rows;
});

afterAll(async () => {
	await pool.end();
});

describe("Phase 11 audit generalization migration", () => {
	it("commits the complete migration and preserves legacy command rows", async () => {
		expect(fullMigrationCommitted).toBe(true);
		expect(legacyAfter).toEqual(legacyBefore);
		const generalized = await pool.query<{
			event_class: string;
			governance_empty: boolean;
		}>(
			`select event_class,
				(target_principal_id is null and prior_active is null and new_active is null
				 and prior_credential_version is null and new_credential_version is null
				 and settings_version is null) as governance_empty
			 from audit_log order by id`,
		);
		expect(generalized.rows).toEqual([
			{ event_class: "command", governance_empty: true },
			{ event_class: "command", governance_empty: true },
			{ event_class: "command", governance_empty: true },
		]);
	});

	it("creates the ordered enums, validated constraints, and event-class index", async () => {
		const actions = await pool.query<{ enumlabel: string }>(
			`select enumlabel from pg_enum
			 where enumtypid = 'audit_action'::regtype order by enumsortorder`,
		);
		expect(actions.rows.map((row) => row.enumlabel)).toEqual([
			"correction_delta",
			"correction_absolute",
			"reset",
			"staff_pin_provisioned",
			"staff_pin_rotated",
			"staff_pin_deactivated",
			"owner_provisioned",
			"owner_deactivated",
			"owner_reactivated",
			"credential_reset",
			"settings_updated",
		]);
		const classes = await pool.query<{ enumlabel: string }>(
			`select enumlabel from pg_enum
			 where enumtypid = 'audit_event_class'::regtype order by enumsortorder`,
		);
		expect(classes.rows.map((row) => row.enumlabel)).toEqual([
			"command",
			"access",
			"settings",
		]);
		const invalid = await pool.query(
			`select conname from pg_constraint
			 where conrelid = 'audit_log'::regclass and not convalidated`,
		);
		expect(invalid.rows).toEqual([]);
		const index = await pool.query(
			`select 1 from pg_indexes
			 where tablename = 'audit_log' and indexname = 'audit_log_event_class_idx'`,
		);
		expect(index.rowCount).toBe(1);
	});

	it("retains the human default and one-row-per-command guarantee", async () => {
		const commandId = await createCommand({ principalId: ownerPrincipalId });
		const values = commandAudit(commandId);
		delete values.command_issuer_class;
		const inserted = await insertAudit(values);
		const stored = await pool.query<{ command_issuer_class: string }>(
			"select command_issuer_class from audit_log where id = $1",
			[inserted.rows[0]?.id],
		);
		expect(stored.rows[0]?.command_issuer_class).toBe("human");
		await expectPgFailure(
			() => insertAudit(commandAudit(commandId)),
			"23505",
			"audit_log_command_unique",
		);

		await insertAudit(accessAudit());
		await insertAudit(
			accessAudit({
				action: "owner_provisioned",
				target_principal_id: targetOwnerPrincipalId,
			}),
		);
	});

	it("enforces null-safe actor and command-linkage rules", async () => {
		const commandId = await createCommand({ principalId: ownerPrincipalId });
		await expectPgFailure(
			() => insertAudit(commandAudit(commandId, { actor_role: null })),
			"23514",
			"audit_log_actor_kind_role",
		);
		await expectPgFailure(
			() => insertAudit(accessAudit({ actor_role: null })),
			"23514",
			"audit_log_actor_kind_role",
		);
		await expectPgFailure(
			() =>
				insertAudit(
					accessAudit({
						actor_principal_id: staffPrincipalId,
						actor_principal_kind: "shared_staff",
						actor_role: "staff",
					}),
				),
			"23514",
			"audit_log_actor_kind_role",
		);

		const missingIssuer = accessAudit();
		delete missingIssuer.command_issuer_class;
		await expectPgFailure(() => insertAudit(missingIssuer), "23514");
		await insertAudit(accessAudit());

		const governanceCommand = await createCommand({
			principalId: ownerPrincipalId,
		});
		await expectPgFailure(
			() =>
				insertAudit(
					accessAudit({
						command_id: governanceCommand,
						command_issuer_class: "human",
					}),
				),
			"23514",
			"audit_log_command_linkage",
		);
		await expectPgFailure(
			() => insertAudit(commandAudit(null)),
			"23514",
			"audit_log_command_linkage",
		);
		await expectPgFailure(
			() =>
				insertAudit(
					commandAudit("9007199254740991", {
						command_issuer_class: null,
					}),
				),
			"23514",
			"audit_log_command_linkage",
		);
		const missingClass = accessAudit();
		delete missingClass.event_class;
		await expectPgFailure(() => insertAudit(missingClass), "23514");
	});

	it("binds every action to its event class at write time", async () => {
		await expectPgFailure(
			() => insertAudit(accessAudit({ action: "reset" })),
			"23514",
			"audit_log_action_event_class",
		);
		await expectPgFailure(
			() => insertAudit(settingsAudit({ action: "credential_reset" })),
			"23514",
			"audit_log_action_event_class",
		);
		const commandId = await createCommand({ principalId: ownerPrincipalId });
		await expectPgFailure(
			() =>
				insertAudit(
					commandAudit(commandId, {
						action: "owner_deactivated",
					}),
				),
			"23514",
			"audit_log_action_event_class",
		);
	});

	it("closes every command-count channel on governance rows", async () => {
		for (const overrides of [
			{ prior_value: 482913 },
			{ requested_delta: 482913 },
			{ requested_value: 482913 },
			{ effective_value: 482913 },
			{
				prior_value: 482913,
				requested_delta: 1,
				requested_value: 482913,
				effective_value: 482913,
			},
		]) {
			await expectPgFailure(() => insertAudit(accessAudit(overrides)), "23514");
		}
	});

	it("requires the correct governance columns and foreign keys", async () => {
		await expectPgFailure(
			() => insertAudit(accessAudit({ target_principal_id: null })),
			"23514",
			"audit_log_governance_columns",
		);
		await expectPgFailure(
			() => insertAudit(settingsAudit({ settings_version: null })),
			"23514",
			"audit_log_governance_columns",
		);
		await expectPgFailure(
			() =>
				insertAudit(settingsAudit({ target_principal_id: staffPrincipalId })),
			"23514",
			"audit_log_governance_columns",
		);
		await expectPgFailure(
			() => insertAudit(settingsAudit({ prior_active: true })),
			"23514",
			"audit_log_governance_columns",
		);
		const commandId = await createCommand({ principalId: ownerPrincipalId });
		await expectPgFailure(
			() =>
				insertAudit(
					commandAudit(commandId, {
						target_principal_id: staffPrincipalId,
					}),
				),
			"23514",
			"audit_log_governance_columns",
		);
		await expectPgFailure(
			() =>
				insertAudit(
					accessAudit({
						target_principal_id: "00000000-0000-4000-8000-000000000099",
					}),
				),
			"23503",
			"audit_log_target_principal_id_auth_principals_id_fk",
		);
		await expectPgFailure(
			() => insertAudit(settingsAudit({ settings_version: 999999 })),
			"23503",
			"audit_log_settings_version_settings_versions_version_fk",
		);
	});

	it("enforces positive credential versions and approved state transitions", async () => {
		for (const value of [0, -1]) {
			await expectPgFailure(
				() =>
					insertAudit(
						accessAudit({
							action: "staff_pin_rotated",
							prior_credential_version: value,
							new_credential_version: 4,
						}),
					),
				"23514",
				"audit_log_credential_versions_positive",
			);
		}

		for (const values of [
			{ prior_active: null, new_active: false },
			{ prior_active: false, new_active: true },
		]) {
			await expectPgFailure(
				() =>
					insertAudit(
						accessAudit({
							action: "owner_deactivated",
							target_principal_id: targetOwnerPrincipalId,
							reason: "Departure approved",
							...values,
						}),
					),
				"23514",
				"audit_log_governance_state_transition",
			);
		}
		for (const values of [
			{ prior_active: null, new_active: true },
			{ prior_active: true, new_active: false },
		]) {
			await expectPgFailure(
				() =>
					insertAudit(
						accessAudit({
							action: "owner_reactivated",
							target_principal_id: targetOwnerPrincipalId,
							...values,
						}),
					),
				"23514",
				"audit_log_governance_state_transition",
			);
		}

		for (const action of ["staff_pin_rotated", "credential_reset"] as const) {
			for (const versions of [
				{ prior_credential_version: null, new_credential_version: 4 },
				{ prior_credential_version: 3, new_credential_version: null },
				{ prior_credential_version: 3, new_credential_version: 3 },
				{ prior_credential_version: 4, new_credential_version: 3 },
			]) {
				await expectPgFailure(
					() => insertAudit(accessAudit({ action, ...versions })),
					"23514",
					"audit_log_governance_state_transition",
				);
			}
		}

		await insertAudit(
			accessAudit({
				action: "owner_deactivated",
				target_principal_id: targetOwnerPrincipalId,
				prior_active: true,
				new_active: false,
				reason: "Departure approved",
			}),
		);
		await insertAudit(
			accessAudit({
				action: "owner_reactivated",
				target_principal_id: targetOwnerPrincipalId,
				prior_active: false,
				new_active: true,
			}),
		);
		await insertAudit(
			accessAudit({
				action: "staff_pin_rotated",
				prior_credential_version: 3,
				new_credential_version: 4,
			}),
		);
	});

	it("requires only destructive reasons and accepts ticket numbers", async () => {
		await expectPgFailure(
			() => insertAudit(accessAudit({ action: "staff_pin_deactivated" })),
			"23514",
			"audit_log_destructive_reason_required",
		);
		await expectPgFailure(
			() =>
				insertAudit(
					accessAudit({
						action: "owner_deactivated",
						target_principal_id: targetOwnerPrincipalId,
						prior_active: true,
						new_active: false,
					}),
				),
			"23514",
			"audit_log_destructive_reason_required",
		);
		await insertAudit(
			accessAudit({
				action: "staff_pin_rotated",
				prior_credential_version: 3,
				new_credential_version: 4,
				reason: null,
			}),
		);
		const ticket = await insertAudit(
			accessAudit({
				action: "staff_pin_deactivated",
				reason: "closing ticket TCK-2026-081501",
			}),
		);
		await expectPgFailure(
			() =>
				pool.query("update audit_log set reason = null where id = $1", [
					ticket.rows[0]?.id,
				]),
			"23514",
			"audit_log_destructive_reason_required",
		);
	});

	it("keeps post-commit cast checks and retained command constraints effective", async () => {
		const row = await insertAudit(accessAudit());
		await pool.query("update audit_log set reason = $1 where id = $2", [
			"Transition test",
			row.rows[0]?.id,
		]);
		await expectPgFailure(
			() =>
				pool.query(
					"update audit_log set action = 'owner_deactivated' where id = $1",
					[row.rows[0]?.id],
				),
			"23514",
			"audit_log_governance_state_transition",
		);

		const negativeCommand = await createCommand({
			principalId: ownerPrincipalId,
		});
		await expectPgFailure(
			() => insertAudit(commandAudit(negativeCommand, { prior_value: -1 })),
			"23514",
			"audit_log_values_nonnegative",
		);
		const incoherentCommand = await createCommand({
			principalId: ownerPrincipalId,
			type: "set_count",
			targetValue: 12,
		});
		await expectPgFailure(
			() =>
				insertAudit(
					commandAudit(incoherentCommand, {
						action: "correction_absolute",
						requested_value: 11,
						effective_value: 12,
					}),
				),
			"23514",
			"audit_log_action_values_coherent",
		);
		for (const reason of ["", " padded "]) {
			const reasonCommand = await createCommand({
				principalId: ownerPrincipalId,
			});
			await expectPgFailure(
				() => insertAudit(commandAudit(reasonCommand, { reason })),
				"23514",
				"audit_log_reason_short_trimmed",
			);
		}
	});

	it("persists credential versions read from principal snapshots in one transaction", async () => {
		await database.transaction(async (transaction) => {
			const [before] = await transaction
				.select({
					principalId: authStaffCredentials.principalId,
					active: authStaffCredentials.active,
					credentialVersion: authStaffCredentials.credentialVersion,
				})
				.from(authStaffCredentials)
				.where(eq(authStaffCredentials.principalId, staffPrincipalId));
			if (!before)
				throw new Error("Staff credential before-snapshot is missing");

			await transaction
				.update(authStaffCredentials)
				.set({ credentialVersion: before.credentialVersion + 1 })
				.where(eq(authStaffCredentials.principalId, staffPrincipalId));
			const [after] = await transaction
				.select({
					principalId: authStaffCredentials.principalId,
					active: authStaffCredentials.active,
					credentialVersion: authStaffCredentials.credentialVersion,
				})
				.from(authStaffCredentials)
				.where(eq(authStaffCredentials.principalId, staffPrincipalId));
			if (!after) throw new Error("Staff credential after-snapshot is missing");

			const entry = buildAccessAuditEntry({
				action: "staff_pin_rotated",
				actorPrincipalId: ownerPrincipalId,
				before,
				after,
				reason: null,
				createdAt: new Date("2026-08-16T19:00:00.000Z"),
			});
			await appendAuditEntry(transaction as never, entry);
		});

		const stored = await pool.query<{
			prior_credential_version: number;
			new_credential_version: number;
		}>(
			`select prior_credential_version, new_credential_version
			 from audit_log where action = 'staff_pin_rotated'
			 order by id desc limit 1`,
		);
		expect(stored.rows[0]).toEqual({
			prior_credential_version: 3,
			new_credential_version: 4,
		});
	});
});
