// Serve one concept independently of launch, using the same preview and LAN origins.
import { networkInterfaces } from "node:os";
import { resolveConceptSide } from "./concept-source.mjs";
import { defaultLanAddresses, lanOrigins, preview } from "./core.mjs";

export async function serveCommand(
	options,
	{
		preview: startPreview = preview,
		lanAddresses = defaultLanAddresses,
		interfaces = networkInterfaces,
	} = {},
) {
	const source = resolveConceptSide(options, "build");
	// The registry's serve --port descriptor refuses a port outside 1024-65535.
	const port = Number(options.port);
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
			for (const origin of lanOrigins(
				server.port,
				interfaces(),
				lanAddresses(),
			))
				console.log(`LAN ${origin}`);
		await new Promise((done) => server.server.once("close", done));
	} finally {
		process.removeListener("SIGINT", stop);
		process.removeListener("SIGTERM", stop);
		await server?.close();
		source.cleanup();
	}
}
