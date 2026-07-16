import { AuthService } from "@fitway/auth";
import { createDb } from "@fitway/db";

import { PinRateLimiter } from "./pin-rate-limiter";
import { PostgresAuthRepository } from "./postgres-auth-repository";

export type AuthRuntime = {
	service: AuthService;
	limiter: PinRateLimiter;
};

export function createAuthRuntime(secret: string): AuthRuntime {
	const repository = new PostgresAuthRepository(createDb());
	return {
		service: new AuthService({
			repository,
			pepper: secret,
			cookieSecret: secret,
		}),
		limiter: new PinRateLimiter(),
	};
}
