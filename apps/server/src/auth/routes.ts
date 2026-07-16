import type { AuthService, CanonicalAuthContext } from "@fitway/auth";
import type { Context, Hono } from "hono";

import type { PinRateLimiter } from "./pin-rate-limiter";

type AuthRouteDependencies = {
	service: AuthService;
	staffPinLimiter: PinRateLimiter;
	ownerLoginLimiter: PinRateLimiter;
};

const INVALID_CREDENTIALS = { error: "invalid_credentials" } as const;
const UNAUTHORIZED = { error: "unauthorized" } as const;

function appendCookies(context: Context, cookies: string[]) {
	for (const cookie of cookies) {
		context.header("Set-Cookie", cookie, { append: true });
	}
}

function publicContext(auth: CanonicalAuthContext) {
	return {
		principalId: auth.principalId,
		principalKind: auth.principalKind,
		role: auth.role,
		sessionId: auth.sessionId,
		expiresAt: auth.expiresAt.toISOString(),
		active: auth.active,
	};
}

export function mountAuthRoutes(
	app: Hono,
	dependencies: AuthRouteDependencies,
) {
	app.use("/api/auth/*", async (context, next) => {
		await next();
		context.header("Cache-Control", "no-store");
	});

	app.post("/api/auth/sign-up/*", (context) =>
		context.json({ error: "signup_disabled" }, 403),
	);

	app.post("/api/auth/staff/pin", async (context) => {
		const now = new Date();
		const limit = dependencies.staffPinLimiter.check(now);
		if (!limit.allowed) {
			context.header("Retry-After", `${limit.retryAfterSeconds}`);
			return context.json(INVALID_CREDENTIALS, 429);
		}

		let pin: unknown;
		try {
			const body = (await context.req.json()) as { pin?: unknown };
			pin = body.pin;
		} catch {
			pin = undefined;
		}
		const result = await dependencies.service.loginStaff({
			pin: typeof pin === "string" ? pin : "",
			cookieHeader: context.req.header("Cookie"),
			now,
		});
		if (result.status !== "authenticated") {
			dependencies.staffPinLimiter.recordFailure(now);
			return context.json(INVALID_CREDENTIALS, 401);
		}
		dependencies.staffPinLimiter.reset();
		appendCookies(context, result.cookieHeaders);
		return context.json({ auth: publicContext(result.context) });
	});

	app.post("/api/auth/owner/password", async (context) => {
		const now = new Date();
		const limit = dependencies.ownerLoginLimiter.check(now);
		if (!limit.allowed) {
			context.header("Retry-After", `${limit.retryAfterSeconds}`);
			return context.json(INVALID_CREDENTIALS, 429);
		}
		let email: unknown;
		let password: unknown;
		try {
			const body = (await context.req.json()) as {
				email?: unknown;
				password?: unknown;
			};
			email = body.email;
			password = body.password;
		} catch {
			email = undefined;
			password = undefined;
		}
		const result = await dependencies.service.loginOwner({
			email: typeof email === "string" ? email : "",
			password: typeof password === "string" ? password : "",
			cookieHeader: context.req.header("Cookie"),
			now,
		});
		if (result.status !== "authenticated") {
			dependencies.ownerLoginLimiter.recordFailure(now);
			return context.json(INVALID_CREDENTIALS, 401);
		}
		dependencies.ownerLoginLimiter.reset();
		appendCookies(context, result.cookieHeaders);
		return context.json({ auth: publicContext(result.context) });
	});

	app.get("/api/auth/session", async (context) => {
		const result = await dependencies.service.authenticate(
			context.req.header("Cookie"),
		);
		appendCookies(context, result.cookieHeaders);
		if (result.status !== "authenticated") {
			return context.json(UNAUTHORIZED, 401);
		}
		return context.json({ auth: publicContext(result.context) });
	});

	app.get("/api/auth/owner/session", async (context) => {
		const result = await dependencies.service.authenticate(
			context.req.header("Cookie"),
		);
		appendCookies(context, result.cookieHeaders);
		if (result.status !== "authenticated") {
			return context.json(UNAUTHORIZED, 401);
		}
		if (
			result.context.role !== "owner" ||
			result.context.principalKind !== "owner"
		) {
			return context.json({ error: "forbidden" }, 403);
		}
		return context.json({ auth: publicContext(result.context) });
	});

	app.post("/api/auth/logout", async (context) => {
		appendCookies(
			context,
			await dependencies.service.logout(context.req.header("Cookie")),
		);
		return context.body(null, 204);
	});
}
