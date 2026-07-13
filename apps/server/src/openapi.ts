import { openApiRouter } from "@fitway/api/routers/index";
import { OpenAPIGenerator } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";

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
				appliedCommandId: null,
			};
		}
		const success = operation.responses?.["200"];
		if (
			success &&
			"content" in success &&
			success.content?.["application/json"]
		) {
			success.content["application/json"].example = {
				schemaVersion: 1,
				accepted: true,
				reason: "processed",
				highestProcessedSequence: 42,
				commands: [],
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
