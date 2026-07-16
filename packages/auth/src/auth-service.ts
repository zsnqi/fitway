import { randomUUID } from "node:crypto";

import type {
	AuthPrincipalRecord,
	CanonicalAuthContext,
	PrincipalKind,
	SessionLookup,
} from "./contracts";
import { OWNER_PASSWORD_PATTERN, PIN_PATTERN } from "./contracts";
import {
	readCookie,
	serializeClearedSessionCookie,
	serializeSessionCookie,
	sessionCookieName,
	signCookieValue,
	verifyCookieValue,
} from "./cookies";
import {
	createOpaqueSessionToken,
	hashOwnerPassword,
	hashSessionToken,
	hashStaffPin,
	verifyOwnerPassword,
	verifyStaffPin,
} from "./crypto";
import type { AuthRepository } from "./repository";

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1_000;
export const SESSION_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1_000;
const DUMMY_SALT = "Zml0d2F5LWludmFsaWQtcGlu";

type AuthenticatedResult = {
	status: "authenticated";
	context: CanonicalAuthContext;
	cookieHeaders: string[];
};

type UnauthenticatedResult = {
	status: "unauthenticated";
	cookieHeaders: string[];
};

type AmbiguousResult = {
	status: "ambiguous";
	cookieHeaders: string[];
};

export type AuthenticationResult =
	| AuthenticatedResult
	| UnauthenticatedResult
	| AmbiguousResult;

export type LoginResult =
	| AuthenticatedResult
	| { status: "invalid_credentials"; cookieHeaders: string[] };

type ServiceOptions = {
	repository: AuthRepository;
	pepper: string;
	cookieSecret: string;
};

type ResolvedSession = {
	lookup: SessionLookup;
	token: string;
	cookieName: string;
};

function contextFromLookup(lookup: SessionLookup): CanonicalAuthContext {
	return {
		principalId: lookup.principal.id,
		principalKind: lookup.principal.principalKind,
		role: lookup.principal.role,
		sessionId: lookup.session.id,
		expiresAt: lookup.session.expiresAt,
		active: lookup.principal.active,
	};
}

function hasCoherentAuthority(principal: AuthPrincipalRecord) {
	return (
		(principal.principalKind === "shared_staff" &&
			principal.role === "staff" &&
			principal.ownerEmail === null) ||
		(principal.principalKind === "owner" &&
			principal.role === "owner" &&
			principal.ownerEmail !== null)
	);
}

export class AuthService {
	readonly #repository: AuthRepository;
	readonly #pepper: string;
	readonly #cookieSecret: string;

	constructor({ repository, pepper, cookieSecret }: ServiceOptions) {
		if (pepper.length < 32 || cookieSecret.length < 32) {
			throw new Error("Authentication secrets must be at least 32 characters");
		}
		this.#repository = repository;
		this.#pepper = pepper;
		this.#cookieSecret = cookieSecret;
	}

	async setSharedStaffPin(pin: string, now = new Date()) {
		if (!PIN_PATTERN.test(pin)) {
			throw new TypeError("Staff PIN must be 6-12 Western digits");
		}
		const hashed = await hashStaffPin(pin, this.#pepper);
		return this.#repository.upsertSharedStaffCredential({ ...hashed, now });
	}

	async provisionOwner(
		input: {
			email: string;
			displayName: string;
			password: string;
		},
		now = new Date(),
	) {
		const email = input.email.trim().toLowerCase();
		if (
			!email.includes("@") ||
			!input.displayName.trim() ||
			!OWNER_PASSWORD_PATTERN.test(input.password)
		) {
			throw new TypeError(
				"A real owner email, display name, and 12-128 character credential are required",
			);
		}
		const hashed = await hashOwnerPassword(input.password, this.#pepper);
		const provisioned = await this.#repository.createOwner({
			email,
			displayName: input.displayName.trim(),
			...hashed,
			now,
		});
		return provisioned.principal;
	}

	async loginStaff(input: {
		pin: string;
		cookieHeader?: string;
		now?: Date;
	}): Promise<LoginResult> {
		const now = input.now ?? new Date();
		const shared = await this.#repository.findSharedStaffCredential();
		const verified = shared
			? await verifyStaffPin({
					pin: input.pin,
					pepper: this.#pepper,
					pinSalt: shared.credential.pinSalt,
					pinHash: shared.credential.pinHash,
				})
			: await this.#burnInvalidPin(input.pin);
		if (
			!PIN_PATTERN.test(input.pin) ||
			!verified ||
			!shared?.principal.active ||
			!shared.credential.active ||
			!hasCoherentAuthority(shared.principal)
		) {
			return { status: "invalid_credentials", cookieHeaders: [] };
		}
		return this.#issueSession({
			principal: shared.principal,
			credentialVersion: shared.credential.credentialVersion,
			cookieHeader: input.cookieHeader,
			now,
		});
	}

	async loginOwner(input: {
		email: string;
		password: string;
		cookieHeader?: string;
		now?: Date;
	}): Promise<LoginResult> {
		const now = input.now ?? new Date();
		const email = input.email.trim().toLowerCase();
		const owner = await this.#repository.findOwnerCredentialByEmail(email);
		const verified = owner
			? await verifyOwnerPassword({
					password: input.password,
					pepper: this.#pepper,
					passwordSalt: owner.credential.passwordSalt,
					passwordHash: owner.credential.passwordHash,
				})
			: await this.#burnInvalidOwnerPassword(input.password);
		if (
			!OWNER_PASSWORD_PATTERN.test(input.password) ||
			!verified ||
			!owner?.principal.active ||
			!owner.credential.active ||
			!hasCoherentAuthority(owner.principal)
		) {
			return { status: "invalid_credentials", cookieHeaders: [] };
		}
		return this.#issueSession({
			principal: owner.principal,
			credentialVersion: owner.credential.credentialVersion,
			cookieHeader: input.cookieHeader,
			now,
		});
	}

	async authenticate(
		cookieHeader: string | undefined,
		now = new Date(),
	): Promise<AuthenticationResult> {
		const [staff, owner] = await Promise.all([
			this.#resolveCookie(cookieHeader, "shared_staff", now),
			this.#resolveCookie(cookieHeader, "owner", now),
		]);
		if (staff && owner) return { status: "ambiguous", cookieHeaders: [] };
		const resolved = staff ?? owner;
		if (!resolved) return { status: "unauthenticated", cookieHeaders: [] };

		const cookieHeaders: string[] = [];
		const refreshedBefore = new Date(
			now.getTime() - SESSION_REFRESH_INTERVAL_MS,
		);
		if (resolved.lookup.session.lastRefreshedAt <= refreshedBefore) {
			const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
			const refreshed = await this.#repository.refreshSession({
				sessionId: resolved.lookup.session.id,
				refreshedBefore,
				refreshedAt: now,
				expiresAt,
			});
			if (refreshed) {
				resolved.lookup.session.expiresAt = expiresAt;
				resolved.lookup.session.lastRefreshedAt = now;
				cookieHeaders.push(
					serializeSessionCookie({
						name: resolved.cookieName,
						value: signCookieValue(
							resolved.cookieName,
							resolved.token,
							this.#cookieSecret,
						),
						expiresAt,
						now,
					}),
				);
			}
		}
		return {
			status: "authenticated",
			context: contextFromLookup(resolved.lookup),
			cookieHeaders,
		};
	}

	async logout(cookieHeader: string | undefined, now = new Date()) {
		const cookieHeaders: string[] = [];
		for (const kind of ["shared_staff", "owner"] as const) {
			const name = sessionCookieName(kind);
			await this.#revokeSessionFromCookie(cookieHeader, kind, now);
			cookieHeaders.push(serializeClearedSessionCookie(name));
		}
		return cookieHeaders;
	}

	async #burnInvalidPin(pin: string) {
		await hashStaffPin(pin, this.#pepper, DUMMY_SALT);
		return false;
	}

	async #burnInvalidOwnerPassword(password: string) {
		await hashOwnerPassword(password, this.#pepper, DUMMY_SALT);
		return false;
	}

	async #issueSession(input: {
		principal: AuthPrincipalRecord;
		credentialVersion: number | null;
		cookieHeader?: string;
		now: Date;
	}): Promise<AuthenticatedResult> {
		const token = createOpaqueSessionToken();
		const expiresAt = new Date(input.now.getTime() + SESSION_TTL_MS);
		const session = await this.#repository.createSession({
			id: randomUUID(),
			principalId: input.principal.id,
			tokenHash: hashSessionToken(token),
			credentialVersion: input.credentialVersion,
			expiresAt,
			lastRefreshedAt: input.now,
			revokedAt: null,
			createdAt: input.now,
		});
		const cookieName = sessionCookieName(input.principal.principalKind);
		const cookieHeaders = [
			serializeSessionCookie({
				name: cookieName,
				value: signCookieValue(cookieName, token, this.#cookieSecret),
				expiresAt,
				now: input.now,
			}),
		];
		const otherKind: PrincipalKind =
			input.principal.principalKind === "owner" ? "shared_staff" : "owner";
		await this.#clearOtherSession(
			input.cookieHeader,
			otherKind,
			input.now,
			cookieHeaders,
		);
		return {
			status: "authenticated",
			context: {
				principalId: input.principal.id,
				principalKind: input.principal.principalKind,
				role: input.principal.role,
				sessionId: session.id,
				expiresAt,
				active: input.principal.active,
			},
			cookieHeaders,
		};
	}

	async #clearOtherSession(
		cookieHeader: string | undefined,
		kind: PrincipalKind,
		now: Date,
		cookieHeaders: string[],
	) {
		const name = sessionCookieName(kind);
		if (!(await this.#revokeSessionFromCookie(cookieHeader, kind, now))) return;
		cookieHeaders.push(serializeClearedSessionCookie(name));
	}

	async #revokeSessionFromCookie(
		cookieHeader: string | undefined,
		kind: PrincipalKind,
		now: Date,
	) {
		const name = sessionCookieName(kind);
		const value = readCookie(cookieHeader, name);
		if (!value) return false;
		const token = verifyCookieValue(name, value, this.#cookieSecret);
		if (!token) return true;
		const found = await this.#repository.findSessionByTokenHash(
			hashSessionToken(token),
		);
		if (found) await this.#repository.revokeSession(found.session.id, now);
		return true;
	}

	async #resolveCookie(
		cookieHeader: string | undefined,
		kind: PrincipalKind,
		now: Date,
	): Promise<ResolvedSession | null> {
		const cookieName = sessionCookieName(kind);
		const value = readCookie(cookieHeader, cookieName);
		if (!value) return null;
		const token = verifyCookieValue(cookieName, value, this.#cookieSecret);
		if (!token) return null;
		const lookup = await this.#repository.findSessionByTokenHash(
			hashSessionToken(token),
		);
		if (!lookup || lookup.principal.principalKind !== kind) return null;
		if (
			!hasCoherentAuthority(lookup.principal) ||
			!lookup.principal.active ||
			lookup.session.revokedAt !== null ||
			lookup.session.expiresAt <= now
		) {
			return null;
		}
		if (
			kind === "shared_staff" &&
			(!lookup.staffCredential?.active ||
				lookup.session.credentialVersion !==
					lookup.staffCredential.credentialVersion)
		) {
			return null;
		}
		if (
			kind === "owner" &&
			(!lookup.ownerCredential?.active ||
				lookup.session.credentialVersion !==
					lookup.ownerCredential.credentialVersion)
		) {
			return null;
		}
		return { lookup, token, cookieName };
	}
}
