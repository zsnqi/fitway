import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, lstatSync, readlinkSync, realpathSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import {
	dirname,
	extname,
	isAbsolute,
	relative,
	resolve,
	sep,
} from "node:path";

export const inside = (root, target) => {
	const rel = relative(root, target);
	return !isAbsolute(rel) && rel !== ".." && !rel.startsWith(`..${sep}`);
};

export function canonical(target, seen = new Set()) {
	if (!isAbsolute(target)) throw new Error(`Use an absolute path: ${target}`);
	let ancestor = resolve(target);
	let info;
	while (!info) {
		try {
			info = lstatSync(ancestor);
		} catch (error) {
			if (!["ENOENT", "ENOTDIR"].includes(error.code)) throw error;
			const parent = dirname(ancestor);
			if (parent === ancestor) throw error;
			ancestor = parent;
		}
	}
	if (info.isSymbolicLink()) {
		if (seen.has(ancestor)) throw new Error(`Link cycle: ${target}`);
		seen.add(ancestor);
		return resolve(
			canonical(resolve(dirname(ancestor), readlinkSync(ancestor)), seen),
			relative(ancestor, target),
		);
	}
	return resolve(realpathSync(ancestor), relative(ancestor, target));
}

export function assertOutsideGit(target) {
	const resolved = canonical(target);
	// Check lexical ancestors too: a link out of a worktree is still output in that tree.
	for (const start of [resolve(target), resolved]) {
		for (let dir = start; ; dir = dirname(dir)) {
			if (existsSync(resolve(dir, ".git")))
				throw new Error(`Refusing output inside git working tree: ${target}`);
			if (dir === dirname(dir)) break;
		}
	}
	return resolved;
}

export function freshOutput() {
	return resolve(
		"D:/fitway-temp",
		`verify-fitway-${Date.now()}-${randomBytes(4).toString("hex")}`,
	);
}

export async function outputFile(root, name) {
	assertOutsideGit(root);
	const target = resolve(root, name);
	if (!inside(canonical(root), canonical(target)) || target === root)
		throw new Error(`Output escapes evidence folder: ${name}`);
	assertOutsideGit(target);
	await mkdir(dirname(target), { recursive: true });
	assertOutsideGit(target);
	return target;
}

export async function jsonOutput(root, name, value) {
	await writeFile(
		await outputFile(root, name),
		`${JSON.stringify(value, null, 2)}\n`,
		"utf8",
	);
}

const types = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".mjs": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".json": "application/json",
	".woff2": "font/woff2",
	".woff": "font/woff",
	".png": "image/png",
	".svg": "image/svg+xml",
	".jpg": "image/jpeg",
	".txt": "text/plain; charset=utf-8",
};

export async function preview({
	concept,
	port,
	lan = false,
	token = randomBytes(24).toString("hex"),
	cache = "no-store",
}) {
	if (!Number.isInteger(port) || port < 1 || port > 65535)
		throw new Error(`Invalid port: ${port}`);
	const root = realpathSync(concept);
	await portAvailable(port);
	const sockets = new Set();
	const server = createServer(async (req, res) => {
		if (cache === "no-store") res.setHeader("Cache-Control", "no-store");
		const send = (code, body = "", type = "text/plain; charset=utf-8") => {
			res.writeHead(code, {
				"Content-Type": type,
				"Content-Length": Buffer.byteLength(body),
			});
			res.end(req.method === "HEAD" ? undefined : body);
		};
		try {
			const url = new URL(req.url, `http://127.0.0.1:${port}`);
			if (url.pathname.startsWith("/__verify/")) {
				if (req.headers["x-verify-token"] !== token) return send(403);
				if (url.pathname === "/__verify/identity" && req.method === "GET")
					return send(
						200,
						JSON.stringify({ token, concept: root, pid: process.pid }),
						"application/json",
					);
				if (url.pathname === "/__verify/stop" && req.method === "POST") {
					send(200, "STOPPED");
					setImmediate(() => close());
					return;
				}
				return send(404);
			}
			if (!["GET", "HEAD"].includes(req.method)) return send(405);
			const decoded = decodeURIComponent(url.pathname);
			if (
				decoded.includes("\\") ||
				decoded.includes("\0") ||
				decoded.split("/").some((part) => part === "..")
			)
				return send(403);
			const file = resolve(
				root,
				`.${decoded.endsWith("/") ? `${decoded}index.html` : decoded}`,
			);
			if (!inside(root, file) || !inside(root, realpathSync(file)))
				return send(403);
			const bytes = await readFile(file);
			return send(
				200,
				bytes,
				types[extname(file)] || "application/octet-stream",
			);
		} catch (error) {
			return send(
				["ENOENT", "ENOTDIR", "EISDIR"].includes(error.code) ? 404 : 400,
			);
		}
	});
	server.on("connection", (socket) => {
		sockets.add(socket);
		socket.once("close", () => sockets.delete(socket));
	});
	let closing;
	function close() {
		closing ??= new Promise((done) => {
			server.close(done);
			for (const socket of sockets) socket.destroy();
		});
		return closing;
	}
	await new Promise((done, reject) => {
		server.once("error", (error) =>
			reject(
				new Error(
					error.code === "EADDRINUSE"
						? `Port ${port} busy; choose another port (never stop its owner).`
						: error.message,
				),
			),
		);
		server.listen(port, lan ? "0.0.0.0" : "127.0.0.1", done);
	});
	return {
		server,
		close,
		token,
		concept: root,
		port,
		origin: `http://127.0.0.1:${port}`,
	};
}

export async function portAvailable(port) {
	if (process.platform === "win32") {
		const owners = portOwners(port);
		if (owners.length)
			throw new Error(
				`Port ${port} held by a process this CLI did not start (${owners.map((o) => `${o.address} pid=${o.pid}`).join(", ")}); use a free port.`,
			);
	}
	const listener = createServer();
	await new Promise((done, reject) => {
		listener.once("error", () =>
			reject(
				new Error(
					`Port ${port} held by a process this CLI did not start; use a free port.`,
				),
			),
		);
		listener.listen({ port, host: "::", exclusive: true }, done);
	});
	await new Promise((done) => listener.close(done));
}

export function portOwners(port) {
	if (process.platform !== "win32") return [];
	return execFileSync("netstat", ["-ano", "-p", "tcp"], {
		encoding: "utf8",
		windowsHide: true,
	})
		.split(/\r?\n/)
		.flatMap((line) => {
			const m = /^\s*TCP\s+(\S+):(\d+)\s+\S+\s+LISTENING\s+(\d+)/.exec(line);
			return m && Number(m[2]) === port
				? [{ address: m[1], pid: Number(m[3]) }]
				: [];
		});
}

export function verificationPort(port) {
	if (![3176, 3177].includes(Number(port)))
		throw new Error(
			`Port ${port} is outside the verification allocation; choose 3176 or 3177. Ports 3174 and 3178-3185 belong to other previews.`,
		);
	return Number(port);
}

export async function ownedSession(folder) {
	const session = JSON.parse(
		await readFile(resolve(folder, "session.json"), "utf8"),
	);
	if (!Number.isInteger(session.port))
		throw new Error("Invalid session port; relaunch.");
	const response = await fetch(
		`http://127.0.0.1:${session.port}/__verify/identity`,
		{
			headers: { "x-verify-token": session.token },
			signal: AbortSignal.timeout(1500),
		},
	);
	if (!response.ok)
		throw new Error(
			`Port ${session.port} is not owned by this session; refuse cleanup.`,
		);
	const identity = await response.json();
	if (
		identity.token !== session.token ||
		identity.concept !== session.concept ||
		identity.pid !== session.pid
	)
		throw new Error("Session identity mismatch; refuse cleanup.");
	const foreign = portOwners(session.port).filter(
		(owner) => owner.pid !== session.pid,
	);
	if (foreign.length)
		throw new Error(
			`Port ${session.port} also held by foreign pid ${foreign.map((o) => o.pid)}; refuse this session.`,
		);
	return session;
}
