// Serve one concept independently of launch, using the same preview and LAN origins.
import { ToolStartupError } from "../../../scripts/agent-environment/tool-contract.mjs";
import { resolveConceptSide } from "./concept-source.mjs";
import { defaultLanAddresses, lanOrigins, preview } from "./core.mjs";

function servePort(value) {
	const port = Number(value);
	if (!Number.isInteger(port) || port < 1024 || port > 65535)
		throw new ToolStartupError(
			`serve --port must be a whole number from 1024 to 65535: ${value}`,
			"pass serve --port <1024-65535>",
		);
	return port;
}

export async function serveCommand(
	options,
	{ preview: startPreview = preview, lanAddresses = defaultLanAddresses } = {},
) {
	const source = resolveConceptSide(options, "build");
	const port = servePort(options.port);
	let server;
	const stop = () => {
		server?.close().catch(() => undefined);
	};
	process.once("SIGINT", stop);
	process.once("SIGTERM", stop);
	try {
		server = await startPreview({
			concept: source.concept,
			port,
			lan: Boolean(options.lan),
			idleTimeoutMs:
				options["idle-timeout-ms"] === undefined
					? null
					: Number(options["idle-timeout-ms"]),
		});
		console.log(`READY ${server.origin} Cache-Control: no-store`);
		if (options.lan)
			for (const origin of lanOrigins(server.port, undefined, lanAddresses()))
				console.log(`LAN ${origin}`);
		await new Promise((done) => server.server.once("close", done));
	} finally {
		process.removeListener("SIGINT", stop);
		process.removeListener("SIGTERM", stop);
		await server?.close();
		source.cleanup();
	}
}
