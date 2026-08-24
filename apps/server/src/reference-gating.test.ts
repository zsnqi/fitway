import { describe, expect, it } from "vitest";

process.env.DATABASE_URL =
	"postgresql://postgres:postgres@127.0.0.1:55432/postgres";
process.env.BETTER_AUTH_SECRET =
	"test-secret-that-is-at-least-thirty-two-characters";
process.env.BETTER_AUTH_URL = "http://localhost:3100/api/auth";
process.env.CORS_ORIGIN = "http://localhost:3101";
process.env.NODE_ENV = "test";

async function createReferenceApp(nodeEnv: "production" | "development") {
	const { createApp } = await import("./index");
	return createApp(nodeEnv);
}

describe("OpenAPI publication gating", () => {
	it("keeps machine JSON in production while the interactive reference is 404", async () => {
		const app = await createReferenceApp("production");
		expect((await app.request("/openapi.json")).status).toBe(200);
		expect((await app.request("/api-reference")).status).toBe(404);
	});

	it("mounts the interactive reference in development", async () => {
		const app = await createReferenceApp("development");
		const response = await app.request("/api-reference");
		expect(response.status).toBe(200);
		expect(await response.text()).toContain('data-url="/openapi.json"');
	});
});
