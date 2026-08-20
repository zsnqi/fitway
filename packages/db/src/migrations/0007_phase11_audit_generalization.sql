-- Phase 11 audit generalization.
--
-- `audit_log_actor_kind_role` is tightened here, not merely extended: the previous
-- rule admitted an owner-kind row with a NULL role, because `actor_role = 'owner'`
-- evaluates to NULL on a NULL column and a CHECK passes when its predicate is NULL.
-- The rewrite closes that pre-existing hole.
--
-- That tightening is NOT additive, and it is safe here only because `audit_log` was
-- empty when this migration was written: counted read-only against the real database
-- `fitway_local_coord` on 2026-08-15, `audit_log` held 0 rows, so 0 rows could
-- violate the new rule. Drizzle wraps all pending migrations in one transaction, so
-- a single non-conforming row would abort the entire migration.
--
-- If this migration is ever applied to an environment whose `audit_log` already holds
-- rows, re-run that count first. Audit rows are immutable: a non-conforming row is a
-- stop condition to be escalated, never something to repair so the migration applies.
CREATE TYPE "public"."audit_event_class" AS ENUM('command', 'access', 'settings');--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'staff_pin_provisioned';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'staff_pin_rotated';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'staff_pin_deactivated';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'owner_provisioned';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'owner_deactivated';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'owner_reactivated';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'credential_reset';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'settings_updated';--> statement-breakpoint
ALTER TABLE "audit_log" DROP CONSTRAINT "audit_log_actor_kind_role";--> statement-breakpoint
ALTER TABLE "audit_log" DROP CONSTRAINT "audit_log_values_nonnegative";--> statement-breakpoint
ALTER TABLE "audit_log" DROP CONSTRAINT "audit_log_action_values_coherent";--> statement-breakpoint
ALTER TABLE "audit_log" ALTER COLUMN "command_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_log" ALTER COLUMN "command_issuer_class" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_log" ALTER COLUMN "effective_value" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_log" ADD COLUMN "event_class" "audit_event_class" DEFAULT 'command' NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_log" ADD COLUMN "target_principal_id" uuid;--> statement-breakpoint
ALTER TABLE "audit_log" ADD COLUMN "prior_active" boolean;--> statement-breakpoint
ALTER TABLE "audit_log" ADD COLUMN "new_active" boolean;--> statement-breakpoint
ALTER TABLE "audit_log" ADD COLUMN "prior_credential_version" integer;--> statement-breakpoint
ALTER TABLE "audit_log" ADD COLUMN "new_credential_version" integer;--> statement-breakpoint
ALTER TABLE "audit_log" ADD COLUMN "settings_version" bigint;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_target_principal_id_auth_principals_id_fk" FOREIGN KEY ("target_principal_id") REFERENCES "public"."auth_principals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_settings_version_settings_versions_version_fk" FOREIGN KEY ("settings_version") REFERENCES "public"."settings_versions"("version") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_event_class_idx" ON "audit_log" USING btree ("event_class");--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_command_linkage" CHECK ((
				("audit_log"."event_class" = 'command' and "audit_log"."command_id" is not null and "audit_log"."command_issuer_class" is not null and "audit_log"."effective_value" is not null)
				or ("audit_log"."event_class" <> 'command' and "audit_log"."command_id" is null and "audit_log"."command_issuer_class" is null and "audit_log"."effective_value" is null)
			));--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_governance_counts_closed" CHECK ("audit_log"."event_class" = 'command' or ("audit_log"."prior_value" is null and "audit_log"."requested_delta" is null and "audit_log"."requested_value" is null and "audit_log"."effective_value" is null));--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_action_event_class" CHECK ((
				("audit_log"."event_class" = 'command' and "audit_log"."action"::text in ('correction_delta', 'correction_absolute', 'reset'))
				or ("audit_log"."event_class" = 'access' and "audit_log"."action"::text in ('staff_pin_provisioned', 'staff_pin_rotated', 'staff_pin_deactivated', 'owner_provisioned', 'owner_deactivated', 'owner_reactivated', 'credential_reset'))
				or ("audit_log"."event_class" = 'settings' and "audit_log"."action"::text = 'settings_updated')
			));--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_governance_columns" CHECK ((
				("audit_log"."event_class" = 'access' and "audit_log"."target_principal_id" is not null and "audit_log"."settings_version" is null)
				or ("audit_log"."event_class" = 'settings' and "audit_log"."settings_version" is not null and "audit_log"."target_principal_id" is null and "audit_log"."prior_active" is null and "audit_log"."new_active" is null and "audit_log"."prior_credential_version" is null and "audit_log"."new_credential_version" is null)
				or ("audit_log"."event_class" = 'command' and "audit_log"."target_principal_id" is null and "audit_log"."settings_version" is null and "audit_log"."prior_active" is null and "audit_log"."new_active" is null and "audit_log"."prior_credential_version" is null and "audit_log"."new_credential_version" is null)
			));--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_credential_versions_positive" CHECK (("audit_log"."prior_credential_version" is null or "audit_log"."prior_credential_version" > 0) and ("audit_log"."new_credential_version" is null or "audit_log"."new_credential_version" > 0));--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_governance_state_transition" CHECK ((
				("audit_log"."action"::text = 'owner_deactivated' and "audit_log"."prior_active" is true and "audit_log"."new_active" is false)
				or ("audit_log"."action"::text = 'owner_reactivated' and "audit_log"."prior_active" is false and "audit_log"."new_active" is true)
				or ("audit_log"."action"::text in ('staff_pin_rotated', 'credential_reset') and "audit_log"."prior_credential_version" is not null and "audit_log"."new_credential_version" is not null and "audit_log"."new_credential_version" > "audit_log"."prior_credential_version")
				or "audit_log"."action"::text not in ('owner_deactivated', 'owner_reactivated', 'staff_pin_rotated', 'credential_reset')
			));--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_destructive_reason_required" CHECK ("audit_log"."action"::text not in ('staff_pin_deactivated', 'owner_deactivated') or "audit_log"."reason" is not null);--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_kind_role" CHECK ((
				("audit_log"."command_issuer_class" is not null and "audit_log"."command_issuer_class" = 'human'
					and "audit_log"."actor_principal_id" is not null
					and "audit_log"."actor_principal_kind" is not null and "audit_log"."actor_principal_kind" = 'shared_staff'
					and "audit_log"."actor_role" is not null and "audit_log"."actor_role" = 'staff')
				or ("audit_log"."command_issuer_class" is not null and "audit_log"."command_issuer_class" = 'human'
					and "audit_log"."actor_principal_id" is not null
					and "audit_log"."actor_principal_kind" is not null and "audit_log"."actor_principal_kind" = 'owner'
					and "audit_log"."actor_role" is not null and "audit_log"."actor_role" = 'owner')
				or ("audit_log"."command_issuer_class" is not null and "audit_log"."command_issuer_class" = 'system'
					and "audit_log"."actor_principal_id" is null
					and "audit_log"."actor_principal_kind" is not null and "audit_log"."actor_principal_kind" = 'system'
					and "audit_log"."actor_role" is null)
				or ("audit_log"."command_issuer_class" is null
					and "audit_log"."actor_principal_id" is not null
					and "audit_log"."actor_principal_kind" is not null and "audit_log"."actor_principal_kind" = 'owner'
					and "audit_log"."actor_role" is not null and "audit_log"."actor_role" = 'owner')
			));--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_values_nonnegative" CHECK (("audit_log"."prior_value" is null or "audit_log"."prior_value" >= 0) and ("audit_log"."requested_value" is null or "audit_log"."requested_value" >= 0) and ("audit_log"."effective_value" is null or "audit_log"."effective_value" >= 0));--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_action_values_coherent" CHECK ("audit_log"."event_class" <> 'command' or (
				("audit_log"."action"::text = 'correction_delta' and "audit_log"."prior_value" is not null and "audit_log"."requested_delta" is not null and "audit_log"."requested_value" is null)
				or ("audit_log"."action"::text = 'correction_absolute' and "audit_log"."requested_delta" is null and "audit_log"."requested_value" is not null and "audit_log"."requested_value" = "audit_log"."effective_value")
				or ("audit_log"."action"::text = 'reset' and "audit_log"."requested_delta" is null and "audit_log"."requested_value" = 0 and "audit_log"."effective_value" = 0)
			));