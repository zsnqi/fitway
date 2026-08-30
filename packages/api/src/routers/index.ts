import type { RouterClient } from "@orpc/server";
import { adminAccessProcedures } from "../access/procedures";
import { adminAnalyticsCsv } from "../analytics/reporting/csv-transport";
import { adminAnalyticsReportingQueries } from "../analytics/reporting/queries";
import {
	analyticsTimeContextInputSchema,
	analyticsTimeContextOutputSchema,
	ownerDailyAnalyticsInputSchema,
	ownerDailyAnalyticsOutputSchema,
} from "../analytics/time-context";
import { auditListInputSchema, auditListOutputSchema } from "../audit/list";
import { edgePushRequestSchema, edgePushResponseSchema } from "../edge-push";
import { healthIncidentSummarySchema } from "../health/incidents";
import { operationalSnapshotSchema } from "../health/snapshot";
import {
	ORPCError,
	ownerProcedure,
	publicProcedure,
	staffProcedure,
} from "../index";
import { adminSettingsProcedures } from "../settings/procedures";

const pushOccupancyContract = publicProcedure
	.route({
		method: "POST",
		path: "/edge/push",
		operationId: "edge.pushOccupancy",
		summary: "Push anonymous occupancy snapshots",
		description:
			"Accepts a contiguous device sequence and complete live minute snapshots. Requires a Bearer device token.",
		tags: ["Edge"],
	})
	.input(edgePushRequestSchema)
	.output(edgePushResponseSchema)
	.handler(() => {
		throw new Error("The canonical Hono edge transport owns execution");
	});

export const openApiRouter = { edge: { pushOccupancy: pushOccupancyContract } };
const staffSession = staffProcedure.handler(({ context }) => context.auth);

/**
 * `/staff` is monitoring-only (`docs/adr/ADR-008-staff-monitoring-only.md`). The
 * staff surface reads; it never issues a command. Do not reintroduce an
 * issuance leaf here without a new versioned product decision.
 */
const staffOperationalSnapshot = staffProcedure
	.output(operationalSnapshotSchema)
	.handler(({ context }) => {
		if (!context.readOperationalSnapshot) {
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}
		return context.readOperationalSnapshot();
	});
const adminSession = ownerProcedure.handler(({ context }) => context.auth);
const adminDailyAnalytics = ownerProcedure
	.input(ownerDailyAnalyticsInputSchema)
	.output(ownerDailyAnalyticsOutputSchema)
	.handler(({ context, input }) => {
		if (!context.readDailyAnalytics) {
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}
		return context.readDailyAnalytics(input?.businessDay);
	});
const adminAnalyticsTimeContext = ownerProcedure
	.input(analyticsTimeContextInputSchema)
	.output(analyticsTimeContextOutputSchema)
	.handler(({ context, input }) => {
		if (!context.readAnalyticsTimeContext) {
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}
		return context.readAnalyticsTimeContext(input.settingsVersions);
	});

/**
 * Owner-only audit history. Read-only by construction: the context exposes no
 * append path, so this leaf cannot write, and Phase 5 command/audit atomicity is
 * untouched. `ownerProcedure` is the same server-side guard the analytics leaves
 * use — missing or expired authentication is 401 and staff is 403.
 */
const adminAuditList = ownerProcedure
	.input(auditListInputSchema)
	.output(auditListOutputSchema)
	.handler(({ context, input }) => {
		if (!context.listAuditEntries) {
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}
		return context.listAuditEntries(input);
	});

/**
 * Owner-only incident and uptime summary. It takes no input at all: the window is a
 * product decision resolved server-side from the configured gym timezone and business
 * day, so no client can widen it, and no device or per-visitor datum is reachable
 * through it. `ownerProcedure` is the same server-side guard the analytics and audit
 * leaves use — missing or expired authentication is 401 and staff is 403.
 */
const adminHealthSummary = ownerProcedure
	.output(healthIncidentSummarySchema)
	.handler(({ context }) => {
		if (!context.readHealthIncidentSummary) {
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}
		return context.readHealthIncidentSummary();
	});

export const appRouter = {
	staff: {
		session: staffSession,
		operationalSnapshot: staffOperationalSnapshot,
	},
	admin: {
		session: adminSession,
		analytics: {
			csv: adminAnalyticsCsv,
			daily: adminDailyAnalytics,
			timeContext: adminAnalyticsTimeContext,
			// Owner-only reporting reads over the frozen Phase 10 contracts. They sit
			// beside the accepted CSV leaf rather than inside it: the export streams,
			// these answer once, and none of them shares the export's range bound.
			range: adminAnalyticsReportingQueries.range,
			heatmap: adminAnalyticsReportingQueries.heatmap,
			weekOverWeek: adminAnalyticsReportingQueries.weekOverWeek,
		},
		audit: {
			list: adminAuditList,
		},
		health: {
			summary: adminHealthSummary,
		},
		/**
		 * Owner access management. The only writers on the owner surface, added
		 * under the recorded coordinator lease for this slice; every read leaf
		 * beside them is untouched.
		 */
		access: adminAccessProcedures,
		/**
		 * Owner Settings. One read of the current effective version and one
		 * append-only writer, both added under the recorded coordinator lease
		 * for this slice. The writer appends the successor snapshot and its
		 * audit row in one transaction; no operational timing is editable
		 * through either leaf.
		 */
		settings: adminSettingsProcedures,
	},
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
