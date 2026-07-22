CREATE TYPE "public"."audit_action" AS ENUM('correction_delta', 'correction_absolute', 'reset');--> statement-breakpoint
CREATE TYPE "public"."edge_command_status" AS ENUM('pending', 'applied', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."edge_command_type" AS ENUM('set_count', 'reset_zero');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"actor_principal_id" uuid NOT NULL,
	"actor_principal_kind" "auth_principal_kind" NOT NULL,
	"actor_role" "auth_role" NOT NULL,
	"command_id" bigint NOT NULL,
	"action" "audit_action" NOT NULL,
	"prior_value" integer,
	"requested_delta" integer,
	"requested_value" integer,
	"effective_value" integer NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_log_id_json_safe" CHECK ("audit_log"."id" > 0 and "audit_log"."id" <= 9007199254740991),
	CONSTRAINT "audit_log_actor_kind_role" CHECK (("audit_log"."actor_principal_kind" = 'shared_staff' and "audit_log"."actor_role" = 'staff') or ("audit_log"."actor_principal_kind" = 'owner' and "audit_log"."actor_role" = 'owner')),
	CONSTRAINT "audit_log_values_nonnegative" CHECK (("audit_log"."prior_value" is null or "audit_log"."prior_value" >= 0) and ("audit_log"."requested_value" is null or "audit_log"."requested_value" >= 0) and "audit_log"."effective_value" >= 0),
	CONSTRAINT "audit_log_action_values_coherent" CHECK ((
				("audit_log"."action" = 'correction_delta' and "audit_log"."prior_value" is not null and "audit_log"."requested_delta" is not null and "audit_log"."requested_value" is null)
				or ("audit_log"."action" = 'correction_absolute' and "audit_log"."requested_delta" is null and "audit_log"."requested_value" is not null and "audit_log"."requested_value" = "audit_log"."effective_value")
				or ("audit_log"."action" = 'reset' and "audit_log"."requested_delta" is null and "audit_log"."requested_value" = 0 and "audit_log"."effective_value" = 0)
			)),
	CONSTRAINT "audit_log_reason_short_trimmed" CHECK ("audit_log"."reason" is null or (length("audit_log"."reason") between 1 and 240 and "audit_log"."reason" = trim("audit_log"."reason")))
);
--> statement-breakpoint
CREATE TABLE "edge_commands" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "edge_commands_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"device_id" uuid NOT NULL,
	"type" "edge_command_type" NOT NULL,
	"target_value" integer,
	"status" "edge_command_status" DEFAULT 'pending' NOT NULL,
	"issued_by_principal_id" uuid NOT NULL,
	"reason" text,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone,
	"applied_at" timestamp with time zone,
	"superseded_at" timestamp with time zone,
	"superseded_by_command_id" bigint,
	CONSTRAINT "edge_commands_id_json_safe" CHECK ("edge_commands"."id" > 0 and "edge_commands"."id" <= 9007199254740991),
	CONSTRAINT "edge_commands_target_coherent" CHECK (("edge_commands"."type" = 'set_count' and "edge_commands"."target_value" is not null and "edge_commands"."target_value" >= 0) or ("edge_commands"."type" = 'reset_zero' and "edge_commands"."target_value" is null)),
	CONSTRAINT "edge_commands_reason_short_trimmed" CHECK ("edge_commands"."reason" is null or (length("edge_commands"."reason") between 1 and 240 and "edge_commands"."reason" = trim("edge_commands"."reason"))),
	CONSTRAINT "edge_commands_lifecycle_coherent" CHECK ((
				("edge_commands"."status" = 'pending' and "edge_commands"."applied_at" is null and "edge_commands"."superseded_at" is null and "edge_commands"."superseded_by_command_id" is null)
				or ("edge_commands"."status" = 'applied' and "edge_commands"."delivered_at" is not null and "edge_commands"."applied_at" is not null and "edge_commands"."superseded_at" is null and "edge_commands"."superseded_by_command_id" is null)
				or ("edge_commands"."status" = 'superseded' and "edge_commands"."applied_at" is null and "edge_commands"."superseded_at" is not null and "edge_commands"."superseded_by_command_id" is not null)
			))
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_principal_id_auth_principals_id_fk" FOREIGN KEY ("actor_principal_id") REFERENCES "public"."auth_principals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_command_id_edge_commands_id_fk" FOREIGN KEY ("command_id") REFERENCES "public"."edge_commands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edge_commands" ADD CONSTRAINT "edge_commands_device_id_edge_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."edge_devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edge_commands" ADD CONSTRAINT "edge_commands_issued_by_principal_id_auth_principals_id_fk" FOREIGN KEY ("issued_by_principal_id") REFERENCES "public"."auth_principals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edge_commands" ADD CONSTRAINT "edge_commands_superseded_by_command_id_edge_commands_id_fk" FOREIGN KEY ("superseded_by_command_id") REFERENCES "public"."edge_commands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "audit_log_command_unique" ON "audit_log" USING btree ("command_id");--> statement-breakpoint
CREATE INDEX "audit_log_created_id_idx" ON "audit_log" USING btree ("created_at","id");--> statement-breakpoint
CREATE INDEX "edge_commands_device_status_id_idx" ON "edge_commands" USING btree ("device_id","status","id");