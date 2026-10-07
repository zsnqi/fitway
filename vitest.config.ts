import { fileURLToPath, URL } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	define: {
		"import.meta.env.VITE_SERVER_URL": JSON.stringify("http://localhost:3000"),
	},
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./apps/web/src", import.meta.url)),
		},
	},
	test: {
		env: {
			VITE_SERVER_URL: "http://localhost:3000",
		},
		exclude: [
			...configDefaults.exclude,
			"**/dist/**",
			"tests/browser/**",
			"**/*.integration.test.ts",
			// These HTTP/filesystem contracts use node:test and have their own fast-ladder step.
			".agents/skills/verify-fitway/**/*.test.mjs",
		],
		// The suite's two heaviest deterministic-compute tests measure 5.9s and
		// 4.0s under full-file parallelism, so Vitest's 5000ms default left the
		// shared baseline decided by machine load rather than by correctness.
		testTimeout: 20000,
	},
});
