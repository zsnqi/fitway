CREATE TYPE "public"."alert_condition" AS ENUM('stale_push', 'process_failure', 'camera_failure', 'feed_failure');--> statement-breakpoint
CREATE TYPE "public"."alert_delivery_outcome" AS ENUM('claimed', 'delivered', 'failed');--> statement-breakpoint
CREATE TYPE "public"."alert_notice_kind" AS ENUM('alert', 'recovery');--> statement-breakpoint
CREATE TYPE "public"."health_transition_type" AS ENUM('online', 'offline', 'reported_flags_changed');--> statement-breakpoint
CREATE TABLE "alert_log" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "alert_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"device_id" uuid NOT NULL,
	"condition" "alert_condition" NOT NULL,
	"notice_kind" "alert_notice_kind" NOT NULL,
	"condition_started_at" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone NOT NULL,
	"delivery_outcome" "alert_delivery_outcome" NOT NULL,
	"recovery_of_alert_id" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "alert_log_recovery_linkage" CHECK (("alert_log"."notice_kind" = 'alert' and "alert_log"."recovery_of_alert_id" is null) or ("alert_log"."notice_kind" = 'recovery' and "alert_log"."recovery_of_alert_id" is not null)),
	CONSTRAINT "alert_log_sent_after_condition_start" CHECK ("alert_log"."sent_at" >= "alert_log"."condition_started_at")
);
--> statement-breakpoint
CREATE TABLE "edge_health_log" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "edge_health_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"device_id" uuid NOT NULL,
	"transition_type" "health_transition_type" NOT NULL,
	"process_status" "edge_health_status",
	"camera_status" "edge_health_status",
	"feed_status" "edge_health_status",
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "edge_health_log_statuses_coherent" CHECK (("edge_health_log"."process_status" is null and "edge_health_log"."camera_status" is null and "edge_health_log"."feed_status" is null) or ("edge_health_log"."process_status" is not null and "edge_health_log"."camera_status" is not null and "edge_health_log"."feed_status" is not null))
);
--> statement-breakpoint
ALTER TABLE "alert_log" ADD CONSTRAINT "alert_log_device_id_edge_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."edge_devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_log" ADD CONSTRAINT "alert_log_recovery_of_alert_id_alert_log_id_fk" FOREIGN KEY ("recovery_of_alert_id") REFERENCES "public"."alert_log"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edge_health_log" ADD CONSTRAINT "edge_health_log_device_id_edge_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."edge_devices"("id") ON DELETE no action ON UPDATE no action;
