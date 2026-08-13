import { pathToFileURL } from "node:url";
import { createContext } from "@fitway/api/context";
import {
	EDGE_NO_STORE,
	EDGE_PUSH_INTERNAL_PATH,
	OPENAPI_REFERENCE_PATH,
	OPENAPI_RESOURCE_PATH,
} from "@fitway/api/edge-push";
import { buildOperationalSnapshot } from "@fitway/api/health/snapshot";
import {
	PUBLIC_OCCUPANCY_INTERNAL_PATH,
	PUBLIC_POLL_HEADER,
} from "@fitway/api/public-occupancy";
import { createScheduledResetRunner } from "@fitway/api/reset/runner";
import { appRouter } from "@fitway/api/routers/index";
import { db } from "@fitway/db";
import { env } from "@fitway/env/server";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createOwnerAnalyticsReaders } from "./analytics-time-context-repository";
import { mountAuthRoutes } from "./auth/routes";
import { type AuthRuntime, createAuthRuntime } from "./auth/runtime";
import { commandService } from "./command-repository";
import { CRON_INTERNAL_PATH, createCronHandler } from "./cron";
import { createEdgePushHandler } from "./edge-push";
import { healthSnapshotRepository } from "./health-repository";
import {
	findDeviceByTokenHash,
	occupancyEngineDatabase,
	publicPayloadRepository,
} from "./occupancy-repositories";
import { generateOpenApiDocument } from "./openapi";
import { createPublicOccupancyHandler } from "./public-occupancy";
import { DeviceRateLimiter } from "./rate-limiter";
import { createResetRepository } from "./reset-repository";

const ownerAnalyticsReaders = createOwnerAnalyticsReaders(db);

export function createApp(
	nodeEnv: "development" | "production" | "test" = env.NODE_ENV,
	authRuntime: AuthRuntime = createAuthRuntime(env.BETTER_AUTH_SECRET),
	cronNow: () => Date = () => new Date(),
	cronRunnerOverride?: { run: () => Promise<unknown> },
) {
	const app = new Hono();
	const requestLogger = logger();
	app.use("*", async (context, next) => {
		if (
			context.req.path === EDGE_PUSH_INTERNAL_PATH ||
			context.req.path === CRON_INTERNAL_PATH
		)
			return next();
		return requestLogger(context, next);
	});
	app.use(
		"*",
		cors({
			origin: env.CORS_ORIGIN,
			allowMethods: ["GET", "POST", "OPTIONS"],
			allowHeaders: ["Content-Type", "Authorization"],
			exposeHeaders: [PUBLIC_POLL_HEADER],
			credentials: true,
		}),
	);

	app.post(
		EDGE_PUSH_INTERNAL_PATH,
		bodyLimit({
			maxSize: 16 * 1_024,
			onError: (context) => {
				context.header("Cache-Control", EDGE_NO_STORE);
				return context.json({ error: "request_too_large" }, 413);
			},
		}),
		createEdgePushHandler({
			findDeviceByHash: findDeviceByTokenHash,
			limiter: new DeviceRateLimiter(),
			engine: occupancyEngineDatabase,
			requireHttps: nodeEnv === "production",
		}),
	);
	app.get(
		PUBLIC_OCCUPANCY_INTERNAL_PATH,
		createPublicOccupancyHandler(publicPayloadRepository),
	);
	const resetRepository = createResetRepository(db);
	const scheduledResetRunner =
		cronRunnerOverride ??
		createScheduledResetRunner({
			now: cronNow,
			...resetRepository,
			issueScheduledReset: (decision) =>
				commandService.issueScheduledReset(decision),
		});
	app.get(
		CRON_INTERNAL_PATH,
		createCronHandler({
			secret: env.CRON_SECRET,
			runner: scheduledResetRunner,
			logger: {
				request: ({ method, path, status }) =>
					console.log(method, path, status),
				error: (errorName) => console.error(errorName),
			},
		}),
	);
	mountAuthRoutes(app, authRuntime);

	const document = generateOpenApiDocument();
	app.get(OPENAPI_RESOURCE_PATH, async (context) => {
		const value = await document;
		context.header("Cache-Control", "no-store");
		return context.json(value);
	});

	const rpcHandler = new RPCHandler(appRouter, {
		interceptors: [
			onError((error) =>
				console.error(
					"RPC request failed",
					error instanceof Error ? error.name : "unknown",
				),
			),
		],
	});
	if (nodeEnv !== "production") {
		app.get(OPENAPI_REFERENCE_PATH, (context) => {
			context.header("Cache-Control", "no-store");
			return context.html(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fitway Edge API Reference</title></head>
<body><script id="api-reference" data-url="${OPENAPI_RESOURCE_PATH}"></script><script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.62.5" integrity="sha384-jVBCKhcCfx34USN27x4iQK1SBNdL/HxKq3KuBAxTS4WPaP5w80K4fjpwB+DezJL5" crossorigin="anonymous"></script></body></html>`);
		});
	}

	app.use("*", async (context, next) => {
		if (context.req.path.startsWith("/rpc")) {
			const rpcResult = await rpcHandler.handle(context.req.raw, {
				prefix: "/rpc",
				context: await createContext({
					context,
					authenticate: (cookieHeader) =>
						authRuntime.service.authenticate(cookieHeader),
					readOperationalSnapshot: () =>
						buildOperationalSnapshot(healthSnapshotRepository),
					readDailyAnalytics: ownerAnalyticsReaders.readDailyAnalytics,
					readAnalyticsTimeContext:
						ownerAnalyticsReaders.readAnalyticsTimeContext,
				}),
			});
			if (rpcResult.matched)
				return context.newResponse(rpcResult.response.body, rpcResult.response);
		}
		await next();
	});
	app.get("/", (context) => context.text("OK"));
	return app;
}

const app = createApp();
export default app;

const entryUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (!process.env.VERCEL && import.meta.url === entryUrl) {
	const { serve } = await import("@hono/node-server");
	const port = Number(process.env.PORT ?? 3100);
	serve({ fetch: app.fetch, port }, (info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	});
}
