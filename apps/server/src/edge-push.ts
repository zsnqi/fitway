import { EDGE_NO_STORE, edgePushRequestSchema } from "@fitway/api/edge-push";
import {
	type OccupancyEngineDependencies,
	OccupancyEngineError,
	processLivePush,
} from "@fitway/api/occupancy/engine";
import type { Context } from "hono";
import type { AuthenticatedDevice } from "./edge-auth";
import { authenticateDevice, EDGE_AUTH_ERROR } from "./edge-auth";
import type { DeviceRateLimiter } from "./rate-limiter";

export type EdgePushHandlerDependencies = {
	findDeviceByHash(hash: string): Promise<AuthenticatedDevice | null>;
	limiter: DeviceRateLimiter;
	engine: OccupancyEngineDependencies;
	requireHttps?: boolean;
};

export function createEdgePushHandler(
	dependencies: EdgePushHandlerDependencies,
) {
	return async (context: Context) => {
		context.header("Cache-Control", EDGE_NO_STORE);
		if (
			dependencies.requireHttps &&
			new URL(context.req.url).protocol !== "https:"
		) {
			return context.json({ error: "https_required" }, 400);
		}
		const device = await authenticateDevice(
			context.req.header("Authorization"),
			dependencies.findDeviceByHash,
		);
		if (!device) return context.json(EDGE_AUTH_ERROR, 401);
		const mediaType = context.req
			.header("Content-Type")
			?.split(";", 1)[0]
			?.trim()
			.toLowerCase();
		if (mediaType !== "application/json") {
			return context.json({ error: "unsupported_media_type" }, 415);
		}
		const decision = dependencies.limiter.consume(device.id);
		if (!decision.allowed) {
			context.header("Retry-After", String(decision.retryAfterSeconds));
			return context.json({ error: "rate_limited" }, 429);
		}
		let value: unknown;
		try {
			const declaredLength = Number(context.req.header("Content-Length") ?? 0);
			if (declaredLength > 16_384) {
				return context.json({ error: "request_too_large" }, 413);
			}
			const body = await context.req.text();
			if (new TextEncoder().encode(body).byteLength > 16_384) {
				return context.json({ error: "request_too_large" }, 413);
			}
			value = JSON.parse(body);
		} catch {
			return context.json({ error: "invalid_request" }, 422);
		}
		const parsed = edgePushRequestSchema.safeParse(value);
		if (!parsed.success) return context.json({ error: "invalid_request" }, 422);
		try {
			const result = await processLivePush(
				device.id,
				parsed.data,
				dependencies.engine,
			);
			return context.json(result);
		} catch (error) {
			if (
				error instanceof OccupancyEngineError &&
				error.code === "device_unavailable"
			) {
				return context.json(EDGE_AUTH_ERROR, 401);
			}
			return context.json({ error: "internal_error" }, 500);
		}
	};
}
