import { describe, expect, it } from "vitest";
import { assertDisposableIntegrationDatabase } from "../../apps/server/src/test-support/integration-database-safety";

const safeInput = {
	connectionString:
		"postgresql://postgres:postgres@127.0.0.1:5432/fitway_integration_phase2_a1",
	resetMarker: "fitway_integration_phase2_a1",
	runId: "phase2_a1",
} as const;

describe("integration database safety", () => {
	it("accepts only the exact run-owned database and reset marker", () => {
		expect(assertDisposableIntegrationDatabase(safeInput)).toEqual({
			databaseName: "fitway_integration_phase2_a1",
			runId: "phase2_a1",
		});
	});

	it.each([
		[
			"broad test name",
			{
				...safeInput,
				connectionString:
					"postgresql://postgres:postgres@127.0.0.1:5432/fitway_test",
			},
		],
		["boolean marker", { ...safeInput, resetMarker: "true" }],
		["short run id", { ...safeInput, runId: "test" }],
		["unsafe run id", { ...safeInput, runId: "phase-2-a1" }],
		[
			"application database alias",
			{
				...safeInput,
				applicationDatabaseUrl:
					"postgresql://app:secret@db.example/fitway_integration_phase2_a1",
			},
		],
	])("rejects %s", (_name, input) => {
		expect(() => assertDisposableIntegrationDatabase(input)).toThrow();
	});
});
