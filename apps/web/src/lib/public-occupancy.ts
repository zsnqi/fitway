import {
	createPublicOccupancyUrl,
	isPublicOccupancyPayload,
	PUBLIC_POLL_HEADER,
	type PublicOccupancyPayload,
} from "@fitway/api/public-occupancy";
import { env } from "@fitway/env/web";

export type PublicOccupancyResponse = {
	payload: PublicOccupancyPayload;
	pollSeconds: number | null;
};

export function getPublicOccupancyUrl(
	serverBase: string = env.VITE_SERVER_URL,
): string {
	return createPublicOccupancyUrl(serverBase);
}

export function parsePollSeconds(value: string | null): number | null {
	if (!value || !/^\d+$/.test(value)) return null;
	const parsed = Number(value);
	return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function fetchPublicOccupancy(
	signal?: AbortSignal,
): Promise<PublicOccupancyResponse> {
	const response = await fetch(getPublicOccupancyUrl(), {
		headers: { Accept: "application/json" },
		signal,
	});
	if (!response.ok) {
		throw new Error(`Public occupancy request failed: ${response.status}`);
	}
	const payload: unknown = await response.json();
	if (!isPublicOccupancyPayload(payload)) {
		throw new Error("Public occupancy response did not match the contract");
	}
	return {
		payload,
		pollSeconds: parsePollSeconds(response.headers.get(PUBLIC_POLL_HEADER)),
	};
}

export function nextPollDelay(
	pollSeconds: number,
	random: () => number = Math.random,
): number {
	return pollSeconds * 1_000 * (0.9 + Math.min(1, Math.max(0, random())) * 0.2);
}

export function effectiveFreshness(
	payload: PublicOccupancyPayload,
	now: Date,
): PublicOccupancyPayload["freshness"] {
	if (payload.freshness !== "fresh") return payload.freshness;
	const freshUntil = Date.parse(payload.freshUntil);
	const computedAt = Date.parse(payload.computedAt);
	const lastUpdatedAt = Date.parse(payload.lastUpdatedAt);
	if (
		!Number.isFinite(freshUntil) ||
		!Number.isFinite(computedAt) ||
		!Number.isFinite(lastUpdatedAt)
	)
		return "stale";
	if (
		lastUpdatedAt > computedAt ||
		computedAt > freshUntil ||
		computedAt > now.getTime() + 5_000
	)
		return "stale";
	return now.getTime() < freshUntil ? "fresh" : "stale";
}
