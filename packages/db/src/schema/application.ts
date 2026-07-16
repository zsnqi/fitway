import { sql } from "drizzle-orm";
import {
	bigint,
	boolean,
	check,
	date,
	doublePrecision,
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
