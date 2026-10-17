import process from "node:process";
import { pathToFileURL } from "node:url";
import { beginToolCommand } from "./tool-contract.mjs";
import {
	CHECK_COMMAND,
	checkToolingMap,
	REGENERATE_COMMAND,
	writeToolingMap,
} from "./tooling-map-document.mjs";

async function main(args = process.argv.slice(2)) {
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
	const args = process.argv.slice(2);
	const lifecycle = process.env.npm_lifecycle_event;
	const name =
		lifecycle === "check:tooling-map" ||
		(lifecycle !== "map:tooling" && args[0] === "--check")
			? "check:tooling-map"
			: "map:tooling";
	beginToolCommand(name, args);
	main(args).catch((error) => {
		const command = process.argv.includes("--check")
			? CHECK_COMMAND
			: REGENERATE_COMMAND;
		console.error(
			`${command}: FAIL: ${error.message} (run ${REGENERATE_COMMAND})`,
		);
		process.exitCode = 1;
	});
}
