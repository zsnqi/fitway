import { edgePushResponseSchema } from "@fitway/api/edge-push";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { describe, expect, it } from "vitest";
import { generateOpenApiDocument } from "./openapi";

describe("generated OpenAPI", () => {
	it("publishes the edge push operation and bearer requirement", async () => {
		const document = await generateOpenApiDocument();
		expect(document.openapi).toBe("3.1.1");
		const operation = document.paths?.["/edge/push"]?.post;
		expect(operation?.operationId).toBe("edge.pushOccupancy");
		expect(operation?.security).toEqual([{ deviceBearer: [] }]);
		expect(document.components?.securitySchemes).toHaveProperty("deviceBearer");
		expect(operation?.responses).toHaveProperty("401");
		expect(operation?.responses).toHaveProperty("400");
		expect(operation?.responses).toHaveProperty("413");
		expect(operation?.responses).toHaveProperty("415");
		expect(operation?.responses).toHaveProperty("422");
		expect(operation?.responses).toHaveProperty("429");
		expect(operation?.responses).toHaveProperty("500");
		expect(
			operation?.requestBody &&
				"content" in operation.requestBody &&
				operation.requestBody.content?.["application/json"]?.example,
		).toMatchObject({ schemaVersion: 1, sequence: 42, appliedCommandId: 41 });
		const success = operation?.responses?.["200"];
		expect(
			success &&
				"content" in success &&
				success.content?.["application/json"]?.example,
		).toMatchObject({
			accepted: true,
			commands: [
				{
					id: 43,
					type: "set_count",
					targetValue: 35,
					issuedAt: "2026-07-13T18:24:19.000Z",
				},
			],
		});

		const requestSchema =
			operation?.requestBody && "content" in operation.requestBody
				? operation.requestBody.content?.["application/json"]?.schema
				: undefined;
		expect(JSON.stringify(requestSchema)).toContain("appliedCommandId");
		if (!success || !("content" in success)) {
			throw new Error("OpenAPI success response is missing");
		}
		const media = success.content?.["application/json"];
		if (!media?.schema || !media.example) {
			throw new Error("OpenAPI success contract is missing");
		}
		const ajv = new Ajv2020({ strict: true });
		addFormats(ajv);
		const validate = ajv.compile(media.schema);
		const valid = media.example;
		const cases = [
			valid,
			{ ...valid, highestProcessedSequence: -1 },
			{
				...valid,
				accepted: false,
				reason: "replay",
				commands: valid.commands,
			},
			{
				...valid,
				commands: [
					{
						id: 43,
						type: "reset_zero",
						targetValue: 0,
						issuedAt: "2026-07-13T18:24:19.000Z",
					},
				],
			},
		];
		for (const value of cases) {
			expect(Boolean(validate(value))).toBe(
				edgePushResponseSchema.safeParse(value).success,
			);
		}
	});
});
