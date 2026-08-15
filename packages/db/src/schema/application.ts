import { sql } from "drizzle-orm";
import {
	type AnyPgColumn,
	bigint,
	boolean,
	check,
	date,
	doublePrecision,
	foreignKey,
	index,
	integer,
	pgEnum,
	pgTable,
	primaryKey,
	smallint,
	text,
	time,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { authPrincipals, authRole } from "./auth";

export const occupancyBand = pgEnum("occupancy_band", [
	"quiet",
	"moderate",
	"busy",
	"packed",
]);
export const currentSource = pgEnum("current_source", ["edge", "manual"]);
export const minuteSource = pgEnum("minute_source", [
	"live",
	"backfill",
	"manual",
]);
export const edgeHealthStatus = pgEnum("edge_health_status", [
	"ok",
	"degraded",
	"failed",
	"unknown",
]);
export const alertCondition = pgEnum("alert_condition", [
	"stale_push",
	"process_failure",
	"camera_failure",
	"feed_failure",
]);
export const alertNoticeKind = pgEnum("alert_notice_kind", [
	"alert",
	"recovery",
]);
export const alertDeliveryOutcome = pgEnum("alert_delivery_outcome", [
	"claimed",
	"delivered",
	"failed",
]);
export const healthTransitionType = pgEnum("health_transition_type", [
	"online",
	"offline",
	"reported_flags_changed",
]);
export const edgeCommandType = pgEnum("edge_command_type", [
	"set_count",
	"reset_zero",
]);
export const edgeCommandStatus = pgEnum("edge_command_status", [
	"pending",
	"applied",
	"superseded",
]);
export const commandIssuerClass = pgEnum("command_issuer_class", [
	"human",
	"system",
]);
export const auditActorPrincipalKind = pgEnum("audit_actor_principal_kind", [
	"shared_staff",
	"owner",
	"system",
]);
/**
 * The eleven audit actions.
 *
 * The three command actions are the original tuple and keep their positions; the
 * eight governance actions are *appended*, so the migration is a plain
 * `ALTER TYPE ... ADD VALUE` per label and never a create/cast/drop recreate.
 *
 * Postgres forbids using a label in the same transaction that adds it, and drizzle
 * wraps all pending migrations in one transaction, so every constraint below that
 * names an action compares `action::text` rather than a bare enum literal.
 */
export const auditAction = pgEnum("audit_action", [
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

/**
 * The row discriminator. A governance row carries no command and no count, so a
 * class cannot be rescued from the other columns without circular rules; the
 * class filter also wants one indexable predicate.
 *
 * This type is created in the same migration transaction that adds the eight
 * action labels. A type created in that transaction *is* usable as a bare literal
 * — only pre-existing enums carry the restriction — so `event_class` appears bare
 * below while `action` never does.
 */
export const auditEventClass = pgEnum("audit_event_class", [
	"command",
	"access",
	"settings",
]);

const utcTimestamp = (name: string) => timestamp(name, { withTimezone: true });

export const edgeDevices = pgTable(
	"edge_devices",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		name: text("name").notNull(),
		tokenHash: text("token_hash").notNull(),
		enabled: boolean("enabled").notNull().default(true),
		lastSeenAt: utcTimestamp("last_seen_at"),
		lastSequence: bigint("last_sequence", { mode: "number" })
			.notNull()
			.default(0),
		createdAt: utcTimestamp("created_at").notNull().defaultNow(),
		updatedAt: utcTimestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		uniqueIndex("edge_devices_token_hash_unique").on(table.tokenHash),
		check("edge_devices_name_nonempty", sql`length(trim(${table.name})) > 0`),
		check(
			"edge_devices_token_hash_sha256",
			sql`${table.tokenHash} ~ '^[0-9a-f]{64}$'`,
		),
		check(
			"edge_devices_last_sequence_nonnegative",
			sql`${table.lastSequence} >= 0`,
		),
	],
);

export const settingsVersions = pgTable(
	"settings_versions",
	{
		version: bigint("version", { mode: "number" })
			.primaryKey()
			.generatedAlwaysAsIdentity(),
		capacity: integer("capacity").notNull(),
		quietMaxPercent: integer("quiet_max_percent").notNull(),
		moderateMaxPercent: integer("moderate_max_percent").notNull(),
		busyMaxPercent: integer("busy_max_percent").notNull(),
		timezone: text("timezone").notNull().default("Asia/Riyadh"),
		businessDayBoundary: time("business_day_boundary")
			.notNull()
			.default("04:00"),
		pushIntervalSeconds: integer("push_interval_seconds").notNull().default(20),
		freshForSeconds: integer("fresh_for_seconds").notNull().default(90),
		operationalStaleAfterSeconds: integer("operational_stale_after_seconds")
			.notNull()
			.default(180),
		publicPollSeconds: integer("public_poll_seconds").notNull().default(60),
		resetBufferMinutes: integer("reset_buffer_minutes").notNull().default(30),
		scheduleSunOpen: time("schedule_sun_open"),
		scheduleSunClose: time("schedule_sun_close"),
		scheduleMonOpen: time("schedule_mon_open"),
		scheduleMonClose: time("schedule_mon_close"),
		scheduleTueOpen: time("schedule_tue_open"),
		scheduleTueClose: time("schedule_tue_close"),
		scheduleWedOpen: time("schedule_wed_open"),
		scheduleWedClose: time("schedule_wed_close"),
		scheduleThuOpen: time("schedule_thu_open"),
		scheduleThuClose: time("schedule_thu_close"),
		scheduleFriOpen: time("schedule_fri_open"),
		scheduleFriClose: time("schedule_fri_close"),
		scheduleSatOpen: time("schedule_sat_open"),
		scheduleSatClose: time("schedule_sat_close"),
		effectiveFrom: utcTimestamp("effective_from").notNull().defaultNow(),
		createdAt: utcTimestamp("created_at").notNull().defaultNow(),
		createdBy: text("created_by"),
	},
	(table) => [
		check("settings_capacity_positive", sql`${table.capacity} > 0`),
		check(
			"settings_bands_ordered",
			sql`0 <= ${table.quietMaxPercent} and ${table.quietMaxPercent} < ${table.moderateMaxPercent} and ${table.moderateMaxPercent} < ${table.busyMaxPercent} and ${table.busyMaxPercent} <= 100`,
		),
		check(
			"settings_timezone_nonempty",
			sql`length(trim(${table.timezone})) > 0`,
		),
		check(
			"settings_push_interval_positive",
			sql`${table.pushIntervalSeconds} > 0`,
		),
		check("settings_fresh_for_positive", sql`${table.freshForSeconds} > 0`),
		check(
			"settings_operational_stale_after_fresh",
			sql`${table.operationalStaleAfterSeconds} > ${table.freshForSeconds}`,
		),
		check("settings_public_poll_positive", sql`${table.publicPollSeconds} > 0`),
		check(
			"settings_reset_buffer_nonnegative",
			sql`${table.resetBufferMinutes} >= 0`,
		),
		check(
			"settings_schedule_sun_pair",
			sql`(${table.scheduleSunOpen} is null) = (${table.scheduleSunClose} is null)`,
		),
		check(
			"settings_schedule_mon_pair",
			sql`(${table.scheduleMonOpen} is null) = (${table.scheduleMonClose} is null)`,
		),
		check(
			"settings_schedule_tue_pair",
			sql`(${table.scheduleTueOpen} is null) = (${table.scheduleTueClose} is null)`,
		),
		check(
			"settings_schedule_wed_pair",
			sql`(${table.scheduleWedOpen} is null) = (${table.scheduleWedClose} is null)`,
		),
		check(
			"settings_schedule_thu_pair",
			sql`(${table.scheduleThuOpen} is null) = (${table.scheduleThuClose} is null)`,
		),
		check(
			"settings_schedule_fri_pair",
			sql`(${table.scheduleFriOpen} is null) = (${table.scheduleFriClose} is null)`,
		),
		check(
			"settings_schedule_sat_pair",
			sql`(${table.scheduleSatOpen} is null) = (${table.scheduleSatClose} is null)`,
		),
	],
);

export const currentState = pgTable(
	"current_state",
	{
		id: smallint("id").primaryKey(),
		currentCount: integer("current_count"),
		band: occupancyBand("band"),
		source: currentSource("source"),
		lastPushReceivedAt: utcTimestamp("last_push_received_at"),
		lastEdgeReportedAt: utcTimestamp("last_edge_reported_at"),
		activeDeviceId: uuid("active_device_id").references(() => edgeDevices.id),
		settingsVersion: bigint("settings_version", { mode: "number" }).references(
			() => settingsVersions.version,
		),
		updatedAt: utcTimestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		check("current_state_singleton", sql`${table.id} = 1`),
		check(
			"current_state_nonnegative",
			sql`${table.currentCount} is null or ${table.currentCount} >= 0`,
		),
		check(
			"current_state_coherent",
			sql`(${table.currentCount} is null and ${table.band} is null and ${table.source} is null and ${table.lastPushReceivedAt} is null and ${table.lastEdgeReportedAt} is null and ${table.activeDeviceId} is null and ${table.settingsVersion} is null) or (${table.currentCount} is not null and ${table.band} is not null and ${table.source} is not null and ${table.lastPushReceivedAt} is not null and ${table.lastEdgeReportedAt} is not null and ${table.activeDeviceId} is not null and ${table.settingsVersion} is not null)`,
		),
	],
);

export const occupancyMinutes = pgTable(
	"occupancy_minutes",
	{
		deviceId: uuid("device_id")
			.notNull()
			.references(() => edgeDevices.id),
		minuteStartUtc: utcTimestamp("minute_start_utc").notNull(),
		businessDay: date("business_day").notNull(),
		count: integer("count").notNull(),
		entries: integer("entries").notNull(),
		exits: integer("exits").notNull(),
		band: occupancyBand("band").notNull(),
		capacitySnapshot: integer("capacity_snapshot").notNull(),
		settingsVersion: bigint("settings_version", { mode: "number" })
			.notNull()
			.references(() => settingsVersions.version),
		source: minuteSource("source").notNull(),
		updatedAt: utcTimestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		primaryKey({ columns: [table.deviceId, table.minuteStartUtc] }),
		check(
			"occupancy_minutes_aligned",
			sql`date_trunc('minute', ${table.minuteStartUtc}) = ${table.minuteStartUtc}`,
		),
		check("occupancy_minutes_count_nonnegative", sql`${table.count} >= 0`),
		check("occupancy_minutes_entries_nonnegative", sql`${table.entries} >= 0`),
		check("occupancy_minutes_exits_nonnegative", sql`${table.exits} >= 0`),
		check(
			"occupancy_minutes_capacity_positive",
			sql`${table.capacitySnapshot} > 0`,
		),
	],
);

export const edgeCurrentHealth = pgTable(
	"edge_current_health",
	{
		deviceId: uuid("device_id")
			.primaryKey()
			.references(() => edgeDevices.id, { onDelete: "cascade" }),
		sequence: bigint("sequence", { mode: "number" }).notNull(),
		processStatus: edgeHealthStatus("process_status").notNull(),
		cameraStatus: edgeHealthStatus("camera_status").notNull(),
		feedStatus: edgeHealthStatus("feed_status").notNull(),
		detectorFps: doublePrecision("detector_fps"),
		edgeObservedAt: utcTimestamp("edge_observed_at").notNull(),
		receivedAt: utcTimestamp("received_at").notNull(),
		updatedAt: utcTimestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		check(
			"edge_current_health_sequence_nonnegative",
			sql`${table.sequence} >= 0`,
		),
		check(
			"edge_current_health_detector_fps_finite_nonnegative",
			sql`${table.detectorFps} is null or (${table.detectorFps} >= 0 and ${table.detectorFps} < 'infinity'::double precision)`,
		),
	],
);

/** Durable edge-authoritative corrections and resets. Delivery is metadata, not a status. */
export const edgeCommands = pgTable(
	"edge_commands",
	{
		id: bigint("id", { mode: "number" })
			.primaryKey()
			.generatedAlwaysAsIdentity(),
		deviceId: uuid("device_id")
			.notNull()
			.references(() => edgeDevices.id),
		type: edgeCommandType("type").notNull(),
		targetValue: integer("target_value"),
		status: edgeCommandStatus("status").notNull().default("pending"),
		issuerClass: commandIssuerClass("issuer_class").notNull().default("human"),
		issuedByPrincipalId: uuid("issued_by_principal_id").references(
			() => authPrincipals.id,
		),
		reason: text("reason"),
		issuedAt: utcTimestamp("issued_at").notNull().defaultNow(),
		deliveredAt: utcTimestamp("delivered_at"),
		appliedAt: utcTimestamp("applied_at"),
		supersededAt: utcTimestamp("superseded_at"),
		supersededByCommandId: bigint("superseded_by_command_id", {
			mode: "number",
		}).references((): AnyPgColumn => edgeCommands.id),
	},
	(table) => [
		index("edge_commands_device_status_id_idx").on(
			table.deviceId,
			table.status,
			table.id,
		),
		uniqueIndex("edge_commands_id_issuer_class_unique").on(
			table.id,
			table.issuerClass,
		),
		uniqueIndex("edge_commands_id_issuer_class_type_unique").on(
			table.id,
			table.issuerClass,
			table.type,
		),
		check(
			"edge_commands_id_json_safe",
			sql`${table.id} > 0 and ${table.id} <= 9007199254740991`,
		),
		check(
			"edge_commands_issuer_coherent",
			sql`(${table.issuerClass} = 'human' and ${table.issuedByPrincipalId} is not null) or (${table.issuerClass} = 'system' and ${table.issuedByPrincipalId} is null)`,
		),
		check(
			"edge_commands_target_coherent",
			sql`(${table.type} = 'set_count' and ${table.targetValue} is not null and ${table.targetValue} >= 0) or (${table.type} = 'reset_zero' and ${table.targetValue} is null)`,
		),
		check(
			"edge_commands_reason_short_trimmed",
			sql`${table.reason} is null or (length(${table.reason}) between 1 and 240 and ${table.reason} = trim(${table.reason}))`,
		),
		check(
			"edge_commands_lifecycle_coherent",
			sql`(
				(${table.status} = 'pending' and ${table.appliedAt} is null and ${table.supersededAt} is null and ${table.supersededByCommandId} is null)
				or (${table.status} = 'applied' and ${table.deliveredAt} is not null and ${table.appliedAt} is not null and ${table.supersededAt} is null and ${table.supersededByCommandId} is null)
				or (${table.status} = 'superseded' and ${table.appliedAt} is null and ${table.supersededAt} is not null and ${table.supersededByCommandId} is not null)
			)`,
		),
	],
);

/**
 * Immutable provenance for every command, access-governance, and settings event.
 *
 * One table, not two: `SPEC.md:168-169` asks for a single audit log covering
 * "every correction, reset, and settings change", so a parallel governance table
 * would satisfy the schema and fail the product.
 *
 * Governance state is typed and non-secret by construction: an active flag and a
 * monotonic credential version have room for a status and a counter and nowhere to
 * put a PIN, password, hash, salt, pepper-derived value, or session token. The four
 * count columns are held null on governance rows so the PIN-sized integer channel
 * they would otherwise open stays closed.
 */
export const auditLog = pgTable(
	"audit_log",
	{
		id: bigint("id", { mode: "number" })
			.primaryKey()
			.generatedAlwaysAsIdentity(),
		eventClass: auditEventClass("event_class").notNull().default("command"),
		actorPrincipalId: uuid("actor_principal_id").references(
			() => authPrincipals.id,
		),
		actorPrincipalKind: auditActorPrincipalKind(
			"actor_principal_kind",
		).notNull(),
		actorRole: authRole("actor_role"),
		commandId: bigint("command_id", { mode: "number" }),
		/**
		 * Nullable for governance rows, but the `'human'` default stays: the Phase 5
		 * human command path never sets this key and depends entirely on the default.
		 * Drizzle omits only `undefined`, so the governance write path passes an
		 * explicit `null`, which is emitted and suppresses the default.
		 */
		commandIssuerClass: commandIssuerClass("command_issuer_class").default(
			"human",
		),
		action: auditAction("action").notNull(),
		priorValue: integer("prior_value"),
		requestedDelta: integer("requested_delta"),
		requestedValue: integer("requested_value"),
		effectiveValue: integer("effective_value"),
		/** The subject of an access event: whose credential or account changed. */
		targetPrincipalId: uuid("target_principal_id").references(
			() => authPrincipals.id,
		),
		priorActive: boolean("prior_active"),
		newActive: boolean("new_active"),
		priorCredentialVersion: integer("prior_credential_version"),
		newCredentialVersion: integer("new_credential_version"),
		settingsVersion: bigint("settings_version", { mode: "number" }).references(
			() => settingsVersions.version,
		),
		reason: text("reason"),
		createdAt: utcTimestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		// Still one audit row per command. Postgres treats nulls as distinct in a
		// unique index, so governance rows with a null command coexist freely.
		uniqueIndex("audit_log_command_unique").on(table.commandId),
		index("audit_log_created_id_idx").on(table.createdAt, table.id),
		index("audit_log_event_class_idx").on(table.eventClass),
		check(
			"audit_log_id_json_safe",
			sql`${table.id} > 0 and ${table.id} <= 9007199254740991`,
		),
		/**
		 * Every column in every arm carries its own `is not null`.
		 *
		 * A CHECK passes when its predicate is NULL, so `actor_role = 'owner'` is
		 * vacuously satisfied by a NULL role — the exact row this rule exists to
		 * reject. The fourth arm is the governance path: `command_issuer_class` is
		 * explicitly null there and only a real owner may author a governance event.
		 */
		check(
			"audit_log_actor_kind_role",
			sql`(
				(${table.commandIssuerClass} is not null and ${table.commandIssuerClass} = 'human'
					and ${table.actorPrincipalId} is not null
					and ${table.actorPrincipalKind} is not null and ${table.actorPrincipalKind} = 'shared_staff'
					and ${table.actorRole} is not null and ${table.actorRole} = 'staff')
				or (${table.commandIssuerClass} is not null and ${table.commandIssuerClass} = 'human'
					and ${table.actorPrincipalId} is not null
					and ${table.actorPrincipalKind} is not null and ${table.actorPrincipalKind} = 'owner'
					and ${table.actorRole} is not null and ${table.actorRole} = 'owner')
				or (${table.commandIssuerClass} is not null and ${table.commandIssuerClass} = 'system'
					and ${table.actorPrincipalId} is null
					and ${table.actorPrincipalKind} is not null and ${table.actorPrincipalKind} = 'system'
					and ${table.actorRole} is null)
				or (${table.commandIssuerClass} is null
					and ${table.actorPrincipalId} is not null
					and ${table.actorPrincipalKind} is not null and ${table.actorPrincipalKind} = 'owner'
					and ${table.actorRole} is not null and ${table.actorRole} = 'owner')
			)`,
		),
		/** A command row keeps its full linkage; a governance row carries none of it. */
		check(
			"audit_log_command_linkage",
			sql`(
				(${table.eventClass} = 'command' and ${table.commandId} is not null and ${table.commandIssuerClass} is not null and ${table.effectiveValue} is not null)
				or (${table.eventClass} <> 'command' and ${table.commandId} is null and ${table.commandIssuerClass} is null and ${table.effectiveValue} is null)
			)`,
		),
		check(
			"audit_log_values_nonnegative",
			sql`(${table.priorValue} is null or ${table.priorValue} >= 0) and (${table.requestedValue} is null or ${table.requestedValue} >= 0) and (${table.effectiveValue} is null or ${table.effectiveValue} >= 0)`,
		),
		check(
			"audit_log_action_values_coherent",
			sql`${table.eventClass} <> 'command' or (
				(${table.action}::text = 'correction_delta' and ${table.priorValue} is not null and ${table.requestedDelta} is not null and ${table.requestedValue} is null)
				or (${table.action}::text = 'correction_absolute' and ${table.requestedDelta} is null and ${table.requestedValue} is not null and ${table.requestedValue} = ${table.effectiveValue})
				or (${table.action}::text = 'reset' and ${table.requestedDelta} is null and ${table.requestedValue} = 0 and ${table.effectiveValue} = 0)
			)`,
		),
		/**
		 * The four count columns are closed on governance rows. A staff PIN is 6-12
		 * Western digits and fits in `int4`; without this, guarding the coherence
		 * rule above would open a PIN-sized channel the table never had.
		 */
		check(
			"audit_log_governance_counts_closed",
			sql`${table.eventClass} = 'command' or (${table.priorValue} is null and ${table.requestedDelta} is null and ${table.requestedValue} is null and ${table.effectiveValue} is null)`,
		),
		/** An action belongs to exactly one class, and a mismatch is rejected at write. */
		check(
			"audit_log_action_event_class",
			sql`(
				(${table.eventClass} = 'command' and ${table.action}::text in ('correction_delta', 'correction_absolute', 'reset'))
				or (${table.eventClass} = 'access' and ${table.action}::text in ('staff_pin_provisioned', 'staff_pin_rotated', 'staff_pin_deactivated', 'owner_provisioned', 'owner_deactivated', 'owner_reactivated', 'credential_reset'))
				or (${table.eventClass} = 'settings' and ${table.action}::text = 'settings_updated')
			)`,
		),
		/** Access rows name a target; settings rows name a version; commands name neither. */
		check(
			"audit_log_governance_columns",
			sql`(
				(${table.eventClass} = 'access' and ${table.targetPrincipalId} is not null and ${table.settingsVersion} is null)
				or (${table.eventClass} = 'settings' and ${table.settingsVersion} is not null and ${table.targetPrincipalId} is null and ${table.priorActive} is null and ${table.newActive} is null and ${table.priorCredentialVersion} is null and ${table.newCredentialVersion} is null)
				or (${table.eventClass} = 'command' and ${table.targetPrincipalId} is null and ${table.settingsVersion} is null and ${table.priorActive} is null and ${table.newActive} is null and ${table.priorCredentialVersion} is null and ${table.newCredentialVersion} is null)
			)`,
		),
		check(
			"audit_log_credential_versions_positive",
			sql`(${table.priorCredentialVersion} is null or ${table.priorCredentialVersion} > 0) and (${table.newCredentialVersion} is null or ${table.newCredentialVersion} > 0)`,
		),
		/**
		 * The "from → to" story 26 promises. `is true`/`is false` rather than
		 * `= true`, because `prior_active = true` passes vacuously on a NULL column.
		 */
		check(
			"audit_log_governance_state_transition",
			sql`(
				(${table.action}::text = 'owner_deactivated' and ${table.priorActive} is true and ${table.newActive} is false)
				or (${table.action}::text = 'owner_reactivated' and ${table.priorActive} is false and ${table.newActive} is true)
				or (${table.action}::text in ('staff_pin_rotated', 'credential_reset') and ${table.priorCredentialVersion} is not null and ${table.newCredentialVersion} is not null and ${table.newCredentialVersion} > ${table.priorCredentialVersion})
				or ${table.action}::text not in ('owner_deactivated', 'owner_reactivated', 'staff_pin_rotated', 'credential_reset')
			)`,
		),
		/**
		 * A reason is required for the two deactivations only. Rotation, reset, and
		 * provisioning are exactly the moments a fresh secret sits in the operator's
		 * hands, and demanding free text there would invite it into the log.
		 */
		check(
			"audit_log_destructive_reason_required",
			sql`${table.action}::text not in ('staff_pin_deactivated', 'owner_deactivated') or ${table.reason} is not null`,
		),
		check(
			"audit_log_reason_short_trimmed",
			sql`${table.reason} is null or (length(${table.reason}) between 1 and 240 and ${table.reason} = trim(${table.reason}))`,
		),
		foreignKey({
			columns: [table.commandId, table.commandIssuerClass],
			foreignColumns: [edgeCommands.id, edgeCommands.issuerClass],
			name: "audit_log_command_issuer_fk",
		}),
	],
);

/** Durable one-per-business-day closure marker for scheduled reset issuance. */
export const scheduledResetIssuances = pgTable(
	"scheduled_reset_issuances",
	{
		businessDay: date("business_day").primaryKey(),
		issuanceKey: text("issuance_key").notNull(),
		settingsVersion: bigint("settings_version", { mode: "number" })
			.notNull()
			.references(() => settingsVersions.version),
		scheduledClose: utcTimestamp("scheduled_close").notNull(),
		dueAt: utcTimestamp("due_at").notNull(),
		commandId: bigint("command_id", { mode: "number" }).notNull(),
		commandIssuerClass: commandIssuerClass("command_issuer_class")
			.notNull()
			.default("system"),
		commandType: edgeCommandType("command_type")
			.notNull()
			.default("reset_zero"),
		issuedAt: utcTimestamp("issued_at").notNull(),
	},
	(table) => [
		uniqueIndex("scheduled_reset_issuances_key_unique").on(table.issuanceKey),
		uniqueIndex("scheduled_reset_issuances_command_unique").on(table.commandId),
		check(
			"scheduled_reset_issuances_key_coherent",
			sql`${table.issuanceKey} = 'scheduled-reset:' || to_char(${table.businessDay}, 'YYYY-MM-DD')`,
		),
		check(
			"scheduled_reset_issuances_command_identity",
			sql`${table.commandIssuerClass} = 'system' and ${table.commandType} = 'reset_zero'`,
		),
		check(
			"scheduled_reset_issuances_due_after_close",
			sql`${table.dueAt} >= ${table.scheduledClose}`,
		),
		check(
			"scheduled_reset_issuances_issued_after_due",
			sql`${table.issuedAt} >= ${table.dueAt}`,
		),
		foreignKey({
			columns: [table.commandId, table.commandIssuerClass, table.commandType],
			foreignColumns: [
				edgeCommands.id,
				edgeCommands.issuerClass,
				edgeCommands.type,
			],
			name: "scheduled_reset_issuances_command_fk",
		}),
	],
);

/** Append-only health-transition history derived from the current projection. */
export const edgeHealthLog = pgTable(
	"edge_health_log",
	{
		id: bigint("id", { mode: "number" })
			.primaryKey()
			.generatedAlwaysAsIdentity(),
		deviceId: uuid("device_id")
			.notNull()
			.references(() => edgeDevices.id),
		transitionType: healthTransitionType("transition_type").notNull(),
		processStatus: edgeHealthStatus("process_status"),
		cameraStatus: edgeHealthStatus("camera_status"),
		feedStatus: edgeHealthStatus("feed_status"),
		occurredAt: utcTimestamp("occurred_at").notNull(),
		createdAt: utcTimestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		check(
			"edge_health_log_statuses_coherent",
			sql`(${table.processStatus} is null and ${table.cameraStatus} is null and ${table.feedStatus} is null) or (${table.processStatus} is not null and ${table.cameraStatus} is not null and ${table.feedStatus} is not null)`,
		),
	],
);

/** Append-only alert and recovery delivery history; it is the suppression authority. */
export const alertLog = pgTable(
	"alert_log",
	{
		id: bigint("id", { mode: "number" })
			.primaryKey()
			.generatedAlwaysAsIdentity(),
		deviceId: uuid("device_id")
			.notNull()
			.references(() => edgeDevices.id),
		condition: alertCondition("condition").notNull(),
		noticeKind: alertNoticeKind("notice_kind").notNull(),
		conditionStartedAt: utcTimestamp("condition_started_at").notNull(),
		sentAt: utcTimestamp("sent_at").notNull(),
		deliveryOutcome: alertDeliveryOutcome("delivery_outcome").notNull(),
		recoveryOfAlertId: bigint("recovery_of_alert_id", {
			mode: "number",
		}).references((): AnyPgColumn => alertLog.id),
		createdAt: utcTimestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		check(
			"alert_log_recovery_linkage",
			sql`(${table.noticeKind} = 'alert' and ${table.recoveryOfAlertId} is null) or (${table.noticeKind} = 'recovery' and ${table.recoveryOfAlertId} is not null)`,
		),
		check(
			"alert_log_sent_after_condition_start",
			sql`${table.sentAt} >= ${table.conditionStartedAt}`,
		),
	],
);
