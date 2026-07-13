import {
	buildPublicOccupancyPayload,
	type PublicPayloadRepository,
} from "@fitway/api/public/payload-builder";
import {
	PUBLIC_OCCUPANCY_CACHE_CONTROL,
	PUBLIC_POLL_HEADER,
} from "@fitway/api/public-occupancy";
import type { Context } from "hono";

export function createPublicOccupancyHandler(
	repository: PublicPayloadRepository,
) {
	return async (context: Context) => {
		const built = await buildPublicOccupancyPayload(repository);
		context.header("Cache-Control", PUBLIC_OCCUPANCY_CACHE_CONTROL);
		if (built.pollSeconds !== null) {
			context.header(PUBLIC_POLL_HEADER, String(built.pollSeconds));
		}
		return context.json(built.payload);
	};
}
