import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

function getVercelOrigin() {
	const vercelUrl =
		process.env.VERCEL_ENV === "production"
			? (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL)
			: (process.env.VERCEL_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL);
	if (!vercelUrl) return undefined;
	return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
}

const vercelOrigin = getVercelOrigin();
export const cronSecretSchema = z.string().min(32);

const runtimeEnv = {
	...process.env,
	// Public auth base: /api/auth bypasses the rewrite's path strip, so the
	// same URL works for incoming matching and generated callbacks
	BETTER_AUTH_URL:
		process.env.BETTER_AUTH_URL ??
		(vercelOrigin ? `${vercelOrigin}/api/auth` : undefined),
	CORS_ORIGIN: process.env.CORS_ORIGIN ?? vercelOrigin,
};

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().min(1),
		BETTER_AUTH_SECRET: z.string().min(32),
		CRON_SECRET: cronSecretSchema,
		// Maintainer health-alert transport, per the SPEC environment additions.
		// Gym configuration stays in the settings table; only the delivery
		// channel credential belongs here.
		TELEGRAM_BOT_TOKEN: z.string().min(1),
		TELEGRAM_CHAT_ID: z.string().min(1),
		BETTER_AUTH_URL: z.url(),
		CORS_ORIGIN: z.url(),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
	},
	runtimeEnv: runtimeEnv,
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	emptyStringAsUndefined: true,
});
