import { serve } from "@hono/node-server";
import { createApp } from "../../apps/server/src/index";

const port = Number(process.env.PORT ?? "3100");
if (!Number.isInteger(port) || port < 1 || port > 65535) {
	throw new Error("Demo server PORT must be a valid TCP port");
}

const server = serve(
	{ fetch: createApp("development").fetch, hostname: "127.0.0.1", port },
	() => {
		console.log(`FITWAY_DEMO_SERVER_READY http://127.0.0.1:${port}`);
	},
);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
	process.once(signal, () => server.close(() => process.exit(0)));
}
