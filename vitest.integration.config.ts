import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: { "@": fileURLToPath(new URL("./apps/web/src", import.meta.url)) },
	},
	test: {
		include: ["**/*.integration.test.ts"],
		fileParallelism: false,
		setupFiles: ["tests/integration/setup.ts"],
	},
});
