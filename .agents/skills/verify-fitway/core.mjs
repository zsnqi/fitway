import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, lstatSync, readlinkSync, realpathSync } from "node:fs";
import {
	mkdir,
	readdir,
	readFile,
	rm,
	rmdir,
	writeFile,
} from "node:fs/promises";
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import {
	dirname,
	extname,
	isAbsolute,
	relative,
	resolve,
	sep,
} from "node:path";
import { ToolStartupError } from "../../../scripts/agent-environment/tool-contract.mjs";

// A command already printed this failure's outcome block; callers still fail.
export class ReportedFailure extends Error {}

export const inside = (root, target) => {
	const rel = relative(root, target);
	return !isAbsolute(rel) && rel !== ".." && !rel.startsWith(`..${sep}`);
};

export const shortFinding = (value) => {
	const line = String(value).replace(/\s+/g, " ").trim();
	return line.length > 240 ? `${line.slice(0, 240)}… (see record)` : line;
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
				throw new ToolStartupError(
					`Refusing output inside git working tree: ${target}`,
					"pass --out a folder outside every Git working tree, such as one under D:/fitway-temp",
				);
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
	idleTimeoutMs = 30 * 60 * 1000,
	portLease,
}) {
	if (!Number.isInteger(port) || port < 0 || port > 65535)
		throw new Error(`Invalid port: ${port}`);
	if (
		!Number.isInteger(idleTimeoutMs) ||
		idleTimeoutMs < 1 ||
		idleTimeoutMs > 30 * 60 * 1000
	)
		throw new Error("Idle timeout must be 1-1800000 ms (at most 30 minutes).");
	const root = realpathSync(concept);
	if (port !== 0) await portAvailable(port, portLease);
	const sockets = new Set();
	let idleTimer;
	const touch = () => {
		clearTimeout(idleTimer);
		idleTimer = setTimeout(() => close(), idleTimeoutMs);
	};
	const server = createServer(async (req, res) => {
		touch();
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
		clearTimeout(idleTimer);
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
						? `Port ${port} busy; ${portPairMessage(port)}`
						: error.message,
				),
			),
		);
		server.listen(port, lan ? "0.0.0.0" : "127.0.0.1", done);
	});
	const assigned = server.address().port;
	if (port === 0 && assigned < 49152) {
		await close();
		throw new Error(
			`Kernel assigned port ${assigned} outside the isolated high-port range.`,
		);
	}
	port = assigned;
	touch();
	return {
		server,
		close,
		token,
		concept: root,
		port,
		origin: `http://127.0.0.1:${port}`,
	};
}

export async function portAvailable(port, lease) {
	await checkVerificationLease(port, lease);
	if (process.platform === "win32") {
		const owners = portOwners(port);
		if (owners.length)
			throw new Error(
				`Port ${port} held by a process this CLI did not start (${owners.map((o) => `${o.address} pid=${o.pid}`).join(", ")}); ${portPairMessage(port)}`,
			);
	}
	const listener = createServer();
	await new Promise((done, reject) => {
		listener.once("error", () =>
			reject(
				new Error(
					`Port ${port} held by a process this CLI did not start; ${portPairMessage(port)}`,
				),
			),
		);
		listener.listen({ port, host: "::", exclusive: true }, done);
	});
	await new Promise((done) => listener.close(done));
}

export function portOwners(port) {
	if (process.platform !== "win32") return [];
	return parsePortOwners(
		execFileSync("netstat", ["-ano"], {
			encoding: "utf8",
			windowsHide: true,
		}),
		port,
	);
}

export function parsePortOwners(output, port) {
	return output.split(/\r?\n/).flatMap((line) => {
		const m = /^\s*TCP\s+(\S+):(\d+)\s+\S+\s+LISTENING\s+(\d+)/.exec(line);
		return m && Number(m[2]) === port
			? [{ address: m[1].replace(/^\[|\]$/g, ""), pid: Number(m[3]) }]
			: [];
	});
}

export function defaultLanAddresses() {
	if (process.platform !== "win32") return [];
	const routes = execFileSync("route", ["PRINT", "-4"], {
		encoding: "utf8",
		windowsHide: true,
	});
	return routes
		.split(/\r?\n/)
		.flatMap((line) => {
			const match =
				/^\s*0\.0\.0\.0\s+0\.0\.0\.0\s+\S+\s+([\d.]+)\s+(\d+)\s*$/.exec(line);
			return match ? [{ address: match[1], metric: Number(match[2]) }] : [];
		})
		.sort((a, b) => a.metric - b.metric)
		.map((route) => route.address);
}

export function lanOrigins(
	port,
	interfaces = networkInterfaces(),
	preferred = [],
) {
	const addresses = [
		...new Set(
			Object.values(interfaces)
				.flat()
				.filter(
					(item) =>
						item &&
						!item.internal &&
						(item.family === "IPv4" || item.family === 4) &&
						item.address !== "0.0.0.0" &&
						!item.address.startsWith("169.254."),
				)
				.map((item) => item.address),
		),
	].sort();
	if (!addresses.length)
		throw new Error(
			"No external IPv4 LAN address; connect a network interface before launch --lan.",
		);
	const routed = preferred.find((address) => addresses.includes(address));
	return (routed ? [routed] : addresses).map(
		(address) => `http://${address}:${port}`,
	);
}

export const verificationPairs = [
	[3176, 3177],
	[3186, 3187],
	[3188, 3189],
];
export const verificationPairNames = () =>
	verificationPairs.map((pair) => pair.join("-")).join(", ");
const portPairMessage = (port) => {
	const pair = verificationPairs.find((pair) => pair.includes(Number(port)));
	return pair
		? `verification pair ${pair.join("-")} is busy; choose a free pair (never stop its owner).`
		: "use a free port.";
};
export function verificationPort(port) {
	if (!verificationPairs.flat().includes(Number(port)))
		throw new ToolStartupError(
			`Port ${port} is outside the verification allocation; choose 3176 or 3177, or a port in the pairs ${verificationPairNames()}. Ports 3174 and 3178-3185 belong to other previews.`,
			`choose 3176 or 3177, or a port in the pairs ${verificationPairNames()}; ports 3174 and 3178-3185 belong to other previews`,
			{ what: `port ${port} is outside the verification allocation` },
		);
	return Number(port);
}

export function comparisonPorts(options) {
	const ports = [
		verificationPort(options.port ?? 3176),
		verificationPort(options["baseline-port"] ?? 3177),
	];
	if (
		!verificationPairs.some(
			(pair) => pair[0] === ports[0] && pair[1] === ports[1],
		)
	)
		throw new Error(
			`compare requires one ordered verification pair: ${verificationPairNames()}; received ${ports.join("-")}.`,
		);
	return ports;
}

const leaseRoot = "D:/fitway-verify-captures";
const leaseFolder = (port) => resolve(leaseRoot, `.port-${port}-lease`);
export async function checkVerificationLease(port, lease) {
	if (!verificationPairs.flat().includes(Number(port))) return;
	const claims = await resourceOwners(leaseFolder(port));
	if (claims.some((claim) => claim.token === lease?.tokens?.[port])) return;
	if (claims.length)
		throw new Error(
			`Port ${port} held by another command; ${portPairMessage(port)}`,
		);
}

// Claim before capture startup, including file-only commands. No waiter
// can share a pair during the gap before the HTTP listeners have been created.
export async function reserveVerificationPorts(ports) {
	assertOutsideGit(leaseRoot);
	await mkdir(leaseRoot, { recursive: true });
	const lease = { tokens: {} };
	const owned = [];
	lease.release = async () => {
		for (const claim of owned) await claim.release();
	};
	try {
		for (const port of ports) {
			await checkVerificationLease(port);
			let claim;
			try {
				claim = await claimResource(leaseFolder(port), true, [
					leaseFolder(port),
				]);
			} catch (error) {
				if (error.code === "RESOURCE_BUSY")
					throw new Error(
						`Port ${port} held by another command; ${portPairMessage(port)}`,
					);
				throw error;
			}
			owned.push(claim);
			lease.tokens[port] = claim.token;
			await portAvailable(port, lease);
		}
		return lease;
	} catch (error) {
		await lease.release();
		throw error;
	}
}

// A bakery lock gives each claimant a never-reused directory. Reaping a dead
// generation cannot delete a successor's claim, even with simultaneous reapers.
async function resourceOwners(root) {
	const owners = [];
	for (const entry of await readdir(root, { withFileTypes: true }).catch(
		(error) => {
			if (error.code === "ENOENT") return [];
			throw error;
		},
	)) {
		const match = /^claim-(\d+)-([a-f0-9]{48})$/.exec(entry.name);
		if (!entry.isDirectory() || !match) continue;
		const pid = Number(match[1]);
		const folder = resolve(root, entry.name);
		try {
			process.kill(pid, 0);
		} catch (error) {
			if (error.code !== "ESRCH") throw error;
			await rm(folder, { recursive: true, force: true });
			continue;
		}
		const owner = await readFile(resolve(folder, "owner.json"), "utf8")
			.then(JSON.parse)
			.catch(() => null);
		owners.push({
			token: match[2],
			ticket:
				Number.isSafeInteger(owner?.ticket) && owner.ticket > 0
					? owner.ticket
					: null,
		});
	}
	return owners;
}

async function removeEmptyDirectory(path) {
	try {
		await rmdir(path);
	} catch (error) {
		if (!["ENOENT", "ENOTEMPTY", "EPERM"].includes(error.code)) throw error;
	}
}

export async function claimResource(root, tryOnly = false, emptyParents = []) {
	assertOutsideGit(root);
	await mkdir(root, { recursive: true });
	const token = randomBytes(24).toString("hex");
	const folder = resolve(root, `claim-${process.pid}-${token}`);
	await mkdir(folder);
	const release = async () => {
		await rm(folder, { recursive: true, force: true });
		for (const parent of emptyParents) await removeEmptyDirectory(parent);
	};
	try {
		const ownerFile = resolve(folder, "owner.json");
		await writeFile(ownerFile, JSON.stringify({ ticket: null }));
		const ticket =
			1 +
			Math.max(
				0,
				...(await resourceOwners(root)).map((owner) => owner.ticket || 0),
			);
		await writeFile(ownerFile, JSON.stringify({ ticket }));
		const deadline = Date.now() + 60000;
		for (;;) {
			const blocked = (await resourceOwners(root)).some(
				(owner) =>
					owner.token !== token &&
					(owner.ticket === null ||
						owner.ticket < ticket ||
						(owner.ticket === ticket && owner.token < token)),
			);
			if (!blocked) return { token, release };
			if (tryOnly)
				throw Object.assign(new Error(`Resource busy: ${root}`), {
					code: "RESOURCE_BUSY",
				});
			if (Date.now() >= deadline)
				throw new Error(`Resource publication lock timed out: ${root}`);
			await new Promise((done) => setTimeout(done, 50));
		}
	} catch (error) {
		await release();
		throw error;
	}
}

export async function ownedSession(folder) {
	const session = JSON.parse(
		await readFile(resolve(folder, "session.json"), "utf8"),
	);
	if (!Number.isInteger(session.port))
		throw new Error("Invalid session port; relaunch.");
	const refused = (cause) =>
		new Error(
			`Port ${session.port} is not owned by this session (not served by this session); refuse session.`,
			{ cause },
		);
	let response;
	try {
		response = await fetch(
			`http://127.0.0.1:${session.port}/__verify/identity`,
			{
				headers: { "x-verify-token": session.token },
				redirect: "error",
				signal: AbortSignal.timeout(1500),
			},
		);
	} catch (error) {
		try {
			await portAvailable(session.port);
		} catch {
			throw refused(error);
		}
		throw new Error(
			`Session preview on port ${session.port} has stopped or is unreachable; relaunch.`,
			{ cause: error },
		);
	}
	if (!response.ok) throw refused();
	let identity;
	try {
		identity = await response.json();
	} catch (error) {
		throw refused(error);
	}
	if (
		!identity ||
		identity.token !== session.token ||
		identity.concept !== session.concept ||
		identity.pid !== session.pid
	)
		throw refused();
	const foreign = portOwners(session.port).filter(
		(owner) => owner.pid !== session.pid,
	);
	if (foreign.length) {
		const pids = [...new Set(foreign.map((owner) => owner.pid))];
		throw new Error(
			`Port ${session.port} is served by this session but also held by foreign pid${pids.length === 1 ? "" : "s"} ${pids.join(", ")}; refuse session.`,
		);
	}
	return session;
}
