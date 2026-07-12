import {
	createUnavailablePublicOccupancyPayload,
	PUBLIC_OCCUPANCY_CACHE_CONTROL,
} from "@fitway/api/public-occupancy";
import type { Context } from "hono";

export function publicOccupancyHandler(context: Context) {
	context.header("Cache-Control", PUBLIC_OCCUPANCY_CACHE_CONTROL);
	return context.json(createUnavailablePublicOccupancyPayload());
}
