import type {
	AuthPrincipalRecord,
	AuthSessionRecord,
	OwnerCredentialRecord,
	SessionLookup,
	StaffCredentialRecord,
} from "./contracts";

export type SharedStaffCredential = {
	principal: AuthPrincipalRecord;
	credential: StaffCredentialRecord;
};

export type ProvisionedOwner = {
	principal: AuthPrincipalRecord;
	credential: OwnerCredentialRecord;
};

export interface AuthRepository {
	upsertSharedStaffCredential(input: {
		pinHash: string;
		pinSalt: string;
		now: Date;
	}): Promise<SharedStaffCredential>;
	findSharedStaffCredential(): Promise<SharedStaffCredential | null>;
	createOwner(input: {
		email: string;
		displayName: string;
		passwordHash: string;
		passwordSalt: string;
		now: Date;
	}): Promise<ProvisionedOwner>;
	findOwnerCredentialByEmail(email: string): Promise<ProvisionedOwner | null>;
	findPrincipalById(principalId: string): Promise<AuthPrincipalRecord | null>;
	createSession(input: AuthSessionRecord): Promise<AuthSessionRecord>;
	findSessionByTokenHash(tokenHash: string): Promise<SessionLookup | null>;
	refreshSession(input: {
		sessionId: string;
		refreshedBefore: Date;
		refreshedAt: Date;
		expiresAt: Date;
	}): Promise<boolean>;
	revokeSession(sessionId: string, revokedAt: Date): Promise<void>;
}
