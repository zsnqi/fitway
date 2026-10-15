import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REMOTE = "origin";
const REMOTE_MAIN = "refs/heads/main";
const CHECKS_WORKFLOW = ".github/workflows/checks.yml";

export class MainAdvanceError extends Error {}

function run(command, args, { cwd, allowFailure = false } = {}) {
	const result = spawnSync(command, args, {
		cwd,
		encoding: "utf8",
		windowsHide: true,
	});
	const stdout = result.stdout ?? "";
	const stderr = result.stderr ?? "";
	if (result.error || (!allowFailure && result.status !== 0)) {
		const detail = stderr.trim() || stdout.trim() || result.error?.message;
		throw new MainAdvanceError(
			`${command} ${args.join(" ")} failed${detail ? `: ${detail}` : ""}`,
		);
	}
	return { status: result.status ?? 1, stdout, stderr };
}

function git(cwd, args, options = {}) {
	return run("git", args, { cwd, ...options });
}

function resolveCommit(cwd, revision) {
	if (!/^[0-9a-f]{7,40}$/i.test(revision))
		throw new MainAdvanceError(`commit must be a hexadecimal SHA: ${revision}`);
	const result = git(cwd, ["rev-parse", "--verify", `${revision}^{commit}`]);
	return result.stdout.trim();
}

function pushedBy(cwd, sha) {
	const result = git(cwd, [
		"for-each-ref",
		"--format=%(refname)",
		"--contains",
		sha,
		"refs/remotes/origin",
	]);
	return result.stdout
		.split(/\r?\n/)
		.map((entry) => entry.trim())
		.filter(Boolean);
}

function remoteMain(cwd) {
	const result = git(cwd, ["ls-remote", "--exit-code", REMOTE, REMOTE_MAIN], {
		allowFailure: true,
	});
	if (result.status !== 0)
		throw new MainAdvanceError(`remote ${REMOTE}/main does not exist`);
	const line = result.stdout
		.split(/\r?\n/)
		.map((entry) => entry.trim())
		.find(Boolean);
	if (!line) throw new MainAdvanceError(`remote ${REMOTE}/main does not exist`);
	const [sha] = line.split(/\s+/);
	const object = git(cwd, ["cat-file", "-e", `${sha}^{commit}`], {
		allowFailure: true,
	});
	if (object.status !== 0)
		throw new MainAdvanceError(
			`remote ${REMOTE}/main commit ${sha} is not present locally`,
		);
	return sha;
}

function isAncestor(cwd, ancestor, descendant) {
	const result = git(
		cwd,
		["merge-base", "--is-ancestor", ancestor, descendant],
		{ allowFailure: true },
	);
	if (result.status === 0) return true;
	if (result.status === 1) return false;
	throw new MainAdvanceError(
		`cannot compare ${ancestor} with ${descendant}: ${result.stderr.trim()}`,
	);
}

function sortRuns(runs) {
	return [...runs].sort((left, right) => {
		const byTime =
			Date.parse(right.createdAt ?? "") - Date.parse(left.createdAt ?? "");
		if (Number.isFinite(byTime) && byTime !== 0) return byTime;
		return Number(right.databaseId ?? 0) - Number(left.databaseId ?? 0);
	});
}

export function evaluateChecksRuns(runs, sha) {
	const matching = sortRuns(
		runs.filter((run) => run.headSha === sha && run.status !== undefined),
	);
	if (matching.length === 0)
		throw new MainAdvanceError(`no ${CHECKS_WORKFLOW} run found for ${sha}`);
	const unfinished = matching.find((run) => run.status !== "completed");
	if (unfinished)
		throw new MainAdvanceError(
			`${CHECKS_WORKFLOW} run ${unfinished.databaseId ?? "unknown"} for ${sha} is ${unfinished.status}; wait for it to complete`,
		);
	const newest = matching[0];
	if (newest.conclusion !== "success")
		throw new MainAdvanceError(
			`newest ${CHECKS_WORKFLOW} run ${newest.databaseId ?? "unknown"} for ${sha} concluded ${newest.conclusion ?? "without a conclusion"}`,
		);
	return newest;
}

export function listChecksRuns(cwd, sha) {
	const result = run(
		"gh",
		[
			"run",
			"list",
			"--workflow",
			CHECKS_WORKFLOW,
			"--commit",
			sha,
			"--limit",
			"100",
			"--json",
			"conclusion,createdAt,databaseId,headSha,status",
		],
		{ cwd },
	);
	let runs;
	try {
		runs = JSON.parse(result.stdout);
	} catch (error) {
		throw new MainAdvanceError(
			`cannot parse gh run list output: ${error.message}`,
		);
	}
	if (!Array.isArray(runs))
		throw new MainAdvanceError("gh run list did not return an array");
	return runs;
}

function parseArgs(args) {
	let dryRun = false;
	let commit = null;
	for (const argument of args) {
		if (argument === "--dry-run") dryRun = true;
		else if (argument === "--") continue;
		else if (argument.startsWith("-"))
			throw new MainAdvanceError(`unknown option: ${argument}`);
		else if (commit !== null)
			throw new MainAdvanceError("expected exactly one commit");
		else commit = argument;
	}
	if (!commit)
		throw new MainAdvanceError("usage: pnpm main:advance [--dry-run] <commit>");
	return { commit, dryRun };
}

export async function advanceMain({
	commit,
	cwd = process.cwd(),
	dryRun = false,
	listRuns = listChecksRuns,
} = {}) {
	const sha = resolveCommit(cwd, commit);
	const containingRefs = pushedBy(cwd, sha);
	if (containingRefs.length === 0)
		throw new MainAdvanceError(`commit ${sha} is not pushed to ${REMOTE}`);

	const originalMain = remoteMain(cwd);
	if (!isAncestor(cwd, originalMain, sha))
		throw new MainAdvanceError(
			`${REMOTE}/main ${originalMain} is not an ancestor of ${sha}; refusing a non-fast-forward move`,
		);

	const firstRun = evaluateChecksRuns(await listRuns(cwd, sha), sha);
	const currentMain = remoteMain(cwd);
	if (currentMain !== originalMain)
		throw new MainAdvanceError(
			`${REMOTE}/main changed from ${originalMain} to ${currentMain} while checking`,
		);
	const secondRun = evaluateChecksRuns(await listRuns(cwd, sha), sha);
	if (secondRun.databaseId !== firstRun.databaseId)
		throw new MainAdvanceError(
			`newest ${CHECKS_WORKFLOW} run changed while checking; retry after it settles`,
		);

	if (dryRun) {
		console.log(
			`DRY RUN: ${REMOTE}/main would advance from ${originalMain} to ${sha}`,
		);
		return { sha, previous: originalMain, dryRun: true };
	}

	git(cwd, ["push", REMOTE, `${sha}:${REMOTE_MAIN}`]);
	const moved = remoteMain(cwd);
	if (moved !== sha)
		throw new MainAdvanceError(
			`push returned but ${REMOTE}/main is ${moved}, not ${sha}`,
		);
	console.log(`${REMOTE}/main advanced from ${originalMain} to ${sha}`);
	return { sha, previous: originalMain, dryRun: false };
}

if (
	process.argv[1] &&
	path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
	try {
		const options = parseArgs(process.argv.slice(2));
		await advanceMain(options);
	} catch (error) {
		console.error(
			`main:advance:1: FAIL: ${error.message.replace(/[\r\n]+/g, " ")}`,
		);
		process.exitCode = 1;
	}
}
