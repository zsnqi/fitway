import { createHmac } from "node:crypto";

import { AuthService } from "@fitway/auth";
import { createDb } from "@fitway/db";

import { PinRateLimiter } from "./pin-rate-limiter";
import { PostgresAuthRepository } from "./postgres-auth-repository";

export type AuthRuntime = {
	service: AuthService;
	staffPinLimiter: PinRateLimiter;
	ownerLoginLimiter: PinRateLimiter;
	/**
	 * The derived hashing subkeys, exposed so a credential written outside the
	 * login path is written under the same pepper the login path verifies with.
	 *
	 * Optional, deliberately. Making them required would force every existing
	 * integration test that builds a runtime literal to be edited, across eight
	 * milestones this slice does not own. `createAuthRuntime` always supplies
	 * them, so production always has the matching pair; a caller that assembles a
	 * runtime by hand and omits them gets the env-derived pepper, and if that
	 * caller used a different master secret the mismatch surfaces immediately as a
	 * failing credential rather than as a weaker one.
	 */
	pinPepper?: string;
	ownerPasswordPepper?: string;
};

export function derivePinPepper(masterSecret: string) {
	return deriveSubkey(masterSecret, "pin-pepper");
}

function deriveSubkey(masterSecret: string, purpose: string) {
	return createHmac("sha256", masterSecret)
		.update(`fitway-auth-subkey-v1:${purpose}`, "utf8")
		.digest("base64url");
}

export function createAuthRuntime(masterSecret: string): AuthRuntime {
	const repository = new PostgresAuthRepository(createDb());
	const pinPepper = derivePinPepper(masterSecret);
	return {
		service: new AuthService({
			repository,
			pepper: pinPepper,
			cookieSecret: deriveSubkey(masterSecret, "cookie-signing"),
		}),
		staffPinLimiter: new PinRateLimiter(),
		ownerLoginLimiter: new PinRateLimiter(),
		pinPepper,
		// The owner password path derives from the same pin subkey today; naming it
		// separately here is what lets the two diverge later without a silent
		// credential break.
		ownerPasswordPepper: pinPepper,
	};
}
