import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { ToolStartupError } from "../../../scripts/agent-environment/tool-contract.mjs";

export function colorsAxis(value = "normal") {
	const values = value.split(",");
	for (const color of values)
		if (!["normal", "forced"].includes(color))
			throw new ToolStartupError(
				`Unsupported colours axis ${color}; choose normal,forced`,
				"pass --colors normal, forced or normal,forced",
			);
	return values;
}

// Older context helpers silently ignore unknown options. Gate before launching
// a preview or writing evidence, rather than returning normal-colour results.
export async function requireForcedColors(tools) {
	let common;
	try {
		common = await import(
			pathToFileURL(resolve(tools, "scripts/web/_common.mjs"))
		);
	} catch {
		/* Missing or unusable installations also fail closed. */
	}
	const version = common?.TOOL_VERSION || "unknown";
	const match = /^(\d+)\.(\d+)\.(\d+)(?:$|\+)/.exec(version);
	const supported =
		match &&
		(Number(match[1]) > 1 || (Number(match[1]) === 1 && Number(match[2]) >= 2));
	if (!supported || !common?.CONTEXT_SPEC?.forcedColors)
		throw new Error(
			`Forced colours require ui-forensics >=1.2.0 with --forced-colors support; found ${version} at ${tools}. Use --forensics <1.2.0 copy>.`,
		);
}

export function measurementColors(options) {
	const args = [...options.extra];
	if (options.colors !== undefined) {
		const colors = colorsAxis(options.colors);
		if (colors.length !== 1)
			throw new ToolStartupError(
				"measure --colors takes one value: normal or forced",
				"pass measure --colors normal or --colors forced",
			);
		if (args.some((arg) => /^--forced-colors(?:=|$)/.test(arg)))
			throw new ToolStartupError(
				"Supply either measure --colors or tool --forced-colors, not both",
				"drop one: measure --colors or the tool's --forced-colors",
			);
		args.push("--forced-colors", colors[0] === "forced" ? "active" : "none");
	}
	const values = [];
	const inspect = (value) => {
		if (!value || typeof value !== "object") return;
		for (const [key, child] of Object.entries(value)) {
			if (key === "forcedColors") values.push(...[].concat(child));
			inspect(child);
		}
	};
	for (let i = 0; i < args.length; i++) {
		const [key, inline] = args[i].split(/=(.*)/s, 2);
		const value = inline ?? args[i + 1];
		if (key === "--forced-colors") values.push(value);
		if (key === "--each" && value) {
			const index = value.indexOf("=");
			const axis = value.slice(0, index).trim();
			if (["forcedColors", "forced-colors"].includes(axis))
				values.push(
					...value
						.slice(index + 1)
						.split(",")
						.map((v) => v.trim())
						.filter(Boolean),
				);
		}
		if (["--spec", "--frames"].includes(key))
			inspect(JSON.parse(readFileSync(value, "utf8").replace(/^\uFEFF/, "")));
	}
	for (const value of values)
		if (!["none", "active"].includes(value))
			throw new ToolStartupError(
				`--forced-colors is none or active (got ${value})`,
				"pass the tool --forced-colors none or active",
			);
	return {
		args,
		forced: values.includes("active"),
		colors: values.includes("active") ? "forced" : "normal",
	};
}
