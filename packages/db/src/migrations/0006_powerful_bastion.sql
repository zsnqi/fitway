CREATE TYPE "public"."audit_actor_principal_kind" AS ENUM('shared_staff', 'owner', 'system');--> statement-breakpoint
CREATE TYPE "public"."command_issuer_class" AS ENUM('human', 'system');--> statement-breakpoint
CREATE TABLE "scheduled_reset_issuances" (
	"business_day" date PRIMARY KEY NOT NULL,
	"issuance_key" text NOT NULL,
	"settings_version" bigint NOT NULL,
	"scheduled_close" timestamp with time zone NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"command_id" bigint NOT NULL,
	"command_issuer_class" "command_issuer_class" DEFAULT 'system' NOT NULL,
	"command_type" "edge_command_type" DEFAULT 'reset_zero' NOT NULL,
	"issued_at" timestamp with time zone NOT NULL,
	CONSTRAINT "scheduled_reset_issuances_key_coherent" CHECK ("scheduled_reset_issuances"."issuance_key" = 'scheduled-reset:' || to_char("scheduled_reset_issuances"."business_day", 'YYYY-MM-DD')),
	CONSTRAINT "scheduled_reset_issuances_command_identity" CHECK ("scheduled_reset_issuances"."command_issuer_class" = 'system' and "scheduled_reset_issuances"."command_type" = 'reset_zero'),
	CONSTRAINT "scheduled_reset_issuances_due_after_close" CHECK ("scheduled_reset_issuances"."due_at" >= "scheduled_reset_issuances"."scheduled_close"),
	CONSTRAINT "scheduled_reset_issuances_issued_after_due" CHECK ("scheduled_reset_issuances"."issued_at" >= "scheduled_reset_issuances"."due_at")
);
--> statement-breakpoint
ALTER TABLE "audit_log" DROP CONSTRAINT "audit_log_actor_kind_role";--> statement-breakpoint
ALTER TABLE "audit_log" DROP CONSTRAINT "audit_log_command_id_edge_commands_id_fk";
--> statement-breakpoint
ALTER TABLE "audit_log" ALTER COLUMN "actor_principal_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_log" ALTER COLUMN "actor_principal_kind" SET DATA TYPE "public"."audit_actor_principal_kind" USING "actor_principal_kind"::text::"public"."audit_actor_principal_kind";--> statement-breakpoint
ALTER TABLE "audit_log" ALTER COLUMN "actor_role" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "edge_commands" ALTER COLUMN "issued_by_principal_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_log" ADD COLUMN "command_issuer_class" "command_issuer_class" DEFAULT 'human' NOT NULL;--> statement-breakpoint
ALTER TABLE "edge_commands" ADD COLUMN "issuer_class" "command_issuer_class" DEFAULT 'human' NOT NULL;--> statement-breakpoint
ALTER TABLE "settings_versions" ADD COLUMN "reset_buffer_minutes" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "edge_commands_id_issuer_class_unique" ON "edge_commands" USING btree ("id","issuer_class");--> statement-breakpoint
CREATE UNIQUE INDEX "edge_commands_id_issuer_class_type_unique" ON "edge_commands" USING btree ("id","issuer_class","type");--> statement-breakpoint
ALTER TABLE "scheduled_reset_issuances" ADD CONSTRAINT "scheduled_reset_issuances_settings_version_settings_versions_version_fk" FOREIGN KEY ("settings_version") REFERENCES "public"."settings_versions"("version") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_reset_issuances" ADD CONSTRAINT "scheduled_reset_issuances_command_fk" FOREIGN KEY ("command_id","command_issuer_class","command_type") REFERENCES "public"."edge_commands"("id","issuer_class","type") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "scheduled_reset_issuances_key_unique" ON "scheduled_reset_issuances" USING btree ("issuance_key");--> statement-breakpoint
CREATE UNIQUE INDEX "scheduled_reset_issuances_command_unique" ON "scheduled_reset_issuances" USING btree ("command_id");--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_command_issuer_fk" FOREIGN KEY ("command_id","command_issuer_class") REFERENCES "public"."edge_commands"("id","issuer_class") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_kind_role" CHECK ((
				("audit_log"."command_issuer_class" = 'human' and "audit_log"."actor_principal_id" is not null and "audit_log"."actor_principal_kind" = 'shared_staff' and "audit_log"."actor_role" = 'staff')
				or ("audit_log"."command_issuer_class" = 'human' and "audit_log"."actor_principal_id" is not null and "audit_log"."actor_principal_kind" = 'owner' and "audit_log"."actor_role" = 'owner')
				or ("audit_log"."command_issuer_class" = 'system' and "audit_log"."actor_principal_id" is null and "audit_log"."actor_principal_kind" = 'system' and "audit_log"."actor_role" is null)
			));--> statement-breakpoint
ALTER TABLE "edge_commands" ADD CONSTRAINT "edge_commands_issuer_coherent" CHECK (("edge_commands"."issuer_class" = 'human' and "edge_commands"."issued_by_principal_id" is not null) or ("edge_commands"."issuer_class" = 'system' and "edge_commands"."issued_by_principal_id" is null));--> statement-breakpoint
ALTER TABLE "settings_versions" ADD CONSTRAINT "settings_reset_buffer_nonnegative" CHECK ("settings_versions"."reset_buffer_minutes" >= 0);
