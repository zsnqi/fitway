import process from "node:process";
import { pathToFileURL } from "node:url";
import {
	CHECK_COMMAND,
	checkCodeHealth,
	formatCodeHealthChange,
} from "./code-health-baseline.mjs";
import { beginToolCommand } from "./tool-contract.mjs";

function main(options) {
	const result = checkCodeHealth();
	if (options.exceptions === true) {
		for (const exception of result.openExceptions)
			console.log(
				`${exception.file}:${exception.line} ${exception.measure} until=${exception.until} reason=${exception.reason}`,
			);
	}
	const failed =
		result.changes.length +
		result.inflation.length +
		result.invalidExceptions.length +
		result.expiredExceptions.length;
	if (failed) {
		for (const change of result.changes)
			console.log(formatCodeHealthChange(change));
		for (const change of result.inflation)
			console.log(
				`working baseline inflation: ${formatCodeHealthChange(change)}`,
			);
		for (const exception of result.invalidExceptions)
			console.log(
				`${exception.file}:${exception.line}: invalid code-health exception: ${exception.measure} until=${exception.until} reason=${exception.reason}; ${exception.detail}`,
			);
		for (const exception of result.expiredExceptions)
			console.log(
				`${exception.file}:${exception.line}: expired code-health exception: ${exception.measure} until=${exception.until} reason=${exception.reason}`,
			);
		process.exitCode = 1;
		return;
	}
	console.log("PASS: code health");
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(process.argv[1]).href
) {
	try {
		const parsed = beginToolCommand("check:code-health", process.argv.slice(2));
		main(parsed.options);
	} catch (error) {
		console.error(`${CHECK_COMMAND}: FAIL: ${error.message}`);
		process.exitCode = 1;
	}
}
