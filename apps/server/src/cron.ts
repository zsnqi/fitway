import { createHash, timingSafeEqual } from "node:crypto";
import type { Context } from "hono";

export const CRON_INTERNAL_PATH = "/cron";
export const CRON_NO_STORE = "no-store";

export type CronRequestEvent = {
	method: string;
	path: string;
	status: number;
};

export type CronHandlerDependencies = {
	secret: string;
	runner: { run: () => Promise<unknown> };
	logger: {
		request: (event: CronRequestEvent) => void;
		error: (errorName: string) => void;
	};
};

function digest(value: string) {
	return createHash("sha256").update(value, "utf8").digest();
}

export function createCronHandler(dependencies: CronHandlerDependencies) {
	if (dependencies.secret.length < 32) {
		throw new RangeError("Cron secret must contain at least 32 characters");
	}
	const expectedAuthorization = `Bearer ${dependencies.secret}`;
	const expectedDigest = digest(expectedAuthorization);

	return async (context: Context) => {
		context.header("Cache-Control", CRON_NO_STORE);
		if (context.req.method !== "GET") {
			dependencies.logger.request({
				method: context.req.method,
				path: context.req.path,
				status: 405,
			});
			return context.json({ error: "method_not_allowed" }, 405);
		}

		const authorization = context.req.header("Authorization") ?? "";
		const authenticated = timingSafeEqual(
			digest(authorization),
			expectedDigest,
		);
		if (
			!authorization.startsWith("Bearer ") ||
			authorization.length !== expectedAuthorization.length ||
			!authenticated
		) {
			dependencies.logger.request({
				method: context.req.method,
				path: context.req.path,
				status: 401,
			});
			return context.json({ error: "unauthorized" }, 401);
		}

		try {
			await dependencies.runner.run();
			dependencies.logger.request({
				method: context.req.method,
				path: context.req.path,
				status: 200,
			});
			return context.json({ status: "ok" });
		} catch (error) {
			dependencies.logger.error(
				error instanceof Error ? error.name : "unknown",
			);
			dependencies.logger.request({
				method: context.req.method,
				path: context.req.path,
				status: 500,
			});
			return context.json({ error: "cron_failed" }, 500);
		}
	};
}
