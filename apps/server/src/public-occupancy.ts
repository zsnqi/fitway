import {
	buildPublicOccupancyPayload,
	type PublicPayloadRepository,
} from "@fitway/api/public/payload-builder";
import {
	PUBLIC_POLL_HEADER,
	publicOccupancyCacheControl,
} from "@fitway/api/public-occupancy";
import type { Context } from "hono";

export function createPublicOccupancyHandler(
	repository: PublicPayloadRepository,
	now: () => Date = () => new Date(),
) {
	return async (context: Context) => {
		const instant = now();
		const built = await buildPublicOccupancyPayload(repository, instant);
		context.header(
			"Cache-Control",
			publicOccupancyCacheControl(built.payload, instant),
		);
		if (built.pollSeconds !== null) {
			context.header(PUBLIC_POLL_HEADER, String(built.pollSeconds));
		}
		return context.json(built.payload);
	};
}
