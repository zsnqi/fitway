import { relations, sql } from "drizzle-orm";
import {
	boolean,
	check,
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

export const authRole = pgEnum("auth_role", ["staff", "owner"]);
export const authPrincipalKind = pgEnum("auth_principal_kind", [
	"shared_staff",
	"owner",
]);

const utcTimestamp = (name: string) => timestamp(name, { withTimezone: true });

export const authPrincipals = pgTable(
	"auth_principals",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		principalKind: authPrincipalKind("principal_kind").notNull(),
		role: authRole("role").notNull(),
		active: boolean("active").notNull().default(true),
		ownerEmail: text("owner_email"),
		displayName: text("display_name").notNull(),
		createdAt: utcTimestamp("created_at").notNull().defaultNow(),
		updatedAt: utcTimestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		uniqueIndex("auth_principals_one_shared_staff")
			.on(table.principalKind)
			.where(sql`${table.principalKind} = 'shared_staff'`),
		uniqueIndex("auth_principals_owner_email_unique")
			.on(sql`lower(${table.ownerEmail})`)
			.where(sql`${table.ownerEmail} is not null`),
		check(
			"auth_principals_kind_role_identity",
			sql`(
				(${table.principalKind} = 'shared_staff' and ${table.role} = 'staff' and ${table.ownerEmail} is null)
				or
				(${table.principalKind} = 'owner' and ${table.role} = 'owner' and ${table.ownerEmail} is not null)
			)`,
		),
		check(
			"auth_principals_display_name_nonempty",
			sql`length(trim(${table.displayName})) > 0`,
		),
		check(
			"auth_principals_owner_email_nonempty",
			sql`${table.ownerEmail} is null or length(trim(${table.ownerEmail})) > 0`,
		),
	],
);

export const authStaffCredentials = pgTable(
	"auth_staff_credentials",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		principalId: uuid("principal_id")
			.notNull()
			.references(() => authPrincipals.id, { onDelete: "cascade" }),
		pinHash: text("pin_hash").notNull(),
		pinSalt: text("pin_salt").notNull(),
		credentialVersion: integer("credential_version").notNull().default(1),
		active: boolean("active").notNull().default(true),
		createdAt: utcTimestamp("created_at").notNull().defaultNow(),
		rotatedAt: utcTimestamp("rotated_at").notNull().defaultNow(),
	},
	(table) => [
		uniqueIndex("auth_staff_credentials_principal_unique").on(
			table.principalId,
		),
		check(
			"auth_staff_credentials_hash_nonempty",
			sql`length(trim(${table.pinHash})) > 0`,
		),
		check(
			"auth_staff_credentials_salt_nonempty",
			sql`length(trim(${table.pinSalt})) > 0`,
		),
		check(
			"auth_staff_credentials_version_positive",
			sql`${table.credentialVersion} > 0`,
		),
	],
);

export const authOwnerCredentials = pgTable(
	"auth_owner_credentials",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		principalId: uuid("principal_id")
			.notNull()
			.references(() => authPrincipals.id, { onDelete: "cascade" }),
		passwordHash: text("password_hash").notNull(),
		passwordSalt: text("password_salt").notNull(),
		credentialVersion: integer("credential_version").notNull().default(1),
		active: boolean("active").notNull().default(true),
		createdAt: utcTimestamp("created_at").notNull().defaultNow(),
		rotatedAt: utcTimestamp("rotated_at").notNull().defaultNow(),
	},
	(table) => [
		uniqueIndex("auth_owner_credentials_principal_unique").on(
			table.principalId,
		),
		check(
			"auth_owner_credentials_hash_nonempty",
			sql`length(trim(${table.passwordHash})) > 0`,
		),
		check(
			"auth_owner_credentials_salt_nonempty",
			sql`length(trim(${table.passwordSalt})) > 0`,
		),
		check(
			"auth_owner_credentials_version_positive",
			sql`${table.credentialVersion} > 0`,
		),
	],
);

export const authSessions = pgTable(
	"auth_sessions",
	{
		id: uuid("id").primaryKey(),
		principalId: uuid("principal_id")
			.notNull()
			.references(() => authPrincipals.id, { onDelete: "cascade" }),
		tokenHash: text("token_hash").notNull(),
		credentialVersion: integer("credential_version"),
		expiresAt: utcTimestamp("expires_at").notNull(),
		lastRefreshedAt: utcTimestamp("last_refreshed_at").notNull(),
		revokedAt: utcTimestamp("revoked_at"),
		createdAt: utcTimestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		uniqueIndex("auth_sessions_token_hash_unique").on(table.tokenHash),
		index("auth_sessions_principal_idx").on(table.principalId),
		index("auth_sessions_expires_idx").on(table.expiresAt),
		check(
			"auth_sessions_token_hash_sha256",
			sql`${table.tokenHash} ~ '^[0-9a-f]{64}$'`,
		),
		check(
			"auth_sessions_credential_version_positive",
			sql`${table.credentialVersion} is null or ${table.credentialVersion} > 0`,
		),
		check(
			"auth_sessions_expiry_after_creation",
			sql`${table.expiresAt} > ${table.createdAt}`,
		),
	],
);

export const authPrincipalRelations = relations(
	authPrincipals,
	({ many, one }) => ({
		staffCredential: one(authStaffCredentials),
		ownerCredential: one(authOwnerCredentials),
		sessions: many(authSessions),
	}),
);

export const authStaffCredentialRelations = relations(
	authStaffCredentials,
	({ one }) => ({
		principal: one(authPrincipals, {
			fields: [authStaffCredentials.principalId],
			references: [authPrincipals.id],
		}),
	}),
);

export const authSessionRelations = relations(authSessions, ({ one }) => ({
	principal: one(authPrincipals, {
		fields: [authSessions.principalId],
		references: [authPrincipals.id],
	}),
}));

export const authOwnerCredentialRelations = relations(
	authOwnerCredentials,
	({ one }) => ({
		principal: one(authPrincipals, {
			fields: [authOwnerCredentials.principalId],
			references: [authPrincipals.id],
		}),
	}),
);
