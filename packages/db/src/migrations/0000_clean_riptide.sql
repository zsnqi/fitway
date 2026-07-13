CREATE TYPE "public"."current_source" AS ENUM('edge', 'manual');--> statement-breakpoint
CREATE TYPE "public"."minute_source" AS ENUM('live', 'backfill', 'manual');--> statement-breakpoint
CREATE TYPE "public"."occupancy_band" AS ENUM('quiet', 'moderate', 'busy', 'packed');--> statement-breakpoint
CREATE TABLE "current_state" (
	"id" smallint PRIMARY KEY NOT NULL,
	"current_count" integer,
	"band" "occupancy_band",
	"source" "current_source",
	"last_push_received_at" timestamp with time zone,
	"last_edge_reported_at" timestamp with time zone,
	"active_device_id" uuid,
	"settings_version" bigint,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "current_state_singleton" CHECK ("current_state"."id" = 1),
	CONSTRAINT "current_state_nonnegative" CHECK ("current_state"."current_count" is null or "current_state"."current_count" >= 0),
	CONSTRAINT "current_state_coherent" CHECK (("current_state"."current_count" is null and "current_state"."band" is null and "current_state"."source" is null and "current_state"."last_push_received_at" is null and "current_state"."last_edge_reported_at" is null and "current_state"."active_device_id" is null and "current_state"."settings_version" is null) or ("current_state"."current_count" is not null and "current_state"."band" is not null and "current_state"."source" is not null and "current_state"."last_push_received_at" is not null and "current_state"."last_edge_reported_at" is not null and "current_state"."active_device_id" is not null and "current_state"."settings_version" is not null))
);
--> statement-breakpoint
CREATE TABLE "edge_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"token_hash" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_seen_at" timestamp with time zone,
	"last_sequence" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "edge_devices_name_nonempty" CHECK (length(trim("edge_devices"."name")) > 0),
	CONSTRAINT "edge_devices_token_hash_sha256" CHECK ("edge_devices"."token_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "edge_devices_last_sequence_nonnegative" CHECK ("edge_devices"."last_sequence" >= 0)
);
--> statement-breakpoint
CREATE TABLE "occupancy_minutes" (
	"device_id" uuid NOT NULL,
	"minute_start_utc" timestamp with time zone NOT NULL,
	"business_day" date NOT NULL,
	"count" integer NOT NULL,
	"entries" integer NOT NULL,
	"exits" integer NOT NULL,
	"band" "occupancy_band" NOT NULL,
	"capacity_snapshot" integer NOT NULL,
	"settings_version" bigint NOT NULL,
	"source" "minute_source" NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "occupancy_minutes_device_id_minute_start_utc_pk" PRIMARY KEY("device_id","minute_start_utc"),
	CONSTRAINT "occupancy_minutes_aligned" CHECK (date_trunc('minute', "occupancy_minutes"."minute_start_utc") = "occupancy_minutes"."minute_start_utc"),
	CONSTRAINT "occupancy_minutes_count_nonnegative" CHECK ("occupancy_minutes"."count" >= 0),
	CONSTRAINT "occupancy_minutes_entries_nonnegative" CHECK ("occupancy_minutes"."entries" >= 0),
	CONSTRAINT "occupancy_minutes_exits_nonnegative" CHECK ("occupancy_minutes"."exits" >= 0),
	CONSTRAINT "occupancy_minutes_capacity_positive" CHECK ("occupancy_minutes"."capacity_snapshot" > 0)
);
--> statement-breakpoint
CREATE TABLE "settings_versions" (
	"version" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "settings_versions_version_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"capacity" integer NOT NULL,
	"quiet_max_percent" integer NOT NULL,
	"moderate_max_percent" integer NOT NULL,
	"busy_max_percent" integer NOT NULL,
	"timezone" text DEFAULT 'Asia/Riyadh' NOT NULL,
	"business_day_boundary" time DEFAULT '04:00' NOT NULL,
	"push_interval_seconds" integer DEFAULT 20 NOT NULL,
	"fresh_for_seconds" integer DEFAULT 90 NOT NULL,
	"operational_stale_after_seconds" integer DEFAULT 180 NOT NULL,
	"public_poll_seconds" integer DEFAULT 60 NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	CONSTRAINT "settings_capacity_positive" CHECK ("settings_versions"."capacity" > 0),
	CONSTRAINT "settings_bands_ordered" CHECK (0 <= "settings_versions"."quiet_max_percent" and "settings_versions"."quiet_max_percent" < "settings_versions"."moderate_max_percent" and "settings_versions"."moderate_max_percent" < "settings_versions"."busy_max_percent" and "settings_versions"."busy_max_percent" <= 100),
	CONSTRAINT "settings_timezone_nonempty" CHECK (length(trim("settings_versions"."timezone")) > 0),
	CONSTRAINT "settings_push_interval_positive" CHECK ("settings_versions"."push_interval_seconds" > 0),
	CONSTRAINT "settings_fresh_for_positive" CHECK ("settings_versions"."fresh_for_seconds" > 0),
	CONSTRAINT "settings_operational_stale_after_fresh" CHECK ("settings_versions"."operational_stale_after_seconds" > "settings_versions"."fresh_for_seconds"),
	CONSTRAINT "settings_public_poll_positive" CHECK ("settings_versions"."public_poll_seconds" > 0)
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "current_state" ADD CONSTRAINT "current_state_active_device_id_edge_devices_id_fk" FOREIGN KEY ("active_device_id") REFERENCES "public"."edge_devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "current_state" ADD CONSTRAINT "current_state_settings_version_settings_versions_version_fk" FOREIGN KEY ("settings_version") REFERENCES "public"."settings_versions"("version") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occupancy_minutes" ADD CONSTRAINT "occupancy_minutes_device_id_edge_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."edge_devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occupancy_minutes" ADD CONSTRAINT "occupancy_minutes_settings_version_settings_versions_version_fk" FOREIGN KEY ("settings_version") REFERENCES "public"."settings_versions"("version") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "edge_devices_token_hash_unique" ON "edge_devices" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");
--> statement-breakpoint
-- Deterministic development placeholders only. Replace after site measurement and owner confirmation.
INSERT INTO "settings_versions" (
	"capacity", "quiet_max_percent", "moderate_max_percent", "busy_max_percent",
	"timezone", "business_day_boundary", "push_interval_seconds", "fresh_for_seconds",
	"operational_stale_after_seconds", "public_poll_seconds", "created_by"
) VALUES (100, 25, 50, 75, 'Asia/Riyadh', '04:00', 20, 90, 180, 60, NULL);
--> statement-breakpoint
INSERT INTO "current_state" ("id") VALUES (1);
