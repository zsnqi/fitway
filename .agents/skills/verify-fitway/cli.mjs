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
import {
	beginToolCommand,
	renderToolHelp,
	resolveToolArguments,
	ToolStartupError,
	toolStartupLine,
} from "../../../scripts/agent-environment/tool-contract.mjs";
import {
	colorsAxis,
	measurementColors,
	requireForcedColors,
} from "./colors.mjs";
import { compare } from "./compare.mjs";
import {
	assertOutsideGit,
	canonical,
	checkVerificationLease,
	defaultLanAddresses,
	freshOutput,
	jsonOutput,
	lanOrigins,
	outputFile,
	ownedSession,
	portAvailable,
	preview,
	ReportedFailure,
	verificationPairs,
	verificationPort,
} from "./core.mjs";
import { requireDependency } from "./discover.mjs";
import { checkVerificationMaps } from "./drift-tree.mjs";
import {
	coverageProblems,
	drift,
	generateMap,
	repairRecipes,
	repository,
} from "./map.mjs";
import {
	refuseOutputArguments,
	refuseServingSpecs,
} from "./measure-arguments.mjs";
import { drive } from "./runner.mjs";

const self = fileURLToPath(import.meta.url);
export const help = renderToolHelp("verify:owner");

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
	if (!options.session) {
		// File rendering does not bind a listener; command-owned claims still
		// refuse another compare's allocation, including before HTTP startup.
		if (options.transports === "file")
			await checkVerificationLease(
				Number(options.port || 3176),
				options.portLease,
			);
		else await portAvailable(Number(options.port || 3176), options.portLease);
	}
	if (!options.quiet)
		console.log(
			`DOCTOR PASS: Chromium, ui-forensics, probe kit, ${map.pages.length} pages, current map ${path}, port owned/free.`,
		);
	return { concept, map, tools, loaded };
}

export async function doctorFix(options, error, available = portAvailable) {
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
	if (/port|Port|Session/.test(error.message)) {
		let preferred = Number(options.port || 3176);
		if (options.session) {
			try {
				const session = JSON.parse(
					await readFile(resolve(options.session, "session.json"), "utf8"),
				);
				preferred = session.port;
			} catch {
				// A missing or invalid record cannot supply a preferred port.
			}
		}
		const pair =
			verificationPairs.find((pair) => pair.includes(preferred)) ||
			verificationPairs[0];
		const ports = [...new Set([preferred, ...pair])].filter((port) =>
			pair.includes(port),
		);
		for (const port of ports) {
			try {
				await available(port);
			} catch {
				continue;
			}
			return `${command} launch --concept ${quote(concept)} --port ${port} --out ${quote(freshOutput())}`;
		}
		return `BLOCKED: verification ports ${pair[0]} and ${pair[1]} are both held; retry when a verification port is free.`;
	}
	if (/Cannot find module/.test(error.message))
		return `pnpm --dir ${quote(repository)} install --frozen-lockfile`;
	return `${command} doctor ${args}`;
}

export async function doctor(options) {
	try {
		return await doctorChecks(options);
	} catch (error) {
		// A value the command cannot use is a start-up failure (C4), not a doctor finding.
		if (error instanceof ToolStartupError) throw error;
		const available =
			process.env.VERIFY_FITWAY_TEST_DOCTOR_PORT_PROBE === "0"
				? async () => {}
				: portAvailable;
		const fix = await doctorFix(options, error, available);
		console.error(
			`DOCTOR FAIL: ${error.message}\nFIX${fix.startsWith("BLOCKED:") ? " " : ": "}${fix}`,
		);
		throw new ReportedFailure(error.message, { cause: error });
	}
}

async function launch(options) {
	const concept = canonical(options.concept);
	let port = verificationPort(options.port || 3176);
	if (options["isolated-port"] !== undefined)
		port = Number(options["isolated-port"]);
	const out = options.out || freshOutput();
	assertOutsideGit(out);
	if (existsSync(resolve(out, "session.json")))
		throw new ToolStartupError(
			`Launch folder already has a session; cleanup --session '${out}' and use a fresh folder.`,
			`run cleanup --session '${out}', then pass a fresh --out folder`,
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
			env: { ...process.env },
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

export function ownerCommandOptions(parsed) {
	return {
		command: parsed.command?.name ?? parsed.fixedArgs[0] ?? "help",
		options: { ...parsed.options, extra: parsed.passthrough.slice() },
	};
}

async function prepareMeasureOptions(options) {
	const requested = measurementColors(options);
	if (requested.forced) await requireForcedColors(forensicsPath(options));
	options.extra = requested.args;
	options.colors = requested.colors;
}

export async function main(input, services = {}) {
	const parsed = Array.isArray(input)
		? resolveToolArguments("verify:owner", input)
		: input;
	const { command, options } = ownerCommandOptions(parsed);
	if (parsed.help || command === "help") return console.log(help);
	if (
		["drive", "compare"].includes(command) &&
		colorsAxis(options.colors).includes("forced")
	)
		await requireForcedColors(forensicsPath(options));
	if (command === "measure") await prepareMeasureOptions(options);
	if (command === "belonging-check")
		return (await import("./belonging-check.mjs")).belongingCheck(options, {
			doctor,
		});
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
	if (command === "drift-tree")
		return console.log(checkVerificationMaps(options.root || repository));
	if (command === "cleanup") return cleanup(options.session);
	if (command === "measure") {
		assertOutsideGit(options.out);
		if (existsSync(options.out) && readdirSync(options.out).length)
			throw new ToolStartupError(
				"measure requires a fresh empty output folder; this prevents descendant links or old evidence from redirecting writes.",
				"pass --out a new or empty folder outside Git",
			);
		const tools = forensicsPath(options);
		const tool = options.tool;
		refuseOutputArguments(options.extra);
		const heldRequested = options.extra.some((arg) =>
			/(?:^|[=:])(?:hold|release)(?::|$)/.test(arg),
		);
		if (heldRequested) {
			const source = readFileSync(
				resolve(tools, "scripts/web/_common.mjs"),
				"utf8",
			);
			const version =
				source.match(/TOOL_VERSION\s*=\s*["']([^"']+)/)?.[1] || "unknown";
			const [major, minor, patch] = String(version).split(".").map(Number);
			if (
				!(
					major > 1 ||
					(major === 1 && (minor > 3 || (minor === 3 && patch >= 1)))
				)
			)
				throw new Error(
					`Held presses require ui-forensics >=1.3.1; found ${version}`,
				);
		}
		// Refused before the evidence folder exists (C4: nothing written before a refusal).
		refuseServingSpecs(options.extra);
		await outputFile(options.out, "tool-output");
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
			colors: options.colors,
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
			{ doctor, child, ...services.compare },
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

if (process.argv[1] && resolve(process.argv[1]) === self) {
	const parsed = beginToolCommand(
		["verify:owner", "check:verification-map"],
		process.argv.slice(2),
	);
	main(parsed).catch((error) => {
		const line = toolStartupLine(parsed.entry.name, error);
		if (line) console.error(line);
		else if (!(error instanceof ReportedFailure))
			console.error(
				`FAIL: ${error.message}${error.fix ? `\nFIX: ${error.fix}` : ""}`,
			);
		process.exitCode = 1;
	});
}
