import type { RouterClient } from "@orpc/server";
import {
	analyticsTimeContextInputSchema,
	analyticsTimeContextOutputSchema,
	ownerDailyAnalyticsInputSchema,
	ownerDailyAnalyticsOutputSchema,
} from "../analytics/time-context";
import { recentCommandsSchema } from "../commands/recent-commands";
import {
	commandMutationResultSchema,
	correctionInputSchema,
	resetInputSchema,
} from "../commands/schemas";
import type { CommandService } from "../commands/service";
import { CommandIssueError } from "../commands/service";
import type { Context } from "../context";
import { edgePushRequestSchema, edgePushResponseSchema } from "../edge-push";
import { operationalSnapshotSchema } from "../health/snapshot";
import {
	ORPCError,
	ownerProcedure,
	publicProcedure,
	staffProcedure,
} from "../index";

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
function requireCommandService(context: Context): CommandService {
	if (!context.commandService) throw new ORPCError("INTERNAL_SERVER_ERROR");
	return context.commandService;
}

async function handleCommandIssue<T>(operation: () => Promise<T>): Promise<T> {
	try {
		return await operation();
	} catch (error) {
		if (error instanceof CommandIssueError) throw new ORPCError("BAD_REQUEST");
		throw error;
	}
}

const staffOperationalSnapshot = staffProcedure
	.output(operationalSnapshotSchema)
	.handler(({ context }) => {
		if (!context.readOperationalSnapshot) {
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}
		return context.readOperationalSnapshot();
	});
const staffIssueCorrection = staffProcedure
	.input(correctionInputSchema)
	.output(commandMutationResultSchema)
	.handler(({ context, input }) =>
		handleCommandIssue(() =>
			requireCommandService(context).issueCorrection(context.auth, input),
		),
	);
const staffIssueReset = staffProcedure
	.input(resetInputSchema)
	.output(commandMutationResultSchema)
	.handler(({ context, input }) =>
		handleCommandIssue(() =>
			requireCommandService(context).issueReset(context.auth, input),
		),
	);
const staffRecentCommands = staffProcedure
	.output(recentCommandsSchema)
	.handler(({ context }) => {
		if (!context.readRecentCommands) {
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}
		return context.readRecentCommands();
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

export const appRouter = {
	staff: {
		session: staffSession,
		operationalSnapshot: staffOperationalSnapshot,
		issueCorrection: staffIssueCorrection,
		issueReset: staffIssueReset,
		recentCommands: staffRecentCommands,
	},
	admin: {
		session: adminSession,
		analytics: {
			daily: adminDailyAnalytics,
			timeContext: adminAnalyticsTimeContext,
		},
	},
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
