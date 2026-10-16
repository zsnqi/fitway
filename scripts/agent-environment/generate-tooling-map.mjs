import process from "node:process";
import { pathToFileURL } from "node:url";
import {
	CHECK_COMMAND,
	checkToolingMap,
	MAP_RELATIVE_PATH,
	REGENERATE_COMMAND,
	writeToolingMap,
} from "./tooling-map-document.mjs";

function usage() {
	console.log(`Usage: pnpm map:tooling [--check]

Writes ${MAP_RELATIVE_PATH} from tracked JavaScript and TypeScript in the mapped tool paths.
Use --check to regenerate in memory and fail when the committed map differs.

Exit codes:
  0  map written or committed map is current
  1  invalid option, missing map, or drift`);
}

async function main(args = process.argv.slice(2)) {
	if (args.includes("--help") || args.includes("-h")) {
		usage();
		return;
	}
	if (args.length > 1 || (args.length === 1 && args[0] !== "--check"))
		throw new Error(`Unknown option: ${args.join(" ")}`);
	if (args[0] === "--check") {
		const result = await checkToolingMap();
		if (!result.ok) {
			console.error(
				`${CHECK_COMMAND}: FAIL: ${result.errors[0]} (run ${REGENERATE_COMMAND})`,
			);
			process.exitCode = 1;
			return;
		}
		console.log(
			`${CHECK_COMMAND} passed: ${result.generated.files.length} files, ${result.generated.callables.length} callables, ${result.generated.uncovered.length} without a covering test.`,
		);
		return;
	}
	await writeToolingMap();
}

const isMain =
	process.argv[1] !== undefined &&
	import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
	main().catch((error) => {
		const command = process.argv.includes("--check")
			? CHECK_COMMAND
			: REGENERATE_COMMAND;
		console.error(
			`${command}: FAIL: ${error.message} (run ${REGENERATE_COMMAND})`,
		);
		process.exitCode = 1;
	});
}
