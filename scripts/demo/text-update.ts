import { isDeepStrictEqual } from "node:util";
import { Pool, type PoolClient } from "pg";

import {
	assertDemoDatabaseUrl,
	DEMO_DATABASE_URL,
	DEMO_OWNER_EMAIL,
} from "./contract";

type JsonRecord = Record<string, unknown>;

export const DEMO_PRESENTATION_TEXT = {
	ownerDisplayName: "إدارة نادي FITWAY",
	staffDisplayName: "فريق الاستقبال",
	settingsBaseline: "اعتماد إعدادات التشغيل الأساسية للصالة",
	frontDeskReconciliation: "مطابقة العدد مع سجل مكتب الاستقبال",
	occupancyReview: "مراجعة العدد بعد جولة داخل الصالة",
	closingReset: "تصفير العدد عند إغلاق الصالة",
	entryGateReconciliation: "مطابقة العدد مع سجل بوابة الدخول",
	septemberSettings: "تحديث إعدادات التشغيل لشهر سبتمبر",
} as const;

const PRINCIPAL_PREIMAGES = {
	owner: ["FITWAY Demo Owner", DEMO_PRESENTATION_TEXT.ownerDisplayName],
	staff: ["Shared front desk", DEMO_PRESENTATION_TEXT.staffDisplayName],
} as const;

const COMMAND_SPECS = [
	{
		action: "correction_delta",
		actor: "staff",
		priorValue: 34,
		requestedDelta: 3,
		requestedValue: null,
		effectiveValue: 37,
		commandType: "set_count",
		targetValue: 37,
		acceptedReasons: [
			"Synthetic front-desk headcount reconciliation",
			DEMO_PRESENTATION_TEXT.frontDeskReconciliation,
		],
		finalReason: DEMO_PRESENTATION_TEXT.frontDeskReconciliation,
	},
	{
		action: "correction_absolute",
		actor: "owner",
		priorValue: 28,
		requestedDelta: null,
		requestedValue: 25,
		effectiveValue: 25,
		commandType: "set_count",
		targetValue: 25,
		acceptedReasons: [
			"Synthetic occupancy review",
			DEMO_PRESENTATION_TEXT.occupancyReview,
		],
		finalReason: DEMO_PRESENTATION_TEXT.occupancyReview,
	},
	{
		action: "reset",
		actor: "owner",
		priorValue: 7,
		requestedDelta: null,
		requestedValue: 0,
		effectiveValue: 0,
		commandType: "reset_zero",
		targetValue: null,
		acceptedReasons: [
			"Synthetic closing walkthrough reset",
			DEMO_PRESENTATION_TEXT.closingReset,
		],
		finalReason: DEMO_PRESENTATION_TEXT.closingReset,
	},
	{
		action: "correction_delta",
		actor: "staff",
		priorValue: 52,
		requestedDelta: -2,
		requestedValue: null,
		effectiveValue: 50,
		commandType: "set_count",
		targetValue: 50,
		acceptedReasons: [
			"Synthetic turnstile reconciliation",
			"Front desk count reconciliation",
			DEMO_PRESENTATION_TEXT.entryGateReconciliation,
		],
		finalReason: DEMO_PRESENTATION_TEXT.entryGateReconciliation,
	},
] as const;

const SETTINGS_SPECS = [
	{
		settingsVersion: 3,
		acceptedReasons: [
			"Synthetic demo baseline",
			DEMO_PRESENTATION_TEXT.settingsBaseline,
		],
		finalReason: DEMO_PRESENTATION_TEXT.settingsBaseline,
	},
	{
		settingsVersion: 4,
		acceptedReasons: [
			"Synthetic owner-demo profile refresh",
			"Updated September operating profile",
			DEMO_PRESENTATION_TEXT.septemberSettings,
		],
		finalReason: DEMO_PRESENTATION_TEXT.septemberSettings,
	},
] as const;

export type DemoTextSnapshot = {
	principals: JsonRecord[];
	commandPairs: Array<{
		commandRecord: JsonRecord;
		auditRecord: JsonRecord;
	}>;
	settingsAudits: JsonRecord[];
};

export type DemoTextRecord = {
	table: "auth_principals" | "edge_commands" | "audit_log";
	id: string;
	field: "display_name" | "reason";
	action: string;
	timestamp: string;
	oldText: string;
	newText: string;
	status: "change" | "unchanged";
};

export type DemoTextUpdateResult = {
	mode: "preview" | "apply";
	records: DemoTextRecord[];
	updatedRows: number;
};

export type DemoTextLockTargets = {
	principalIds: string[];
	commandIds: string[];
	auditIds: string[];
};

export interface DemoTextStore {
	begin(mode: "preview" | "apply"): Promise<void>;
	readSnapshot(): Promise<DemoTextSnapshot>;
	lockTargets(targets: DemoTextLockTargets): Promise<void>;
	updatePrincipal(
		id: string,
		oldText: string,
		newText: string,
	): Promise<number>;
	updateCommandReason(
		id: string,
		oldText: string,
		newText: string,
	): Promise<number>;
	updateAuditReason(
		id: string,
		oldText: string,
		newText: string,
	): Promise<number>;
	commit(): Promise<void>;
	rollback(): Promise<void>;
	close(): Promise<void>;
}

type DemoTextPlan = DemoTextLockTargets & { records: DemoTextRecord[] };

function value(record: JsonRecord, field: string): unknown {
	return record[field];
}

function id(record: JsonRecord): string {
	const candidate = value(record, "id");
	if (typeof candidate !== "string" && typeof candidate !== "number") {
		throw new Error("Demo text target has an invalid record id");
	}
	return String(candidate);
}

function text(record: JsonRecord, field: string): string {
	const candidate = value(record, field);
	if (typeof candidate !== "string") {
		throw new Error(`Demo text target ${id(record)} has no ${field}`);
	}
	return candidate;
}

function timestamp(record: JsonRecord, field: string): string {
	const candidate = value(record, field);
	if (typeof candidate !== "string") {
		throw new Error(`Demo text target ${id(record)} has no ${field}`);
	}
	return candidate;
}

function numberOrNull(candidate: unknown): number | null | undefined {
	if (candidate === null) return null;
	if (
		(typeof candidate === "number" || typeof candidate === "string") &&
		candidate !== "" &&
		Number.isSafeInteger(Number(candidate))
	) {
		return Number(candidate);
	}
	return undefined;
}

function hasValue(
	record: JsonRecord,
	field: string,
	expected: unknown,
): boolean {
	if (typeof expected === "number" || expected === null) {
		return numberOrNull(value(record, field)) === expected;
	}
	return value(record, field) === expected;
}

function expectOne<T>(records: T[], label: string): T {
	if (records.length !== 1) {
		throw new Error(
			`Expected exactly one ${label}; found ${records.length}. Refusing demo text update.`,
		);
	}
	return records[0] as T;
}

function assertAccepted(
	current: string,
	accepted: readonly string[],
	label: string,
): void {
	if (!accepted.includes(current)) {
		throw new Error(
			`Unexpected ${label} text ${JSON.stringify(current)}. Refusing demo text update.`,
		);
	}
}

function recordChange(input: Omit<DemoTextRecord, "status">): DemoTextRecord {
	return {
		...input,
		status: input.oldText === input.newText ? "unchanged" : "change",
	};
}

function matchesCommandStructure(
	pair: DemoTextSnapshot["commandPairs"][number],
	spec: (typeof COMMAND_SPECS)[number],
	ownerId: string,
	staffId: string,
): boolean {
	const { auditRecord: audit, commandRecord: command } = pair;
	const actorId = spec.actor === "owner" ? ownerId : staffId;
	const actorKind = spec.actor === "owner" ? "owner" : "shared_staff";
	const actorRole = spec.actor === "owner" ? "owner" : "staff";
	return (
		hasValue(audit, "event_class", "command") &&
		hasValue(audit, "actor_principal_id", actorId) &&
		hasValue(audit, "actor_principal_kind", actorKind) &&
		hasValue(audit, "actor_role", actorRole) &&
		hasValue(audit, "command_id", numberOrNull(value(command, "id"))) &&
		hasValue(audit, "command_issuer_class", "human") &&
		hasValue(audit, "action", spec.action) &&
		hasValue(audit, "prior_value", spec.priorValue) &&
		hasValue(audit, "requested_delta", spec.requestedDelta) &&
		hasValue(audit, "requested_value", spec.requestedValue) &&
		hasValue(audit, "effective_value", spec.effectiveValue) &&
		hasValue(audit, "target_principal_id", null) &&
		hasValue(audit, "settings_version", null) &&
		hasValue(command, "type", spec.commandType) &&
		hasValue(command, "target_value", spec.targetValue) &&
		hasValue(command, "status", "applied") &&
		hasValue(command, "issuer_class", "human") &&
		hasValue(command, "issued_by_principal_id", actorId) &&
		hasValue(command, "superseded_at", null) &&
		hasValue(command, "superseded_by_command_id", null) &&
		typeof value(command, "delivered_at") === "string" &&
		typeof value(command, "applied_at") === "string" &&
		value(audit, "created_at") === value(command, "applied_at")
	);
}

function matchesSettingsStructure(
	audit: JsonRecord,
	settingsVersion: number,
	ownerId: string,
): boolean {
	return (
		hasValue(audit, "event_class", "settings") &&
		hasValue(audit, "actor_principal_id", ownerId) &&
		hasValue(audit, "actor_principal_kind", "owner") &&
		hasValue(audit, "actor_role", "owner") &&
		hasValue(audit, "command_id", null) &&
		hasValue(audit, "command_issuer_class", null) &&
		hasValue(audit, "action", "settings_updated") &&
		hasValue(audit, "prior_value", null) &&
		hasValue(audit, "requested_delta", null) &&
		hasValue(audit, "requested_value", null) &&
		hasValue(audit, "effective_value", null) &&
		hasValue(audit, "target_principal_id", null) &&
		hasValue(audit, "settings_version", settingsVersion)
	);
}

function buildPlan(snapshot: DemoTextSnapshot): DemoTextPlan {
	const owners = snapshot.principals.filter(
		(record) =>
			value(record, "principal_kind") === "owner" &&
			value(record, "role") === "owner" &&
			value(record, "active") === true &&
			value(record, "owner_email") === DEMO_OWNER_EMAIL,
	);
	const staffPrincipals = snapshot.principals.filter(
		(record) =>
			value(record, "principal_kind") === "shared_staff" &&
			value(record, "role") === "staff" &&
			value(record, "active") === true &&
			value(record, "owner_email") === null,
	);
	const owner = expectOne(owners, "active demo owner identity");
	const staff = expectOne(staffPrincipals, "active shared-staff identity");
	const ownerId = id(owner);
	const staffId = id(staff);
	const ownerName = text(owner, "display_name");
	const staffName = text(staff, "display_name");
	assertAccepted(
		ownerName,
		PRINCIPAL_PREIMAGES.owner,
		"demo owner display name",
	);
	assertAccepted(
		staffName,
		PRINCIPAL_PREIMAGES.staff,
		"shared-staff display name",
	);

	const records: DemoTextRecord[] = [
		recordChange({
			table: "auth_principals",
			id: ownerId,
			field: "display_name",
			action: "owner identity",
			timestamp: timestamp(owner, "created_at"),
			oldText: ownerName,
			newText: DEMO_PRESENTATION_TEXT.ownerDisplayName,
		}),
		recordChange({
			table: "auth_principals",
			id: staffId,
			field: "display_name",
			action: "shared-staff identity",
			timestamp: timestamp(staff, "created_at"),
			oldText: staffName,
			newText: DEMO_PRESENTATION_TEXT.staffDisplayName,
		}),
	];

	for (const spec of COMMAND_SPECS) {
		const pair = expectOne(
			snapshot.commandPairs.filter((candidate) =>
				matchesCommandStructure(candidate, spec, ownerId, staffId),
			),
			`${spec.action} demo command fixture (${spec.priorValue} to ${spec.effectiveValue})`,
		);
		const commandReason = text(pair.commandRecord, "reason");
		const auditReason = text(pair.auditRecord, "reason");
		if (commandReason !== auditReason) {
			throw new Error(
				`Command ${id(pair.commandRecord)} and audit ${id(pair.auditRecord)} reasons differ. Refusing demo text update.`,
			);
		}
		assertAccepted(
			commandReason,
			spec.acceptedReasons,
			`${spec.action} fixture reason`,
		);
		records.push(
			recordChange({
				table: "edge_commands",
				id: id(pair.commandRecord),
				field: "reason",
				action: spec.action,
				timestamp: timestamp(pair.commandRecord, "issued_at"),
				oldText: commandReason,
				newText: spec.finalReason,
			}),
			recordChange({
				table: "audit_log",
				id: id(pair.auditRecord),
				field: "reason",
				action: spec.action,
				timestamp: timestamp(pair.auditRecord, "created_at"),
				oldText: auditReason,
				newText: spec.finalReason,
			}),
		);
	}

	for (const spec of SETTINGS_SPECS) {
		const audit = expectOne(
			snapshot.settingsAudits.filter((candidate) =>
				matchesSettingsStructure(candidate, spec.settingsVersion, ownerId),
			),
			`settings version ${spec.settingsVersion} demo audit fixture`,
		);
		const reason = text(audit, "reason");
		assertAccepted(
			reason,
			spec.acceptedReasons,
			`settings version ${spec.settingsVersion} fixture reason`,
		);
		records.push(
			recordChange({
				table: "audit_log",
				id: id(audit),
				field: "reason",
				action: `settings_updated v${spec.settingsVersion}`,
				timestamp: timestamp(audit, "created_at"),
				oldText: reason,
				newText: spec.finalReason,
			}),
		);
	}

	return {
		records,
		principalIds: records
			.filter((record) => record.table === "auth_principals")
			.map((record) => record.id),
		commandIds: records
			.filter((record) => record.table === "edge_commands")
			.map((record) => record.id),
		auditIds: records
			.filter((record) => record.table === "audit_log")
			.map((record) => record.id),
	};
}

function flatten(snapshot: DemoTextSnapshot): Map<string, JsonRecord> {
	const records = new Map<string, JsonRecord>();
	const add = (table: DemoTextRecord["table"], record: JsonRecord) => {
		const key = `${table}:${id(record)}`;
		if (records.has(key)) {
			throw new Error(`Duplicate ${key} in demo text snapshot`);
		}
		records.set(key, record);
	};
	for (const principal of snapshot.principals)
		add("auth_principals", principal);
	for (const pair of snapshot.commandPairs) {
		add("edge_commands", pair.commandRecord);
		add("audit_log", pair.auditRecord);
	}
	for (const audit of snapshot.settingsAudits) add("audit_log", audit);
	return records;
}

function assertOnlyPlannedChanges(
	before: DemoTextSnapshot,
	after: DemoTextSnapshot,
	planRecords: DemoTextRecord[],
): void {
	const beforeRecords = flatten(before);
	const afterRecords = flatten(after);
	if (beforeRecords.size !== afterRecords.size) {
		throw new Error(
			"Demo text snapshot record set changed during the transaction",
		);
	}
	const allowed = new Map(
		planRecords.map((record) => [`${record.table}:${record.id}`, record]),
	);
	for (const [key, beforeRecord] of beforeRecords) {
		const afterRecord = afterRecords.get(key);
		if (!afterRecord) {
			throw new Error(`Demo text snapshot lost ${key} during the transaction`);
		}
		const change = allowed.get(key);
		const expected = change
			? { ...beforeRecord, [change.field]: change.newText }
			: beforeRecord;
		if (!isDeepStrictEqual(afterRecord, expected)) {
			throw new Error(
				`Unexpected column change in ${key}; rolling back demo text update`,
			);
		}
	}
}

class PgDemoTextStore implements DemoTextStore {
	constructor(
		private readonly pool: Pool,
		private readonly client: PoolClient,
	) {}

	async begin(mode: "preview" | "apply"): Promise<void> {
		await this.client.query(
			mode === "preview"
				? "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY"
				: "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE",
		);
	}

	async readSnapshot(): Promise<DemoTextSnapshot> {
		const principals = await this.client.query<{ record: JsonRecord }>(
			`SELECT to_jsonb(p) AS record
				 FROM auth_principals p
				 WHERE lower(p.owner_email) = $1 OR p.principal_kind = 'shared_staff'
				 ORDER BY p.id`,
			[DEMO_OWNER_EMAIL],
		);
		const commandPairs = await this.client.query<{
			command_record: JsonRecord;
			audit_record: JsonRecord;
		}>(
			`SELECT to_jsonb(c) AS command_record, to_jsonb(a) AS audit_record
				 FROM audit_log a
				 JOIN edge_commands c ON c.id = a.command_id
				 WHERE a.event_class = 'command'
				 ORDER BY a.id`,
		);
		const settingsAudits = await this.client.query<{ record: JsonRecord }>(
			`SELECT to_jsonb(a) AS record
				 FROM audit_log a
				 WHERE a.event_class = 'settings' AND a.settings_version IN (3, 4)
				 ORDER BY a.id`,
		);
		return {
			principals: principals.rows.map((row) => row.record),
			commandPairs: commandPairs.rows.map((row) => ({
				commandRecord: row.command_record,
				auditRecord: row.audit_record,
			})),
			settingsAudits: settingsAudits.rows.map((row) => row.record),
		};
	}

	async lockTargets(targets: DemoTextLockTargets): Promise<void> {
		const principals = await this.client.query(
			"SELECT id FROM auth_principals WHERE id = ANY($1::uuid[]) ORDER BY id FOR UPDATE",
			[targets.principalIds],
		);
		const commands = await this.client.query(
			"SELECT id FROM edge_commands WHERE id = ANY($1::bigint[]) ORDER BY id FOR UPDATE",
			[targets.commandIds],
		);
		const audits = await this.client.query(
			"SELECT id FROM audit_log WHERE id = ANY($1::bigint[]) ORDER BY id FOR UPDATE",
			[targets.auditIds],
		);
		for (const [label, result, expected] of [
			["principals", principals, targets.principalIds.length],
			["commands", commands, targets.commandIds.length],
			["audit rows", audits, targets.auditIds.length],
		] as const) {
			if (result.rowCount !== expected) {
				throw new Error(
					`Could not lock every demo text ${label}; expected ${expected}, found ${result.rowCount ?? 0}`,
				);
			}
		}
	}

	async updatePrincipal(
		idValue: string,
		oldText: string,
		newText: string,
	): Promise<number> {
		const result = await this.client.query(
			"UPDATE auth_principals SET display_name = $1 WHERE id = $2::uuid AND display_name = $3 RETURNING id",
			[newText, idValue, oldText],
		);
		return result.rowCount ?? 0;
	}

	async updateCommandReason(
		idValue: string,
		oldText: string,
		newText: string,
	): Promise<number> {
		const result = await this.client.query(
			"UPDATE edge_commands SET reason = $1 WHERE id = $2::bigint AND reason = $3 RETURNING id",
			[newText, idValue, oldText],
		);
		return result.rowCount ?? 0;
	}

	async updateAuditReason(
		idValue: string,
		oldText: string,
		newText: string,
	): Promise<number> {
		const result = await this.client.query(
			"UPDATE audit_log SET reason = $1 WHERE id = $2::bigint AND reason = $3 RETURNING id",
			[newText, idValue, oldText],
		);
		return result.rowCount ?? 0;
	}

	async commit(): Promise<void> {
		await this.client.query("COMMIT");
	}

	async rollback(): Promise<void> {
		await this.client.query("ROLLBACK");
	}

	async close(): Promise<void> {
		this.client.release();
		await this.pool.end();
	}
}

async function pgStore(databaseUrl: string): Promise<DemoTextStore> {
	const pool = new Pool({ connectionString: databaseUrl });
	try {
		return new PgDemoTextStore(pool, await pool.connect());
	} catch (error) {
		await pool.end();
		throw error;
	}
}

export async function updateDemoPresentationText(input: {
	mode: "preview" | "apply";
	databaseUrl?: string;
	storeFactory?: (databaseUrl: string) => Promise<DemoTextStore>;
}): Promise<DemoTextUpdateResult> {
	const databaseUrl = input.databaseUrl ?? DEMO_DATABASE_URL;
	assertDemoDatabaseUrl(databaseUrl);
	const store = await (input.storeFactory ?? pgStore)(databaseUrl);
	let transactionOpen = false;
	try {
		await store.begin(input.mode);
		transactionOpen = true;
		const initial = await store.readSnapshot();
		const initialPlan = buildPlan(initial);
		if (input.mode === "preview") {
			await store.rollback();
			transactionOpen = false;
			return { mode: input.mode, records: initialPlan.records, updatedRows: 0 };
		}

		await store.lockTargets(initialPlan);
		const locked = await store.readSnapshot();
		assertOnlyPlannedChanges(initial, locked, []);
		const plan = buildPlan(locked);
		let updatedRows = 0;
		for (const record of plan.records) {
			if (record.status === "unchanged") continue;
			const affected =
				record.table === "auth_principals"
					? await store.updatePrincipal(
							record.id,
							record.oldText,
							record.newText,
						)
					: record.table === "edge_commands"
						? await store.updateCommandReason(
								record.id,
								record.oldText,
								record.newText,
							)
						: await store.updateAuditReason(
								record.id,
								record.oldText,
								record.newText,
							);
			if (affected !== 1) {
				throw new Error(
					`Optimistic update for ${record.table}:${record.id} affected ${affected} rows`,
				);
			}
			updatedRows += 1;
		}
		const after = await store.readSnapshot();
		buildPlan(after);
		assertOnlyPlannedChanges(locked, after, plan.records);
		await store.commit();
		transactionOpen = false;
		return { mode: input.mode, records: plan.records, updatedRows };
	} catch (error) {
		if (transactionOpen) {
			try {
				await store.rollback();
			} catch {
				// Preserve the original closed-fail error.
			}
		}
		throw error;
	} finally {
		await store.close();
	}
}

export function formatDemoTextUpdate(result: DemoTextUpdateResult): string {
	const changes = result.records.filter((record) => record.status === "change");
	const lines = [
		`Demo presentation text ${result.mode}: ${changes.length} pending change(s); ${result.updatedRows} row(s) updated.`,
	];
	for (const record of result.records) {
		lines.push(
			`${record.status.toUpperCase()} ${record.table}#${record.id} · ${record.action} · ${record.timestamp} · ${JSON.stringify(record.oldText)} -> ${JSON.stringify(record.newText)}`,
		);
	}
	return lines.join("\n");
}
