import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { CommandService } from "@fitway/api/commands/service";
import { edgePushResponseSchema } from "@fitway/api/edge-push";
import { evaluateScheduledReset } from "@fitway/api/reset/evaluator";
import { createScheduledResetRunner } from "@fitway/api/reset/runner";
import type { SystemResetIssuanceDecision } from "@fitway/api/reset/types";
import * as applicationSchema from "@fitway/db/schema/application";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createResetRepository } from "./reset-repository";
import { assertDisposableIntegrationDatabase } from "./test-support/integration-database-safety";

const connectionString = process.env.TEST_DATABASE_URL;
assertDisposableIntegrationDatabase({
	connectionString,
	resetMarker: process.env.FITWAY_INTEGRATION_RESET_DATABASE,
	runId: process.env.FITWAY_RUN_ID,
});
if (connectionString) process.env.DATABASE_URL = connectionString;

const pool = new Pool({ connectionString });
const database = drizzle(pool, { schema: applicationSchema });
const migrationsFolder = path.resolve("packages/db/src/migrations");

let settingsVersion = "";
let deviceId = "";
let staffPrincipalId = "";
let ownerPrincipalId = "";
let legacyStaffCommandId = "";
let legacyOwnerCommandId = "";
let commands: CommandService;

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

async function createCommand(input: {
	issuerClass: "human" | "system";
	principalId: string | null;
	type: "set_count" | "reset_zero";
	targetValue: number | null;
	reason?: string | null;
	issuedAt?: string;
}) {
	const result = await pool.query<{ id: string }>(
		`insert into edge_commands (
			device_id,
			type,
			target_value,
			issuer_class,
			issued_by_principal_id,
			reason,
			issued_at
		) values ($1, $2, $3, $4, $5, $6, $7)
		returning id`,
		[
			deviceId,
			input.type,
			input.targetValue,
			input.issuerClass,
			input.principalId,
			input.reason ?? null,
			input.issuedAt ?? "2026-08-13T12:00:00.000Z",
		],
	);
	const id = result.rows[0]?.id;
	if (!id) throw new Error("Command fixture was not created");
	return id;
}

async function insertAudit(input: {
	actorPrincipalId: string | null;
	actorPrincipalKind: "shared_staff" | "owner" | "system";
	actorRole: "staff" | "owner" | null;
	commandId: string;
	commandIssuerClass: "human" | "system";
	reason?: string;
	createdAt?: string;
}) {
	return pool.query(
		`insert into audit_log (
			actor_principal_id,
			actor_principal_kind,
			actor_role,
			command_id,
			command_issuer_class,
			action,
			prior_value,
			requested_value,
			effective_value,
			reason,
			created_at
		) values ($1, $2, $3, $4, $5, 'reset', 7, 0, 0, $6, $7)`,
		[
			input.actorPrincipalId,
			input.actorPrincipalKind,
			input.actorRole,
			input.commandId,
			input.commandIssuerClass,
			input.reason ?? "scheduled close",
			input.createdAt ?? "2026-08-13T12:00:00.000Z",
		],
	);
}

async function insertIssuance(input: {
	businessDay: string;
	issuanceKey: string;
	commandId: string;
	scheduledClose?: string;
	dueAt?: string;
	issuedAt?: string;
}) {
	return pool.query(
		`insert into scheduled_reset_issuances (
			business_day,
			issuance_key,
			settings_version,
			scheduled_close,
			due_at,
			command_id,
			command_issuer_class,
			command_type,
			issued_at
		) values ($1, $2, $3, $4, $5, $6, 'system', 'reset_zero', $7)`,
		[
			input.businessDay,
			input.issuanceKey,
			settingsVersion,
			input.scheduledClose ?? "2026-08-13T11:30:00.000Z",
			input.dueAt ?? "2026-08-13T12:00:00.000Z",
			input.commandId,
			input.issuedAt ?? "2026-08-13T12:00:00.000Z",
		],
	);
}

beforeAll(async () => {
	await pool.query("drop schema if exists drizzle cascade");
	await pool.query("drop schema if exists public cascade");
	await pool.query("create schema public");

	const files = await migrationFiles();
	const legacyFiles = files.filter((name) => name < "0006_");
	const phase7Files = files.filter((name) => name.startsWith("0006_"));
	expect(legacyFiles).toHaveLength(6);
	expect(phase7Files).toHaveLength(1);
	const phase7Source = await readFile(
		path.join(migrationsFolder, phase7Files[0] ?? ""),
		"utf8",
	);
	for (const [indexName, foreignKeyName] of [
		["edge_commands_id_issuer_class_unique", "audit_log_command_issuer_fk"],
		[
			"edge_commands_id_issuer_class_type_unique",
			"scheduled_reset_issuances_command_fk",
		],
	] as const) {
		expect(phase7Source.indexOf(indexName)).toBeGreaterThanOrEqual(0);
		expect(phase7Source.indexOf(indexName)).toBeLessThan(
			phase7Source.indexOf(foreignKeyName),
		);
	}
	for (const filename of legacyFiles) await applyMigration(filename);

	const settings = await pool.query<{ version: string }>(
		`insert into settings_versions (
			capacity,
			quiet_max_percent,
			moderate_max_percent,
			busy_max_percent,
			effective_from
		) values (100, 25, 50, 75, $1)
		returning version`,
		["2026-08-01T00:00:00.000Z"],
	);
	settingsVersion = settings.rows[0]?.version ?? "";

	const device = await pool.query<{ id: string }>(
		`insert into edge_devices (name, token_hash)
		values ('phase-7-stage-0', $1)
		returning id`,
		["7".repeat(64)],
	);
	deviceId = device.rows[0]?.id ?? "";

	const staff = await pool.query<{ id: string }>(
		`insert into auth_principals (principal_kind, role, display_name)
		values ('shared_staff', 'staff', 'Phase 7 staff fixture')
		returning id`,
	);
	staffPrincipalId = staff.rows[0]?.id ?? "";
	const owner = await pool.query<{ id: string }>(
		`insert into auth_principals (
			principal_kind,
			role,
			owner_email,
			display_name
		) values ('owner', 'owner', 'phase7@example.test', 'Phase 7 owner fixture')
		returning id`,
	);
	ownerPrincipalId = owner.rows[0]?.id ?? "";

	const staffCommand = await pool.query<{ id: string }>(
		`insert into edge_commands (
			device_id,
			type,
			target_value,
			issued_by_principal_id,
			issued_at
		) values ($1, 'set_count', 12, $2, $3)
		returning id`,
		[deviceId, staffPrincipalId, "2026-08-12T12:00:00.000Z"],
	);
	legacyStaffCommandId = staffCommand.rows[0]?.id ?? "";
	await pool.query(
		`insert into audit_log (
			actor_principal_id,
			actor_principal_kind,
			actor_role,
			command_id,
			action,
			requested_value,
			effective_value,
			created_at
		) values ($1, 'shared_staff', 'staff', $2, 'correction_absolute', 12, 12, $3)`,
		[staffPrincipalId, legacyStaffCommandId, "2026-08-12T12:00:00.000Z"],
	);

	const ownerCommand = await pool.query<{ id: string }>(
		`insert into edge_commands (
			device_id,
			type,
			target_value,
			issued_by_principal_id,
			issued_at
		) values ($1, 'reset_zero', null, $2, $3)
		returning id`,
		[deviceId, ownerPrincipalId, "2026-08-12T12:01:00.000Z"],
	);
	legacyOwnerCommandId = ownerCommand.rows[0]?.id ?? "";
	await pool.query(
		`insert into audit_log (
			actor_principal_id,
			actor_principal_kind,
			actor_role,
			command_id,
			action,
			prior_value,
			requested_value,
			effective_value,
			created_at
		) values ($1, 'owner', 'owner', $2, 'reset', 12, 0, 0, $3)`,
		[ownerPrincipalId, legacyOwnerCommandId, "2026-08-12T12:01:00.000Z"],
	);

	await applyMigration(phase7Files[0] ?? "");
	const { createCommandServiceDatabase } = await import("./command-repository");
	commands = createCommandServiceDatabase(
		database as unknown as typeof import("@fitway/db").db,
	);
});

afterAll(async () => {
	await pool.end();
});

describe("Phase 7 additive scheduled-reset persistence", () => {
	it("keeps the frozen schema-v2 edge settings subset free of reset configuration", () => {
		const settings = {
			version: 1,
			pushIntervalSeconds: 20,
			timezone: "Asia/Riyadh",
			businessDayBoundary: "04:00:00",
			weeklySchedule: {
				sun: { open: "06:00:00", close: "23:00:00" },
				mon: { open: "06:00:00", close: "23:00:00" },
				tue: { open: "06:00:00", close: "23:00:00" },
				wed: { open: "06:00:00", close: "23:00:00" },
				thu: { open: "06:00:00", close: "23:00:00" },
				fri: { open: "14:00:00", close: "23:00:00" },
				sat: null,
			},
		} as const;
		const response = {
			schemaVersion: 2,
			accepted: true,
			reason: "processed",
			highestProcessedSequence: 1,
			commands: [],
			serverTime: "2026-08-13T12:00:00.000Z",
			settings,
		} as const;
		const parsed = edgePushResponseSchema.parse(response);
		expect(Object.keys(parsed.settings).sort()).toEqual([
			"businessDayBoundary",
			"pushIntervalSeconds",
			"timezone",
			"version",
			"weeklySchedule",
		]);
		expect(
			edgePushResponseSchema.safeParse({
				...response,
				settings: { ...settings, resetBufferMinutes: 30 },
			}).success,
		).toBe(false);
	});

	it("migrates reset buffer defaults and preserves existing human command provenance", async () => {
		const migratedSettings = await pool.query<{
			reset_buffer_minutes: number;
		}>(
			"select reset_buffer_minutes from settings_versions where version = $1",
			[settingsVersion],
		);
		expect(migratedSettings.rows[0]?.reset_buffer_minutes).toBe(30);

		const explicitZero = await pool.query<{ reset_buffer_minutes: number }>(
			`insert into settings_versions (
				capacity,
				quiet_max_percent,
				moderate_max_percent,
				busy_max_percent,
				reset_buffer_minutes
			) values (100, 25, 50, 75, 0)
			returning reset_buffer_minutes`,
		);
		expect(explicitZero.rows[0]?.reset_buffer_minutes).toBe(0);
		await expect(
			pool.query(
				`insert into settings_versions (
					capacity,
					quiet_max_percent,
					moderate_max_percent,
					busy_max_percent,
					reset_buffer_minutes
				) values (100, 25, 50, 75, -1)`,
			),
		).rejects.toThrow();

		const commands = await pool.query<{
			id: string;
			issuer_class: string;
			issued_by_principal_id: string | null;
		}>(
			`select id, issuer_class, issued_by_principal_id
			from edge_commands
			where id = any($1::bigint[])
			order by id`,
			[[legacyStaffCommandId, legacyOwnerCommandId]],
		);
		expect(commands.rows).toEqual([
			{
				id: legacyStaffCommandId,
				issuer_class: "human",
				issued_by_principal_id: staffPrincipalId,
			},
			{
				id: legacyOwnerCommandId,
				issuer_class: "human",
				issued_by_principal_id: ownerPrincipalId,
			},
		]);
		const audits = await pool.query<{
			actor_principal_kind: string;
			actor_role: string | null;
			command_issuer_class: string;
		}>(
			`select actor_principal_kind, actor_role, command_issuer_class
			from audit_log
			where command_id = any($1::bigint[])
			order by command_id`,
			[[legacyStaffCommandId, legacyOwnerCommandId]],
		);
		expect(audits.rows).toEqual([
			{
				actor_principal_kind: "shared_staff",
				actor_role: "staff",
				command_issuer_class: "human",
			},
			{
				actor_principal_kind: "owner",
				actor_role: "owner",
				command_issuer_class: "human",
			},
		]);
	});

	it("stores system command and audit provenance without an authentication principal", async () => {
		const commandId = await createCommand({
			issuerClass: "system",
			principalId: null,
			type: "reset_zero",
			targetValue: null,
		});
		await insertAudit({
			actorPrincipalId: null,
			actorPrincipalKind: "system",
			actorRole: null,
			commandId,
			commandIssuerClass: "system",
		});

		const provenance = await pool.query(
			`select
				c.issuer_class,
				c.issued_by_principal_id,
				a.actor_principal_kind,
				a.actor_principal_id,
				a.actor_role,
				a.command_issuer_class
			from edge_commands c
			join audit_log a on a.command_id = c.id
			where c.id = $1`,
			[commandId],
		);
		expect(provenance.rows[0]).toEqual({
			issuer_class: "system",
			issued_by_principal_id: null,
			actor_principal_kind: "system",
			actor_principal_id: null,
			actor_role: null,
			command_issuer_class: "system",
		});
		const authSystemRows = await pool.query<{ count: string }>(
			"select count(*) from auth_principals where principal_kind::text = 'system'",
		);
		expect(authSystemRows.rows[0]?.count).toBe("0");
		const authEnumLabels = await pool.query<{
			enum_name: string;
			labels: string[];
		}>(
			`select
				t.typname as enum_name,
				array_agg(e.enumlabel::text order by e.enumsortorder) as labels
			from pg_type t
			join pg_enum e on e.enumtypid = t.oid
			where t.typname in ('auth_principal_kind', 'auth_role')
			group by t.typname
			order by t.typname`,
		);
		expect(authEnumLabels.rows).toEqual([
			{
				enum_name: "auth_principal_kind",
				labels: ["shared_staff", "owner"],
			},
			{ enum_name: "auth_role", labels: ["staff", "owner"] },
		]);
	});

	it("rejects incoherent issuer and audit actor provenance", async () => {
		await expect(
			createCommand({
				issuerClass: "human",
				principalId: null,
				type: "reset_zero",
				targetValue: null,
			}),
		).rejects.toThrow();
		await expect(
			createCommand({
				issuerClass: "system",
				principalId: staffPrincipalId,
				type: "reset_zero",
				targetValue: null,
			}),
		).rejects.toThrow();

		const humanCommandId = await createCommand({
			issuerClass: "human",
			principalId: staffPrincipalId,
			type: "reset_zero",
			targetValue: null,
		});
		await expect(
			insertAudit({
				actorPrincipalId: null,
				actorPrincipalKind: "system",
				actorRole: null,
				commandId: humanCommandId,
				commandIssuerClass: "system",
			}),
		).rejects.toThrow();
		await expect(
			insertAudit({
				actorPrincipalId: null,
				actorPrincipalKind: "system",
				actorRole: null,
				commandId: humanCommandId,
				commandIssuerClass: "human",
			}),
		).rejects.toThrow();

		const systemCommandId = await createCommand({
			issuerClass: "system",
			principalId: null,
			type: "reset_zero",
			targetValue: null,
		});
		await expect(
			insertAudit({
				actorPrincipalId: staffPrincipalId,
				actorPrincipalKind: "shared_staff",
				actorRole: "staff",
				commandId: systemCommandId,
				commandIssuerClass: "human",
			}),
		).rejects.toThrow();
		await expect(
			insertAudit({
				actorPrincipalId: staffPrincipalId,
				actorPrincipalKind: "shared_staff",
				actorRole: "staff",
				commandId: systemCommandId,
				commandIssuerClass: "system",
			}),
		).rejects.toThrow();
	});

	it("retains stable scheduled issuances and rejects incoherent or duplicate claims", async () => {
		const validCommandId = await createCommand({
			issuerClass: "system",
			principalId: null,
			type: "reset_zero",
			targetValue: null,
		});
		await insertIssuance({
			businessDay: "2026-08-13",
			issuanceKey: "scheduled-reset:2026-08-13",
			commandId: validCommandId,
		});
		const valid = await pool.query(
			`select
				business_day::text,
				issuance_key,
				settings_version::text,
				scheduled_close,
				due_at,
				command_id::text,
				command_issuer_class,
				command_type,
				issued_at
			from scheduled_reset_issuances
			where business_day = '2026-08-13'`,
		);
		expect(valid.rows[0]).toMatchObject({
			business_day: "2026-08-13",
			issuance_key: "scheduled-reset:2026-08-13",
			settings_version: settingsVersion,
			command_id: validCommandId,
			command_issuer_class: "system",
			command_type: "reset_zero",
		});
		expect(new Date(valid.rows[0]?.scheduled_close).toISOString()).toBe(
			"2026-08-13T11:30:00.000Z",
		);
		expect(new Date(valid.rows[0]?.due_at).toISOString()).toBe(
			"2026-08-13T12:00:00.000Z",
		);
		expect(new Date(valid.rows[0]?.issued_at).toISOString()).toBe(
			"2026-08-13T12:00:00.000Z",
		);
		const issuanceIndexes = await pool.query<{
			indexname: string;
			indexdef: string;
		}>(
			`select indexname, indexdef
			from pg_indexes
			where schemaname = 'public'
				and tablename = 'scheduled_reset_issuances'
				and indexname in (
					'scheduled_reset_issuances_pkey',
					'scheduled_reset_issuances_key_unique',
					'scheduled_reset_issuances_command_unique'
				)
			order by indexname`,
		);
		expect(issuanceIndexes.rows.map((row) => row.indexname)).toEqual([
			"scheduled_reset_issuances_command_unique",
			"scheduled_reset_issuances_key_unique",
			"scheduled_reset_issuances_pkey",
		]);
		expect(
			issuanceIndexes.rows.every((row) => row.indexdef.includes("UNIQUE")),
		).toBe(true);
		const commandIndexes = await pool.query<{
			indexname: string;
			indexdef: string;
		}>(
			`select indexname, indexdef
			from pg_indexes
			where schemaname = 'public'
				and tablename = 'edge_commands'
				and indexname in (
					'edge_commands_id_issuer_class_unique',
					'edge_commands_id_issuer_class_type_unique'
				)
			order by indexname`,
		);
		expect(commandIndexes.rows).toHaveLength(2);
		expect(
			commandIndexes.rows.every((row) => row.indexdef.includes("UNIQUE")),
		).toBe(true);
		const compositeForeignKeys = await pool.query<{
			conname: string;
			contype: string;
			convalidated: boolean;
		}>(
			`select conname, contype, convalidated
			from pg_constraint
			where conname in (
				'audit_log_command_issuer_fk',
				'scheduled_reset_issuances_command_fk'
			)
			order by conname`,
		);
		expect(compositeForeignKeys.rows).toEqual([
			{
				conname: "audit_log_command_issuer_fk",
				contype: "f",
				convalidated: true,
			},
			{
				conname: "scheduled_reset_issuances_command_fk",
				contype: "f",
				convalidated: true,
			},
		]);

		const humanResetId = await createCommand({
			issuerClass: "human",
			principalId: staffPrincipalId,
			type: "reset_zero",
			targetValue: null,
		});
		await expect(
			insertIssuance({
				businessDay: "2026-08-14",
				issuanceKey: "scheduled-reset:2026-08-14",
				commandId: humanResetId,
			}),
		).rejects.toThrow();

		const systemSetCountId = await createCommand({
			issuerClass: "system",
			principalId: null,
			type: "set_count",
			targetValue: 1,
		});
		await expect(
			insertIssuance({
				businessDay: "2026-08-14",
				issuanceKey: "scheduled-reset:2026-08-14",
				commandId: systemSetCountId,
			}),
		).rejects.toThrow();

		const duplicateBusinessDayId = await createCommand({
			issuerClass: "system",
			principalId: null,
			type: "reset_zero",
			targetValue: null,
		});
		await expect(
			insertIssuance({
				businessDay: "2026-08-13",
				issuanceKey: "scheduled-reset:2026-08-13",
				commandId: duplicateBusinessDayId,
			}),
		).rejects.toMatchObject({ code: "23505" });

		const duplicateKeyId = await createCommand({
			issuerClass: "system",
			principalId: null,
			type: "reset_zero",
			targetValue: null,
		});
		const duplicateKeyArbiter = await pool.query(
			`insert into scheduled_reset_issuances (
				business_day,
				issuance_key,
				settings_version,
				scheduled_close,
				due_at,
				command_id,
				command_issuer_class,
				command_type,
				issued_at
			) values ($1, $2, $3, $4, $5, $6, 'system', 'reset_zero', $7)
			on conflict (issuance_key) do nothing
			returning command_id`,
			[
				"2026-08-13",
				"scheduled-reset:2026-08-13",
				settingsVersion,
				"2026-08-13T11:30:00.000Z",
				"2026-08-13T12:00:00.000Z",
				duplicateKeyId,
				"2026-08-13T12:00:00.000Z",
			],
		);
		expect(duplicateKeyArbiter.rowCount).toBe(0);

		await expect(
			insertIssuance({
				businessDay: "2026-08-16",
				issuanceKey: "scheduled-reset:2026-08-16",
				commandId: validCommandId,
			}),
		).rejects.toMatchObject({
			code: "23505",
			constraint: "scheduled_reset_issuances_command_unique",
		});

		const earlyDueCommandId = await createCommand({
			issuerClass: "system",
			principalId: null,
			type: "reset_zero",
			targetValue: null,
		});
		await expect(
			insertIssuance({
				businessDay: "2026-08-17",
				issuanceKey: "scheduled-reset:2026-08-17",
				commandId: earlyDueCommandId,
				scheduledClose: "2026-08-17T12:00:00.000Z",
				dueAt: "2026-08-17T11:59:59.999Z",
				issuedAt: "2026-08-17T12:00:00.000Z",
			}),
		).rejects.toThrow();

		const earlyIssueCommandId = await createCommand({
			issuerClass: "system",
			principalId: null,
			type: "reset_zero",
			targetValue: null,
		});
		await expect(
			insertIssuance({
				businessDay: "2026-08-18",
				issuanceKey: "scheduled-reset:2026-08-18",
				commandId: earlyIssueCommandId,
				scheduledClose: "2026-08-18T11:30:00.000Z",
				dueAt: "2026-08-18T12:00:00.000Z",
				issuedAt: "2026-08-18T11:59:59.999Z",
			}),
		).rejects.toThrow();

		const dateStyleValidCommandId = await createCommand({
			issuerClass: "system",
			principalId: null,
			type: "reset_zero",
			targetValue: null,
		});
		const dateStyleInvalidCommandId = await createCommand({
			issuerClass: "system",
			principalId: null,
			type: "reset_zero",
			targetValue: null,
		});
		const client = await pool.connect();
		try {
			await client.query("set datestyle to 'SQL, DMY'");
			await client.query(
				`insert into scheduled_reset_issuances (
					business_day,
					issuance_key,
					settings_version,
					scheduled_close,
					due_at,
					command_id,
					command_issuer_class,
					command_type,
					issued_at
				) values (
					date '2026-08-19',
					'scheduled-reset:2026-08-19',
					$1,
					timestamptz '2026-08-19T11:30:00.000Z',
					timestamptz '2026-08-19T12:00:00.000Z',
					$2,
					'system',
					'reset_zero',
					timestamptz '2026-08-19T12:00:00.000Z'
				)`,
				[settingsVersion, dateStyleValidCommandId],
			);
			await expect(
				client.query(
					`insert into scheduled_reset_issuances (
						business_day,
						issuance_key,
						settings_version,
						scheduled_close,
						due_at,
						command_id,
						command_issuer_class,
						command_type,
						issued_at
					) values (
						date '2026-08-20',
						'scheduled-reset:2026-08-21',
						$1,
						timestamptz '2026-08-20T11:30:00.000Z',
						timestamptz '2026-08-20T12:00:00.000Z',
						$2,
						'system',
						'reset_zero',
						timestamptz '2026-08-20T12:00:00.000Z'
					)`,
					[settingsVersion, dateStyleInvalidCommandId],
				),
			).rejects.toMatchObject({
				code: "23514",
				constraint: "scheduled_reset_issuances_key_coherent",
			});
		} finally {
			await client.query("set datestyle to 'ISO, MDY'");
			client.release();
		}

		const claims = await pool.query<{ count: string }>(
			"select count(*) from scheduled_reset_issuances",
		);
		expect(claims.rows[0]?.count).toBe("2");
	});
});
const closedWeek = {
	sun: null,
	mon: null,
	tue: null,
	wed: null,
	thu: null,
	fri: null,
	sat: null,
} as const;

function evaluateThursdayReset(
	businessDay: string,
	now: string,
	priorIssuances: Array<{
		businessDay: string;
		commandId: number;
		status: "pending" | "applied" | "superseded";
	}> = [],
) {
	return evaluateScheduledReset({
		businessDay,
		now: new Date(now),
		settingsVersions: [
			{
				version: Number(settingsVersion),
				effectiveFrom: new Date("2026-08-01T00:00:00.000Z"),
				timeZone: "Asia/Riyadh",
				businessDayBoundary: "04:00",
				resetBufferMinutes: 30,
				weeklySchedule: {
					...closedWeek,
					thu: { open: "06:00", close: "23:00" },
				},
			},
		],
		priorIssuances,
	});
}

function requireIssueDecision(
	value: ReturnType<typeof evaluateThursdayReset>,
): SystemResetIssuanceDecision {
	if (value.decision !== "issue") {
		throw new Error(`Expected issue decision, received ${value.reason}`);
	}
	return value;
}

function expectIssuanceToPreserveDecision(
	issuance: {
		businessDay: string;
		issuanceKey: string;
		settingsVersion: number;
		scheduledCloseAt: Date;
		dueAt: Date;
		commandId: number;
		issuedAt: Date;
	},
	decision: SystemResetIssuanceDecision,
	commandId: number,
) {
	expect(issuance.businessDay).toBe(decision.businessDay);
	expect(typeof issuance.businessDay).toBe("string");
	expect(issuance.issuanceKey).toBe(decision.issuanceKey);
	expect(issuance.settingsVersion).toBe(decision.settingsVersion);
	expect(issuance.commandId).toBe(commandId);
	for (const [actual, expected] of [
		[issuance.scheduledCloseAt, decision.scheduledCloseAt],
		[issuance.dueAt, decision.dueAt],
		[issuance.issuedAt, decision.issuedAt],
	] as const) {
		expect(actual).toBeInstanceOf(Date);
		expect(actual.toISOString()).toBe(expected.toISOString());
	}
}

async function completeWithin<T>(
	operation: Promise<T>,
	label: string,
): Promise<T> {
	let timeoutId: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<never>((_resolve, reject) => {
		timeoutId = setTimeout(() => {
			reject(new Error(`${label} did not settle within 3 seconds`));
		}, 3_000);
	});
	try {
		return await Promise.race([operation, timeout]);
	} finally {
		if (timeoutId) clearTimeout(timeoutId);
	}
}

async function setActiveDevice(activeDeviceId: string | null) {
	if (!activeDeviceId) {
		await pool.query(
			`update current_state set
				current_count = null,
				band = null,
				source = null,
				last_push_received_at = null,
				last_edge_reported_at = null,
				active_device_id = null,
				settings_version = null,
				updated_at = $1
			where id = 1`,
			["2026-08-20T20:30:00.000Z"],
		);
		return;
	}
	await pool.query(
		`update current_state set
			current_count = 7,
			band = 'quiet',
			source = 'edge',
			last_push_received_at = $1,
			last_edge_reported_at = $1,
			active_device_id = $2,
			settings_version = $3,
			updated_at = $1
		where id = 1`,
		["2026-08-20T20:30:00.000Z", activeDeviceId, settingsVersion],
	);
}

async function issuanceTables() {
	return {
		commands: (await pool.query("select * from edge_commands order by id"))
			.rows,
		audits: (await pool.query("select * from audit_log order by id")).rows,
		issuances: (
			await pool.query(
				"select * from scheduled_reset_issuances order by business_day",
			)
		).rows,
	};
}

describe.sequential("Phase 7 scheduled reset command service", () => {
	it("does nothing before due and atomically issues system provenance at exact due", async () => {
		await setActiveDevice(deviceId);
		const before = await issuanceTables();
		expect(
			evaluateThursdayReset("2026-08-20", "2026-08-20T20:29:59.999Z"),
		).toMatchObject({ decision: "skip", reason: "not_due" });
		expect(await issuanceTables()).toEqual(before);

		const decision = requireIssueDecision(
			evaluateThursdayReset("2026-08-20", "2026-08-20T20:30:00.000Z"),
		);
		const currentBefore = await pool.query(
			"select * from current_state where id = 1",
		);
		const result = await commands.issueScheduledReset(decision);
		expect(result).toMatchObject({ alreadyIssued: false });
		if (result.alreadyIssued) throw new Error("Expected a new issuance");
		expectIssuanceToPreserveDecision(
			result.issuance,
			decision,
			result.command.id,
		);
		expect(result.command.issuedAt).toBe(decision.issuedAt.toISOString());

		const command = await pool.query(
			"select * from edge_commands where id = $1",
			[result.command.id],
		);
		expect(command.rows[0]).toMatchObject({
			device_id: deviceId,
			type: "reset_zero",
			target_value: null,
			status: "pending",
			issuer_class: "system",
			issued_by_principal_id: null,
			reason: "scheduled reset for business day 2026-08-20",
		});
		expect(new Date(command.rows[0]?.issued_at).toISOString()).toBe(
			decision.issuedAt.toISOString(),
		);
		const audit = await pool.query(
			"select * from audit_log where command_id = $1",
			[result.command.id],
		);
		expect(audit.rows[0]).toMatchObject({
			actor_principal_id: null,
			actor_principal_kind: "system",
			actor_role: null,
			command_issuer_class: "system",
			action: "reset",
			prior_value: 7,
			requested_delta: null,
			requested_value: 0,
			effective_value: 0,
			reason: decision.command.reason,
		});
		expect(new Date(audit.rows[0]?.created_at).toISOString()).toBe(
			decision.issuedAt.toISOString(),
		);
		const claim = await pool.query(
			`select business_day::text as business_day, issuance_key,
				settings_version, scheduled_close, due_at, command_id,
				command_issuer_class, command_type, issued_at
			from scheduled_reset_issuances where business_day = $1`,
			[decision.businessDay],
		);
		expect(claim.rows[0]).toMatchObject({
			business_day: decision.businessDay,
			issuance_key: decision.issuanceKey,
			settings_version: settingsVersion,
			command_id: String(result.command.id),
			command_issuer_class: "system",
			command_type: "reset_zero",
		});
		expect(new Date(claim.rows[0]?.scheduled_close).toISOString()).toBe(
			decision.scheduledCloseAt.toISOString(),
		);
		expect(new Date(claim.rows[0]?.due_at).toISOString()).toBe(
			decision.dueAt.toISOString(),
		);
		expect(new Date(claim.rows[0]?.issued_at).toISOString()).toBe(
			decision.issuedAt.toISOString(),
		);
		expect(
			await pool.query("select * from current_state where id = 1"),
		).toEqual(currentBefore);
		const olderPending = await pool.query<{
			id: string;
			status: string;
			superseded_by_command_id: string;
		}>(
			`select id::text, status, superseded_by_command_id::text
			from edge_commands
			where id = any($1::bigint[])
			order by id`,
			[[legacyStaffCommandId, legacyOwnerCommandId]],
		);
		expect(olderPending.rows).toEqual([
			{
				id: legacyStaffCommandId,
				status: "superseded",
				superseded_by_command_id: String(result.command.id),
			},
			{
				id: legacyOwnerCommandId,
				status: "superseded",
				superseded_by_command_id: String(result.command.id),
			},
		]);
	});

	it("never reopens a claimed day after pending, applied, or superseded lifecycle states", async () => {
		const pendingDecision = requireIssueDecision(
			evaluateThursdayReset("2026-08-20", "2026-08-20T20:31:00.000Z"),
		);
		const pendingBefore = await issuanceTables();
		const pendingCommand = await pool.query<{ command_id: string }>(
			`select command_id::text from scheduled_reset_issuances
			where business_day = $1`,
			[pendingDecision.businessDay],
		);
		const pending = await commands.issueScheduledReset(pendingDecision);
		if (!pending.alreadyIssued)
			throw new Error("Expected existing pending claim");
		expectIssuanceToPreserveDecision(
			pending.issuance,
			{
				...pendingDecision,
				issuedAt: new Date("2026-08-20T20:30:00.000Z"),
			},
			Number(pendingCommand.rows[0]?.command_id),
		);
		expect(await issuanceTables()).toEqual(pendingBefore);

		const appliedDecision = requireIssueDecision(
			evaluateThursdayReset("2026-08-27", "2026-08-27T20:30:00.000Z"),
		);
		const applied = await commands.issueScheduledReset(appliedDecision);
		if (applied.alreadyIssued)
			throw new Error("Expected applied fixture issue");
		await pool.query(
			`update edge_commands set
				status = 'applied', delivered_at = $2, applied_at = $2
			where id = $1`,
			[applied.command.id, "2026-08-27T20:31:00.000Z"],
		);
		const appliedBefore = await issuanceTables();
		expect(await commands.issueScheduledReset(appliedDecision)).toMatchObject({
			alreadyIssued: true,
		});
		expect(await issuanceTables()).toEqual(appliedBefore);

		const supersededDecision = requireIssueDecision(
			evaluateThursdayReset("2026-09-03", "2026-09-03T20:30:00.000Z"),
		);
		const superseded = await commands.issueScheduledReset(supersededDecision);
		if (superseded.alreadyIssued) {
			throw new Error("Expected superseded fixture issue");
		}
		const newer = await createCommand({
			issuerClass: "human",
			principalId: staffPrincipalId,
			type: "reset_zero",
			targetValue: null,
		});
		await pool.query(
			`update edge_commands set
				status = 'superseded', superseded_at = $2,
				superseded_by_command_id = $3
			where id = $1`,
			[superseded.command.id, "2026-09-03T20:31:00.000Z", newer],
		);
		const supersededBefore = await issuanceTables();
		expect(
			await commands.issueScheduledReset(supersededDecision),
		).toMatchObject({ alreadyIssued: true });
		expect(await issuanceTables()).toEqual(supersededBefore);
	});

	it("synchronizes concurrent issue calls before locking and settles exactly once", async () => {
		const { createCommandServiceDatabase } = await import(
			"./command-repository"
		);
		const decision = requireIssueDecision(
			evaluateThursdayReset("2026-09-10", "2026-09-10T20:30:00.000Z"),
		);
		const before = await issuanceTables();
		let arrivals = 0;
		let releasePreLockGate!: () => void;
		let abortPreLockGate!: (error: unknown) => void;
		let observeBothCalls!: () => void;
		const preLockGate = new Promise<void>((resolve, reject) => {
			releasePreLockGate = resolve;
			abortPreLockGate = reject;
		});
		const bothCallsObserved = new Promise<void>((resolve) => {
			observeBothCalls = resolve;
		});
		const pauseBeforeLocks = async () => {
			arrivals += 1;
			if (arrivals === 2) {
				observeBothCalls();
				releasePreLockGate();
			}
			await preLockGate;
		};
		const concurrentServices = [
			createCommandServiceDatabase(
				database as unknown as typeof import("@fitway/db").db,
				undefined,
				{ afterCommandStateObservation: pauseBeforeLocks },
			),
			createCommandServiceDatabase(
				database as unknown as typeof import("@fitway/db").db,
				undefined,
				{ afterCommandStateObservation: pauseBeforeLocks },
			),
		];
		const concurrent = Promise.all(
			concurrentServices.map((service) =>
				service.issueScheduledReset(decision),
			),
		);
		let results: Awaited<typeof concurrent>;
		try {
			await completeWithin(
				bothCallsObserved,
				"both concurrent calls reaching the pre-lock seam",
			);
			expect(arrivals).toBe(2);
			results = await completeWithin(
				concurrent,
				"concurrent scheduled-reset issuance",
			);
		} catch (error) {
			abortPreLockGate(error);
			await Promise.allSettled([concurrent]);
			throw error;
		}
		expect(results.map((result) => result.alreadyIssued).sort()).toEqual([
			false,
			true,
		]);
		const after = await issuanceTables();
		expect(after.commands).toHaveLength(before.commands.length + 1);
		expect(after.audits).toHaveLength(before.audits.length + 1);
		expect(after.issuances).toHaveLength(before.issuances.length + 1);
	});

	it("resolves only the exact business-day race by reading the winning claim", async () => {
		const { createCommandServiceDatabase } = await import(
			"./command-repository"
		);
		const decision = requireIssueDecision(
			evaluateThursdayReset("2026-10-22", "2026-10-22T20:30:00.000Z"),
		);
		const winnerCommandId = await createCommand({
			issuerClass: "system",
			principalId: null,
			type: "reset_zero",
			targetValue: null,
			reason: decision.command.reason,
			issuedAt: decision.issuedAt.toISOString(),
		});
		await insertAudit({
			actorPrincipalId: null,
			actorPrincipalKind: "system",
			actorRole: null,
			commandId: winnerCommandId,
			commandIssuerClass: "system",
			reason: decision.command.reason,
			createdAt: decision.issuedAt.toISOString(),
		});
		await pool.query(
			`update edge_commands set
				status = 'applied', delivered_at = $2, applied_at = $2
			where id = $1`,
			[winnerCommandId, "2026-10-22T20:30:00.000Z"],
		);
		const raced = createCommandServiceDatabase(
			database as unknown as typeof import("@fitway/db").db,
			undefined,
			{
				beforeScheduledResetIssuanceInsert: async () => {
					await insertIssuance({
						businessDay: decision.businessDay,
						issuanceKey: decision.issuanceKey,
						commandId: winnerCommandId,
						scheduledClose: decision.scheduledCloseAt.toISOString(),
						dueAt: decision.dueAt.toISOString(),
						issuedAt: decision.issuedAt.toISOString(),
					});
				},
			},
		);
		const before = await issuanceTables();
		const result = await raced.issueScheduledReset(decision);
		if (!result.alreadyIssued) throw new Error("Expected winning race claim");
		expectIssuanceToPreserveDecision(
			result.issuance,
			decision,
			Number(winnerCommandId),
		);
		const after = await issuanceTables();
		expect(after.commands).toEqual(before.commands);
		expect(after.audits).toEqual(before.audits);
		expect(after.issuances).toHaveLength(before.issuances.length + 1);
	});

	it("propagates an unrelated claim constraint failure and rolls back", async () => {
		const wrongSettingsDecision = {
			...requireIssueDecision(
				evaluateThursdayReset("2026-10-29", "2026-10-29T20:30:00.000Z"),
			),
			settingsVersion: Number.MAX_SAFE_INTEGER,
		};
		const before = await issuanceTables();
		await expect(
			commands.issueScheduledReset(wrongSettingsDecision),
		).rejects.toMatchObject({
			cause: {
				code: "23503",
				constraint:
					"scheduled_reset_issuances_settings_version_settings_versions_ve",
			},
		});
		expect(await issuanceTables()).toEqual(before);
	});

	it("rolls back missing or changed targets and injected command, audit, and claim failures", async () => {
		const { createCommandServiceDatabase } = await import(
			"./command-repository"
		);
		await setActiveDevice(null);
		await pool.query("update edge_devices set enabled = false");
		const missingBefore = await issuanceTables();
		await expect(
			commands.issueScheduledReset(
				requireIssueDecision(
					evaluateThursdayReset("2026-09-17", "2026-09-17T20:30:00.000Z"),
				),
			),
		).rejects.toMatchObject({ code: "device_unavailable" });
		expect(await issuanceTables()).toEqual(missingBefore);

		await pool.query("update edge_devices set enabled = true where id = $1", [
			deviceId,
		]);
		await setActiveDevice(deviceId);
		const secondDevice = await pool.query<{ id: string }>(
			`insert into edge_devices (name, token_hash)
			values ('phase-7-changed-target', $1)
			returning id`,
			["8".repeat(64)],
		);
		const secondDeviceId = secondDevice.rows[0]?.id;
		if (!secondDeviceId)
			throw new Error("Second device fixture was not created");
		const changed = createCommandServiceDatabase(
			database as unknown as typeof import("@fitway/db").db,
			undefined,
			{
				afterCommandStateObservation: async () => {
					await pool.query(
						"update current_state set active_device_id = $1 where id = 1",
						[secondDeviceId],
					);
				},
			},
		);
		const changedBefore = await issuanceTables();
		await expect(
			changed.issueScheduledReset(
				requireIssueDecision(
					evaluateThursdayReset("2026-09-24", "2026-09-24T20:30:00.000Z"),
				),
			),
		).rejects.toThrow("Active command target changed during issuance");
		expect(await issuanceTables()).toEqual(changedBefore);
		await setActiveDevice(deviceId);

		const failures = [
			{
				businessDay: "2026-10-01",
				message: "forced command failure",
				service: createCommandServiceDatabase(
					database as unknown as typeof import("@fitway/db").db,
					undefined,
					{
						beforeSystemCommandInsert: () => {
							throw new Error("forced command failure");
						},
					},
				),
			},
			{
				businessDay: "2026-10-08",
				message: "forced audit failure",
				service: createCommandServiceDatabase(
					database as unknown as typeof import("@fitway/db").db,
					async () => {
						throw new Error("forced audit failure");
					},
				),
			},
			{
				businessDay: "2026-10-15",
				message: "forced claim failure",
				service: createCommandServiceDatabase(
					database as unknown as typeof import("@fitway/db").db,
					undefined,
					{
						beforeScheduledResetIssuanceInsert: () => {
							throw new Error("forced claim failure");
						},
					},
				),
			},
		];
		for (const failure of failures) {
			const before = await issuanceTables();
			await expect(
				failure.service.issueScheduledReset(
					requireIssueDecision(
						evaluateThursdayReset(
							failure.businessDay,
							`${failure.businessDay}T20:30:00.000Z`,
						),
					),
				),
			).rejects.toThrow(failure.message);
			expect(await issuanceTables()).toEqual(before);
		}
	});

	it("rejects fabricated system audit provenance at the database boundary", async () => {
		const before = await issuanceTables();
		await expect(
			commands.issueReset(
				{
					principalId: staffPrincipalId,
					principalKind: "system",
					role: null,
				} as never,
				{},
			),
		).rejects.toMatchObject({
			cause: {
				code: "23514",
				constraint: "audit_log_actor_kind_role",
			},
		});
		expect(await issuanceTables()).toEqual(before);
	});
});

describe.sequential("Phase 7 scheduled reset runner and repository", () => {
	it("reads ordered history and joined issuance status while issuing exact and late past-midnight resets", async () => {
		const [fridaySettings, overnightSettings] = await database
			.insert(applicationSchema.settingsVersions)
			.values([
				{
					capacity: 100,
					quietMaxPercent: 25,
					moderateMaxPercent: 50,
					busyMaxPercent: 75,
					timezone: "UTC",
					businessDayBoundary: "04:00",
					resetBufferMinutes: 30,
					scheduleSunOpen: null,
					scheduleSunClose: null,
					scheduleMonOpen: null,
					scheduleMonClose: null,
					scheduleTueOpen: null,
					scheduleTueClose: null,
					scheduleWedOpen: null,
					scheduleWedClose: null,
					scheduleThuOpen: null,
					scheduleThuClose: null,
					scheduleFriOpen: "10:00",
					scheduleFriClose: "18:00",
					scheduleSatOpen: null,
					scheduleSatClose: null,
					effectiveFrom: new Date("2026-08-01T00:00:00.000Z"),
				},
				{
					capacity: 100,
					quietMaxPercent: 25,
					moderateMaxPercent: 50,
					busyMaxPercent: 75,
					timezone: "UTC",
					businessDayBoundary: "04:00",
					resetBufferMinutes: 30,
					scheduleSunOpen: null,
					scheduleSunClose: null,
					scheduleMonOpen: null,
					scheduleMonClose: null,
					scheduleTueOpen: null,
					scheduleTueClose: null,
					scheduleWedOpen: null,
					scheduleWedClose: null,
					scheduleThuOpen: null,
					scheduleThuClose: null,
					scheduleFriOpen: "14:00",
					scheduleFriClose: "02:00",
					scheduleSatOpen: null,
					scheduleSatClose: null,
					effectiveFrom: new Date("2026-11-01T00:00:00.000Z"),
				},
			])
			.returning({ version: applicationSchema.settingsVersions.version });
		if (!fridaySettings || !overnightSettings) {
			throw new Error("Phase 7 runner settings fixtures were not created");
		}

		const repository = createResetRepository(
			database as unknown as typeof import("@fitway/db").db,
		);
		const settings = await repository.readSettingsVersions();
		expect(settings).toEqual(
			[...settings].sort(
				(left, right) =>
					left.effectiveFrom.getTime() - right.effectiveFrom.getTime() ||
					left.version - right.version,
			),
		);
		expect(settings.map((row) => row.version)).toEqual(
			expect.arrayContaining([
				Number(settingsVersion),
				fridaySettings.version,
				overnightSettings.version,
			]),
		);
		expect(settings).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					version: fridaySettings.version,
					resetBufferMinutes: 30,
					weeklySchedule: expect.objectContaining({
						fri: { open: "10:00:00", close: "18:00:00" },
					}),
				}),
			]),
		);

		const exactDue = createScheduledResetRunner({
			now: () => new Date("2026-08-07T18:30:00.000Z"),
			...repository,
			issueScheduledReset: (decision) => commands.issueScheduledReset(decision),
		});
		await exactDue.run();

		const lateAfterMidnight = createScheduledResetRunner({
			now: () => new Date("2026-11-07T03:00:00.000Z"),
			...repository,
			issueScheduledReset: (decision) => commands.issueScheduledReset(decision),
		});
		await lateAfterMidnight.run();

		const priorIssuances = await repository.readPriorIssuances();
		expect(priorIssuances).toEqual(
			expect.arrayContaining([
				{
					businessDay: "2026-08-07",
					commandId: expect.any(Number),
					status: "superseded",
				},
				{
					businessDay: "2026-11-06",
					commandId: expect.any(Number),
					status: "pending",
				},
			]),
		);
	});
});
