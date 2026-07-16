export const ROLES = ["staff", "owner"] as const;
export type AuthRole = (typeof ROLES)[number];

export const PRINCIPAL_KINDS = ["shared_staff", "owner"] as const;
export type PrincipalKind = (typeof PRINCIPAL_KINDS)[number];

export const PIN_PATTERN = /^[0-9]{6,12}$/;
export const OWNER_PASSWORD_PATTERN = /^.{12,128}$/u;

export type CanonicalAuthContext = {
	principalId: string;
	principalKind: PrincipalKind;
	role: AuthRole;
	sessionId: string;
	expiresAt: Date;
	active: boolean;
};

export type AuthPrincipalRecord = {
	id: string;
	principalKind: PrincipalKind;
	role: AuthRole;
	active: boolean;
	ownerEmail: string | null;
	displayName: string;
};

export type StaffCredentialRecord = {
	id: string;
	principalId: string;
	pinHash: string;
	pinSalt: string;
	credentialVersion: number;
	active: boolean;
	createdAt: Date;
	rotatedAt: Date;
};

export type OwnerCredentialRecord = {
	id: string;
	principalId: string;
	passwordHash: string;
	passwordSalt: string;
	credentialVersion: number;
	active: boolean;
	createdAt: Date;
	rotatedAt: Date;
};

export type AuthSessionRecord = {
	id: string;
	principalId: string;
	tokenHash: string;
	credentialVersion: number | null;
	expiresAt: Date;
	lastRefreshedAt: Date;
	revokedAt: Date | null;
	createdAt: Date;
};

export type SessionLookup = {
	session: AuthSessionRecord;
	principal: AuthPrincipalRecord;
	staffCredential: StaffCredentialRecord | null;
	ownerCredential: OwnerCredentialRecord | null;
};
