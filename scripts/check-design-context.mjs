// Design-session entry check: prove the Impeccable bridge resolves FITWAY's
// PRODUCT.md and DESIGN.md routers.
//
// docs/WORKFLOW.md ("Design work: authority, concepts, and perceptual gates",
// item 1) requires `pnpm check:design-context` before any design or UI session.
// The Impeccable engine resolves PRODUCT.md and DESIGN.md child-first and then
// at the repo root; FITWAY routes those two names to its real authorities
// through the router files at the repo root. An empty Doctor result is not
// proof of that integration, because Doctor reports no findings when the
// bridge cannot resolve at all.
//
// This check is deliberately not part of `verify:fast`: it depends on a
// locally installed Impeccable engine, which the verification ladder must not
// require. It never prints environment values; IMPECCABLE_BIN only selects
// the engine.

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
);

const installedWindowsEngine =
	"C:\\Users\\Pc Force\\.codex\\skills\\impeccable\\scripts\\bin\\windows-x64\\impeccable.exe";

const resolutionTargets = [
	{
		label: "repo root",
		cwd: repositoryRoot,
		// A monorepo root must name its target or the engine answers
		// TARGET_SELECTION_REQUIRED; `.` names the repo root itself.
		args: ["context", "--json", "--target", "."],
	},
	{
		label: "apps/web",
		cwd: path.join(repositoryRoot, "apps", "web"),
		args: ["context", "--json"],
	},
];

/** Quote a Windows command line; cmd /s strips the outer quotes we add. */
function windowsCommandLine(parts) {
	return parts
		.map((part) => (/[\s"]/.test(part) ? `"${part}"` : part))
		.join(" ");
}

function run(engine, args, cwd) {
	// `.cmd` and `.bat` engines (npm-style shims) are not executable without
	// cmd.exe. Everything is passed through cmd's `/d /s /c "<line>"` form so
	// paths with spaces and fixed arguments survive verbatim.
	const isWindowsScript =
		process.platform === "win32" && /\.(?:cmd|bat)$/i.test(engine);
	const command = isWindowsScript
		? (process.env.ComSpec ?? "C:\\Windows\\System32\\cmd.exe")
		: engine;
	const commandArgs = isWindowsScript
		? ["/d", "/s", "/c", `"${windowsCommandLine([engine, ...args])}"`]
		: args;
	return new Promise((resolve, reject) => {
		const child = spawn(command, commandArgs, {
			cwd,
			stdio: ["ignore", "pipe", "pipe"],
			windowsHide: true,
			windowsVerbatimArguments: isWindowsScript,
		});
		const stdout = [];
		const stderr = [];
		child.stdout.on("data", (chunk) => stdout.push(chunk));
		child.stderr.on("data", (chunk) => stderr.push(chunk));
		child.once("error", reject);
		child.once("close", (code) => {
			resolve({
				code: code ?? 1,
				stdout: Buffer.concat(stdout).toString("utf8"),
				stderr: Buffer.concat(stderr).toString("utf8"),
			});
		});
	});
}

function engineCandidates() {
	const candidates = [];
	if (process.env.IMPECCABLE_BIN) {
		candidates.push({
			command: process.env.IMPECCABLE_BIN,
			label: "IMPECCABLE_BIN",
		});
	}
	candidates.push({ command: "impeccable", label: "`impeccable` on PATH" });
	if (process.platform === "win32") {
		candidates.push({
			command: installedWindowsEngine,
			label: "installed win32 helper",
		});
	}
	return candidates;
}

async function resolveEngine() {
	const problems = [];
	for (const candidate of engineCandidates()) {
		try {
			const probe = await run(candidate.command, ["--version"], repositoryRoot);
			const version = probe.stdout.trim();
			if (probe.code === 0 && version) {
				return {
					engine: { ...candidate, version: version.split(/\r?\n/)[0] },
				};
			}
			problems.push(`${candidate.label} exited with code ${probe.code}`);
		} catch {
			problems.push(`${candidate.label} could not run`);
		}
	}
	return { problems };
}

/** Extract the JSON object that follows the engine's RESOLVED_CONTEXT marker. */
function parseResolvedContext(output) {
	const marker = output.indexOf("RESOLVED_CONTEXT:");
	if (marker === -1) return null;
	const start = output.indexOf("{", marker);
	if (start === -1) return null;
	let depth = 0;
	let inString = false;
	let escaped = false;
	for (let index = start; index < output.length; index += 1) {
		const character = output[index];
		if (inString) {
			if (escaped) escaped = false;
			else if (character === "\\") escaped = true;
			else if (character === '"') inString = false;
			continue;
		}
		if (character === '"') inString = true;
		else if (character === "{") depth += 1;
		else if (character === "}") {
			depth -= 1;
			if (depth === 0) {
				try {
					return JSON.parse(output.slice(start, index + 1));
				} catch {
					return null;
				}
			}
		}
	}
	return null;
}

function verifiedFile(cwd, resolved, field, expectedName) {
	const value = resolved?.[field];
	if (typeof value !== "string" || value.length === 0) {
		return { problem: `${field} is null` };
	}
	if (path.basename(value).toLowerCase() !== expectedName.toLowerCase()) {
		return { problem: `${field} is ${value}, not an ${expectedName} file` };
	}
	const absolute = path.resolve(cwd, value);
	if (!existsSync(absolute)) {
		return { problem: `${field} points at a missing file` };
	}
	return { relative: path.relative(repositoryRoot, absolute) };
}

function printDoctorReport(report) {
	const findings = Array.isArray(report?.findings) ? report.findings : null;
	if (!findings) {
		return ["doctor: report had no findings array"];
	}
	if (findings.length === 0) {
		return [
			"doctor findings: none (an empty Doctor result is never integration proof on its own)",
		];
	}
	const lines = [`doctor findings (repo root): ${findings.length}`];
	for (const finding of findings) {
		lines.push(
			`  [${finding.severity ?? "unknown"}] ${finding.id} (path: ${finding.path ?? "none"}): ${finding.summary ?? ""}`,
		);
	}
	return lines;
}

async function main() {
	const { engine, problems } = await resolveEngine();
	if (!engine) {
		throw new Error(
			[
				"no runnable Impeccable engine found.",
				`Tried ${problems.join("; ")}.`,
				"This is the required design-session entry check (docs/WORKFLOW.md)",
				"and is deliberately not part of `verify:fast`; install the Impeccable",
				"skill or point IMPECCABLE_BIN at its engine, then rerun.",
			].join(" "),
		);
	}
	console.log(
		`check:design-context: Impeccable ${engine.version} via ${engine.label}`,
	);

	const failures = [];
	for (const target of resolutionTargets) {
		const result = await run(engine.command, target.args, target.cwd);
		const resolved = parseResolvedContext(result.stdout);
		const product = verifiedFile(
			target.cwd,
			resolved,
			"productPath",
			"PRODUCT.md",
		);
		const design = verifiedFile(
			target.cwd,
			resolved,
			"designPath",
			"DESIGN.md",
		);
		if (product.relative && design.relative) {
			console.log(
				`  ${target.label}: product ${product.relative}, design ${design.relative} (platform ${resolved.platform ?? "unknown"})`,
			);
			continue;
		}
		const details = [product.problem, design.problem]
			.filter(Boolean)
			.join("; ");
		failures.push(`${target.label}: ${details}`);
		if (resolved === null) {
			failures.push(
				`${target.label}: engine did not return RESOLVED_CONTEXT (exit ${result.code})`,
			);
		}
	}

	const doctor = await run(
		engine.command,
		["doctor", "--json"],
		repositoryRoot,
	);
	let report = null;
	try {
		report = JSON.parse(doctor.stdout);
	} catch {
		failures.push(`doctor --json did not return JSON (exit ${doctor.code})`);
	}
	if (report) {
		for (const line of printDoctorReport(report)) console.log(line);
	}

	if (failures.length > 0) {
		for (const failure of failures) {
			console.error(`check:design-context FAILED: ${failure}`);
		}
		process.exitCode = 1;
		return;
	}
	console.log(
		"check:design-context passed: the Impeccable bridge resolves FITWAY's PRODUCT.md/DESIGN.md routers at the repo root and from apps/web.",
	);
}

main().catch((error) => {
	console.error(`check:design-context FAILED: ${error.message}`);
	process.exitCode = 1;
});
