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
		).toMatchObject({ schemaVersion: 1, sequence: 42 });
		const success = operation?.responses?.["200"];
		expect(
			success &&
				"content" in success &&
				success.content?.["application/json"]?.example,
		).toMatchObject({ accepted: true, commands: [] });
	});
});
