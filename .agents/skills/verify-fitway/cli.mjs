#!/usr/bin/env node
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
	closeSync,
	existsSync,
	openSync,
	readdirSync,
	readFileSync,
} from "node:fs";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { createConnection } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
	assertOutsideGit,
	canonical,
	freshOutput,
	jsonOutput,
	outputFile,
	ownedSession,
	portAvailable,
	preview,
} from "./core.mjs";
import { drive } from "./drive.mjs";
import { checkCommittedMaps, drift, generateMap, repository } from "./map.mjs";

const self = fileURLToPath(import.meta.url);
export const help = `verify-fitway: node <absolute-skill-folder>/cli.mjs <command> [options]
Commands:
  help
  map --concept <folder> [--out <evidence-folder>]
  drift --concept <folder> [--map <verification-map.json>]
  drift-tree [--root <repository>]
  launch --concept <folder> [--port 3176] [--out <evidence-folder>] [--lan]
  doctor --concept <folder> [--map <file>] [--session <launch-folder>] [--port 3176] [--tools diff]
  drive --concept <folder> [--map <file>] [--session <launch-folder>] [--out <evidence-folder>]
        [--page index.html|all] [--feature page|all] [--states default|all|switch=value,...]
        [--query key=value&key=value] [--languages ar,en] [--sizes desktop,tablet,phone]
        [--inputs mouse,touch] [--motions reduce,full] [--transports http,file] [--port 3176]
        [--cache no-store|none]
        [--probes daily]
  measure --tool focus|motion|a11y|probe|perf|capture|sheet|diff --out <folder> -- <tool arguments>
  cleanup --session <launch-folder>
Map defaults to <concept>/verification-map.json. map writes <out>/verification-map.json.
Output defaults to a fresh D:/fitway-temp/verify-fitway-*; git trees/links into them are refused.
Sizes: desktop=1440x900, boundary=1024x900, tablet=768x1024, phone=390x844,
       narrow=320x844, zoom=1440x900 at 200% (720x450 CSS px, phone frame).
States all sweeps one switch value at a time; --query explicitly requests combinations.
Open numeric/text domains have representative samples in the map; --query accepts other values.
Touch uses hasTouch/coarse pointer and real taps; full means no-preference.
measure calls the installed ui-forensics tool; its own --help describes further arguments.
Ports 3174,3178,3179 are other people's previews. Use 3176-3177 for verification.
--forensics <folder> overrides the machine-level ui-forensics location.
Git Bash: use Windows D:/ absolute paths and quote --query; no /api-style arguments cross shells.
`;

function parse(argv) {
	const command = argv.shift() || "help";
	const options = { extra: [] };
	while (argv.length) {
		const item = argv.shift();
		if (item === "--") {
			options.extra = argv;
			break;
		}
		if (!item.startsWith("--")) throw new Error(`Unexpected argument: ${item}`);
		const key = item.slice(2);
		if (key === "lan") options[key] = true;
		else {
			const value = argv.shift();
			if (!value || value.startsWith("--"))
				throw new Error(`${item} requires a value`);
			options[key] = value;
		}
	}
	return { command, options };
}

export function playwright(concept) {
	let enclosing = concept;
	while (!existsSync(resolve(enclosing, "package.json"))) {
		if (dirname(enclosing) === enclosing)
			throw new Error(
				"Concept has no enclosing package.json; use its build worktree.",
			);
		enclosing = dirname(enclosing);
	}
	const req = createRequire(resolve(enclosing, "package.json"));
	const pw = req("@playwright/test");
	return {
		pw,
		from: "@playwright/test",
		resolved: req.resolve("@playwright/test"),
		version: req("@playwright/test/package.json").version,
	};
}

export function forensicsPath(options) {
	return (
		options.forensics ||
		resolve(
			process.env.USERPROFILE || process.env.HOME,
			".agents/skills/ui-forensics",
		)
	);
}

export async function child(
	command,
	args,
	cwd = repository,
	signal = undefined,
) {
	await new Promise((done, reject) => {
		const nodeTool = command === process.execPath;
		const processChild = spawn(
			command,
			nodeTool ? [resolve(dirname(self), "worker.mjs"), ...args] : args,
			{
				cwd,
				env: {
					...process.env,
					TEMP: "D:/fitway-temp",
					TMP: "D:/fitway-temp",
					PYTHONDONTWRITEBYTECODE: "1",
				},
				stdio: nodeTool ? ["inherit", "inherit", "inherit", "ipc"] : "inherit",
				windowsHide: true,
			},
		);
		const cancel = () => {
			if (nodeTool && processChild.connected)
				processChild.send("cancel", () => {});
			else if (!nodeTool) processChild.kill();
		};
		process.once("SIGINT", cancel);
		process.once("SIGTERM", cancel);
		signal?.addEventListener("abort", cancel, { once: true });
		if (signal?.aborted) cancel();
		const detach = () => {
			process.removeListener("SIGINT", cancel);
			process.removeListener("SIGTERM", cancel);
			signal?.removeEventListener("abort", cancel);
		};
		processChild.once("error", (error) => {
			detach();
			reject(error);
		});
		processChild.once("close", (code, signal) => {
			detach();
			if (code === 0) done();
			else
				reject(
					new Error(
						`${command} failed (${signal || code}); owned tool cleanup completed`,
					),
				);
		});
	});
}

function mapFor(options, concept) {
	const path = options.map || resolve(concept, "verification-map.json");
	if (!existsSync(path))
		throw new Error(
			`Map missing: ${path}; run map --concept <folder> --out <evidence-folder>, then pass --map <output>/verification-map.json.`,
		);
	const map = JSON.parse(readFileSync(path, "utf8"));
	const problems = drift(map, concept);
	if (problems.length)
		throw new Error(`Stale map; regenerate/review:\n${problems.join("\n")}`);
	return { map, path };
}

export async function doctor(options) {
	const concept = canonical(options.concept);
	if (!existsSync(resolve(concept, "tools/probes/lib.mjs")))
		throw new Error(
			`Probe kit missing: ${concept}/tools/probes/lib.mjs; use the current Eclipse build (main does not have it).`,
		);
	const tools = forensicsPath(options);
	for (const file of [
		"SKILL.md",
		"scripts/web/lib.mjs",
		"scripts/web/probe.js",
	])
		if (!existsSync(resolve(tools, file)))
			throw new Error(
				`ui-forensics missing: ${tools}/${file}; install the user's ui-forensics skill (cloud sessions cannot drive this concept).`,
			);
	const loaded = playwright(concept);
	if (!existsSync(loaded.pw.chromium.executablePath()))
		throw new Error(
			"Playwright Chromium missing; run pnpm exec playwright install chromium in the repository.",
		);
	const { map, path } = mapFor(options, concept);
	if (options.tools?.split(",").includes("diff")) {
		try {
			await child(process.platform === "win32" ? "py" : "python3", [
				"-c",
				"import sys; assert sys.version_info >= (3,10); import numpy; import PIL",
			]);
		} catch {
			throw new Error(
				"Python 3.10+, numpy or Pillow missing; install Python and run python -m pip install numpy Pillow for diff only.",
			);
		}
	}
	if (options.session) {
		const session = await ownedSession(options.session);
		if (session.concept !== concept)
			throw new Error(
				"Session serves a different concept; launch the supplied concept.",
			);
	} else await portAvailable(Number(options.port || 3176));
	console.log(
		`DOCTOR PASS: Chromium, ui-forensics, probe kit, ${map.pages.length} pages, current map ${path}, port owned/free.`,
	);
	return { concept, map, tools, loaded };
}

async function launch(options) {
	const concept = canonical(options.concept);
	const port = Number(options.port || 3176);
	await portAvailable(port);
	const out = options.out || freshOutput();
	assertOutsideGit(out);
	const token = randomBytes(24).toString("hex");
	const log = openSync(await outputFile(out, "preview.log"), "a");
	const running = spawn(
		process.execPath,
		[
			self,
			"_serve",
			"--concept",
			concept,
			"--port",
			String(port),
			"--token",
			token,
			...(options.lan ? ["--lan"] : []),
		],
		{
			cwd: dirname(self),
			env: { ...process.env, TEMP: "D:/fitway-temp", TMP: "D:/fitway-temp" },
			detached: true,
			windowsHide: true,
			stdio: ["ignore", log, log],
		},
	);
	closeSync(log);
	let interrupted = false;
	const interrupt = () => {
		interrupted = true;
		running.kill();
	};
	process.once("SIGINT", interrupt);
	process.once("SIGTERM", interrupt);
	try {
		await new Promise((done, reject) => {
			const deadline = Date.now() + 10000;
			const attempt = async () => {
				if (interrupted)
					return reject(
						new Error("Launch interrupted; its owned preview was stopped."),
					);
				try {
					const response = await fetch(
						`http://127.0.0.1:${port}/__verify/identity`,
						{
							headers: { "x-verify-token": token },
							signal: AbortSignal.timeout(500),
						},
					);
					const identity = await response.json();
					if (identity.token === token && identity.pid === running.pid)
						return done();
				} catch {
					/* poll only this child's readiness */
				}
				if (Date.now() >= deadline || running.exitCode !== null)
					return reject(
						new Error(
							`Preview failed on port ${port}; read ${out}/preview.log`,
						),
					);
				setTimeout(attempt, 50);
			};
			running.once("error", reject);
			attempt();
		});
		await jsonOutput(out, "session.json", {
			concept,
			port,
			pid: running.pid,
			token,
		});
		if (interrupted)
			throw new Error("Launch interrupted; its owned preview was stopped.");
		running.unref();
		console.log(
			`LAUNCH PASS: http://${options.lan ? "0.0.0.0" : "127.0.0.1"}:${port}; no-store; session ${out}`,
		);
	} catch (error) {
		running.kill();
		throw error;
	} finally {
		process.removeListener("SIGINT", interrupt);
		process.removeListener("SIGTERM", interrupt);
	}
}

async function cleanup(folder) {
	const session = await ownedSession(folder);
	await fetch(`http://127.0.0.1:${session.port}/__verify/stop`, {
		method: "POST",
		headers: { "x-verify-token": session.token },
		signal: AbortSignal.timeout(1500),
	});
	await new Promise((done, reject) => {
		const deadline = Date.now() + 3000;
		const attempt = () => {
			const socket = createConnection(session.port, "127.0.0.1");
			socket.once("error", done);
			socket.once("connect", () => {
				socket.destroy();
				if (Date.now() > deadline)
					reject(new Error(`Port ${session.port} still listening`));
				else setTimeout(attempt, 50);
			});
		};
		attempt();
	});
	console.log(
		`CLEANUP PASS: owned port ${session.port} stopped; evidence retained at ${folder}`,
	);
}

async function main() {
	const { command, options } = parse(process.argv.slice(2));
	if (command === "help" || command === "--help") return console.log(help);
	if (command === "_serve") {
		const server = await preview({
			concept: options.concept,
			port: Number(options.port),
			lan: options.lan,
			token: options.token,
		});
		for (const signal of ["SIGINT", "SIGTERM"])
			process.once(signal, () => server.close());
		console.log(`READY ${server.origin} Cache-Control: no-store`);
		return;
	}
	if (command === "drift-tree")
		return console.log(
			`DRIFT PASS: ${checkCommittedMaps(options.root || repository)} maps found and checked.`,
		);
	if (command === "cleanup") return cleanup(options.session);
	if (command === "measure") {
		assertOutsideGit(options.out);
		if (existsSync(options.out) && readdirSync(options.out).length)
			throw new Error(
				"measure requires a fresh empty output folder; this prevents descendant links or old evidence from redirecting writes.",
			);
		const tools = forensicsPath(options);
		const tool = options.tool;
		if (
			![
				"focus",
				"motion",
				"a11y",
				"probe",
				"perf",
				"capture",
				"sheet",
				"diff",
			].includes(tool)
		)
			throw new Error("Unknown measure tool; see help.");
		if (
			options.extra.some((arg) =>
				[
					"--out",
					"--serve",
					"--ref-serve",
					"--refServe",
					"--json",
					"--html",
				].includes(arg.split("=")[0]),
			)
		)
			throw new Error(
				"Pass output only as measure --out; use the maintained launch URL, not --serve.",
			);
		await outputFile(options.out, "tool-output");
		for (let index = 0; index < options.extra.length; index++) {
			const argument = options.extra[index];
			if (!["--spec", "--frames"].includes(argument.split("=")[0])) continue;
			const path = argument.includes("=")
				? argument.slice(argument.indexOf("=") + 1)
				: options.extra[index + 1];
			const spec = JSON.parse(readFileSync(path, "utf8"));
			const inspect = (value) => {
				if (!value || typeof value !== "object") return;
				for (const [key, childValue] of Object.entries(value)) {
					if (["serve", "refServe", "ref-serve"].includes(key) && childValue)
						throw new Error(
							"Tool spec starts a server; use target.url from the maintained preview.",
						);
					inspect(childValue);
				}
			};
			inspect(spec);
		}
		if (tool === "diff") {
			await child(process.platform === "win32" ? "py" : "python3", [
				resolve(tools, "scripts/img/diff_map.py"),
				...options.extra,
				"--out",
				resolve(options.out, "diff"),
				"--json",
				resolve(options.out, "diff.json"),
			]);
		} else
			await child(process.execPath, [
				resolve(tools, `scripts/web/${tool}.mjs`),
				...options.extra,
				"--out",
				tool === "sheet"
					? resolve(options.out, "sheet.png")
					: tool === "a11y" && options.extra[0] === "diff"
						? resolve(options.out, "a11y-diff.json")
						: options.out,
			]);
		await jsonOutput(options.out, "measure-manifest.json", {
			tool,
			arguments: options.extra,
			feature: options.feature || "measurement",
			state: options.states || "default",
			language: options.languages || "see tool arguments",
			size: options.sizes || "see tool arguments",
			input: options.inputs || "see tool arguments",
			motion: options.motions || "see tool arguments",
			transport: options.transports || "see tool arguments",
		});
		return console.log(`MEASURE PASS: ${tool}; evidence ${options.out}`);
	}
	if (!options.concept)
		throw new Error(
			"--concept requires the absolute Eclipse folder (the build is read-only).",
		);
	if (command === "map") {
		const out = options.out || freshOutput();
		assertOutsideGit(out);
		const map = generateMap(canonical(options.concept));
		await jsonOutput(out, "verification-map.json", map);
		return console.log(
			`MAP PASS: ${map.pages.length} pages, ${map.pages.reduce((sum, page) => sum + page.features.length, 0)} feature recipes; ${out}/verification-map.json`,
		);
	}
	if (command === "drift") {
		const { map } = mapFor(options, canonical(options.concept));
		return console.log(
			`DRIFT PASS: ${map.pages.length} pages; switches, recipes, readiness and source fingerprints current.`,
		);
	}
	if (command === "launch") return launch(options);
	if (command === "doctor") return doctor(options);
	if (command === "drive") {
		const out = options.out || freshOutput();
		assertOutsideGit(out);
		const setup = await doctor(options);
		if (options.page === "all") {
			const combined = { schema: 1, concept: setup.concept, items: [] };
			let failed = false;
			for (const page of setup.map.pages) {
				const pageOut = resolve(out, page.page.replace(".html", ""));
				try {
					await drive({ ...options, ...setup, page: page.page, out: pageOut });
				} catch (error) {
					failed = true;
					console.error(`PAGE FAIL: ${page.page}: ${error.message}`);
				}
				if (existsSync(resolve(pageOut, "manifest.json"))) {
					const result = JSON.parse(
						await readFile(resolve(pageOut, "manifest.json"), "utf8"),
					);
					combined.items.push(
						...result.items.map((item) => ({ ...item, folder: pageOut })),
					);
				}
			}
			await jsonOutput(out, "manifest.json", combined);
			if (failed)
				throw new Error(
					`Page sweep had findings; evidence ${out}/manifest.json`,
				);
			return console.log(
				`DRIVE PASS: ${combined.items.length} items across all pages; evidence ${out}/manifest.json`,
			);
		}
		return drive({ ...options, ...setup, out });
	}
	throw new Error(`Unknown command: ${command}; run help.`);
}

if (process.argv[1] && resolve(process.argv[1]) === self)
	main().catch((error) => {
		console.error(`FAIL: ${error.message}`);
		process.exitCode = 1;
	});
