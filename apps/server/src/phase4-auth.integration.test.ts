import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";
import path from "node:path";
import { AuthService, SESSION_COOKIE_NAMES } from "@fitway/auth";
import * as applicationSchema from "@fitway/db/schema/application";
import * as authSchema from "@fitway/db/schema/auth";
import { serve } from "@hono/node-server";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PinRateLimiter } from "./auth/pin-rate-limiter";
import { PostgresAuthRepository } from "./auth/postgres-auth-repository";
import { assertDisposableIntegrationDatabase } from "./test-support/integration-database-safety";

const connectionString = process.env.TEST_DATABASE_URL;
assertDisposableIntegrationDatabase({
	connectionString,
	resetMarker: process.env.FITWAY_INTEGRATION_RESET_DATABASE,
	runId: process.env.FITWAY_RUN_ID,
});
const serverSecret = randomBytes(32).toString("base64url");
process.env.BETTER_AUTH_SECRET = serverSecret;
process.env.BETTER_AUTH_URL = "http://127.0.0.1/api/auth";
process.env.CORS_ORIGIN = "http://127.0.0.1";
process.env.NODE_ENV = "test";

const pool = new Pool({ connectionString });
const database = drizzle(pool, {
	schema: { ...applicationSchema, ...authSchema },
});
const repository = new PostgresAuthRepository(
	database as unknown as typeof import("@fitway/db").db,
);
const service = new AuthService({
	repository,
	pepper: serverSecret,
	cookieSecret: serverSecret,
});
const runtime = {
	service,
	staffPinLimiter: new PinRateLimiter(),
	ownerLoginLimiter: new PinRateLimiter(),
};
let app: ReturnType<typeof import("./index").createApp>;
let baseUrl = "";
let server: ReturnType<typeof serve>;
const capturedLogs: string[] = [];
const logSpy = vi.spyOn(console, "log").mockImplementation((...values) => {
	capturedLogs.push(values.map(String).join(" "));
});
const errorSpy = vi.spyOn(console, "error").mockImplementation((...values) => {
	capturedLogs.push(values.map(String).join(" "));
});

function cookiePair(setCookie: string) {
	return setCookie.split(";", 1)[0] ?? "";
}

function setCookies(response: Response) {
	return response.headers.getSetCookie();
}

async function request(pathname: string, init?: RequestInit) {
	return fetch(`${baseUrl}${pathname}`, init);
}

beforeAll(async () => {
	const { createApp } = await import("./index");
	app = createApp("test", runtime);
	await database.execute(sql`drop schema if exists drizzle cascade`);
	await database.execute(sql`drop schema if exists public cascade`);
	await database.execute(sql`create schema public`);
	await migrate(database, {
		migrationsFolder: path.resolve("packages/db/src/migrations"),
	});
	await new Promise<void>((resolve, reject) => {
		server = serve(
			{ fetch: app.fetch, hostname: "127.0.0.1", port: 0 },
			(info) => {
				baseUrl = `http://127.0.0.1:${info.port}`;
				resolve();
			},
		);
		server.once("error", reject);
	});
});

afterAll(async () => {
	await new Promise<void>((resolve, reject) => {
		server.close((error) => (error ? reject(error) : resolve()));
	});
	await pool.end();
	logSpy.mockRestore();
	errorSpy.mockRestore();
});

describe("Phase 4 auth real HTTP and disposable Postgres slice", () => {
	it("enforces the frozen PIN, principal, session, role, and signup contract", async () => {
		const rawPin = `${randomInt(0, 1_000_000)}`.padStart(6, "0");
		await service.setSharedStaffPin(rawPin);

		const enumRows = await database.execute(sql`
			select t.typname, json_agg(e.enumlabel order by e.enumsortorder) labels
			from pg_type t join pg_enum e on t.oid = e.enumtypid
			where t.typname in ('auth_role', 'auth_principal_kind')
			group by t.typname order by t.typname
		`);
		expect(enumRows.rows).toEqual([
			{ typname: "auth_principal_kind", labels: ["shared_staff", "owner"] },
			{ typname: "auth_role", labels: ["staff", "owner"] },
		]);

		const sharedRows = await database
			.select()
			.from(authSchema.authPrincipals)
			.where(eq(authSchema.authPrincipals.principalKind, "shared_staff"));
		expect(sharedRows).toHaveLength(1);
		expect(sharedRows[0]).toMatchObject({
			role: "staff",
			ownerEmail: null,
			active: true,
		});

		const missing = await request("/api/auth/session");
		expect(missing.status).toBe(401);
		expect(await missing.json()).toEqual({ error: "unauthorized" });
		const missingStaffLeaf = await request("/rpc/staff/session", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ json: null }),
		});
		expect(missingStaffLeaf.status).toBe(401);

		const signup = await request("/api/auth/sign-up/email", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({}),
		});
		expect(signup.status).toBe(403);
		expect(await signup.json()).toEqual({ error: "signup_disabled" });

		const login = await request("/api/auth/staff/pin", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ pin: rawPin }),
		});
		expect(login.status).toBe(200);
		expect(login.headers.get("Cache-Control")).toBe("no-store");
		const loginCookies = setCookies(login);
		expect(loginCookies).toHaveLength(1);
		const staffSetCookie = loginCookies[0] ?? "";
		expect(staffSetCookie).toContain(`${SESSION_COOKIE_NAMES.staff}=`);
		expect(staffSetCookie).toContain("HttpOnly");
		expect(staffSetCookie).toContain("Secure");
		expect(staffSetCookie).toContain("SameSite=Lax");
		expect(staffSetCookie).toContain("Path=/");
		expect(staffSetCookie).toContain("Max-Age=2592000");
		expect(staffSetCookie).not.toContain("Domain=");
		expect(staffSetCookie).not.toContain(rawPin);
		const staffCookie = cookiePair(staffSetCookie);

		const storedSessions = await database
			.select()
			.from(authSchema.authSessions);
		expect(storedSessions).toHaveLength(1);
		expect(storedSessions[0]?.tokenHash).toMatch(/^[a-f0-9]{64}$/);
		const signedCookieValue = staffCookie.split("=")[1] ?? "";
		const rawToken = signedCookieValue.split(".")[0] ?? "";
		expect(storedSessions[0]?.tokenHash).toBe(
			createHash("sha256").update(rawToken).digest("hex"),
		);
		expect(JSON.stringify(storedSessions)).not.toContain(rawToken);

		const staffSession = await request("/api/auth/session", {
			headers: { Cookie: staffCookie },
		});
		expect(staffSession.status).toBe(200);
		expect(await staffSession.json()).toMatchObject({
			auth: {
				principalKind: "shared_staff",
				role: "staff",
				active: true,
			},
		});
		const wrongRole = await request("/api/auth/owner/session", {
			headers: { Cookie: staffCookie },
		});
		expect(wrongRole.status).toBe(403);
		expect(await wrongRole.json()).toEqual({ error: "forbidden" });
		const wrongRoleLeaf = await request("/rpc/admin/session", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Cookie: staffCookie,
			},
			body: JSON.stringify({ json: null }),
		});
		expect(wrongRoleLeaf.status).toBe(403);

		const ownerPassword = randomBytes(24).toString("base64url");
		const ownerEmail = `owner-${randomUUID()}@fitway.example`;
		const owner = await service.provisionOwner({
			email: ownerEmail,
			displayName: "Provisioned pilot owner",
			password: ownerPassword,
		});
		const ownerLoginResponse = await request("/api/auth/owner/password", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: ownerEmail, password: ownerPassword }),
		});
		expect(ownerLoginResponse.status).toBe(200);
		const ownerCookie = cookiePair(setCookies(ownerLoginResponse)[0] ?? "");
		const ownerSession = await request("/api/auth/owner/session", {
			headers: { Cookie: ownerCookie },
		});
		expect(ownerSession.status).toBe(200);
		expect(await ownerSession.json()).toMatchObject({
			auth: { principalKind: "owner", role: "owner", active: true },
		});
		const ownerLeaf = await request("/rpc/admin/session", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Cookie: ownerCookie,
			},
			body: JSON.stringify({ json: null }),
		});
		expect(ownerLeaf.status).toBe(200);

		const ambiguousCookies = `${staffCookie}; ${ownerCookie}`;
		const ambiguous = await request("/api/auth/session", {
			headers: { Cookie: ambiguousCookies },
		});
		expect(ambiguous.status).toBe(401);

		const explicitStaffLogin = await request("/api/auth/staff/pin", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Cookie: ambiguousCookies,
			},
			body: JSON.stringify({ pin: rawPin }),
		});
		expect(explicitStaffLogin.status).toBe(200);
		expect(setCookies(explicitStaffLogin).join("\n")).toContain(
			`${SESSION_COOKIE_NAMES.owner}=;`,
		);
		const ownerDatabaseSession = await database
			.select()
			.from(authSchema.authSessions)
			.where(eq(authSchema.authSessions.principalId, owner.id));
		expect(ownerDatabaseSession[0]?.revokedAt).toBeInstanceOf(Date);

		const databaseText = JSON.stringify(
			await database.execute(sql`
				select pin_hash, pin_salt from auth_staff_credentials
				union all
				select password_hash, password_salt from auth_owner_credentials
				union all
				select token_hash, '' from auth_sessions
			`),
		);
		expect(databaseText).not.toContain(rawPin);
		expect(databaseText).not.toContain(ownerPassword);
		expect(capturedLogs.join("\n")).not.toContain(rawPin);
		expect(capturedLogs.join("\n")).not.toContain(ownerPassword);
		expect(capturedLogs.join("\n")).not.toContain(rawToken);

		for (let attempt = 0; attempt < 5; attempt += 1) {
			const failed = await request("/api/auth/staff/pin", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					pin: `${randomInt(0, 1_000_000)}`.padStart(6, "0"),
				}),
			});
			expect(failed.status).toBe(401);
			expect(await failed.json()).toEqual({ error: "invalid_credentials" });
		}
		const limited = await request("/api/auth/staff/pin", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ pin: "" }),
		});
		expect(limited.status).toBe(429);
		expect(await limited.json()).toEqual({ error: "invalid_credentials" });
		expect(limited.headers.get("Retry-After")).toMatch(/^[1-9][0-9]*$/);
	});
});
