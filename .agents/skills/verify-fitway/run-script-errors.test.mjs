import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { after, before, test } from "node:test";
import { fakeCli } from "./fake-cli.mjs";

let root;
let cli;
let runs = 0;
before(async () => {
	root = await mkdtemp(resolve(tmpdir(), "verify-fitway-run-errors-"));
	cli = await fakeCli(root);
});
after(async () => {
	await rm(root, { recursive: true, force: true });
});

async function runScript(source, extra = []) {
	const script = resolve(root, `script-${runs}.mjs`);
	await writeFile(script, source);
	const out = resolve(root, `out-${runs++}`);
	return cli.run([
		"run",
		"--script",
		script,
		"--concept",
		cli.concept,
		...extra,
		"--out",
		out,
	]);
}

test("a default export that is not a function is named for what it is", async () => {
	const result = await runScript("export default 42;");
	assert.equal(result.code, 1, result.stdout + result.stderr);
	assert.match(
		result.stderr,
		/FAIL: Script's default export is the number 42, not a function: /,
	);
	const missing = await runScript("export const notDefault = 1;");
	assert.equal(missing.code, 1);
	assert.match(missing.stderr, /FAIL: Script has no default export: /);
});

test("url() with an unknown side names the sides the run serves", async () => {
	const script = 'export default ({ url }) => url("concept", "index.html");';
	const alone = await runScript(script);
	assert.equal(alone.code, 1, alone.stdout + alone.stderr);
	assert.match(
		alone.stderr,
		/FAIL: url\(\) has no side concept; this run serves build\./,
	);
	const paired = await runScript(script, ["--baseline", cli.concept]);
	assert.equal(paired.code, 1, paired.stdout + paired.stderr);
	assert.match(
		paired.stderr,
		/FAIL: url\(\) has no side concept; this run serves build and baseline\./,
	);
});
