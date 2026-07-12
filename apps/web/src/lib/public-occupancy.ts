import {
	createPublicOccupancyUrl,
	isPublicOccupancyUnavailablePayload,
	type PublicOccupancyUnavailablePayload,
} from "@fitway/api/public-occupancy";
import { env } from "@fitway/env/web";

export function getPublicOccupancyUrl(
	serverBase: string = env.VITE_SERVER_URL,
): string {
	return createPublicOccupancyUrl(serverBase);
}

export async function fetchPublicOccupancy(): Promise<PublicOccupancyUnavailablePayload> {
	const response = await fetch(getPublicOccupancyUrl(), {
		headers: { Accept: "application/json" },
	});
	if (!response.ok) {
		throw new Error(`Public occupancy request failed: ${response.status}`);
	}

	const payload: unknown = await response.json();
	if (!isPublicOccupancyUnavailablePayload(payload)) {
		throw new Error("Public occupancy response did not match the contract");
	}

	return payload;
}
