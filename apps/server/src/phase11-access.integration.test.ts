/**
 * Phase 11 owner access management over the real oRPC transport, real
 * authentication, and disposable Postgres.
 *
 * Every assertion here aims at one of the 2026-08-11 human decisions, exercised
 * through the transport rather than against the service, because the decisions
 * are about what an owner can do — not about what a function returns.
 */
import { randomBytes, randomUUID } from "node:crypto";
import path from "node:path";
import { AuthService } from "@fitway/auth";
import * as applicationSchema from "@fitway/db/schema/application";
import { auditLog } from "@fitway/db/schema/application";
import * as authSchema from "@fitway/db/schema/auth";
import { serve } from "@hono/node-server";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PinRateLimiter } from "./auth/pin-rate-limiter";
import { PostgresAuthRepository } from "./auth/postgres-auth-repository";
import { assertDisposableIntegrationDatabase } from "./test-support/integration-database-safety";

const connectionString = process.env.TEST_DATABASE_URL;
assertDisposableIntegrationDatabase({
	connectionString,
	resetMarker: process.env.FITWAY_INTEGRATION_RESET_DATABASE,
	runId: process.env.FITWAY_RUN_ID,
});

const secret = randomBytes(32).toString("base64url");
process.env.BETTER_AUTH_SECRET = secret;
process.env.BETTER_AUTH_URL = "http://127.0.0.1/api/auth";
process.env.CORS_ORIGIN = "http://127.0.0.1";
process.env.NODE_ENV = "test";

const pool = new Pool({ connectionString });
const database = drizzle(pool, {
	schema: { ...applicationSchema, ...authSchema },
});
const authService = new AuthService({
	repository: new PostgresAuthRepository(
		database as unknown as typeof import("@fitway/db").db,
	),
	pepper: secret,
	cookieSecret: secret,
});
/**
 * `pinPepper` is supplied explicitly and equals the pepper this test's
 * `AuthService` verifies with. The access service hashes new credentials with
 * it, so a PIN it generates must log in through the real login route — which is
 * the point of several assertions below. Omitting it would make the app fall
 * back to the env-derived subkey and the mismatch would show up as a login
 * failure, which is exactly the loud failure the fallback is documented to have.
 */
const runtime = {
	service: authService,
	staffPinLimiter: new PinRateLimiter(),
	ownerLoginLimiter: new PinRateLimiter(),
	pinPepper: secret,
	ownerPasswordPepper: secret,
};

type PrincipalGovernance = {
	principalId: string;
	principalKind: "shared_staff" | "owner";
	role: "staff" | "owner";
	displayName: string;
	ownerEmail: string | null;
	active: boolean;
	credentialVersion: number | null;
	credentialActive: boolean | null;
};
type MutationPayload = {
	auditId: number;
	principal: PrincipalGovernance;
	revokedSessions: number;
};
type RevealPayload = MutationPayload & { revealedPin: string };

let server: ReturnType<typeof serve>;
let baseUrl = "";
let ownerCookie = "";
let ownerEmail = "";
let ownerPassword = "";
let ownerPrincipalId = "";

function cookiePair(response: Response) {
	return (response.headers.getSetCookie()[0] ?? "").split(";", 1)[0] ?? "";
}

async function rpcRaw(
	route: string,
	json: unknown,
	cookie?: string,
): Promise<Response> {
	return fetch(`${baseUrl}/rpc/admin/access/${route}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...(cookie ? { Cookie: cookie } : {}),
		},
		body: JSON.stringify({ json }),
	});
}

async function rpc<T>(route: string, json: unknown = {}): Promise<T> {
	const response = await rpcRaw(route, json, ownerCookie);
	if (response.status !== 200) {
		throw new Error(`${route} returned ${response.status}`);
	}
	const body = (await response.json()) as { json: T };
	return body.json;
}

/** The transport's refusal code, as the owner surface will read it. */
async function refusal(
	route: string,
	json: unknown,
	cookie = ownerCookie,
): Promise<{ status: number; code: unknown }> {
	const response = await rpcRaw(route, json, cookie);
	const body = (await response.json().catch(() => null)) as {
		json?: { data?: { code?: unknown } };
	} | null;
	return { status: response.status, code: body?.json?.data?.code };
}

async function loginStaff(pin: string): Promise<Response> {
	return fetch(`${baseUrl}/api/auth/staff/pin`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ pin }),
	});
}

async function loginOwner(email: string, password: string): Promise<Response> {
	return fetch(`${baseUrl}/api/auth/owner/password`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password }),
	});
}

/** Whether a cookie still authenticates, asked through a real owner-only leaf. */
async function cookieStillWorks(cookie: string): Promise<boolean> {
	const response = await rpcRaw("list", {}, cookie);
	return response.status === 200;
}

async function latestAuditRow() {
	const [row] = await database
		.select()
		.from(auditLog)
		.orderBy(desc(auditLog.id))
		.limit(1);
	if (!row) throw new Error("No audit row was written");
	return row;
}

async function provisionOwnerAccount(displayName: string) {
	const email = `p11-access-${randomUUID()}@fitway.example`;
	const password = randomBytes(18).toString("base64url");
	const result = await rpc<MutationPayload>("owner/provision", {
		email,
		displayName,
		password,
	});
	return { email, password, principalId: result.principal.principalId, result };
}

beforeAll(async () => {
	await migrate(database, {
		migrationsFolder: path.resolve("packages/db/src/migrations"),
	});
	await database.delete(auditLog);
	await database.delete(authSchema.authSessions);
	await database.delete(authSchema.authStaffCredentials);
	await database.delete(authSchema.authOwnerCredentials);
	await database.delete(authSchema.authPrincipals);

	ownerEmail = `p11-access-root-${randomUUID()}@fitway.example`;
	ownerPassword = randomBytes(18).toString("base64url");
	await authService.provisionOwner({
		email: ownerEmail,
		displayName: "Founding owner",
		password: ownerPassword,
	});

	const { createApp } = await import("./index");
	const app = createApp("test", runtime);
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
	ownerCookie = cookiePair(await loginOwner(ownerEmail, ownerPassword));
	expect(ownerCookie).not.toBe("");
	const [principal] = await database
		.select()
		.from(authSchema.authPrincipals)
		.where(eq(authSchema.authPrincipals.ownerEmail, ownerEmail));
	if (!principal) throw new Error("Founding owner principal is missing");
	ownerPrincipalId = principal.id;
}, 120_000);

afterAll(async () => {
	server?.close();
	await pool.end();
});

describe("authorization", () => {
	it("refuses every access leaf to an anonymous caller", async () => {
		for (const route of [
			"list",
			"staffPin/provision",
			"staffPin/rotate",
			"staffPin/deactivate",
			"owner/provision",
			"owner/deactivate",
			"owner/reactivate",
			"owner/resetCredential",
		]) {
			const response = await rpcRaw(route, {}, undefined);
			expect(response.status, `${route} must refuse an anonymous caller`).toBe(
				401,
			);
		}
	});

	it("refuses every access leaf to staff", async () => {
		// A staff PIN has to exist for a staff session to exist at all, so this
		// runs after provisioning and uses the PIN the owner just generated.
		const provisioned = await rpc<RevealPayload>("staffPin/provision", {});
		const staffCookie = cookiePair(await loginStaff(provisioned.revealedPin));
		expect(staffCookie).not.toBe("");
		for (const route of [
			"list",
			"staffPin/rotate",
			"staffPin/deactivate",
			"owner/provision",
			"owner/deactivate",
			"owner/reactivate",
			"owner/resetCredential",
		]) {
			const response = await rpcRaw(route, {}, staffCookie);
			expect(response.status, `${route} must refuse staff`).toBe(403);
		}
	});
});

describe("staff PIN lifecycle", () => {
	it("generates the PIN, reveals it once, and it logs in", async () => {
		const rotated = await rpc<RevealPayload>("staffPin/rotate", {});
		expect(rotated.revealedPin).toMatch(/^[0-9]{6,12}$/);
		expect(cookiePair(await loginStaff(rotated.revealedPin))).not.toBe("");

		// The reveal is the only place it appears. No read returns it.
		const listed = await rpc<{ principals: PrincipalGovernance[] }>("list");
		expect(JSON.stringify(listed)).not.toContain(rotated.revealedPin);
	});

	it("never accepts a caller-supplied PIN", async () => {
		const chosen = "13571357";
		const result = await rpc<RevealPayload>("staffPin/rotate", {
			pin: chosen,
			revealedPin: chosen,
		});
		expect(result.revealedPin).not.toBe(chosen);
		expect(cookiePair(await loginStaff(chosen))).toBe("");
	});

	it("rotation advances the version, ends live sessions, and retires the old PIN", async () => {
		const first = await rpc<RevealPayload>("staffPin/rotate", {});
		const staffCookie = cookiePair(await loginStaff(first.revealedPin));
		expect(staffCookie).not.toBe("");

		const second = await rpc<RevealPayload>("staffPin/rotate", {});
		expect(second.principal.credentialVersion).toBe(
			(first.principal.credentialVersion ?? 0) + 1,
		);
		expect(second.revokedSessions).toBeGreaterThanOrEqual(1);
		expect(cookiePair(await loginStaff(first.revealedPin))).toBe("");
		expect(cookiePair(await loginStaff(second.revealedPin))).not.toBe("");

		const row = await latestAuditRow();
		expect(row.action).toBe("staff_pin_rotated");
		expect(row.eventClass).toBe("access");
		expect(row.actorPrincipalId).toBe(ownerPrincipalId);
		expect(row.priorCredentialVersion).toBe(first.principal.credentialVersion);
		expect(row.newCredentialVersion).toBe(second.principal.credentialVersion);
		expect(row.commandId).toBeNull();
		expect(row.effectiveValue).toBeNull();
	});

	it("deactivation requires a reason and then refuses the PIN", async () => {
		const active = await rpc<RevealPayload>("staffPin/rotate", {});
		expect(await refusal("staffPin/deactivate", {})).toMatchObject({
			status: 400,
		});
		expect(
			await refusal("staffPin/deactivate", { reason: "   " }),
		).toMatchObject({ status: 400 });

		const result = await rpc<MutationPayload>("staffPin/deactivate", {
			reason: "front desk closed for refurbishment",
		});
		expect(result.principal.credentialActive).toBe(false);
		expect(cookiePair(await loginStaff(active.revealedPin))).toBe("");

		const row = await latestAuditRow();
		expect(row.action).toBe("staff_pin_deactivated");
		expect(row.reason).toBe("front desk closed for refurbishment");
	});

	it("refuses to rotate a PIN that is not active, and provisions instead", async () => {
		expect(await refusal("staffPin/rotate", {})).toMatchObject({
			status: 400,
		});
		const provisioned = await rpc<RevealPayload>("staffPin/provision", {});
		expect(provisioned.principal.credentialActive).toBe(true);
		expect(cookiePair(await loginStaff(provisioned.revealedPin))).not.toBe("");
		expect((await latestAuditRow()).action).toBe("staff_pin_provisioned");

		expect(await refusal("staffPin/provision", {})).toMatchObject({
			status: 400,
		});
	});
});

describe("owner lifecycle", () => {
	it("provisions a real owner who can then sign in", async () => {
		const created = await provisionOwnerAccount("Second owner");
		expect(created.result.principal.active).toBe(true);
		expect((await latestAuditRow()).action).toBe("owner_provisioned");
		expect(
			cookiePair(await loginOwner(created.email, created.password)),
		).not.toBe("");
	});

	it("refuses self-deactivation", async () => {
		expect(
			await refusal("owner/deactivate", {
				targetPrincipalId: ownerPrincipalId,
				reason: "stepping down",
			}),
		).toMatchObject({ status: 400, code: "owner_self_deactivation" });
	});

	it("refuses to deactivate the last active owner", async () => {
		const created = await provisionOwnerAccount("Temporary owner");
		// Deactivate every owner but one, then try to take the last.
		const principals = await rpc<{ principals: PrincipalGovernance[] }>("list");
		const others = principals.principals.filter(
			(entry) =>
				entry.role === "owner" &&
				entry.active &&
				entry.principalId !== ownerPrincipalId &&
				entry.principalId !== created.principalId,
		);
		for (const entry of others) {
			await rpc<MutationPayload>("owner/deactivate", {
				targetPrincipalId: entry.principalId,
				reason: "clearing the fixture",
			});
		}
		await rpc<MutationPayload>("owner/deactivate", {
			targetPrincipalId: created.principalId,
			reason: "clearing the fixture",
		});

		// Only the acting owner is left. Another owner must exist to even try, so
		// provision one, sign in as them, and aim at the acting owner.
		const successor = await provisionOwnerAccount("Successor owner");
		const successorCookie = cookiePair(
			await loginOwner(successor.email, successor.password),
		);
		const savedCookie = ownerCookie;
		ownerCookie = successorCookie;
		await rpc<MutationPayload>("owner/deactivate", {
			targetPrincipalId: ownerPrincipalId,
			reason: "handing over",
		});
		expect(
			await refusal("owner/deactivate", {
				targetPrincipalId: successor.principalId,
				reason: "no one left",
			}),
		).toMatchObject({ status: 400 });

		// Restore the founding owner for the remaining cases.
		await rpc<MutationPayload>("owner/reactivate", {
			targetPrincipalId: ownerPrincipalId,
		});
		ownerCookie = cookiePair(await loginOwner(ownerEmail, ownerPassword));
		expect(ownerCookie).not.toBe("");
		expect(savedCookie).not.toBe("");
	});

	it("deactivation ends the target's sessions and reactivation does not resurrect them", async () => {
		const created = await provisionOwnerAccount("Departing owner");
		const theirCookie = cookiePair(
			await loginOwner(created.email, created.password),
		);
		expect(await cookieStillWorks(theirCookie)).toBe(true);

		const deactivated = await rpc<MutationPayload>("owner/deactivate", {
			targetPrincipalId: created.principalId,
			reason: "left the company",
		});
		expect(deactivated.principal.active).toBe(false);
		expect(deactivated.revokedSessions).toBeGreaterThanOrEqual(1);
		expect(await cookieStillWorks(theirCookie)).toBe(false);
		expect(cookiePair(await loginOwner(created.email, created.password))).toBe(
			"",
		);

		const deactivationRow = await latestAuditRow();
		expect(deactivationRow.action).toBe("owner_deactivated");
		expect(deactivationRow.priorActive).toBe(true);
		expect(deactivationRow.newActive).toBe(false);
		expect(deactivationRow.reason).toBe("left the company");
		expect(deactivationRow.targetPrincipalId).toBe(created.principalId);

		await rpc<MutationPayload>("owner/reactivate", {
			targetPrincipalId: created.principalId,
		});
		const reactivationRow = await latestAuditRow();
		expect(reactivationRow.action).toBe("owner_reactivated");
		expect(reactivationRow.priorActive).toBe(false);
		expect(reactivationRow.newActive).toBe(true);
		expect(reactivationRow.reason).toBeNull();

		// The decision says deactivation invalidates sessions, not that it
		// suspends them. The old cookie must stay dead even though the principal
		// is active again.
		expect(await cookieStillWorks(theirCookie)).toBe(false);
		expect(
			cookiePair(await loginOwner(created.email, created.password)),
		).not.toBe("");
	});

	it("refuses reactivating an owner who is already active", async () => {
		expect(
			await refusal("owner/reactivate", {
				targetPrincipalId: ownerPrincipalId,
			}),
		).toMatchObject({ status: 400, code: "owner_already_active" });
	});
});

describe("credential reset", () => {
	it("sets a new credential in-app, advances the version, and ends sessions", async () => {
		const created = await provisionOwnerAccount("Locked-out owner");
		const theirCookie = cookiePair(
			await loginOwner(created.email, created.password),
		);
		expect(await cookieStillWorks(theirCookie)).toBe(true);

		const replacement = randomBytes(18).toString("base64url");
		const result = await rpc<MutationPayload>("owner/resetCredential", {
			targetPrincipalId: created.principalId,
			password: replacement,
		});
		expect(result.principal.credentialVersion).toBe(2);
		expect(result.revokedSessions).toBeGreaterThanOrEqual(1);
		expect(await cookieStillWorks(theirCookie)).toBe(false);
		expect(cookiePair(await loginOwner(created.email, created.password))).toBe(
			"",
		);
		expect(cookiePair(await loginOwner(created.email, replacement))).not.toBe(
			"",
		);

		const row = await latestAuditRow();
		expect(row.action).toBe("credential_reset");
		expect(row.priorCredentialVersion).toBe(1);
		expect(row.newCredentialVersion).toBe(2);
	});
});

describe("the audit log the governance rows land in", () => {
	it("carries no secret material in any access row", async () => {
		const rows = await database
			.select()
			.from(auditLog)
			.where(eq(auditLog.eventClass, "access"));
		expect(rows.length).toBeGreaterThan(5);
		const serialized = JSON.stringify(rows);
		for (const forbidden of [
			"pinHash",
			"pin_hash",
			"pinSalt",
			"passwordHash",
			"password",
			"scrypt-v1",
			"scrypt-owner-v1",
			"tokenHash",
		]) {
			expect(serialized).not.toContain(forbidden);
		}
		// Every access row names an owner actor and a target, and carries no
		// command or count.
		for (const row of rows) {
			expect(row.actorPrincipalKind).toBe("owner");
			expect(row.actorRole).toBe("owner");
			expect(row.targetPrincipalId).not.toBeNull();
			expect(row.commandId).toBeNull();
			expect(row.effectiveValue).toBeNull();
			expect(row.requestedValue).toBeNull();
			expect(row.requestedDelta).toBeNull();
			expect(row.priorValue).toBeNull();
			expect(row.settingsVersion).toBeNull();
		}
	});

	it("writes exactly one row per successful mutation and none per refusal", async () => {
		const before = await database
			.select()
			.from(auditLog)
			.where(eq(auditLog.eventClass, "access"));
		await refusal("owner/reactivate", {
			targetPrincipalId: ownerPrincipalId,
		});
		await refusal("owner/deactivate", {
			targetPrincipalId: ownerPrincipalId,
			reason: "stepping down",
		});
		const afterRefusals = await database
			.select()
			.from(auditLog)
			.where(eq(auditLog.eventClass, "access"));
		expect(afterRefusals.length).toBe(before.length);

		const created = await provisionOwnerAccount("Audited owner");
		expect(created.result.auditId).toBeGreaterThan(0);
		const afterSuccess = await database
			.select()
			.from(auditLog)
			.where(eq(auditLog.eventClass, "access"));
		expect(afterSuccess.length).toBe(before.length + 1);
	});
});

describe("the last-active-owner rule under concurrency", () => {
	it("lets only one of two simultaneous deactivations through", async () => {
		// Reduce to exactly two active owners besides nobody else, then aim both
		// requests at the two of them at the same time. Without row locking both
		// would see two active owners, both would pass, and the gym would be left
		// with no owner at all.
		const listed = await rpc<{ principals: PrincipalGovernance[] }>("list");
		for (const entry of listed.principals) {
			if (
				entry.role === "owner" &&
				entry.active &&
				entry.principalId !== ownerPrincipalId
			) {
				await rpc<MutationPayload>("owner/deactivate", {
					targetPrincipalId: entry.principalId,
					reason: "clearing the fixture",
				});
			}
		}
		const first = await provisionOwnerAccount("Race owner A");
		const second = await provisionOwnerAccount("Race owner B");
		// Three active owners now: the actor plus two targets. Deactivating the
		// actor is refused separately, so drop to exactly two by removing one
		// target through the acting owner, leaving actor + one target.
		await rpc<MutationPayload>("owner/deactivate", {
			targetPrincipalId: first.principalId,
			reason: "clearing the fixture",
		});

		// Now sign in as the remaining target and fire both directions at once:
		// each owner tries to deactivate the other, and only one may win.
		const secondCookie = cookiePair(
			await loginOwner(second.email, second.password),
		);
		const [actorSide, targetSide] = await Promise.all([
			rpcRaw(
				"owner/deactivate",
				{ targetPrincipalId: second.principalId, reason: "race" },
				ownerCookie,
			),
			rpcRaw(
				"owner/deactivate",
				{ targetPrincipalId: ownerPrincipalId, reason: "race" },
				secondCookie,
			),
		]);
		// The invariant is the survivor, not the status code. Whichever request
		// commits first revokes the other actor's sessions, so the loser is refused
		// either by the rule (400) or because its own session died underneath it
		// (401) — which of the two depends on where the winner's commit lands
		// relative to the loser's authentication, and both are correct refusals.
		const remaining = await database
			.select()
			.from(authSchema.authPrincipals)
			.where(eq(authSchema.authPrincipals.active, true));
		expect(
			remaining.filter((row) => row.role === "owner").length,
			"exactly one owner must survive the race",
		).toBe(1);

		const statuses = [actorSide.status, targetSide.status].sort();
		expect(statuses[0]).toBe(200);
		expect([400, 401]).toContain(statuses[1]);
	});
});
