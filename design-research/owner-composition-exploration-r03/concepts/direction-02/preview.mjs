import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const mime = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".woff2": "font/woff2",
};
const server = createServer(async (request, response) => {
	const pathname = decodeURIComponent(
		new URL(request.url, "http://127.0.0.1").pathname,
	);
	const candidate = join(
		root,
		normalize(pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "")),
	);
	if (!candidate.startsWith(root)) {
		response.writeHead(403).end();
		return;
	}
	try {
		const bytes = await readFile(candidate);
		response.writeHead(200, {
			"Content-Type": mime[extname(candidate)] || "application/octet-stream",
			"Cache-Control": "no-store",
		});
		response.end(bytes);
	} catch {
		response.writeHead(404).end("Not found");
	}
});
server.listen(3112, "127.0.0.1", () =>
	console.log("Direction 02 preview: http://127.0.0.1:3112/"),
);
