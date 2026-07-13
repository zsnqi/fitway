ALTER TABLE "settings_versions" ADD COLUMN "schedule_sun_open" time;--> statement-breakpoint
ALTER TABLE "settings_versions" ADD COLUMN "schedule_sun_close" time;--> statement-breakpoint
ALTER TABLE "settings_versions" ADD COLUMN "schedule_mon_open" time;--> statement-breakpoint
ALTER TABLE "settings_versions" ADD COLUMN "schedule_mon_close" time;--> statement-breakpoint
ALTER TABLE "settings_versions" ADD COLUMN "schedule_tue_open" time;--> statement-breakpoint
ALTER TABLE "settings_versions" ADD COLUMN "schedule_tue_close" time;--> statement-breakpoint
ALTER TABLE "settings_versions" ADD COLUMN "schedule_wed_open" time;--> statement-breakpoint
ALTER TABLE "settings_versions" ADD COLUMN "schedule_wed_close" time;--> statement-breakpoint
ALTER TABLE "settings_versions" ADD COLUMN "schedule_thu_open" time;--> statement-breakpoint
ALTER TABLE "settings_versions" ADD COLUMN "schedule_thu_close" time;--> statement-breakpoint
ALTER TABLE "settings_versions" ADD COLUMN "schedule_fri_open" time;--> statement-breakpoint
ALTER TABLE "settings_versions" ADD COLUMN "schedule_fri_close" time;--> statement-breakpoint
ALTER TABLE "settings_versions" ADD COLUMN "schedule_sat_open" time;--> statement-breakpoint
ALTER TABLE "settings_versions" ADD COLUMN "schedule_sat_close" time;--> statement-breakpoint
ALTER TABLE "settings_versions" ADD CONSTRAINT "settings_schedule_sun_pair" CHECK (("settings_versions"."schedule_sun_open" is null) = ("settings_versions"."schedule_sun_close" is null));--> statement-breakpoint
ALTER TABLE "settings_versions" ADD CONSTRAINT "settings_schedule_mon_pair" CHECK (("settings_versions"."schedule_mon_open" is null) = ("settings_versions"."schedule_mon_close" is null));--> statement-breakpoint
ALTER TABLE "settings_versions" ADD CONSTRAINT "settings_schedule_tue_pair" CHECK (("settings_versions"."schedule_tue_open" is null) = ("settings_versions"."schedule_tue_close" is null));--> statement-breakpoint
ALTER TABLE "settings_versions" ADD CONSTRAINT "settings_schedule_wed_pair" CHECK (("settings_versions"."schedule_wed_open" is null) = ("settings_versions"."schedule_wed_close" is null));--> statement-breakpoint
ALTER TABLE "settings_versions" ADD CONSTRAINT "settings_schedule_thu_pair" CHECK (("settings_versions"."schedule_thu_open" is null) = ("settings_versions"."schedule_thu_close" is null));--> statement-breakpoint
ALTER TABLE "settings_versions" ADD CONSTRAINT "settings_schedule_fri_pair" CHECK (("settings_versions"."schedule_fri_open" is null) = ("settings_versions"."schedule_fri_close" is null));--> statement-breakpoint
ALTER TABLE "settings_versions" ADD CONSTRAINT "settings_schedule_sat_pair" CHECK (("settings_versions"."schedule_sat_open" is null) = ("settings_versions"."schedule_sat_close" is null));
--> statement-breakpoint
INSERT INTO "settings_versions" (
	"capacity", "quiet_max_percent", "moderate_max_percent", "busy_max_percent",
	"timezone", "business_day_boundary", "push_interval_seconds", "fresh_for_seconds",
	"operational_stale_after_seconds", "public_poll_seconds", "created_by",
	"schedule_sun_open", "schedule_sun_close", "schedule_mon_open", "schedule_mon_close",
	"schedule_tue_open", "schedule_tue_close", "schedule_wed_open", "schedule_wed_close",
	"schedule_thu_open", "schedule_thu_close", "schedule_fri_open", "schedule_fri_close",
	"schedule_sat_open", "schedule_sat_close"
)
SELECT
	"capacity", "quiet_max_percent", "moderate_max_percent", "busy_max_percent",
	"timezone", "business_day_boundary", "push_interval_seconds", "fresh_for_seconds",
	"operational_stale_after_seconds", "public_poll_seconds", "created_by",
	'06:00', '02:00', '06:00', '02:00', '06:00', '02:00', '06:00', '02:00',
	'06:00', '02:00', '14:00', '00:00', '06:00', '02:00'
FROM "settings_versions"
ORDER BY "version" DESC
LIMIT 1;
