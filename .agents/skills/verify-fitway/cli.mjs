#!/usr/bin/env node
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
	closeSync,
	existsSync,
	openSync,
	readdirSync,
	readFileSync,
	statSync,
} from "node:fs";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compare } from "./compare.mjs";
import {
	assertOutsideGit,
	canonical,
	defaultLanAddresses,
	freshOutput,
	jsonOutput,
	lanOrigins,
	outputFile,
	ownedSession,
	portAvailable,
	preview,
	ReportedFailure,
	verificationPort,
} from "./core.mjs";
import { requireDependency } from "./discover.mjs";
import {
	checkCommittedMaps,
	coverageProblems,
	drift,
	generateMap,
	repairRecipes,
	repository,
} from "./map.mjs";
import { drive } from "./runner.mjs";

const self = fileURLToPath(import.meta.url);
export const help = `verify-fitway: node <absolute-skill-folder>/cli.mjs <command> [options]
Commands:
  help
  map --concept <folder> [--recipes <file>] [--out <evidence-folder>]
  repair-recipes --concept <folder> [--recipes <stale-file>] --out <evidence-folder>
  list --concept <folder> [--recipes <file>] [--map <file>] [--page <page>|all]
  drift --concept <folder> [--recipes <file>] [--map <verification-map.json>]
  drift-tree [--root <repository>]
  launch --concept <folder> [--port 3176] [--out <evidence-folder>] [--lan]
         [--isolated-port <49152-65535>] [--idle-timeout-ms <1-1800000>]
  doctor --concept <folder> [--recipes <file>] [--map <file>] [--session <launch-folder>] [--port 3176] [--tools diff]
  drive --concept <folder> [--recipes <file>] [--map <file>] [--session <launch-folder>] [--out <evidence-folder>]
        [--page index.html|all] [--feature page|all] [--states default|all|switch=value,...]
        [--query key=value&key=value] [--languages ar,en] [--sizes desktop,tablet,phone]
        [--inputs mouse,touch,keyboard] [--motions reduce,full] [--transports http,file] [--port 3176]
        [--cache no-store|none]
        [--probes daily]
  compare --concept <build-folder> --baseline <baseline-folder> [--recipes <file>]
          [--baseline-recipes <file>] [--baseline-map <file>] [--baseline-port 3177]
          [all drive page/feature/state/axis options] [--out <evidence-folder>]
  measure --tool focus|motion|a11y|probe|perf|capture|sheet|diff --out <folder> -- <tool arguments>
  cleanup --session <launch-folder|session.json>
Recipes default to <concept>/verification-recipes.json; --recipes supplies an external file.
repair-recipes drops vanished selectors/markers and writes draft entries outside the concept.
Every use rediscovers source facts; --map is an optional prior map for drift provenance.
map writes <out>/verification-map.json; generated maps are evidence, never committed.
Output defaults to a fresh D:/fitway-temp/verify-fitway-*; git trees/links into them are refused.
Sizes: desktop=1440x900, boundary=1024x900, tablet=768x1024, phone=390x844,
       narrow=320x844, zoom=1440x900 at 200% (720x450 CSS px, phone frame).
--page and --feature select one path; the remaining axes multiply its frames.
States all sweeps every discovered switch value/sample; dependencies are applied or refused.
Use --states 'state=live,state=loading,...' for only the page's data states.
list prints features, states, switches, dependencies, reach and observable proof.
PASS requires state and feature proof. NOT-REACHABLE is a distinct result; PROBLEM names a measuring error.
Items have a short *-summary.json beside the full record; filenames include feature and state.
compare repeats differing items in fresh contexts, with exact pixel regions and diff images.
Known limits: CSS-only openings and some dynamic/delegated opener relationships are not exhaustively discovered.
Doctor can block when a missing standalone input has no authoritative recovery source.
Open numeric/text domains have representative samples in the map; --query accepts other values.
Touch uses hasTouch/coarse pointer and real taps; full means no-preference.
Keyboard uses Tab and key presses only; full evidence records focus at every key.
Unreached keyboard targets fail with the element where focus stopped; keyboardActions can supply roving keys.
measure calls the installed ui-forensics tool; its own --help describes further arguments.
--port accepts only 3176-3177. Ports 3174 and 3178-3185 belong to other previews.
launch --isolated-port selects a separate high port (49152-65535) for isolated tests.
--port stays restricted to 3176-3177 even with --isolated-port; busy ports are always refused.
Previews stop after 30 minutes without a request; requests renew the timeout.
launch --idle-timeout-ms can shorten that bound for tests, never extend it.
--forensics <folder> overrides the machine-level ui-forensics location.
Git Bash: use Windows D:/ absolute paths and quote --query; no /api-style arguments cross shells.
help and preview lifecycle need only Node. For discovery/drive/compare/doctor, install checkout dependencies:
  pnpm --dir '${repository.replaceAll("'", "''")}' install --frozen-lockfile
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

export function playwright(_concept) {
	// Tools belong to this checkout. Inputs may be an archive or a plain folder.
	const req = createRequire(resolve(repository, "package.json"));
	const pw = requireDependency("@playwright/test");
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
	quiet = false,
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
				stdio: nodeTool
					? [
							"inherit",
							quiet ? "ignore" : "inherit",
							quiet ? "pipe" : "inherit",
							"ipc",
						]
					: [
							"inherit",
							quiet ? "ignore" : "inherit",
							quiet ? "pipe" : "inherit",
						],
				windowsHide: true,
			},
		);
		let diagnostic = "";
		processChild.stderr?.on("data", (bytes) => {
			diagnostic = (diagnostic + bytes).slice(-8000);
		});
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
						`${command} failed (${signal || code}); owned tool cleanup completed${diagnostic ? `; ${diagnostic.trim()}` : ""}`,
					),
				);
		});
	});
}

function mapFor(options, concept) {
	const path = options.map || resolve(concept, "verification-map.json");
	const saved = existsSync(path)
		? JSON.parse(readFileSync(path, "utf8"))
		: undefined;
	if (saved && saved.schema !== 2)
		throw new Error(
			`Stale map schema: ${path}; regenerate this map from the current source and recipes.`,
		);
	const recipes =
		options.recipes ||
		(existsSync(resolve(concept, "verification-recipes.json"))
			? resolve(concept, "verification-recipes.json")
			: saved?.recipePath);
	const map = generateMap(concept, recipes);
	const problems = saved
		? drift(saved, concept, recipes)
		: coverageProblems(map, concept);
	if (problems.length) throw new Error(`Recipe drift:\n${problems.join("\n")}`);
	return {
		map,
		path: saved ? path : `fresh source discovery; recipes ${map.recipePath}`,
	};
}

async function doctorChecks(options) {
	verificationPort(options.port || 3176);
	const concept = canonical(options.concept);
	if (options.session) {
		const session = await ownedSession(options.session);
		if (session.concept !== concept)
			throw new Error(
				"Session serves a different concept; launch the supplied concept.",
			);
	}
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
	if (!options.session) await portAvailable(Number(options.port || 3176));
	if (!options.quiet)
		console.log(
			`DOCTOR PASS: Chromium, ui-forensics, probe kit, ${map.pages.length} pages, current map ${path}, port owned/free.`,
		);
	return { concept, map, tools, loaded };
}

export function doctorFix(options, error) {
	if (error.fix) return error.fix;
	const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
	const concept = options.concept;
	const args = `--concept ${quote(concept)}${options.recipes ? ` --recipes ${quote(options.recipes)}` : ""}`;
	const command = `node ${quote(self)}`;
	if (/Stale map schema/.test(error.message)) {
		const out = freshOutput();
		return `${command} map ${args} --out ${quote(out)}; ${command} doctor ${args} --map ${quote(resolve(out, "verification-map.json"))}`;
	}
	if (/Recipes missing|Recipe drift/.test(error.message))
		return `${command} repair-recipes ${args} --out ${quote(freshOutput())}`;
	if (/Invalid recipes|No observable/.test(error.message))
		return "BLOCKED: repair the recipe schema or author the missing observable proof, then rerun doctor; automatic repair cannot supply that knowledge.";
	if (/Chromium missing/.test(error.message))
		return `node ${quote(resolve(repository, "node_modules/@playwright/test/cli.js"))} install chromium`;
	if (/ui-forensics missing/.test(error.message))
		return `${command} doctor ${args} --forensics ${quote(forensicsPath({}))}`;
	if (/Probe kit missing/.test(error.message)) {
		for (let folder = resolve(concept); ; folder = dirname(folder)) {
			if (existsSync(resolve(folder, ".git")))
				return `git -C ${quote(concept)} restore -- tools/probes/lib.mjs tools/probes/geom.mjs tools/probes/a11y.mjs`;
			if (folder === dirname(folder)) break;
		}
		return "BLOCKED: restore the missing probe kit from an authoritative concept revision; this standalone folder has no git recovery source.";
	}
	if (/Python/.test(error.message)) return "py -m pip install numpy Pillow";
	if (/port|Port|Session/.test(error.message))
		return `${command} launch --concept ${quote(concept)} --port ${Number(options.port || 3176) === 3176 ? 3177 : 3176} --out ${quote(freshOutput())}`;
	if (/Cannot find module/.test(error.message))
		return `pnpm --dir ${quote(repository)} install --frozen-lockfile`;
	return `${command} doctor ${args}`;
}

export async function doctor(options) {
	try {
		return await doctorChecks(options);
	} catch (error) {
		const fix = doctorFix(options, error);
		console.error(
			`DOCTOR FAIL: ${error.message}\nFIX${fix.startsWith("BLOCKED:") ? " " : ": "}${fix}`,
		);
		throw new ReportedFailure(error.message, { cause: error });
	}
}

async function launch(options) {
	const concept = canonical(options.concept);
	let port = verificationPort(options.port || 3176);
	if (options["isolated-port"] !== undefined) {
		port = Number(options["isolated-port"]);
		if (!Number.isInteger(port) || port < 49152 || port > 65535)
			throw new Error("--isolated-port requires a port in 49152-65535.");
	}
	if (options["idle-timeout-ms"] !== undefined) {
		const idle = Number(options["idle-timeout-ms"]);
		if (!Number.isInteger(idle) || idle < 1 || idle > 1800000)
			throw new Error(
				"Idle timeout must be 1-1800000 ms (at most 30 minutes).",
			);
	}
	const out = options.out || freshOutput();
	assertOutsideGit(out);
	if (existsSync(resolve(out, "session.json")))
		throw new Error(
			`Launch folder already has a session; cleanup --session '${out}' and use a fresh folder.`,
		);
	await outputFile(out, "session.json");
	await portAvailable(port);
	const origins = options.lan
		? lanOrigins(port, undefined, defaultLanAddresses())
		: [`http://127.0.0.1:${port}`];
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
			...(options["idle-timeout-ms"]
				? ["--idle-timeout-ms", options["idle-timeout-ms"]]
				: []),
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
		console.log(`LAUNCH PASS: ${origins.join(", ")}; no-store; session ${out}`);
	} catch (error) {
		running.kill();
		throw error;
	} finally {
		process.removeListener("SIGINT", interrupt);
		process.removeListener("SIGTERM", interrupt);
	}
}

async function cleanup(path) {
	let folder = path;
	if (!folder || !existsSync(folder))
		throw new Error(
			`Cleanup session path does not exist: ${folder}; give the existing launch folder or session.json.`,
		);
	if (statSync(folder).isFile()) {
		if (resolve(folder) !== resolve(dirname(folder), "session.json"))
			throw new Error(`Give the launch folder: ${dirname(folder)}`);
		folder = dirname(folder);
	}
	if (!existsSync(resolve(folder, "session.json")))
		return console.log(
			`CLEANUP PASS: no owned preview started; evidence retained at ${folder}`,
		);
	const record = JSON.parse(
		readFileSync(resolve(folder, "session.json"), "utf8"),
	);
	if (!Number.isInteger(record.port) || record.port < 1 || record.port > 65535)
		throw new Error(
			`Invalid session port in ${folder}/session.json; relaunch.`,
		);
	// A free port proves a detached preview has stopped, including idle expiry.
	let free = false;
	try {
		await portAvailable(record.port);
		free = true;
	} catch {
		// A busy port must authenticate before we can stop anything.
	}
	if (free) {
		await jsonOutput(folder, "session.json", { ...record, stopped: true });
		return console.log(
			`CLEANUP PASS: owned port ${record.port} already stopped; evidence retained at ${folder}`,
		);
	}
	const session = await ownedSession(folder);
	const response = await fetch(
		`http://127.0.0.1:${session.port}/__verify/stop`,
		{
			method: "POST",
			headers: { "x-verify-token": session.token },
			signal: AbortSignal.timeout(1500),
		},
	);
	if (!response.ok)
		throw new Error(`Preview refused stop on port ${session.port}.`);
	await new Promise((done, reject) => {
		const deadline = Date.now() + 3000;
		const attempt = async () => {
			try {
				await portAvailable(session.port);
				done();
			} catch {
				if (Date.now() > deadline)
					reject(new Error(`Port ${session.port} still listening`));
				else setTimeout(attempt, 50);
			}
		};
		attempt();
	});
	console.log(
		`CLEANUP PASS: owned port ${session.port} stopped; evidence retained at ${folder}`,
	);
	await jsonOutput(folder, "session.json", { ...session, stopped: true });
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
			idleTimeoutMs:
				options["idle-timeout-ms"] === undefined
					? undefined
					: Number(options["idle-timeout-ms"]),
		});
		for (const signal of ["SIGINT", "SIGTERM"])
			process.once(signal, () => server.close());
		console.log(`READY ${server.origin} Cache-Control: no-store`);
		return;
	}
	if (command === "drift-tree") {
		const count = checkCommittedMaps(options.root || repository);
		return console.log(
			count
				? `DRIFT PASS: ${count} recipe files found and checked.`
				: "DRIFT SKIP: no recipe file was found; nothing checked. Provide verification-recipes.json beside the concept, or use drift --concept <folder> --recipes <absolute recipe file>.",
		);
	}
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
	if (command === "repair-recipes") {
		const out = options.out || freshOutput();
		assertOutsideGit(out);
		const concept = canonical(options.concept);
		const repaired = repairRecipes(concept, options.recipes);
		await jsonOutput(out, "verification-recipes.json", repaired.recipes);
		await jsonOutput(out, "recipe-repair.json", repaired);
		console.log(
			`REPAIR PASS: ${repaired.dropped.length} stale findings dropped; ${repaired.drafts.length} draft entries added; ${out}/verification-recipes.json`,
		);
		console.log(
			`NEXT: complete draft reach/proof, then node '${self.replaceAll("'", "''")}' drift --concept '${concept.replaceAll("'", "''")}' --recipes '${resolve(out, "verification-recipes.json").replaceAll("'", "''")}'`,
		);
		return;
	}
	if (command === "map") {
		const out = options.out || freshOutput();
		assertOutsideGit(out);
		const map = generateMap(canonical(options.concept), options.recipes);
		await jsonOutput(out, "verification-map.json", map);
		const problems = coverageProblems(map, canonical(options.concept));
		if (problems.length) throw new Error(problems.join("\n"));
		return console.log(
			`MAP PASS: ${map.pages.length} pages, ${map.pages.reduce((sum, page) => sum + page.features.length, 0)} feature recipes; ${out}/verification-map.json`,
		);
	}
	if (command === "drift") {
		const { map } = mapFor(options, canonical(options.concept));
		return console.log(
			`DRIFT PASS: ${map.pages.length} pages; discovered openings covered and recipe selectors/markers present; source rediscovered.`,
		);
	}
	if (command === "list") {
		const { map } = mapFor(options, canonical(options.concept));
		for (const page of map.pages.filter(
			(p) => !options.page || options.page === "all" || p.page === options.page,
		)) {
			console.log(`PAGE ${page.page}; readiness ${page.ready}`);
			for (const item of page.switches)
				console.log(
					`SWITCH ${item.name}: ${[...new Set([...item.values, ...item.samples])].join(", ") || "<open domain>"}${item.dependencies.length ? `; dependencies ${JSON.stringify(item.dependencies)}` : ""}`,
				);
			for (const state of page.states)
				console.log(
					`STATE ${JSON.stringify(state.when || {})}${state.language ? ` ${state.language}` : ""}: ${state.shows}`,
				);
			for (const feature of page.features)
				console.log(
					`FEATURE ${feature.id}: ${feature.what || feature.id}; ${feature.reach || feature.actions.join(" -> ") || "open page"}; proof ${JSON.stringify(feature.proof)}`,
				);
		}
		return;
	}
	if (command === "compare")
		return compare(
			{ ...options, out: options.out || freshOutput() },
			{ doctor, child },
		);
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
					if (!(error instanceof ReportedFailure))
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
		if (!(error instanceof ReportedFailure))
			console.error(
				`FAIL: ${error.message}${error.fix ? `\nFIX: ${error.fix}` : ""}`,
			);
		process.exitCode = 1;
	});
