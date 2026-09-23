import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../../..",
);
const types = {
	".html": "text/html; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".woff2": "font/woff2",
	".png": "image/png",
};
createServer(async (request, response) => {
	const url = new URL(request.url, "http://127.0.0.1");
	const file = path.resolve(root, `.${decodeURIComponent(url.pathname)}`);
	if (!file.startsWith(root + path.sep)) {
		response.writeHead(403).end();
		return;
	}
	try {
		const data = await readFile(file);
		response
			.writeHead(200, {
				"Content-Type": types[path.extname(file)] || "application/octet-stream",
				"Cache-Control": "no-store",
			})
			.end(data);
	} catch {
		response.writeHead(404).end("Not found");
	}
}).listen(3111, "127.0.0.1", () =>
	console.log("Owner Observatory concept on http://127.0.0.1:3111"),
);
