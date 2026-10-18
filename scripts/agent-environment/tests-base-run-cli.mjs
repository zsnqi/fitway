import process from "node:process";
import { runBaseTests } from "./tests-base-run.mjs";
import {
	beginToolCommand,
	ToolStartupError,
	toolStartupLine,
} from "./tool-contract.mjs";

const parsed = beginToolCommand("tests:base-run", process.argv.slice(2));

try {
	process.exitCode = await runBaseTests({
		cwd: process.cwd(),
		base: parsed.options.base,
		result: parsed.options.result ?? "HEAD",
	});
} catch (error) {
	const line =
		error instanceof ToolStartupError
			? toolStartupLine("tests:base-run", error)
			: null;
	if (!line) throw error;
	process.stderr.write(`${line}\n`);
	process.exitCode = 1;
}
