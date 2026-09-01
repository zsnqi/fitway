import { createHash, createHmac } from "node:crypto";
import path from "node:path";
import { assertDemoDatabaseUrl, DEMO_OWNER_EMAIL } from "./contract";

const CAPACITY = 120;
const PROFILE_SEED = 20260901;
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
	// Keep the synthetic profile identical for the entire Riyadh business day.
	// The current day contains its opening minute; the live simulator owns the
	// wall-clock state shown by Public and Staff after startup.
	const observedThroughUtc = new Date(businessDayEpoch + 3_600_000);
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
		const createdAt = new Date(`${profile.businessDay}T01:00:00.000Z`);
		const owner = await auth.provisionOwner(
			{
				email: DEMO_OWNER_EMAIL,
				displayName: "FITWAY Demo Owner",
				password: input.ownerPassword,
			},
			createdAt,
		);
		const staff = await auth.setSharedStaffPin(input.staffPin, createdAt);
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
				createdAt,
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
				createdAt,
				updatedAt: createdAt,
			})
			.returning();
		if (!device) throw new Error("Demo edge device was not provisioned");
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
		// The fixed business-day opening minute keeps resets deterministic without
		// presenting future history. Live state is populated by the simulator.
		const observedThrough = new Date(profile.observedThroughUtc).getTime();
		const history = generatedHistory.filter(
			(row) => row.minuteStartUtc.getTime() <= observedThrough,
		);
		for (let offset = 0; offset < history.length; offset += 1_000)
			await database.insert(applicationSchema.occupancyMinutes).values(
				history.slice(offset, offset + 1_000).map((row) => ({
					...row,
					deviceId: device.id,
					updatedAt: createdAt,
				})),
			);
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
				effectiveFrom: new Date(`${profile.businessDay}T01:00:00.000Z`),
				createdAt,
				createdBy: owner.id,
				...SCHEDULE,
			})
			.returning();
		if (!latest) throw new Error("Demo current settings were not created");
		const now = input.now ?? new Date();
		await database.insert(applicationSchema.currentState).values({
			id: 1,
			currentCount: 0,
			band: "quiet",
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
				createdAt,
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
				createdAt,
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
				settingsVersion: latest.version,
				reason: "Synthetic desktop-demo profile",
				createdAt,
			},
		]);
		return {
			fingerprint: profileFingerprint(profile, history),
			ownerEmail: DEMO_OWNER_EMAIL,
			businessDay: profile.businessDay,
		};
	} finally {
		await pool.end();
	}
}
