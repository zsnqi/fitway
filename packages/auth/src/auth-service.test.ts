import { randomBytes, randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
	type AuthPrincipalRecord,
	type AuthRepository,
	AuthService,
	type AuthSessionRecord,
	type OwnerCredentialRecord,
	SESSION_COOKIE_NAMES,
	SESSION_REFRESH_INTERVAL_MS,
	SESSION_TTL_MS,
	type SessionLookup,
	type StaffCredentialRecord,
} from "./index";

class MemoryAuthRepository implements AuthRepository {
	principals: AuthPrincipalRecord[] = [];
	credentials: StaffCredentialRecord[] = [];
	ownerCredentials: OwnerCredentialRecord[] = [];
	sessions: AuthSessionRecord[] = [];
	lastStoredPin?: { pinHash: string; pinSalt: string };

	async upsertSharedStaffCredential(input: {
		pinHash: string;
		pinSalt: string;
		now: Date;
	}) {
		this.lastStoredPin = {
			pinHash: input.pinHash,
			pinSalt: input.pinSalt,
		};
		let principal = this.principals.find(
			(candidate) => candidate.principalKind === "shared_staff",
		);
		if (!principal) {
			principal = {
				id: randomUUID(),
				principalKind: "shared_staff",
				role: "staff",
				active: true,
				ownerEmail: null,
				displayName: "Shared front desk",
			};
			this.principals.push(principal);
		}
		let credential = this.credentials.find(
			(candidate) => candidate.principalId === principal.id,
		);
		if (credential) {
			credential = {
				...credential,
				pinHash: input.pinHash,
				pinSalt: input.pinSalt,
				credentialVersion: credential.credentialVersion + 1,
				active: true,
				rotatedAt: input.now,
			};
			this.credentials = [credential];
		} else {
			credential = {
				id: randomUUID(),
				principalId: principal.id,
				pinHash: input.pinHash,
				pinSalt: input.pinSalt,
				credentialVersion: 1,
				active: true,
				createdAt: input.now,
				rotatedAt: input.now,
			};
			this.credentials.push(credential);
		}
		return { principal, credential };
	}

	async findSharedStaffCredential() {
		const principal = this.principals.find(
			(candidate) => candidate.principalKind === "shared_staff",
		);
		const credential = principal
			? this.credentials.find(
					(candidate) => candidate.principalId === principal.id,
				)
			: undefined;
		return principal && credential ? { principal, credential } : null;
	}

	async createOwner(input: {
		email: string;
		displayName: string;
		passwordHash: string;
		passwordSalt: string;
		now: Date;
	}) {
		const principal: AuthPrincipalRecord = {
			id: randomUUID(),
			principalKind: "owner",
			role: "owner",
			active: true,
			ownerEmail: input.email,
			displayName: input.displayName,
		};
		this.principals.push(principal);
		const credential: OwnerCredentialRecord = {
			id: randomUUID(),
			principalId: principal.id,
			passwordHash: input.passwordHash,
			passwordSalt: input.passwordSalt,
			credentialVersion: 1,
			active: true,
			createdAt: input.now,
			rotatedAt: input.now,
		};
		this.ownerCredentials.push(credential);
		return { principal, credential };
	}

	async findOwnerCredentialByEmail(email: string) {
		const principal = this.principals.find(
			(candidate) => candidate.ownerEmail === email,
		);
		const credential = principal
			? this.ownerCredentials.find(
					(candidate) => candidate.principalId === principal.id,
				)
			: undefined;
		return principal && credential ? { principal, credential } : null;
	}

	async findPrincipalById(principalId: string) {
		return (
			this.principals.find((principal) => principal.id === principalId) ?? null
		);
	}

	async createSession(input: AuthSessionRecord) {
		this.sessions.push(input);
		return input;
	}

	async findSessionByTokenHash(
		tokenHash: string,
	): Promise<SessionLookup | null> {
		const session = this.sessions.find(
			(candidate) => candidate.tokenHash === tokenHash,
		);
		if (!session) return null;
		const principal = this.principals.find(
			(candidate) => candidate.id === session.principalId,
		);
		if (!principal) return null;
		const credential = this.credentials.find(
			(candidate) => candidate.principalId === principal.id,
		);
		const ownerCredential = this.ownerCredentials.find(
			(candidate) => candidate.principalId === principal.id,
		);
		return {
			session,
			principal,
			staffCredential: credential ?? null,
			ownerCredential: ownerCredential ?? null,
		};
	}

	async refreshSession(input: {
		sessionId: string;
		refreshedBefore: Date;
		refreshedAt: Date;
		expiresAt: Date;
	}) {
		const session = this.sessions.find(
			(candidate) => candidate.id === input.sessionId,
		);
		if (!session || session.lastRefreshedAt > input.refreshedBefore)
			return false;
		session.lastRefreshedAt = input.refreshedAt;
		session.expiresAt = input.expiresAt;
		return true;
	}

	async revokeSession(sessionId: string, revokedAt: Date) {
		const session = this.sessions.find(
			(candidate) => candidate.id === sessionId,
		);
		if (session) session.revokedAt = revokedAt;
	}
}

const pepper = randomBytes(32).toString("base64url");
const cookieSecret = randomBytes(32).toString("base64url");
const pin = () => `${Math.floor(100_000 + Math.random() * 900_000)}`;

function cookieHeader(setCookie: string) {
	return setCookie.split(";", 1)[0] ?? "";
}

describe("AuthService", () => {
	it("stores a salted memory-hard PIN hash and creates a hashed opaque staff session", async () => {
		const repository = new MemoryAuthRepository();
		const service = new AuthService({ repository, pepper, cookieSecret });
		const rawPin = pin();

		const credential = await service.setSharedStaffPin(rawPin);
		const login = await service.loginStaff({ pin: rawPin });

		expect(credential.principal.ownerEmail).toBeNull();
		expect(repository.principals).toHaveLength(1);
		expect(repository.lastStoredPin?.pinHash).toMatch(/^scrypt-v1\$/);
		expect(repository.lastStoredPin?.pinHash).not.toContain(rawPin);
		expect(repository.lastStoredPin?.pinSalt).not.toBe("");
		expect(login.status).toBe("authenticated");
		if (login.status !== "authenticated") return;
		expect(login.context.principalKind).toBe("shared_staff");
		expect(login.context.role).toBe("staff");
		expect(repository.sessions[0]?.tokenHash).toMatch(/^[a-f0-9]{64}$/);
		expect(login.cookieHeaders[0]).toContain(`${SESSION_COOKIE_NAMES.staff}=`);
		expect(login.cookieHeaders[0]).toContain("HttpOnly");
		expect(login.cookieHeaders[0]).toContain("Secure");
		expect(login.cookieHeaders[0]).toContain("SameSite=Lax");
		expect(login.cookieHeaders[0]).toContain("Path=/");
		expect(login.cookieHeaders[0]).toContain("Max-Age=2592000");
		expect(login.cookieHeaders[0]).not.toContain("Domain=");
		expect(login.cookieHeaders.join("\n")).not.toContain(rawPin);
	});

	it("rejects expiration, revocation, deactivation, and credential rotation", async () => {
		const repository = new MemoryAuthRepository();
		const service = new AuthService({ repository, pepper, cookieSecret });
		const rawPin = pin();
		await service.setSharedStaffPin(rawPin);
		const now = new Date("2026-07-16T00:00:00.000Z");
		const login = await service.loginStaff({ pin: rawPin, now });
		expect(login.status).toBe("authenticated");
		if (login.status !== "authenticated") return;
		const cookie = cookieHeader(login.cookieHeaders[0] ?? "");
		const session = repository.sessions[0];
		const principal = repository.principals[0];
		if (!session || !principal)
			throw new Error("auth records were not created");

		expect((await service.authenticate(cookie, now)).status).toBe(
			"authenticated",
		);
		session.expiresAt = new Date(now.getTime() - 1);
		expect((await service.authenticate(cookie, now)).status).toBe(
			"unauthenticated",
		);
		session.expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
		session.revokedAt = now;
		expect((await service.authenticate(cookie, now)).status).toBe(
			"unauthenticated",
		);
		session.revokedAt = null;
		principal.active = false;
		expect((await service.authenticate(cookie, now)).status).toBe(
			"unauthenticated",
		);
		principal.active = true;
		await service.setSharedStaffPin(pin());
		expect((await service.authenticate(cookie, now)).status).toBe(
			"unauthenticated",
		);
	});

	it("refreshes rolling expiry no more than once per 24 hours", async () => {
		const repository = new MemoryAuthRepository();
		const service = new AuthService({ repository, pepper, cookieSecret });
		const rawPin = pin();
		await service.setSharedStaffPin(rawPin);
		const issuedAt = new Date("2026-07-16T00:00:00.000Z");
		const login = await service.loginStaff({ pin: rawPin, now: issuedAt });
		if (login.status !== "authenticated") throw new Error("login failed");
		const cookie = cookieHeader(login.cookieHeaders[0] ?? "");

		const early = await service.authenticate(
			cookie,
			new Date(issuedAt.getTime() + SESSION_REFRESH_INTERVAL_MS - 1),
		);
		expect(early.status).toBe("authenticated");
		expect(early.cookieHeaders).toHaveLength(0);

		const daily = await service.authenticate(
			cookie,
			new Date(issuedAt.getTime() + SESSION_REFRESH_INTERVAL_MS),
		);
		expect(daily.status).toBe("authenticated");
		expect(daily.cookieHeaders).toHaveLength(1);
		expect(repository.sessions[0]?.expiresAt.getTime()).toBe(
			issuedAt.getTime() + SESSION_REFRESH_INTERVAL_MS + SESSION_TTL_MS,
		);
	});

	it("rejects ambiguous valid staff and owner sessions, while explicit login clears the other", async () => {
		const repository = new MemoryAuthRepository();
		const service = new AuthService({ repository, pepper, cookieSecret });
		const rawPin = pin();
		await service.setSharedStaffPin(rawPin);
		const staffLogin = await service.loginStaff({ pin: rawPin });
		if (staffLogin.status !== "authenticated")
			throw new Error("staff login failed");
		const ownerPassword = randomBytes(24).toString("base64url");
		const provisionedOwner = await service.provisionOwner({
			email: `owner-${randomUUID()}@fitway.example`,
			displayName: "Authenticated Owner",
			password: ownerPassword,
		});
		const ownerLogin = await service.loginOwner({
			email: provisionedOwner.ownerEmail ?? "",
			password: ownerPassword,
		});
		if (ownerLogin.status !== "authenticated")
			throw new Error("owner login failed");
		const both = [
			cookieHeader(staffLogin.cookieHeaders[0] ?? ""),
			cookieHeader(ownerLogin.cookieHeaders[0] ?? ""),
		].join("; ");
		expect((await service.authenticate(both)).status).toBe("ambiguous");

		const relogin = await service.loginStaff({
			pin: rawPin,
			cookieHeader: both,
		});
		expect(relogin.status).toBe("authenticated");
		if (relogin.status !== "authenticated") return;
		expect(relogin.cookieHeaders.join("\n")).toContain(
			`${SESSION_COOKIE_NAMES.owner}=;`,
		);
		expect(
			repository.sessions.find(
				(session) => session.principalId === provisionedOwner.id,
			)?.revokedAt,
		).toBeInstanceOf(Date);
	});
});
