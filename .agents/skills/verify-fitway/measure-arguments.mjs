// Refuse measurement arguments that bypass the launcher's output or preview.
import { readFileSync } from "node:fs";
import { ToolStartupError } from "../../../scripts/agent-environment/tool-contract.mjs";
import { verificationPairs } from "./core.mjs";

export function measurePagePort(value = 3176) {
	const port = Number(value);
	if (!verificationPairs.some((pair) => pair[0] === port))
		throw new ToolStartupError(
			`measure --page requires the first port of a verification pair: ${value}`,
			"pass measure --port 3176, 3186 or 3188",
		);
	return port;
}

export function measurePageUrl(origin, page, query) {
	if (
		/^[a-z][a-z0-9+.-]*:/i.test(page) ||
		page.startsWith("/") ||
		page.includes("..")
	)
		throw new ToolStartupError(
			`measure --page must be a page path inside the concept: ${page}`,
			"pass measure --page <page.html>",
		);
	const url = new URL(`${origin}/${page}`);
	url.search = query || "";
	return url.href;
}

export function readMeasureArgumentFile(path) {
	if (!path) return [];
	let value;
	try {
		value = JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
	} catch (error) {
		throw new ToolStartupError(
			`measure --args-file is not a JSON array of strings: ${path}; ${error.message}`,
			"pass --args-file a JSON array of strings",
		);
	}
	if (!Array.isArray(value) || value.some((item) => typeof item !== "string"))
		throw new ToolStartupError(
			`measure --args-file must contain a JSON array of strings: ${path}`,
			"pass --args-file a JSON array of strings",
		);
	return value;
}

export function refusePageUrlArgument(extra) {
	if (extra.some((argument) => argument.split("=")[0] === "--url"))
		throw new ToolStartupError(
			"measure --page supplies the tool --url; do not pass both",
			"drop the tool --url and let measure serve the --page",
		);
}

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
export function refuseServingSpecs(extra, servedUrl) {
	for (let index = 0; index < extra.length; index++) {
		const argument = extra[index];
		if (!["--spec", "--frames"].includes(argument.split("=")[0])) continue;
		const path = argument.includes("=")
			? argument.slice(argument.indexOf("=") + 1)
			: extra[index + 1];
		const spec = JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
		const inspect = (value, inTarget = false) => {
			if (!value || typeof value !== "object") return;
			for (const [key, childValue] of Object.entries(value)) {
				if (["serve", "refServe", "ref-serve"].includes(key) && childValue)
					throw new ToolStartupError(
						"Tool spec starts a server; use target.url from the maintained preview.",
						"remove serve/refServe from the spec and set target.url to the launched preview",
					);
				if (
					inTarget &&
					servedUrl &&
					key === "url" &&
					typeof childValue === "string" &&
					childValue !== servedUrl
				)
					throw new ToolStartupError(
						`Tool spec target URL is not the served page: ${childValue}`,
						`set target.url to ${servedUrl}`,
					);
				inspect(childValue, inTarget || key === "target");
			}
		};
		inspect(spec);
	}
}
