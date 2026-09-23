import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";

const root = process.cwd();
const mime = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".woff2": "font/woff2",
	".png": "image/png",
};
createServer(async (req, res) => {
	try {
		const url = new URL(req.url, "http://127.0.0.1");
		const file = resolve(root, "." + decodeURIComponent(url.pathname));
		if (!file.startsWith(root + sep)) {
			res.writeHead(403).end();
			return;
		}
		const data = await readFile(file);
		res
			.writeHead(200, {
				"content-type": mime[extname(file)] ?? "application/octet-stream",
				"cache-control": "no-store",
			})
			.end(data);
	} catch {
		res.writeHead(404).end();
	}
}).listen(3113, "127.0.0.1", () =>
	console.log(
		"Direction 03 preview: http://127.0.0.1:3113/design-research/owner-composition-exploration-r03/concepts/direction-03/index.html",
	),
);
