import type { RouterClient } from "@orpc/server";
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
const staffOperationalSnapshot = staffProcedure
	.output(operationalSnapshotSchema)
	.handler(({ context }) => {
		if (!context.readOperationalSnapshot) {
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}
		return context.readOperationalSnapshot();
	});
const adminSession = ownerProcedure.handler(({ context }) => context.auth);

export const appRouter = {
	staff: {
		session: staffSession,
		operationalSnapshot: staffOperationalSnapshot,
	},
	admin: { session: adminSession },
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
