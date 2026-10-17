import process from "node:process";
import { pathToFileURL } from "node:url";
import { beginToolCommand } from "./tool-contract.mjs";
import {
	CHECK_COMMAND,
	checkToolingMap,
	REGENERATE_COMMAND,
	writeToolingMap,
} from "./tooling-map-document.mjs";

export function toolingMapOptions(parsed) {
	return {
		check:
			parsed.options.check === true || parsed.fixedArgs.includes("--check"),
	};
}

async function main(check) {
	if (check) {
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
	const { check } = toolingMapOptions(beginToolCommand(name, args));
	main(check).catch((error) => {
		const command = check ? CHECK_COMMAND : REGENERATE_COMMAND;
		console.error(
			`${command}: FAIL: ${error.message} (run ${REGENERATE_COMMAND})`,
		);
		process.exitCode = 1;
	});
}
