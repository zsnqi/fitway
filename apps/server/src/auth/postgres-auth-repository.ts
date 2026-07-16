import type {
	AuthPrincipalRecord,
	AuthRepository,
	AuthSessionRecord,
	OwnerCredentialRecord,
	SessionLookup,
	StaffCredentialRecord,
} from "@fitway/auth";
import type { db } from "@fitway/db";
import {
	authOwnerCredentials,
	authPrincipals,
	authSessions,
	authStaffCredentials,
} from "@fitway/db/schema/auth";
import { and, eq, isNull, lte, sql } from "drizzle-orm";

type Database = typeof db;

function principalRecord(
	row: typeof authPrincipals.$inferSelect,
): AuthPrincipalRecord {
	return {
		id: row.id,
		principalKind: row.principalKind,
		role: row.role,
		active: row.active,
		ownerEmail: row.ownerEmail,
		displayName: row.displayName,
	};
}

function credentialRecord(
	row: typeof authStaffCredentials.$inferSelect,
): StaffCredentialRecord {
	return {
		id: row.id,
		principalId: row.principalId,
		pinHash: row.pinHash,
		pinSalt: row.pinSalt,
		credentialVersion: row.credentialVersion,
		active: row.active,
		createdAt: row.createdAt,
		rotatedAt: row.rotatedAt,
	};
}

function sessionRecord(
	row: typeof authSessions.$inferSelect,
): AuthSessionRecord {
	return {
		id: row.id,
		principalId: row.principalId,
		tokenHash: row.tokenHash,
		credentialVersion: row.credentialVersion,
		expiresAt: row.expiresAt,
		lastRefreshedAt: row.lastRefreshedAt,
		revokedAt: row.revokedAt,
		createdAt: row.createdAt,
	};
}

function ownerCredentialRecord(
	row: typeof authOwnerCredentials.$inferSelect,
): OwnerCredentialRecord {
	return {
		id: row.id,
		principalId: row.principalId,
		passwordHash: row.passwordHash,
		passwordSalt: row.passwordSalt,
		credentialVersion: row.credentialVersion,
		active: row.active,
		createdAt: row.createdAt,
		rotatedAt: row.rotatedAt,
	};
}

export class PostgresAuthRepository implements AuthRepository {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async upsertSharedStaffCredential(input: {
		pinHash: string;
		pinSalt: string;
		now: Date;
	}) {
		return this.#db.transaction(async (transaction) => {
			let [principal] = await transaction
				.select()
				.from(authPrincipals)
				.where(eq(authPrincipals.principalKind, "shared_staff"))
				.limit(1);
			if (!principal) {
				[principal] = await transaction
					.insert(authPrincipals)
					.values({
						principalKind: "shared_staff",
						role: "staff",
						ownerEmail: null,
						displayName: "Shared front desk",
						createdAt: input.now,
						updatedAt: input.now,
					})
					.returning();
			}
			if (!principal)
				throw new Error("Failed to create shared staff principal");

			const [existing] = await transaction
				.select()
				.from(authStaffCredentials)
				.where(eq(authStaffCredentials.principalId, principal.id))
				.limit(1);
			const [credential] = existing
				? await transaction
						.update(authStaffCredentials)
						.set({
							pinHash: input.pinHash,
							pinSalt: input.pinSalt,
							credentialVersion: existing.credentialVersion + 1,
							active: true,
							rotatedAt: input.now,
						})
						.where(eq(authStaffCredentials.id, existing.id))
						.returning()
				: await transaction
						.insert(authStaffCredentials)
						.values({
							principalId: principal.id,
							pinHash: input.pinHash,
							pinSalt: input.pinSalt,
							createdAt: input.now,
							rotatedAt: input.now,
						})
						.returning();
			if (!credential) throw new Error("Failed to store staff credential");
			return {
				principal: principalRecord(principal),
				credential: credentialRecord(credential),
			};
		});
	}

	async findSharedStaffCredential() {
		const [row] = await this.#db
			.select({
				principal: authPrincipals,
				credential: authStaffCredentials,
			})
			.from(authPrincipals)
			.innerJoin(
				authStaffCredentials,
				eq(authStaffCredentials.principalId, authPrincipals.id),
			)
			.where(eq(authPrincipals.principalKind, "shared_staff"))
			.limit(1);
		return row
			? {
					principal: principalRecord(row.principal),
					credential: credentialRecord(row.credential),
				}
			: null;
	}

	async createOwner(input: {
		email: string;
		displayName: string;
		passwordHash: string;
		passwordSalt: string;
		now: Date;
	}) {
		return this.#db.transaction(async (transaction) => {
			const [principal] = await transaction
				.insert(authPrincipals)
				.values({
					principalKind: "owner",
					role: "owner",
					ownerEmail: input.email,
					displayName: input.displayName,
					createdAt: input.now,
					updatedAt: input.now,
				})
				.returning();
			if (!principal) throw new Error("Failed to provision owner principal");
			const [credential] = await transaction
				.insert(authOwnerCredentials)
				.values({
					principalId: principal.id,
					passwordHash: input.passwordHash,
					passwordSalt: input.passwordSalt,
					createdAt: input.now,
					rotatedAt: input.now,
				})
				.returning();
			if (!credential) throw new Error("Failed to provision owner credential");
			return {
				principal: principalRecord(principal),
				credential: ownerCredentialRecord(credential),
			};
		});
	}

	async findOwnerCredentialByEmail(email: string) {
		const [row] = await this.#db
			.select({
				principal: authPrincipals,
				credential: authOwnerCredentials,
			})
			.from(authPrincipals)
			.innerJoin(
				authOwnerCredentials,
				eq(authOwnerCredentials.principalId, authPrincipals.id),
			)
			.where(sql`lower(${authPrincipals.ownerEmail}) = ${email}`)
			.limit(1);
		return row
			? {
					principal: principalRecord(row.principal),
					credential: ownerCredentialRecord(row.credential),
				}
			: null;
	}

	async findPrincipalById(principalId: string) {
		const [row] = await this.#db
			.select()
			.from(authPrincipals)
			.where(eq(authPrincipals.id, principalId))
			.limit(1);
		return row ? principalRecord(row) : null;
	}

	async createSession(input: AuthSessionRecord) {
		const [row] = await this.#db.insert(authSessions).values(input).returning();
		if (!row) throw new Error("Failed to create auth session");
		return sessionRecord(row);
	}

	async findSessionByTokenHash(
		tokenHash: string,
	): Promise<SessionLookup | null> {
		const [row] = await this.#db
			.select({
				session: authSessions,
				principal: authPrincipals,
				credential: authStaffCredentials,
				ownerCredential: authOwnerCredentials,
			})
			.from(authSessions)
			.innerJoin(
				authPrincipals,
				eq(authPrincipals.id, authSessions.principalId),
			)
			.leftJoin(
				authStaffCredentials,
				eq(authStaffCredentials.principalId, authPrincipals.id),
			)
			.leftJoin(
				authOwnerCredentials,
				eq(authOwnerCredentials.principalId, authPrincipals.id),
			)
			.where(eq(authSessions.tokenHash, tokenHash))
			.limit(1);
		return row
			? {
					session: sessionRecord(row.session),
					principal: principalRecord(row.principal),
					staffCredential: row.credential
						? credentialRecord(row.credential)
						: null,
					ownerCredential: row.ownerCredential
						? ownerCredentialRecord(row.ownerCredential)
						: null,
				}
			: null;
	}

	async refreshSession(input: {
		sessionId: string;
		refreshedBefore: Date;
		refreshedAt: Date;
		expiresAt: Date;
	}) {
		const rows = await this.#db
			.update(authSessions)
			.set({
				lastRefreshedAt: input.refreshedAt,
				expiresAt: input.expiresAt,
			})
			.where(
				and(
					eq(authSessions.id, input.sessionId),
					lte(authSessions.lastRefreshedAt, input.refreshedBefore),
					isNull(authSessions.revokedAt),
				),
			)
			.returning({ id: authSessions.id });
		return rows.length === 1;
	}

	async revokeSession(sessionId: string, revokedAt: Date) {
		await this.#db
			.update(authSessions)
			.set({ revokedAt })
			.where(
				and(eq(authSessions.id, sessionId), isNull(authSessions.revokedAt)),
			);
	}
}
