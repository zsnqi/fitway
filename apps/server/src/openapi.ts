import { openApiRouter } from "@fitway/api/routers/index";
import { OpenAPIGenerator } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";

const SAFE_INTEGER_MAX = 9_007_199_254_740_991;
const POSTGRES_INTEGER_MAX = 2_147_483_647;
const CANONICAL_UTC_PATTERN =
	"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{3}Z$";

const positiveSafeIntegerSchema = {
	type: "integer",
	minimum: 1,
	maximum: SAFE_INTEGER_MAX,
} as const;
const canonicalUtcSchema = {
	type: "string",
	format: "date-time",
	pattern: CANONICAL_UTC_PATTERN,
} as const;
const commandProperties = {
	id: positiveSafeIntegerSchema,
	issuedAt: canonicalUtcSchema,
} as const;
const commandRequired = ["id", "type", "targetValue", "issuedAt"] as const;

const edgePushResponseOpenApiSchema = {
	type: "object",
	properties: {
		schemaVersion: { const: 1 },
		accepted: { type: "boolean" },
		reason: {
			type: "string",
			enum: ["processed", "replay", "sequence_gap"],
		},
		highestProcessedSequence: {
			type: "integer",
			minimum: 0,
			maximum: SAFE_INTEGER_MAX,
		},
		commands: {
			type: "array",
			maxItems: 1,
			uniqueItems: true,
			description:
				"The single effective pending command under the latest-only rule; empty unless the push is accepted.",
			items: {
				oneOf: [
					{
						type: "object",
						properties: {
							...commandProperties,
							type: { const: "set_count" },
							targetValue: {
								type: "integer",
								minimum: 0,
								maximum: POSTGRES_INTEGER_MAX,
							},
						},
						required: commandRequired,
						additionalProperties: false,
					},
					{
						type: "object",
						properties: {
							...commandProperties,
							type: { const: "reset_zero" },
							targetValue: { type: "null" },
						},
						required: commandRequired,
						additionalProperties: false,
					},
				],
			},
		},
		settings: {
			type: "object",
			properties: {
				version: positiveSafeIntegerSchema,
				pushIntervalSeconds: {
					type: "integer",
					minimum: 1,
					maximum: SAFE_INTEGER_MAX,
				},
			},
			required: ["version", "pushIntervalSeconds"],
			additionalProperties: false,
		},
		serverTime: canonicalUtcSchema,
	},
	required: [
		"schemaVersion",
		"accepted",
		"reason",
		"highestProcessedSequence",
		"commands",
		"settings",
		"serverTime",
	],
	additionalProperties: false,
	oneOf: [
		{
			properties: {
				accepted: { const: true },
				reason: { const: "processed" },
			},
		},
		{
			properties: {
				accepted: { const: false },
				reason: { enum: ["replay", "sequence_gap"] },
				commands: { type: "array", maxItems: 0 },
			},
		},
	],
} as const;

export async function generateOpenApiDocument() {
	const generator = new OpenAPIGenerator({
		schemaConverters: [new ZodToJsonSchemaConverter()],
	});
	const document = await generator.generate(openApiRouter, {
		info: { title: "Fitway Edge API", version: "1.0.0" },
		servers: [{ url: "/api" }],
		components: {
			securitySchemes: {
				deviceBearer: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "opaque",
				},
			},
		},
	});
	const operation = document.paths?.["/edge/push"]?.post;
	if (operation) {
		const errorContent = (example: string) => ({
			"application/json": {
				schema: {
					type: "object" as const,
					properties: { error: { type: "string" as const } },
					required: ["error"],
					additionalProperties: false,
				},
				example: { error: example },
			},
		});
		operation.security = [{ deviceBearer: [] }];
		if (
			operation.requestBody &&
			"content" in operation.requestBody &&
			operation.requestBody.content?.["application/json"]
		) {
			operation.requestBody.content["application/json"].example = {
				schemaVersion: 1,
				sequence: 42,
				observedAt: "2026-07-13T18:24:20.000Z",
				currentCount: 37,
				minutes: [
					{
						minuteStart: "2026-07-13T18:24:00.000Z",
						count: 37,
						entries: 2,
						exits: 1,
					},
				],
				health: {
					process: "ok",
					camera: "ok",
					feed: "ok",
					detectorFps: 4.8,
				},
				appliedCommandId: 41,
			};
		}
		const success = operation.responses?.["200"];
		if (
			success &&
			"content" in success &&
			success.content?.["application/json"]
		) {
			success.content["application/json"].schema =
				edgePushResponseOpenApiSchema as never;
			success.content["application/json"].example = {
				schemaVersion: 1,
				accepted: true,
				reason: "processed",
				highestProcessedSequence: 42,
				commands: [
					{
						id: 43,
						type: "set_count",
						targetValue: 35,
						issuedAt: "2026-07-13T18:24:19.000Z",
					},
				],
				settings: { version: 1, pushIntervalSeconds: 20 },
				serverTime: "2026-07-13T18:24:20.250Z",
			};
		}
		operation.responses = {
			...operation.responses,
			"400": {
				description: "HTTPS is required outside local development",
				content: errorContent("https_required"),
			},
			"401": {
				description: "Missing, invalid, or disabled device credential",
				content: errorContent("unauthorized"),
			},
			"422": {
				description: "Strict request validation failed",
				content: errorContent("invalid_request"),
			},
			"413": {
				description: "Request body exceeds the live-push size bound",
				content: errorContent("request_too_large"),
			},
			"415": {
				description: "Content-Type must be application/json",
				content: errorContent("unsupported_media_type"),
			},
			"429": {
				description: "Per-device rate limit exceeded",
				content: errorContent("rate_limited"),
				headers: {
					"Retry-After": {
						description: "Seconds before retrying the same sequence",
						schema: { type: "integer", minimum: 1 },
					},
				},
			},
			"500": {
				description: "Non-sensitive internal failure",
				content: errorContent("internal_error"),
			},
		};
	}
	return document;
}
