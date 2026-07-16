CREATE TYPE "public"."edge_health_status" AS ENUM('ok', 'degraded', 'failed', 'unknown');--> statement-breakpoint
CREATE TABLE "edge_current_health" (
	"device_id" uuid PRIMARY KEY NOT NULL,
	"sequence" bigint NOT NULL,
	"process_status" "edge_health_status" NOT NULL,
	"camera_status" "edge_health_status" NOT NULL,
	"feed_status" "edge_health_status" NOT NULL,
	"detector_fps" double precision,
	"edge_observed_at" timestamp with time zone NOT NULL,
	"received_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "edge_current_health_sequence_nonnegative" CHECK ("edge_current_health"."sequence" >= 0),
	CONSTRAINT "edge_current_health_detector_fps_finite_nonnegative" CHECK ("edge_current_health"."detector_fps" is null or ("edge_current_health"."detector_fps" >= 0 and "edge_current_health"."detector_fps" < 'infinity'::double precision))
);
--> statement-breakpoint
ALTER TABLE "edge_current_health" ADD CONSTRAINT "edge_current_health_device_id_edge_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."edge_devices"("id") ON DELETE cascade ON UPDATE no action;