import { createHash } from "node:crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
	DEEPSEEK_MODEL,
	expectedDeepSeekArgs,
	fixture,
	GPT_MODEL,
	refused,
} from "./codex-round-test-support.ts";

describe("D1 model choice, catalog, and resume", () => {
	it("defaults to DeepSeek max and records the catalog and its hash", () => {
		const f = fixture();
		const result = f.invokeRaw([f.brief, "--run", f.run]);
		expect(result.status, result.output).toBe(0);
		expect(f.captured().args).toEqual(
			expectedDeepSeekArgs(f, "last-message.md"),
		);
		const metadata = JSON.parse(
			readFileSync(path.join(f.run, "run.json"), "utf8"),
		);
		expect(metadata).toMatchObject({
			model: DEEPSEEK_MODEL,
			level: "max",
		});
		const catalogBytes = readFileSync(path.join(f.run, "model-catalog.json"));
		expect(metadata.catalogSha256).toBe(
			createHash("sha256").update(catalogBytes).digest("hex"),
		);
		const catalog = JSON.parse(catalogBytes.toString("utf8"));
		expect(catalog.models[0]).toMatchObject({
			slug: DEEPSEEK_MODEL,
			display_name: "DeepSeek V4.1 Flash (Open Design)",
			default_reasoning_level: "high",
			supported_reasoning_levels: [
				{ effort: "high", description: "high" },
				{ effort: "max", description: "max" },
			],
			priority: 99,
			apply_patch_tool_type: "freeform",
			web_search_tool_type: "text",
			context_window: 900000,
			max_context_window: 1000000,
			input_modalities: ["text"],
			supports_search_tool: false,
		});
		expect(catalog.models[0]).not.toHaveProperty("comp_hash");
	});

	it("accepts GPT max without DeepSeek route arguments or a key", () => {
		const f = fixture();
		const result = f.invoke(
			[f.brief, "max", "--model", GPT_MODEL, "--run", f.run],
			{ OPENDESIGN_API_KEY: "" },
		);
		expect(result.status, result.output).toBe(0);
		const args = f.captured().args;
		expect(args).toContain(GPT_MODEL);
		expect(args).toContain("model_reasoning_effort=max");
		expect(args.some((value) => value.startsWith("model_provider="))).toBe(
			false,
		);
		expect(
			JSON.parse(readFileSync(path.join(f.run, "run.json"), "utf8")),
		).toMatchObject({ model: GPT_MODEL, level: "max" });
	});

	it.each([
		["unsupported model", "high", "not-a-model", [DEEPSEEK_MODEL, GPT_MODEL]],
		["unsupported DeepSeek level", "medium", DEEPSEEK_MODEL, ["high", "max"]],
		["unsupported DeepSeek level", "xhigh", DEEPSEEK_MODEL, ["high", "max"]],
	])("refuses %s before Codex starts", (_name, level, model, accepted) => {
		const f = fixture();
		const result = f.invokeRaw([
			f.brief,
			level,
			"--model",
			model,
			"--run",
			f.run,
		]);
		refused(f, result, String(accepted[0]));
		expect(result.stderr).toContain(String(accepted[1]));
	});

	it("uses the model and level recorded for resume", () => {
		const f = fixture();
		expect(f.invokeRaw([f.brief, "--run", f.run]).status).toBe(0);
		rmSync(f.capture);
		const result = f.invokeRaw(["resume", f.run]);
		expect(result.status, result.output).toBe(0);
		expect(f.captured().args).toEqual(
			expectedDeepSeekArgs(f, "last-message.md", true),
		);
		expect(
			JSON.parse(readFileSync(path.join(f.run, "run.json"), "utf8")),
		).toMatchObject({ model: DEEPSEEK_MODEL, level: "max" });
	});
});

describe("D2 absent catalog and missing key gates", () => {
	it("refuses a missing catalog source and names the file", () => {
		const f = fixture();
		const source = path.join(f.codexHome, "models_cache.json");
		rmSync(source);
		const result = f.invokeRaw([f.brief, "--run", f.run], {
			OPENDESIGN_API_KEY: "test-only",
		});
		refused(f, result, "DeepSeek catalog source not found");
		expect(result.stderr).toContain(source);
		expect(existsSync(f.run)).toBe(false);
	});

	it.each([
		["no entry", '{"models":[]}\n'],
		["two entries", '{"models":[{"slug":"a"},{"slug":"b"}]}\n'],
	])("refuses a catalog source with %s", (_name, content) => {
		const f = fixture();
		const source = path.join(f.codexHome, "models_cache.json");
		writeFileSync(source, content);
		const result = f.invokeRaw([f.brief, "--run", f.run], {
			OPENDESIGN_API_KEY: "test-only",
		});
		refused(
			f,
			result,
			"DeepSeek catalog source must hold exactly one model entry",
		);
		expect(result.stderr).toContain(source);
		expect(existsSync(f.run)).toBe(false);
	});

	it("builds the catalog from the source, whatever Codex's own cache holds", () => {
		const f = fixture();
		const source = path.join(f.root, "pinned-source.json");
		writeFileSync(
			source,
			readFileSync(path.join(f.codexHome, "models_cache.json")),
		);
		writeFileSync(
			path.join(f.codexHome, "models_cache.json"),
			'{"models":[{"slug":"gpt-6.1-sol"}]}\n',
		);
		const result = f.invokeRaw([f.brief, "--run", f.run], {
			FITWAY_DEEPSEEK_CATALOG_SOURCE: source,
		});
		expect(result.status, result.output).toBe(0);
		const catalog = JSON.parse(
			readFileSync(path.join(f.run, "model-catalog.json"), "utf8"),
		);
		expect(catalog.models[0]).toMatchObject({
			slug: DEEPSEEK_MODEL,
			model_messages: { instructions_template: "fixture instructions" },
		});
	});

	it("requires OPENDESIGN_API_KEY before DeepSeek review, launch, or resume", () => {
		const review = fixture();
		rmSync(review.reviewRoot, { recursive: true });
		const reviewResult = review.invoke(undefined, {
			OPENDESIGN_API_KEY: "",
		});
		refused(review, reviewResult, "OPENDESIGN_API_KEY");
		expect(review.reviewCalls()).toEqual([]);

		const launch = fixture();
		const launchResult = launch.invokeRaw([launch.brief, "--run", launch.run], {
			OPENDESIGN_API_KEY: "",
		});
		refused(launch, launchResult, "OPENDESIGN_API_KEY");
		expect(existsSync(launch.run)).toBe(false);

		const resume = fixture();
		expect(resume.invokeRaw([resume.brief, "--run", resume.run]).status).toBe(
			0,
		);
		rmSync(resume.capture);
		const resumeResult = resume.invokeRaw(["resume", resume.run], {
			OPENDESIGN_API_KEY: "",
		});
		refused(resume, resumeResult, "OPENDESIGN_API_KEY");
	});
});
