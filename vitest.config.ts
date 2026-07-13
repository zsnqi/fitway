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
		],
	},
});
