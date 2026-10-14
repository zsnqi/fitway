import { Agent, request } from "node:http";
import { preview } from "./core.mjs";

// Contexts stay fresh. Only command-owned browser processes and upstream HTTP
// connections are shared; Chromium never needs an ephemeral socket per asset.
export function compareRuntime() {
	const browsers = new Map();
	const previews = new Map();
	const agents = new Map();
	let closed = false;
	let requests = 0;
	let connections = 0;
	let peak = 0;
	let active = 0;
	let closing;
	const close = () => {
		if (closing) return closing;
		closed = true;
		closing = (async () => {
			for (const agent of agents.values()) agent.destroy();
			await Promise.allSettled([
				...[...browsers.values()].map(async (browser) =>
					(await browser).close(),
				),
				...[...previews.values()].map((server) => server.close()),
			]);
			process.removeListener("SIGINT", abort);
			process.removeListener("SIGTERM", abort);
		})();
		return closing;
	};
	const abort = () => {
		void close();
	};
	process.once("SIGINT", abort);
	process.once("SIGTERM", abort);
	return {
		async browser(ui, loaded) {
			if (closed) throw new Error("Compare interrupted");
			const key = loaded.resolved;
			if (!browsers.has(key))
				browsers.set(
					key,
					ui.launchChromium(loaded, {
						args: ["--disable-partial-raster"],
					}),
				);
			return browsers.get(key);
		},
		async origin(concept, port, cache) {
			if (closed) throw new Error("Compare interrupted");
			let server = previews.get(port);
			if (server && server.concept !== concept) {
				agents.get(server.origin)?.destroy();
				agents.delete(server.origin);
				await server.close();
				previews.delete(port);
				server = null;
			}
			if (!server) {
				server = await preview({ concept, port, cache });
				if (closed) {
					await server.close();
					throw new Error("Compare interrupted during preview creation");
				}
				previews.set(port, server);
			}
			return server.origin;
		},
		async route(context, origin) {
			if (closed) throw new Error("Compare interrupted");
			let agent = agents.get(origin);
			if (!agent) {
				agent = new Agent({
					keepAlive: true,
					maxSockets: 6,
					maxFreeSockets: 6,
				});
				const create = agent.createConnection.bind(agent);
				agent.createConnection = (...args) => {
					const socket = create(...args);
					connections++;
					active++;
					peak = Math.max(peak, active);
					socket.once("close", () => active--);
					return socket;
				};
				agents.set(origin, agent);
			}
			await context.route(`${origin}/**`, async (route) => {
				requests++;
				try {
					const incoming = route.request();
					const response = await new Promise((done, reject) => {
						const upstream = request(
							incoming.url(),
							{
								agent,
								method: incoming.method(),
								headers: incoming.headers(),
							},
							(res) => {
								const chunks = [];
								res.on("data", (chunk) => chunks.push(chunk));
								res.once("error", reject);
								res.once("end", () =>
									done({
										status: res.statusCode,
										headers: Object.fromEntries(
											Object.entries(res.headers)
												.filter(
													([name]) =>
														![
															"connection",
															"keep-alive",
															"transfer-encoding",
														].includes(name),
												)
												.map(([name, value]) => [
													name,
													Array.isArray(value) ? value.join(", ") : value,
												]),
										),
										body: Buffer.concat(chunks),
									}),
								);
							},
						);
						upstream.setTimeout(10000, () =>
							upstream.destroy(new Error("Preview request timed out")),
						);
						upstream.once("error", reject);
						upstream.end(incoming.postDataBuffer());
					});
					await route.fulfill(response);
				} catch {
					await route.abort("failed").catch(() => {});
				}
			});
		},
		close,
		counts: () => ({ requests, connections, peak }),
	};
}
