CREATE TYPE "public"."auth_principal_kind" AS ENUM('shared_staff', 'owner');--> statement-breakpoint
CREATE TYPE "public"."auth_role" AS ENUM('staff', 'owner');--> statement-breakpoint
CREATE TABLE "auth_principals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"principal_kind" "auth_principal_kind" NOT NULL,
	"role" "auth_role" NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_email" text,
	"display_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_principals_kind_role_identity" CHECK ((
				("auth_principals"."principal_kind" = 'shared_staff' and "auth_principals"."role" = 'staff' and "auth_principals"."owner_email" is null)
				or
				("auth_principals"."principal_kind" = 'owner' and "auth_principals"."role" = 'owner' and "auth_principals"."owner_email" is not null)
			)),
	CONSTRAINT "auth_principals_display_name_nonempty" CHECK (length(trim("auth_principals"."display_name")) > 0),
	CONSTRAINT "auth_principals_owner_email_nonempty" CHECK ("auth_principals"."owner_email" is null or length(trim("auth_principals"."owner_email")) > 0)
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"principal_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"credential_version" integer,
	"expires_at" timestamp with time zone NOT NULL,
	"last_refreshed_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_sessions_token_hash_sha256" CHECK ("auth_sessions"."token_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "auth_sessions_credential_version_positive" CHECK ("auth_sessions"."credential_version" is null or "auth_sessions"."credential_version" > 0),
	CONSTRAINT "auth_sessions_expiry_after_creation" CHECK ("auth_sessions"."expires_at" > "auth_sessions"."created_at")
);
--> statement-breakpoint
CREATE TABLE "auth_staff_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"principal_id" uuid NOT NULL,
	"pin_hash" text NOT NULL,
	"pin_salt" text NOT NULL,
	"credential_version" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"rotated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_staff_credentials_hash_nonempty" CHECK (length(trim("auth_staff_credentials"."pin_hash")) > 0),
	CONSTRAINT "auth_staff_credentials_salt_nonempty" CHECK (length(trim("auth_staff_credentials"."pin_salt")) > 0),
	CONSTRAINT "auth_staff_credentials_version_positive" CHECK ("auth_staff_credentials"."credential_version" > 0)
);
--> statement-breakpoint
DROP TABLE "account" CASCADE;--> statement-breakpoint
DROP TABLE "session" CASCADE;--> statement-breakpoint
DROP TABLE "user" CASCADE;--> statement-breakpoint
DROP TABLE "verification" CASCADE;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_principal_id_auth_principals_id_fk" FOREIGN KEY ("principal_id") REFERENCES "public"."auth_principals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_staff_credentials" ADD CONSTRAINT "auth_staff_credentials_principal_id_auth_principals_id_fk" FOREIGN KEY ("principal_id") REFERENCES "public"."auth_principals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "auth_principals_one_shared_staff" ON "auth_principals" USING btree ("principal_kind") WHERE "auth_principals"."principal_kind" = 'shared_staff';--> statement-breakpoint
CREATE UNIQUE INDEX "auth_principals_owner_email_unique" ON "auth_principals" USING btree (lower("owner_email")) WHERE "auth_principals"."owner_email" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "auth_sessions_token_hash_unique" ON "auth_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "auth_sessions_principal_idx" ON "auth_sessions" USING btree ("principal_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_expires_idx" ON "auth_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_staff_credentials_principal_unique" ON "auth_staff_credentials" USING btree ("principal_id");