import { createHash, createHmac } from "node:crypto";
import path from "node:path";
import { assertDemoDatabaseUrl, DEMO_OWNER_EMAIL } from "./contract";

const CAPACITY = 120;
const PROFILE_SEED = 20260901;
const SNAPSHOT_INTERVAL_MS = 5 * 60_000;
const SCHEDULE = {
	scheduleSunOpen: "00:00",
	scheduleSunClose: "00:00",
	scheduleMonOpen: "00:00",
	scheduleMonClose: "00:00",
	scheduleTueOpen: "00:00",
	scheduleTueClose: "00:00",
	scheduleWedOpen: "00:00",
	scheduleWedClose: "00:00",
	scheduleThuOpen: "00:00",
	scheduleThuClose: "00:00",
	scheduleFriOpen: "00:00",
	scheduleFriClose: "00:00",
	scheduleSatOpen: "00:00",
	scheduleSatClose: "00:00",
} as const;

export type DemoSeedInput = {
	databaseUrl: string;
	ownerPassword: string;
	staffPin: string;
	edgeToken: string;
	authSecret: string;
	now?: Date;
};
export type DemoSeedResult = {
	fingerprint: string;
	ownerEmail: string;
	businessDay: string;
	startingCount: number;
};

export function riyadhBusinessDay(now = new Date()) {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Riyadh",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		hourCycle: "h23",
	}).formatToParts(now);
	const value = (type: string) =>
		parts.find((part) => part.type === type)?.value ?? "";
	const date = `${value("year")}-${value("month")}-${value("day")}`;
	return Number(value("hour")) < 4
		? new Date(`${date}T00:00:00.000Z`).getTime() - 86_400_000
		: Date.parse(`${date}T00:00:00.000Z`);
}

export function buildDemoProfile(now = new Date()) {
	const businessDayEpoch = riyadhBusinessDay(now);
	const businessDay = new Date(businessDayEpoch).toISOString().slice(0, 10);
	// Riyadh 04:00 begins at 01:00 UTC; the earliest of 28 business days is 27 days back.
	const historyStartUtc = new Date(
		businessDayEpoch - 27 * 86_400_000 + 3_600_000,
	);
	// Snap to a stable five-minute boundary so rapid resets reproduce the same
	// profile while today's Owner chart remains populated up to the recent past.
	// The live simulator owns only the wall-clock minutes after this cutoff.
	const observedThroughUtc = new Date(
		Math.floor(now.getTime() / SNAPSHOT_INTERVAL_MS) * SNAPSHOT_INTERVAL_MS,
	);
	return {
		businessDay,
		historyStartUtc: historyStartUtc.toISOString(),
		observedThroughUtc: observedThroughUtc.toISOString(),
		days: 28,
		seed: PROFILE_SEED,
		capacity: CAPACITY,
		timeZone: "Asia/Riyadh",
		businessDayBoundary: "04:00",
		schedule: SCHEDULE,
	};
}

function circularHourDistance(left: number, right: number) {
	const direct = Math.abs(left - right);
	return Math.min(direct, 24 - direct);
}

function peak(hour: number, center: number, width: number, amplitude: number) {
	const distance = circularHourDistance(hour, center);
	return amplitude * Math.exp(-(distance * distance) / (2 * width * width));
}

/**
 * A deterministic, recognisably gym-shaped synthetic occupancy curve.
 *
 * It produces morning, lunch, evening, and late-night demand instead of the
 * test generator's intentionally uniform sawtooth. Friday and Saturday shift
 * demand later, and small seeded waves keep neighbouring days from looking
 * cloned without introducing random or credential-dependent state.
 */
export function demoOccupancyCount(
	minuteStartUtc: Date,
	businessDay: string,
	seed = PROFILE_SEED,
) {
	const localMinute =
		(minuteStartUtc.getUTCHours() * 60 +
			minuteStartUtc.getUTCMinutes() +
			3 * 60) %
		(24 * 60);
	const hour = localMinute / 60;
	const weekday = new Date(`${businessDay}T00:00:00.000Z`).getUTCDay();
	const weekend = weekday === 5 || weekday === 6;
	const dayNumber = Math.floor(
		Date.parse(`${businessDay}T00:00:00.000Z`) / 86_400_000,
	);
	const dayScale = 0.92 + ((dayNumber + seed) % 9) * 0.02;
	const morning = peak(hour, 7.25, 1.2, weekend ? 22 : 34);
	const lunch = peak(hour, 13, 1.65, weekend ? 17 : 23);
	const evening = peak(hour, weekend ? 20.25 : 19.25, 2.15, weekend ? 68 : 60);
	const late = peak(hour, 23.25, 1.9, weekend ? 16 : 11);
	const epochMinute = Math.floor(minuteStartUtc.getTime() / 60_000);
	const texture =
		Math.sin((epochMinute + seed) * 0.17) * 1.8 +
		Math.sin((epochMinute + seed * 3) * 0.047) * 1.2;
	return Math.max(
		2,
		Math.min(
			CAPACITY,
			Math.round((5 + morning + lunch + evening + late) * dayScale + texture),
		),
	);
}

function bandForDemoCount(count: number) {
	if (count <= CAPACITY * 0.25) return "quiet" as const;
	if (count <= CAPACITY * 0.5) return "moderate" as const;
	if (count <= CAPACITY * 0.75) return "busy" as const;
	return "packed" as const;
}

export function shapeDemoHistory<
	TRow extends {
		minuteStartUtc: Date;
		businessDay: string;
		settingsVersion: number;
	},
>(rows: TRow[]) {
	const previousByDay = new Map<string, number>();
	return rows.map((row) => {
		const count = demoOccupancyCount(row.minuteStartUtc, row.businessDay);
		const previous = previousByDay.get(row.businessDay) ?? count;
		previousByDay.set(row.businessDay, count);
		return {
			...row,
			count,
			entries: Math.max(0, count - previous),
			exits: Math.max(0, previous - count),
			band: bandForDemoCount(count),
			capacitySnapshot: CAPACITY,
			source: "backfill" as const,
		};
	});
}

export function profileFingerprint(
	profile: ReturnType<typeof buildDemoProfile>,
	history: Array<{
		minuteStartUtc: Date;
		businessDay: string;
		count: number;
		entries: number;
		exits: number;
		band: string;
		capacitySnapshot: number;
		settingsVersion: number;
		source: string;
	}> = [],
) {
	const hash = createHash("sha256").update(JSON.stringify(profile));
	for (const row of history) {
		hash.update(
			JSON.stringify([
				row.minuteStartUtc.toISOString(),
				row.businessDay,
				row.count,
				row.entries,
				row.exits,
				row.band,
				row.capacitySnapshot,
				row.settingsVersion,
				row.source,
			]),
		);
	}
	return hash.digest("hex");
}

export async function migrateDemoDatabase(databaseUrl: string) {
	assertDemoDatabaseUrl(databaseUrl);
	const [{ drizzle }, { migrate }, { Pool }] = await Promise.all([
		import("drizzle-orm/node-postgres"),
		import("drizzle-orm/node-postgres/migrator"),
		import("pg"),
	]);
	const pool = new Pool({ connectionString: databaseUrl });
	try {
		await migrate(drizzle(pool), {
			migrationsFolder: path.resolve("packages/db/src/migrations"),
		});
	} finally {
		await pool.end();
	}
}

export async function seedDemo(input: DemoSeedInput): Promise<DemoSeedResult> {
	assertDemoDatabaseUrl(input.databaseUrl);
	if (input.edgeToken.length < 43 || input.authSecret.length < 32)
		throw new Error("Demo runtime secrets are invalid");
	await migrateDemoDatabase(input.databaseUrl);
	// Dynamic imports keep deterministic profile tests independent of optional workspace links.
	// The actual reset path still uses the repository's real services and schema.
	const [
		{ AuthService },
		{ generateDeterministicAnalyticsHistory },
		applicationSchema,
		authSchema,
		{ drizzle },
		{ Pool },
		{ PostgresAuthRepository },
	] = await Promise.all([
		import("@fitway/auth"),
		import("@fitway/api/analytics/history-generator"),
		import("@fitway/db/schema/application"),
		import("@fitway/db/schema/auth"),
		import("drizzle-orm/node-postgres"),
		import("pg"),
		import("../../apps/server/src/auth/postgres-auth-repository"),
	]);
	const profile = buildDemoProfile(input.now);
	const pool = new Pool({ connectionString: input.databaseUrl });
	const database = drizzle(pool, {
		schema: { ...applicationSchema, ...authSchema },
	});
	try {
		// Migration 0000 supplies production-safe singleton defaults. A fresh demo
		// replaces only those two seed rows before building its own versioned profile.
		await database.delete(applicationSchema.currentState);
		await database.delete(applicationSchema.settingsVersions);
		// Keep bootstrap credentials on the same versioned subkey as the real runtime.
		// The live auth walkthrough is the contract check that detects any drift.
		const credentialPepper = createHmac("sha256", input.authSecret)
			.update("fitway-auth-subkey-v1:pin-pepper", "utf8")
			.digest("base64url");
		const auth = new AuthService({
			repository: new PostgresAuthRepository(
				database as unknown as typeof import("@fitway/db").db,
			),
			pepper: credentialPepper,
			cookieSecret: input.authSecret,
		});
		const profileCreatedAt = new Date(profile.historyStartUtc);
		const currentSettingsAt = new Date(`${profile.businessDay}T01:00:00.000Z`);
		const owner = await auth.provisionOwner(
			{
				email: DEMO_OWNER_EMAIL,
				displayName: "FITWAY Demo Owner",
				password: input.ownerPassword,
			},
			profileCreatedAt,
		);
		const staff = await auth.setSharedStaffPin(
			input.staffPin,
			new Date(profileCreatedAt.getTime() + 5 * 60_000),
		);
		const [historical] = await database
			.insert(applicationSchema.settingsVersions)
			.values({
				capacity: CAPACITY,
				quietMaxPercent: 25,
				moderateMaxPercent: 50,
				busyMaxPercent: 75,
				timezone: "Asia/Riyadh",
				businessDayBoundary: "04:00",
				pushIntervalSeconds: 20,
				freshForSeconds: 90,
				operationalStaleAfterSeconds: 180,
				publicPollSeconds: 60,
				effectiveFrom: new Date(
					new Date(profile.historyStartUtc).getTime() - 60_000,
				),
				createdAt: profileCreatedAt,
				createdBy: owner.id,
				...SCHEDULE,
			})
			.returning();
		if (!historical)
			throw new Error("Demo historical settings were not created");
		const tokenHash = createHash("sha256")
			.update(input.edgeToken, "utf8")
			.digest("hex");
		const [device] = await database
			.insert(applicationSchema.edgeDevices)
			.values({
				name: "desktop-demo-simulator",
				tokenHash,
				enabled: true,
				createdAt: profileCreatedAt,
				updatedAt: profileCreatedAt,
			})
			.returning();
		if (!device) throw new Error("Demo edge device was not provisioned");
		const [latest] = await database
			.insert(applicationSchema.settingsVersions)
			.values({
				capacity: CAPACITY,
				quietMaxPercent: 25,
				moderateMaxPercent: 50,
				busyMaxPercent: 75,
				timezone: "Asia/Riyadh",
				businessDayBoundary: "04:00",
				pushIntervalSeconds: 20,
				freshForSeconds: 90,
				operationalStaleAfterSeconds: 180,
				publicPollSeconds: 60,
				effectiveFrom: currentSettingsAt,
				createdAt: currentSettingsAt,
				createdBy: owner.id,
				...SCHEDULE,
			})
			.returning();
		if (!latest) throw new Error("Demo current settings were not created");
		const generatedHistory = generateDeterministicAnalyticsHistory({
			startUtc: new Date(profile.historyStartUtc),
			days: profile.days,
			seed: profile.seed,
			omitEveryNthOpenMinute: 97,
			settings: {
				version: historical.version,
				effectiveFrom: historical.effectiveFrom,
				timeZone: "Asia/Riyadh",
				businessDayBoundary: "04:00",
				weeklySchedule: {
					sun: { open: "00:00", close: "00:00" },
					mon: { open: "00:00", close: "00:00" },
					tue: { open: "00:00", close: "00:00" },
					wed: { open: "00:00", close: "00:00" },
					thu: { open: "00:00", close: "00:00" },
					fri: { open: "00:00", close: "00:00" },
					sat: { open: "00:00", close: "00:00" },
				},
				capacity: CAPACITY,
				quietMaxPercent: 25,
				moderateMaxPercent: 50,
				busyMaxPercent: 75,
			},
		});
		// History is synthetic and explicitly marked as backfill. It stops at the
		// profile's recent five-minute cutoff; the simulator owns later live minutes.
		const observedThrough = new Date(profile.observedThroughUtc).getTime();
		const history = shapeDemoHistory(
			generatedHistory
				.filter((row) => row.minuteStartUtc.getTime() <= observedThrough)
				.map((row) => ({
					...row,
					settingsVersion:
						row.businessDay === profile.businessDay
							? latest.version
							: historical.version,
				})),
		);
		for (let offset = 0; offset < history.length; offset += 1_000)
			await database.insert(applicationSchema.occupancyMinutes).values(
				history.slice(offset, offset + 1_000).map((row) => ({
					...row,
					deviceId: device.id,
					updatedAt: profileCreatedAt,
				})),
			);
		const now = input.now ?? new Date();
		const startingCount = demoOccupancyCount(now, profile.businessDay);
		await database.insert(applicationSchema.currentState).values({
			id: 1,
			currentCount: startingCount,
			band: bandForDemoCount(startingCount),
			source: "edge",
			lastPushReceivedAt: now,
			lastEdgeReportedAt: now,
			activeDeviceId: device.id,
			settingsVersion: latest.version,
			updatedAt: now,
		});
		await database.insert(applicationSchema.edgeCurrentHealth).values({
			deviceId: device.id,
			sequence: 0,
			processStatus: "ok",
			cameraStatus: "ok",
			feedStatus: "ok",
			detectorFps: 4.8,
			edgeObservedAt: now,
			receivedAt: now,
			updatedAt: now,
		});
		const monitoringStart = new Date(profile.historyStartUtc);
		const outageStart = new Date(
			new Date(`${profile.businessDay}T01:00:00.000Z`).getTime() -
				2 * 86_400_000 +
				6 * 3_600_000,
		);
		const recoveredAt = new Date(outageStart.getTime() + 45 * 60_000);
		await database.insert(applicationSchema.edgeHealthLog).values([
			{
				deviceId: device.id,
				transitionType: "online",
				processStatus: "ok",
				cameraStatus: "ok",
				feedStatus: "ok",
				occurredAt: monitoringStart,
				createdAt: monitoringStart,
			},
			{
				deviceId: device.id,
				transitionType: "offline",
				processStatus: null,
				cameraStatus: null,
				feedStatus: null,
				occurredAt: outageStart,
				createdAt: outageStart,
			},
			{
				deviceId: device.id,
				transitionType: "online",
				processStatus: "ok",
				cameraStatus: "ok",
				feedStatus: "ok",
				occurredAt: recoveredAt,
				createdAt: recoveredAt,
			},
		]);
		const alertAt = new Date(outageStart.getTime() + 5 * 60_000);
		const [alert] = await database
			.insert(applicationSchema.alertLog)
			.values({
				deviceId: device.id,
				condition: "stale_push",
				noticeKind: "alert",
				conditionStartedAt: outageStart,
				sentAt: alertAt,
				deliveryOutcome: "delivered",
				createdAt: alertAt,
			})
			.returning({ id: applicationSchema.alertLog.id });
		if (!alert) throw new Error("Demo health alert was not created");
		await database.insert(applicationSchema.alertLog).values({
			deviceId: device.id,
			condition: "stale_push",
			noticeKind: "recovery",
			conditionStartedAt: outageStart,
			sentAt: recoveredAt,
			deliveryOutcome: "delivered",
			recoveryOfAlertId: alert.id,
			createdAt: recoveredAt,
		});
		const commandFixtures = [
			{
				daysAgo: 20,
				hourUtc: 15,
				actor: "staff",
				action: "correction_delta",
				priorValue: 34,
				requestedDelta: 3,
				requestedValue: null,
				effectiveValue: 37,
				reason: "Synthetic front-desk headcount reconciliation",
			},
			{
				daysAgo: 12,
				hourUtc: 10,
				actor: "owner",
				action: "correction_absolute",
				priorValue: 28,
				requestedDelta: null,
				requestedValue: 25,
				effectiveValue: 25,
				reason: "Synthetic occupancy review",
			},
			{
				daysAgo: 5,
				hourUtc: 21,
				actor: "owner",
				action: "reset",
				priorValue: 7,
				requestedDelta: null,
				requestedValue: 0,
				effectiveValue: 0,
				reason: "Synthetic closing walkthrough reset",
			},
			{
				daysAgo: 1,
				hourUtc: 16,
				actor: "staff",
				action: "correction_delta",
				priorValue: 52,
				requestedDelta: -2,
				requestedValue: null,
				effectiveValue: 50,
				reason: "Synthetic turnstile reconciliation",
			},
		] as const;
		const commandAuditRows: Array<
			typeof applicationSchema.auditLog.$inferInsert
		> = [];
		for (const fixture of commandFixtures) {
			const issuedAt = new Date(
				currentSettingsAt.getTime() -
					fixture.daysAgo * 86_400_000 +
					fixture.hourUtc * 3_600_000,
			);
			const deliveredAt = new Date(issuedAt.getTime() + 20_000);
			const appliedAt = new Date(issuedAt.getTime() + 35_000);
			const actorIsOwner = fixture.actor === "owner";
			const [command] = await database
				.insert(applicationSchema.edgeCommands)
				.values({
					deviceId: device.id,
					type: fixture.action === "reset" ? "reset_zero" : "set_count",
					targetValue:
						fixture.action === "reset" ? null : fixture.effectiveValue,
					status: "applied",
					issuerClass: "human",
					issuedByPrincipalId: actorIsOwner ? owner.id : staff.principal.id,
					reason: fixture.reason,
					issuedAt,
					deliveredAt,
					appliedAt,
				})
				.returning({ id: applicationSchema.edgeCommands.id });
			if (!command) throw new Error("Demo command fixture was not created");
			commandAuditRows.push({
				eventClass: "command" as const,
				actorPrincipalId: actorIsOwner ? owner.id : staff.principal.id,
				actorPrincipalKind: actorIsOwner
					? ("owner" as const)
					: ("shared_staff" as const),
				actorRole: actorIsOwner ? ("owner" as const) : ("staff" as const),
				commandId: command.id,
				commandIssuerClass: "human" as const,
				action: fixture.action,
				priorValue: fixture.priorValue,
				requestedDelta: fixture.requestedDelta,
				requestedValue: fixture.requestedValue,
				effectiveValue: fixture.effectiveValue,
				reason: fixture.reason,
				createdAt: appliedAt,
			});
		}
		await database.insert(applicationSchema.auditLog).values([
			{
				eventClass: "access",
				actorPrincipalId: owner.id,
				actorPrincipalKind: "owner",
				actorRole: "owner",
				commandId: null,
				commandIssuerClass: null,
				action: "owner_provisioned",
				targetPrincipalId: owner.id,
				reason: null,
				createdAt: profileCreatedAt,
			},
			{
				eventClass: "access",
				actorPrincipalId: owner.id,
				actorPrincipalKind: "owner",
				actorRole: "owner",
				commandId: null,
				commandIssuerClass: null,
				action: "staff_pin_provisioned",
				targetPrincipalId: staff.principal.id,
				reason: null,
				createdAt: new Date(profileCreatedAt.getTime() + 5 * 60_000),
			},
			{
				eventClass: "settings",
				actorPrincipalId: owner.id,
				actorPrincipalKind: "owner",
				actorRole: "owner",
				commandId: null,
				commandIssuerClass: null,
				action: "settings_updated",
				targetPrincipalId: null,
				priorActive: null,
				newActive: null,
				priorCredentialVersion: null,
				newCredentialVersion: null,
				settingsVersion: historical.version,
				reason: "Synthetic demo baseline",
				createdAt: new Date(profileCreatedAt.getTime() + 10 * 60_000),
			},
			...commandAuditRows,
			{
				eventClass: "settings",
				actorPrincipalId: owner.id,
				actorPrincipalKind: "owner",
				actorRole: "owner",
				commandId: null,
				commandIssuerClass: null,
				action: "settings_updated",
				targetPrincipalId: null,
				priorActive: null,
				newActive: null,
				priorCredentialVersion: null,
				newCredentialVersion: null,
				settingsVersion: latest.version,
				reason: "Synthetic owner-demo profile refresh",
				createdAt: currentSettingsAt,
			},
		]);
		return {
			fingerprint: profileFingerprint(profile, history),
			ownerEmail: DEMO_OWNER_EMAIL,
			businessDay: profile.businessDay,
			startingCount,
		};
	} finally {
		await pool.end();
	}
}
