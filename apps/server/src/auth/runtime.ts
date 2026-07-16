import { createHmac } from "node:crypto";

import { AuthService } from "@fitway/auth";
import { createDb } from "@fitway/db";

import { PinRateLimiter } from "./pin-rate-limiter";
import { PostgresAuthRepository } from "./postgres-auth-repository";

export type AuthRuntime = {
	service: AuthService;
	staffPinLimiter: PinRateLimiter;
	ownerLoginLimiter: PinRateLimiter;
};

function deriveSubkey(masterSecret: string, purpose: string) {
	return createHmac("sha256", masterSecret)
		.update(`fitway-auth-subkey-v1:${purpose}`, "utf8")
		.digest("base64url");
}

export function createAuthRuntime(masterSecret: string): AuthRuntime {
	const repository = new PostgresAuthRepository(createDb());
	return {
		service: new AuthService({
			repository,
			pepper: deriveSubkey(masterSecret, "pin-pepper"),
			cookieSecret: deriveSubkey(masterSecret, "cookie-signing"),
		}),
		staffPinLimiter: new PinRateLimiter(),
		ownerLoginLimiter: new PinRateLimiter(),
	};
}
