import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { fakeCli } from "./fake-cli.mjs";

test("run exposes readiness and shot through the command-owned page", async () => {
	const root = await mkdtemp(resolve(tmpdir(), "verify-fitway-run-api-"));
	try {
		const cli = await fakeCli(root);
		const script = resolve(root, "check.mjs");
		await writeFile(
			script,
			`export default async ({ newPage, url, ready, shot }) => {
  const { page } = await newPage({ size: "1280x720@2", language: "en", input: "mouse" });
  await page.goto(url("build", "index.html"));
  await ready(page);
  return shot(page, "interaction.png", { clip: ".card" });
};`,
		);
		const out = resolve(root, "out");
		const result = await cli.run([
			"run",
			"--script",
			script,
			"--concept",
			cli.concept,
			"--out",
			out,
		]);
		assert.equal(result.code, 0, result.stdout + result.stderr);
		assert.equal(existsSync(resolve(out, "interaction.png")), true);
		assert.deepEqual(
			JSON.parse(await readFile(resolve(out, "result.json"), "utf8")),
			{
				file: "interaction.png",
				pngWidth: 1440,
				pngHeight: 900,
				pixelHash: "frame-pixels",
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});
