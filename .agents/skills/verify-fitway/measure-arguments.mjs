// Refuse measurement arguments that bypass the launcher's output or preview.
import { readFileSync } from "node:fs";
import { ToolStartupError } from "../../../scripts/agent-environment/tool-contract.mjs";

// measure's checks of the arguments it passes on to the ui-forensics tool (everything after
// --): never this command's own options, which the shared contract has already read.

// The tool's own output and server options would bypass measure --out and the launched preview.
export function refuseOutputArguments(extra) {
	if (
		extra.some((arg) =>
			[
				"--out",
				"--serve",
				"--ref-serve",
				"--refServe",
				"--json",
				"--html",
			].includes(arg.split("=")[0]),
		)
	)
		throw new ToolStartupError(
			"Pass output only as measure --out; use the maintained launch URL, not --serve.",
			"drop the tool's --out, --serve, --ref-serve, --json and --html; measure --out names the output",
		);
}

// A --spec or --frames file that starts its own server would bypass the launched preview.
export function refuseServingSpecs(extra) {
	for (let index = 0; index < extra.length; index++) {
		const argument = extra[index];
		if (!["--spec", "--frames"].includes(argument.split("=")[0])) continue;
		const path = argument.includes("=")
			? argument.slice(argument.indexOf("=") + 1)
			: extra[index + 1];
		const spec = JSON.parse(readFileSync(path, "utf8"));
		const inspect = (value) => {
			if (!value || typeof value !== "object") return;
			for (const [key, childValue] of Object.entries(value)) {
				if (["serve", "refServe", "ref-serve"].includes(key) && childValue)
					throw new ToolStartupError(
						"Tool spec starts a server; use target.url from the maintained preview.",
						"remove serve/refServe from the spec and set target.url to the launched preview",
					);
				inspect(childValue);
			}
		};
		inspect(spec);
	}
}
