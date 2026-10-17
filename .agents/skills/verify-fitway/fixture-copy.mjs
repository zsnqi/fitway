import { copyFile, mkdir, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const skill = dirname(fileURLToPath(import.meta.url));
const repository = resolve(skill, "../../..");
const HELP_MODULES = [
	"cli.mjs",
	"colors.mjs",
	"core.mjs",
	"compare.mjs",
	"runner.mjs",
	"timeline.mjs",
	"drive.mjs",
	"probes.mjs",
	"map.mjs",
	"discover.mjs",
	"state-rules.mjs",
];

async function copyContract(folder) {
	const target = resolve(folder, "../../../scripts/agent-environment");
	await mkdir(target, { recursive: true });
	await Promise.all(
		["tool-contract.mjs", "tool-registry.mjs"].map((name) =>
			copyFile(
				resolve(repository, "scripts/agent-environment", name),
				resolve(target, name),
			),
		),
	);
}

export async function copyHelpFixture(folder) {
	await mkdir(folder, { recursive: true });
	await Promise.all(
		HELP_MODULES.map((name) =>
			copyFile(resolve(skill, name), resolve(folder, name)),
		),
	);
	await copyContract(folder);
}

export async function copyAllFixture(folder) {
	await mkdir(folder, { recursive: true });
	const modules = (await readdir(skill)).filter(
		(name) => name.endsWith(".mjs") && !name.endsWith(".test.mjs"),
	);
	await Promise.all(
		modules.map((name) =>
			copyFile(resolve(skill, name), resolve(folder, name)),
		),
	);
	await copyContract(folder);
}
