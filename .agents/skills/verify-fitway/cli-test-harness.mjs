// Share the unit concept scratch folder and the CLI process runners across the cli tests.
import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { writeConcept } from "./concept-fixture.mjs";

export let scratch;
export let concept;
export let recipes;
export const heldSessions = [];
export async function createUnitConcept() {
	scratch = await mkdtemp(resolve(tmpdir(), "verify-fitway-unit-"));
	concept = resolve(scratch, "concept");
	recipes = resolve(concept, "verification-recipes.json");
	await writeConcept(concept);
}
export async function removeUnitConcept() {
	for (const session of heldSessions.splice(0))
		runCli(["cleanup", "--session", session]);
	if (scratch) await rm(scratch, { recursive: true, force: true });
}

export const cliPath = fileURLToPath(new URL("./cli.mjs", import.meta.url));
export const portObserverPath = fileURLToPath(
	new URL("./port-observer.cjs", import.meta.url),
);
export function runCli(args, cli = cliPath, env = {}) {
	return spawnSync(process.execPath, [cli, ...args], {
		encoding: "utf8",
		windowsHide: true,
		env: {
			...process.env,
			VERIFY_FITWAY_TEST_DOCTOR_PORT_PROBE: "0",
			...env,
		},
	});
}

export function runCliAsync(args) {
	return new Promise((done, reject) => {
		const child = spawn(process.execPath, [cliPath, ...args], {
			windowsHide: true,
			stdio: ["ignore", "pipe", "pipe"],
			env: {
				...process.env,
				VERIFY_FITWAY_TEST_DOCTOR_PORT_PROBE: "0",
			},
		});
		let stdout = "";
		let stderr = "";
		child.stdout.on("data", (bytes) => {
			stdout += bytes;
		});
		child.stderr.on("data", (bytes) => {
			stderr += bytes;
		});
		child.once("error", reject);
		child.once("close", (status) => done({ status, stdout, stderr }));
	});
}
