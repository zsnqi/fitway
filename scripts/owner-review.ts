import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
	isOwnerReviewScenario,
	OWNER_REVIEW_SCENARIOS,
} from "../tests/browser/support/owner-review-fixtures";

type ReviewMode = "capture" | "interactive" | "motion" | "contact-sheet";

function usage() {
	console.log(`FITWAY Owner presentation review

Usage:
  pnpm owner:review
  pnpm owner:review -- --scenario <name> [--locale ar|en] [--viewport 1440x900]
  pnpm owner:review -- --scenario <name> --mode interactive|motion
  pnpm owner:review -- --mode contact-sheet --reference <png> --before <png> --after <png>

Named scenarios:
  ${OWNER_REVIEW_SCENARIOS.join("\n  ")}

The default runs the curated blocking matrix. Review evidence is written under the
run-specific ignored Playwright output directory. This command never updates a canonical.
`);
}

function takeValue(args: string[], name: string) {
	const value = args.shift();
	if (!value) throw new Error(`${name} requires a value`);
	return value;
}

function parseArguments() {
	const args = process.argv.slice(2).filter((argument) => argument !== "--");
	let scenario: string | undefined;
	let locale: string | undefined;
	let viewport: string | undefined;
	let mode: ReviewMode = "capture";
	let reference: string | undefined;
	let before: string | undefined;
	let after: string | undefined;

	while (args.length > 0) {
		const argument = args.shift();
		if (argument === "--help" || argument === "-h") {
			usage();
			process.exit(0);
		}
		if (argument?.includes("update-snapshot")) {
			throw new Error("owner:review never accepts snapshot-update flags");
		}
		if (argument === "--scenario") scenario = takeValue(args, argument);
		else if (argument === "--locale") locale = takeValue(args, argument);
		else if (argument === "--viewport") viewport = takeValue(args, argument);
		else if (argument === "--mode") {
			const next = takeValue(args, argument);
			if (
				!["capture", "interactive", "motion", "contact-sheet"].includes(next)
			) {
				throw new Error(`Unsupported Owner review mode: ${next}`);
			}
			mode = next as ReviewMode;
		} else if (argument === "--reference")
			reference = takeValue(args, argument);
		else if (argument === "--before") before = takeValue(args, argument);
		else if (argument === "--after") after = takeValue(args, argument);
		else throw new Error(`Unknown owner:review argument: ${argument}`);
	}

	if (scenario && !isOwnerReviewScenario(scenario)) {
		throw new Error(`Unsupported Owner review scenario: ${scenario}`);
	}
	if (locale && locale !== "ar" && locale !== "en") {
		throw new Error("--locale must be ar or en");
	}
	if (viewport && !/^\d{3,4}x\d{3,4}$/u.test(viewport)) {
		throw new Error("--viewport must be WIDTHxHEIGHT");
	}
	if (mode !== "contact-sheet" && !scenario && (locale || viewport)) {
		throw new Error("--locale and --viewport require --scenario");
	}
	if (mode === "contact-sheet" && (!reference || !before || !after)) {
		throw new Error(
			"contact-sheet mode requires --reference, --before, and --after",
		);
	}
	return { scenario, locale, viewport, mode, reference, before, after };
}

function capture(command: string, args: string[]) {
	return new Promise<Buffer>((resolve, reject) => {
		const child = spawn(command, args, {
			cwd: process.cwd(),
			stdio: ["ignore", "pipe", "pipe"],
			windowsHide: true,
		});
		const stdout: Buffer[] = [];
		const stderr: Buffer[] = [];
		child.stdout.on("data", (chunk) => stdout.push(chunk));
		child.stderr.on("data", (chunk) => stderr.push(chunk));
		child.once("error", reject);
		child.once("close", (code) => {
			if (code === 0) return resolve(Buffer.concat(stdout));
			reject(
				new Error(
					Buffer.concat(stderr).toString("utf8") || `${command} failed`,
				),
			);
		});
	});
}

async function repositoryFingerprint() {
	const hash = createHash("sha256");
	hash.update(
		await capture("git", [
			"status",
			"--porcelain=v1",
			"-z",
			"--untracked-files=all",
		]),
	);
	hash.update(
		await capture("git", ["diff", "--binary", "--no-ext-diff", "HEAD", "--"]),
	);
	const paths = (
		await capture("git", ["ls-files", "--others", "--exclude-standard", "-z"])
	)
		.toString("utf8")
		.split("\0")
		.filter(Boolean)
		.sort();
	for (const file of paths) {
		hash.update(file);
		hash.update(await readFile(path.resolve(file)));
	}
	return hash.digest("hex");
}

function runReview(args: string[], environment: NodeJS.ProcessEnv) {
	return new Promise<void>((resolve, reject) => {
		// Modern Node on Windows does not directly spawn `.cmd` shims. Reuse the
		// package manager entrypoint that launched this script, through Node itself,
		// so argument boundaries stay exact and no shell is introduced.
		const packageManagerEntrypoint = process.env.npm_execpath;
		const command = packageManagerEntrypoint ? process.execPath : "pnpm";
		const commandArgs = packageManagerEntrypoint
			? [packageManagerEntrypoint, ...args]
			: args;
		const child = spawn(command, commandArgs, {
			cwd: process.cwd(),
			env: environment,
			stdio: "inherit",
			windowsHide: true,
		});
		child.once("error", reject);
		child.once("close", (code, signal) => {
			if (code === 0) return resolve();
			reject(
				new Error(
					`Owner review failed${signal ? ` with ${signal}` : ` with exit code ${code}`}`,
				),
			);
		});
	});
}

async function main() {
	const options = parseArguments();
	const beforeFingerprint = await repositoryFingerprint();
	const runId =
		process.env.FITWAY_RUN_ID ??
		`owner_review_${new Date().toISOString().replace(/\D/gu, "").slice(0, 14)}`;
	if (!/^[a-z0-9]+(?:_[a-z0-9]+)*$/u.test(runId) || runId.length > 40) {
		throw new Error("FITWAY_RUN_ID must be a valid unique verification run id");
	}
	const environment: NodeJS.ProcessEnv = {
		...process.env,
		FITWAY_RUN_ID: runId,
		FITWAY_OWNER_REVIEW_SCENARIO: options.scenario,
		FITWAY_OWNER_REVIEW_LOCALE: options.locale,
		FITWAY_OWNER_REVIEW_VIEWPORT: options.viewport,
		FITWAY_OWNER_REVIEW_INTERACTIVE:
			options.mode === "interactive" ? "true" : undefined,
		FITWAY_OWNER_REVIEW_MOTION: options.mode === "motion" ? "true" : undefined,
		FITWAY_OWNER_REVIEW_CONTACT_SHEET:
			options.mode === "contact-sheet" ? "true" : undefined,
		FITWAY_OWNER_REVIEW_REFERENCE: options.reference,
		FITWAY_OWNER_REVIEW_BEFORE: options.before,
		FITWAY_OWNER_REVIEW_AFTER: options.after,
	};
	const playwrightArgs = [
		"exec",
		"playwright",
		"test",
		"tests/browser/owner-presentation.review.spec.ts",
		"--project=chromium",
		"--workers=1",
	];
	if (options.mode === "interactive") playwrightArgs.push("--headed");
	if (options.mode === "motion") playwrightArgs.push("--trace=on");

	let failure: unknown;
	try {
		await runReview(playwrightArgs, environment);
	} catch (error) {
		failure = error;
	}
	const afterFingerprint = await repositoryFingerprint();
	if (beforeFingerprint !== afterFingerprint) {
		throw new Error(
			"owner:review changed repository content; canonical promotion must be separate and inspected",
		);
	}
	if (failure) throw failure;
	console.log(`Owner review ${runId} passed without repository mutation.`);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = 1;
});
