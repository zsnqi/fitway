// Serve a concept page for one ui-forensics measurement, then stop it.
import { resolve } from "node:path";
import { resolveConceptSide } from "./concept-source.mjs";
import { jsonOutput, outputFile, preview } from "./core.mjs";
import { measurePagePort, measurePageUrl } from "./measure-arguments.mjs";

async function runTool(options, tools, toolArguments, child) {
	if (options.tool === "diff") {
		await child(process.platform === "win32" ? "py" : "python3", [
			resolve(tools, "scripts/img/diff_map.py"),
			...toolArguments,
			"--out",
			resolve(options.out, "diff"),
			"--json",
			resolve(options.out, "diff.json"),
		]);
		return;
	}
	await child(process.execPath, [
		resolve(tools, `scripts/web/${options.tool}.mjs`),
		...toolArguments,
		"--out",
		options.tool === "sheet"
			? resolve(options.out, "sheet.png")
			: options.tool === "a11y" && toolArguments[0] === "diff"
				? resolve(options.out, "a11y-diff.json")
				: options.out,
	]);
}

export async function measureCommand(
	options,
	{ child, tools, preview: startPreview = preview } = {},
) {
	let source;
	let server;
	let servedUrl;
	let toolArguments = [...options.extra];
	try {
		if (options.page) {
			source = resolveConceptSide(options, "build");
			server = await startPreview({
				concept: source.concept,
				port: measurePagePort(options.port),
				cache: "no-store",
			});
			servedUrl = measurePageUrl(server.origin, options.page, options.query);
			toolArguments = [...toolArguments, "--url", servedUrl];
		}
		await outputFile(options.out, "tool-output");
		await runTool(options, tools, toolArguments, child);
		await jsonOutput(options.out, "measure-manifest.json", {
			tool: options.tool,
			arguments: toolArguments,
			feature: options.feature || "measurement",
			state: options.states || "default",
			language: options.languages || "see tool arguments",
			size: options.sizes || "see tool arguments",
			input: options.inputs || "see tool arguments",
			motion: options.motions || "see tool arguments",
			transport: options.transports || "see tool arguments",
			colors: options.colors,
			...(options.page ? { page: options.page, url: servedUrl } : {}),
		});
		return console.log(
			`MEASURE PASS: ${options.tool}; evidence ${options.out}`,
		);
	} finally {
		await server?.close();
		source?.cleanup();
	}
}
