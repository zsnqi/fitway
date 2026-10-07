import { spawn } from "node:child_process";
import { repositoryFingerprint } from "./repository-fingerprint.mjs";

const phases = {
	"login-paper-adoption": {
		browserFiles: [
			"tests/browser/login-paper-adoption.browser.spec.ts",
			"tests/browser/phase4-staff-web.browser.spec.ts",
			"tests/browser/phase9-owner-ui.browser.spec.ts",
			"tests/browser/public-baseline.browser.spec.ts",
			"tests/browser/phase11-shell.browser.spec.ts",
		],
		integrationFiles: [],
		label: "Login Paper adoption integration",
	},
	1: {
		browserFiles: [],
		integrationFiles: [],
		label: "Phase 1 foundation",
	},
	2: {
		browserFiles: ["tests/browser/phase2.browser.spec.ts"],
		integrationFiles: ["apps/server/src/phase2.integration.test.ts"],
		label: "Phase 2 current occupancy",
	},
	3: {
		browserFiles: ["tests/browser/phase3.browser.spec.ts"],
		integrationFiles: ["apps/server/src/phase2.integration.test.ts"],
		label: "Phase 3 schedule awareness",
	},
	6: {
		browserFiles: [],
		integrationFiles: ["apps/server/src/phase6-offline.integration.test.ts"],
		label: "Phase 6 offline fallback, backfill, and reconciliation",
	},
	12: {
		browserFiles: [],
		integrationFiles: ["apps/server/src/phase6-offline.integration.test.ts"],
		label: "Phase 12 durable edge client and Windows lifecycle",
	},
	baseline: {
		browserFiles: null,
		integrationFiles: null,
		label: "Baseline Reconciliation Gate",
	},
	"phase4-auth": {
		browserFiles: [],
		integrationFiles: ["apps/server/src/phase4-auth.integration.test.ts"],
		label: "Phase 4 authentication slice",
	},
	"phase4-health": {
		browserFiles: [],
		integrationFiles: ["apps/server/src/phase4-health.integration.test.ts"],
		label: "Phase 4 operational health slice",
	},
	"phase4-staff-web": {
		browserFiles: ["tests/browser/phase4-staff-web.browser.spec.ts"],
		integrationFiles: [],
		label: "Phase 4 staff web slice",
	},
	"phase8-alert-evaluator": {
		browserFiles: [],
		integrationFiles: [
			"apps/server/src/phase8-alert-evaluator.integration.test.ts",
		],
		label: "Phase 8 alert evaluator slice",
	},
	"phase9-analytics-domain": {
		browserFiles: [],
		integrationFiles: ["apps/server/src/phase9-analytics.integration.test.ts"],
		label: "Phase 9 analytics domain slice",
	},
	"phase5-command-domain": {
		browserFiles: [],
		integrationFiles: [
			"apps/server/src/phase5-command-domain.integration.test.ts",
		],
		label: "Phase 5 command-domain slice",
	},
	"phase5-staff-ui": {
		browserFiles: ["tests/browser/phase4-staff-web.browser.spec.ts"],
		integrationFiles: [
			"apps/server/src/phase5-command-domain.integration.test.ts",
		],
		label: "Phase 5 staff monitoring-only closeout slice",
	},
	"phase9-owner-ui": {
		browserFiles: ["tests/browser/phase9-owner-ui.browser.spec.ts"],
		integrationFiles: ["apps/server/src/phase9-owner-ui.integration.test.ts"],
		label: "Phase 9 owner UI slice",
	},
	"phase10-domain": {
		browserFiles: [],
		integrationFiles: ["apps/server/src/phase10-domain.integration.test.ts"],
		label: "Phase 10 reporting domain slice",
	},
	"phase10-ui-csv": {
		// Every /admin slice gates on its sibling specs from activation.
		browserFiles: [
			"tests/browser/phase10-ui-csv.browser.spec.ts",
			"tests/browser/phase11-health.browser.spec.ts",
			"tests/browser/phase11-audit.browser.spec.ts",
			"tests/browser/phase9-owner-ui.browser.spec.ts",
			"tests/browser/phase11-shell.browser.spec.ts",
		],
		integrationFiles: ["apps/server/src/phase10-ui-csv.integration.test.ts"],
		label: "Phase 10 owner reporting UI and CSV export slice",
	},
	"phase11-health": {
		// Every /admin slice gates on its sibling specs from activation. Omitting
		// them hid a real regression in phase11-audit until coordinator
		// verify:full caught it; that lesson applies to each remaining owner slice.
		browserFiles: [
			"tests/browser/phase11-health.browser.spec.ts",
			"tests/browser/phase11-audit.browser.spec.ts",
			"tests/browser/phase9-owner-ui.browser.spec.ts",
			"tests/browser/phase11-shell.browser.spec.ts",
		],
		integrationFiles: ["apps/server/src/phase11-health.integration.test.ts"],
		label: "Phase 11 owner health and uptime slice",
	},
	"phase11-e2e-propagation-wait": {
		browserFiles: [],
		integrationFiles: ["apps/server/src/phase2.integration.test.ts"],
		label: "Phase 11 simulator-to-browser propagation wait",
	},
	"phase11-audit": {
		// The audit section mounts on /admin beside the Phase 9 analytics, so the
		// Phase 9 owner spec is part of this slice's gate, not a neighbour's
		// problem. Omitting it hid a real regression from both the worker and the
		// independent verifier until coordinator verify:full caught it.
		browserFiles: [
			"tests/browser/phase11-audit.browser.spec.ts",
			"tests/browser/phase9-owner-ui.browser.spec.ts",
			"tests/browser/phase11-shell.browser.spec.ts",
		],
		integrationFiles: ["apps/server/src/phase11-audit.integration.test.ts"],
		label: "Phase 11 owner audit history slice",
	},
	"phase11-access": {
		// Slice B mounts the owner access surface on /admin beside every other
		// owner section, so all of them are this slice's gate. The comments on
		// phase11-health and phase11-audit record two separate occasions where
		// omitting a sibling hid a real regression until coordinator verify:full
		// caught it; this profile is written to not repeat that a third time.
		browserFiles: [
			"tests/browser/phase11-access.browser.spec.ts",
			"tests/browser/phase11-audit.browser.spec.ts",
			"tests/browser/phase11-health.browser.spec.ts",
			"tests/browser/phase10-ui-csv.browser.spec.ts",
			"tests/browser/phase9-owner-ui.browser.spec.ts",
			"tests/browser/phase11-shell.browser.spec.ts",
		],
		integrationFiles: ["apps/server/src/phase11-access.integration.test.ts"],
		label: "Phase 11 owner access management slice",
	},
	"phase11-settings": {
		// Every /admin slice gates on its sibling specs from activation. The
		// comments on phase11-health, phase11-audit, and phase11-access record
		// three separate occasions where omitting a sibling hid a real
		// regression until coordinator verify:full caught it; this profile is
		// written to not repeat that a fourth time.
		browserFiles: [
			"tests/browser/phase11-settings.browser.spec.ts",
			"tests/browser/phase11-access.browser.spec.ts",
			"tests/browser/phase11-audit.browser.spec.ts",
			"tests/browser/phase11-health.browser.spec.ts",
			"tests/browser/phase10-ui-csv.browser.spec.ts",
			"tests/browser/phase9-owner-ui.browser.spec.ts",
			"tests/browser/phase11-shell.browser.spec.ts",
		],
		integrationFiles: ["apps/server/src/phase11-settings.integration.test.ts"],
		label: "Phase 11 owner settings slice",
	},
	"phase11-reference-gating-debt": {
		browserFiles: [],
		integrationFiles: [],
		label: "Phase 11 reference-gating unit debt",
	},
	"phase11-shell": {
		browserFiles: ["tests/browser/phase11-shell.browser.spec.ts"],
		integrationFiles: [],
		label: "Phase 11 owner shell slice",
	},
	"phase10-csv-transport": {
		browserFiles: [],
		integrationFiles: [
			"apps/server/src/phase10-csv-transport.integration.test.ts",
		],
		label: "Phase 10 owner CSV transport slice",
	},
	"phase7-reset-evaluator": {
		browserFiles: [],
		integrationFiles: [
			"apps/server/src/phase7-reset-evaluator.integration.test.ts",
		],
		label: "Phase 7 reset evaluator slice",
	},
	"phase7-integration-b02": {
		browserFiles: [],
		integrationFiles: [
			"apps/server/src/phase7-integration.integration.test.ts",
		],
		label: "Phase 7 scheduled-reset integration b02",
	},
	"phase8-integration": {
		browserFiles: [],
		integrationFiles: [
			"apps/server/src/phase8-integration.integration.test.ts",
		],
		label: "Phase 8 health-alert integration b01",
	},
	"full-route-paper-fidelity": {
		browserFiles: [
			"tests/browser/public-baseline.browser.spec.ts",
			"tests/browser/login-paper-adoption.browser.spec.ts",
			"tests/browser/staff-paper-fidelity.review.spec.ts",
			"tests/browser/owner-cross-surface.review.spec.ts",
			"tests/browser/phase4-staff-web.browser.spec.ts",
			"tests/browser/phase11-shell.browser.spec.ts",
			"tests/browser/phase9-owner-ui.browser.spec.ts",
			"tests/browser/phase10-ui-csv.browser.spec.ts",
			"tests/browser/phase11-access.browser.spec.ts",
			"tests/browser/phase11-audit.browser.spec.ts",
			"tests/browser/phase11-health.browser.spec.ts",
			"tests/browser/phase11-settings.browser.spec.ts",
		],
		integrationFiles: [],
		label: "Full-route Paper fidelity repair",
	},
	"owner-audit-closure": {
		browserFiles: [
			"tests/browser/phase9-owner-ui.browser.spec.ts",
			"tests/browser/phase10-ui-csv.browser.spec.ts",
			"tests/browser/phase11-shell.browser.spec.ts",
			"tests/browser/phase11-audit.browser.spec.ts",
			"tests/browser/phase11-access.browser.spec.ts",
			"tests/browser/phase11-health.browser.spec.ts",
			"tests/browser/phase11-settings.browser.spec.ts",
			"tests/browser/owner-cross-surface.review.spec.ts",
			"tests/browser/owner-presentation.review.spec.ts",
		],
		integrationFiles: [],
		label: "Owner audit closure",
	},
	"agent-context-architecture-migration": {
		browserFiles: [],
		integrationFiles: [],
		label: "Agent-context architecture migration",
	},
};

const phaseNames = Object.keys(phases).join("|");

function usage() {
	console.log(`FITWAY verification

Usage:
  pnpm verify:fast
  FITWAY_PHASE=<${phaseNames}> pnpm verify:phase
  pnpm verify:phase --phase <${phaseNames}>
  pnpm verify:full

fast   Static checks, types, all unit tests, and simulator tests.
phase  The fast ladder plus the selected phase's integration/browser tests.
       This is focused evidence and never replaces verify:full before integration.
full   Every fast, integration, browser, accessibility, build, and mutation gate.

Integration safety requires all three values:
  FITWAY_RUN_ID=<unique_lowercase_run_id>
  TEST_DATABASE_URL=postgresql://.../fitway_integration_<FITWAY_RUN_ID>
  FITWAY_INTEGRATION_RESET_DATABASE=fitway_integration_<FITWAY_RUN_ID>

Optional Playwright isolation:
  FITWAY_PLAYWRIGHT_PORT, FITWAY_PLAYWRIGHT_BASE_URL,
  FITWAY_PLAYWRIGHT_OUTPUT_DIR, FITWAY_PLAYWRIGHT_REPORT_DIR,
  FITWAY_PLAYWRIGHT_REVIEW_DIR, FITWAY_PLAYWRIGHT_SNAPSHOT_DIR,
  FITWAY_PLAYWRIGHT_SKIP_WEBSERVER=true
`);
}

function parseArguments() {
	const args = process.argv.slice(2).filter((argument) => argument !== "--");
	const mode = args.shift();
	if (!mode || mode === "--help" || mode === "-h") {
		usage();
		process.exit(mode ? 0 : 1);
	}
	if (!new Set(["fast", "phase", "full"]).has(mode)) {
		throw new Error(`Unknown verification mode: ${mode}`);
	}
	let phase = process.env.FITWAY_PHASE;
	while (args.length > 0) {
		const argument = args.shift();
		if (argument === "--phase") {
			const argumentPhase = args.shift();
			if (!argumentPhase) throw new Error("--phase requires a value");
			if (phase && phase !== argumentPhase) {
				throw new Error(
					"FITWAY_PHASE and --phase must agree when both are set",
				);
			}
			phase = argumentPhase;
			continue;
		}
		throw new Error(`Unknown argument: ${argument}`);
	}
	if (mode === "phase" && (!phase || !(phase in phases))) {
		throw new Error(
			`verify:phase requires one of: ${Object.keys(phases).join(", ")}`,
		);
	}
	if (mode !== "phase" && phase) {
		throw new Error("--phase is valid only with verify:phase");
	}
	return { mode, phase };
}

async function runStep(label, args) {
	console.log(`\n==> ${label}`);
	const started = performance.now();
	await new Promise((resolve, reject) => {
		const command =
			process.platform === "win32"
				? (process.env.ComSpec ?? "C:\\Windows\\System32\\cmd.exe")
				: "pnpm";
		const commandArgs =
			process.platform === "win32" ? ["/d", "/s", "/c", "pnpm", ...args] : args;
		const child = spawn(command, commandArgs, {
			cwd: process.cwd(),
			env: process.env,
			stdio: "inherit",
			windowsHide: true,
		});
		child.once("error", reject);
		child.once("close", (code, signal) => {
			if (code === 0) {
				resolve();
				return;
			}
			reject(
				new Error(
					`${label} failed${signal ? ` with signal ${signal}` : ` with exit code ${code}`}`,
				),
			);
		});
	});
	console.log(`<== ${label} (${elapsedSeconds(started)}s)`);
}

function elapsedSeconds(started) {
	return ((performance.now() - started) / 1000).toFixed(2);
}

function fastSteps() {
	return [
		["Repository invariants", ["check:repository"]],
		["Biome check", ["check"]],
		[
			"Owner token fidelity",
			["exec", "node", "scripts/check-owner-tokens.mjs"],
		],
		["Type checks", ["check-types"]],
		["Unit tests", ["test"]],
		["Python simulator tests", ["test:simulator"]],
	];
}

function focusedSteps(phase) {
	const profile = phases[phase];
	const steps = [];
	if (profile.integrationFiles === null) {
		steps.push(["All integration tests", ["test:integration"]]);
	} else if (profile.integrationFiles.length > 0) {
		steps.push([
			`${profile.label} integration tests`,
			["test:integration", ...profile.integrationFiles],
		]);
	}
	if (profile.browserFiles === null) {
		steps.push(["All browser and accessibility tests", ["test:browser"]]);
	} else if (profile.browserFiles.length > 0) {
		steps.push([
			`${profile.label} browser tests`,
			["exec", "playwright", "test", ...profile.browserFiles],
		]);
	}
	return steps;
}

async function main() {
	const { mode, phase } = parseArguments();
	const started = performance.now();
	const before = await repositoryFingerprint();
	const steps = fastSteps();
	if (mode === "phase") {
		console.log(
			`Focused profile: ${phases[phase].label}. Build and non-profile integration/browser tests are intentionally deferred to verify:full.`,
		);
		steps.push(...focusedSteps(phase));
	}
	if (mode === "full") {
		steps.push(
			["Build", ["build"]],
			["All integration tests", ["test:integration"]],
			["All browser and accessibility tests", ["test:browser"]],
		);
	}

	let failure;
	try {
		for (const [label, args] of steps) await runStep(label, args);
	} catch (error) {
		failure = error;
	}

	console.log("\n==> Repository mutation guard");
	const guardStarted = performance.now();
	const after = await repositoryFingerprint();
	if (before !== after) {
		await new Promise((resolve) => {
			const status = spawn("git", ["status", "--short"], {
				cwd: process.cwd(),
				stdio: "inherit",
				windowsHide: true,
			});
			status.once("close", resolve);
		});
		const mutationFailure = new Error(
			"Verification changed tracked or untracked repository content; ignored build/test artifacts are permitted only under configured output directories",
		);
		failure ??= mutationFailure;
	}
	console.log(
		`<== Repository mutation guard (${elapsedSeconds(guardStarted)}s)`,
	);

	if (failure) throw failure;
	console.log(
		`\nVerification ${mode} passed without repository mutation (${elapsedSeconds(started)}s).`,
	);
	if (mode === "phase") {
		console.log("Run the full ladder before integration or DONE.");
	}
}

main().catch((error) => {
	console.error(`\nFAILED_VALIDATION: ${error.message}`);
	process.exitCode = 1;
});
