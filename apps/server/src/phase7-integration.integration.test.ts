import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDisposableIntegrationDatabase } from "./test-support/integration-database-safety";

const connectionString = process.env.TEST_DATABASE_URL;
assertDisposableIntegrationDatabase({
	connectionString,
	resetMarker: process.env.FITWAY_INTEGRATION_RESET_DATABASE,
	runId: process.env.FITWAY_RUN_ID,
});

const pool = new Pool({ connectionString });
const migrationsFolder = path.resolve("packages/db/src/migrations");

let settingsVersion = "";
let deviceId = "";
let staffPrincipalId = "";
let ownerPrincipalId = "";
let legacyStaffCommandId = "";
let legacyOwnerCommandId = "";

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
}) {
	const result = await pool.query<{ id: string }>(
		`insert into edge_commands (
			device_id,
			type,
			target_value,
			issuer_class,
			issued_by_principal_id,
			issued_at
		) values ($1, $2, $3, $4, $5, $6)
		returning id`,
		[
			deviceId,
			input.type,
			input.targetValue,
			input.issuerClass,
			input.principalId,
			"2026-08-13T12:00:00.000Z",
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
		) values ($1, $2, $3, $4, $5, 'reset', 7, 0, 0, 'scheduled close', $6)`,
		[
			input.actorPrincipalId,
			input.actorPrincipalKind,
			input.actorRole,
			input.commandId,
			input.commandIssuerClass,
			"2026-08-13T12:00:00.000Z",
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
});

afterAll(async () => {
	await pool.end();
});

describe("Phase 7 additive scheduled-reset persistence", () => {
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
				issuanceKey: "scheduled-reset:duplicate-day",
				commandId: duplicateBusinessDayId,
			}),
		).rejects.toThrow();

		const duplicateKeyId = await createCommand({
			issuerClass: "system",
			principalId: null,
			type: "reset_zero",
			targetValue: null,
		});
		await expect(
			insertIssuance({
				businessDay: "2026-08-15",
				issuanceKey: "scheduled-reset:2026-08-13",
				commandId: duplicateKeyId,
			}),
		).rejects.toThrow();

		await expect(
			insertIssuance({
				businessDay: "2026-08-16",
				issuanceKey: "scheduled-reset:2026-08-16",
				commandId: validCommandId,
			}),
		).rejects.toThrow();

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

		const nonIsoCommandId = await createCommand({
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
				[settingsVersion, nonIsoCommandId],
			);
		} finally {
			client.release();
		}

		const claims = await pool.query<{ count: string }>(
			"select count(*) from scheduled_reset_issuances",
		);
		expect(claims.rows[0]?.count).toBe("2");
	});
});
