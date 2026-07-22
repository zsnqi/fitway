import {
	edgePushRequestSchema,
	edgePushResponseSchema,
} from "@fitway/api/edge-push";
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
		if (!requestSchema) {
			throw new Error("OpenAPI request contract is missing");
		}
		const requestAjv = new Ajv2020({ strict: true });
		addFormats(requestAjv);
		requestAjv.addKeyword({
			keyword: "x-fitway-sorted-unique-minute-starts",
			type: "array",
			schemaType: "boolean",
			validate: (_schema: boolean, value: unknown) => {
				if (!Array.isArray(value)) {
					return false;
				}
				const starts = value.map((item) =>
					typeof item === "object" && item !== null && "minuteStart" in item
						? item.minuteStart
						: undefined,
				);
				const stringStarts = starts.filter(
					(start): start is string => typeof start === "string",
				);
				if (stringStarts.length !== starts.length) {
					return false;
				}
				for (let index = 1; index < stringStarts.length; index += 1) {
					const previous = stringStarts[index - 1];
					const current = stringStarts[index];
					if (!previous || !current || previous >= current) {
						return false;
					}
				}
				return true;
			},
		});
		const validateRequest = requestAjv.compile(requestSchema);
		const validRequest =
			operation?.requestBody && "content" in operation.requestBody
				? operation.requestBody.content?.["application/json"]?.example
				: undefined;
		const olderMinute = {
			minuteStart: "2026-07-13T18:23:00.000Z",
			count: 36,
			entries: 1,
			exits: 0,
		};
		const requestCases = [
			validRequest,
			{ ...validRequest, observedAt: "2026-07-13T18:24:20Z" },
			{ ...validRequest, observedAt: "2026-07-13T18:24:60.000Z" },
			{
				...validRequest,
				minutes: [
					{
						...validRequest.minutes[0],
						minuteStart: "2026-07-13T18:24:01.000Z",
					},
				],
			},
			{
				...validRequest,
				minutes: [validRequest.minutes[0], olderMinute],
			},
			{
				...validRequest,
				minutes: [
					validRequest.minutes[0],
					{ ...validRequest.minutes[0], count: 38 },
				],
			},
		];
		for (const value of requestCases) {
			expect(Boolean(validateRequest(value))).toBe(
				edgePushRequestSchema.safeParse(value).success,
			);
		}
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
			{
				...valid,
				settings: {
					...valid.settings,
					pushIntervalSeconds: 2_147_483_648,
				},
			},
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
						id: 44,
						type: "reset_zero",
						targetValue: null,
						issuedAt: "2026-07-13T18:24:20.000Z",
					},
					...valid.commands,
				],
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
