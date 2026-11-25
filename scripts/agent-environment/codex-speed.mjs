// Choose a GPT round's Codex speed from the signed-in account's plan.

import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

const STANDARD_SPEED = "default";
const FAST_SPEED = "priority";
const BUSINESS_PLANS = new Set(["business", "team"]);
// OpenAI's Business offer: Fast costs no more than Standard through this day.
const FAST_OFFER_END = Date.parse("2027-01-01T00:00:00Z");

async function accountPlan(environment) {
	const home = environment.CODEX_HOME || path.join(homedir(), ".codex");
	try {
		const auth = JSON.parse(
			await readFile(path.join(home, "auth.json"), "utf8"),
		);
		// The id token keeps the plan of the first sign-in; the access token names
		// the workspace chosen now.
		const claims = JSON.parse(
			Buffer.from(auth.tokens.access_token.split(".")[1], "base64url").toString(
				"utf8",
			),
		);
		return claims["https://api.openai.com/auth"].chatgpt_plan_type;
	} catch {
		return undefined;
	}
}

async function accountSpeed(environment, now = Date.now()) {
	const plan = await accountPlan(environment);
	const fast = BUSINESS_PLANS.has(plan) && now < FAST_OFFER_END;
	return {
		plan: plan ?? "unknown",
		speed: fast ? FAST_SPEED : STANDARD_SPEED,
	};
}

export { accountSpeed, STANDARD_SPEED };
