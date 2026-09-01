import path from "node:path";
import { describe, expect, it } from "vitest";
import {
	assertDemoDatabaseUrl,
	assertDemoOperation,
	assertDemoRuntimePath,
	assertOwnedProcessCommand,
	assertOwnedProcessRecord,
	DEMO_COMPOSE_PROJECT,
	DEMO_DATABASE_URL,
	DEMO_PROCESS_MARKERS,
	withoutInteractiveDemoCredentials,
} from "./contract";

describe("desktop demo safety contract", () => {
	it("accepts only the fixed loopback database", () => {
		expect(assertDemoDatabaseUrl(DEMO_DATABASE_URL).hostname).toBe("127.0.0.1");
		for (const value of [
			"postgresql://fitway_demo:fitway_demo_local@localhost:55432/fitway_desktop_demo",
			"postgresql://fitway_demo:fitway_demo_local@10.0.0.2:55432/fitway_desktop_demo",
			"postgresql://fitway_demo:fitway_demo_local@127.0.0.1:5432/fitway_desktop_demo",
			"postgresql://fitway_demo:fitway_demo_local@127.0.0.1:55432/postgres",
		])
			expect(() => assertDemoDatabaseUrl(value)).toThrow(/fixed loopback/);
	});

	it("requires the exact compose project and runtime path", () => {
		const workspace = path.resolve("C:/fitway-workspace");
		expect(
			assertDemoOperation({
				databaseUrl: DEMO_DATABASE_URL,
				composeProject: DEMO_COMPOSE_PROJECT,
				workspace,
			}),
		).toBe(path.resolve(workspace, ".local/demo"));
		expect(() =>
			assertDemoRuntimePath(workspace, path.resolve(workspace, ".local")),
		).toThrow(/workspace\/\.local\/demo/);
		expect(() =>
			assertDemoOperation({
				databaseUrl: DEMO_DATABASE_URL,
				composeProject: "other",
				workspace,
			}),
		).toThrow(/Compose project/);
	});

	it("fails closed before killing an ambiguous process", () => {
		expect(() =>
			assertOwnedProcessCommand(undefined, "scripts/demo/server.ts"),
		).toThrow(/Refusing/);
		expect(() =>
			assertOwnedProcessCommand("node unrelated.js", "scripts/demo/server.ts"),
		).toThrow(/Refusing/);
		expect(() =>
			assertOwnedProcessCommand(
				"node scripts/demo/server.ts",
				"scripts/demo/server.ts",
			),
		).not.toThrow();
		expect(() =>
			assertOwnedProcessRecord({
				role: "server",
				pid: 42,
				marker: "unrelated.exe",
			}),
		).toThrow(/malformed/);
		expect(() =>
			assertOwnedProcessRecord({
				role: "server",
				pid: 42,
				marker: DEMO_PROCESS_MARKERS.server,
			}),
		).not.toThrow();
	});

	it("removes interactive credentials from helper child environments", () => {
		const source = {
			FITWAY_DEMO_OWNER_PASSWORD: "synthetic-owner-secret",
			FITWAY_DEMO_STAFF_PIN: "123456",
			SAFE_VALUE: "preserved",
		};
		expect(withoutInteractiveDemoCredentials(source)).toEqual({
			SAFE_VALUE: "preserved",
		});
		expect(source.FITWAY_DEMO_OWNER_PASSWORD).toBe("synthetic-owner-secret");
	});
});
