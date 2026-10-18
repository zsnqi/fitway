// Commit-command interpretation and Git evidence checks.

import { appendFile } from "node:fs/promises";
import path from "node:path";
import { outcomeTextFromBrief } from "./brief-readings.mjs";
import {
	matchReportRows,
	passedIds,
	readRunActivity,
} from "./codex-report.mjs";
import { commitHeaderSha } from "./commit-header.mjs";
import { commandStatusIsEvent, isGitCommitWords } from "./git-commit-words.mjs";
import { readGit } from "./git-context.mjs";
import { shellScan, shellTokens, unwrapCommand } from "./shell-words.mjs";

function commandParts(command) {
	const { text, shell } = unwrapCommand(command);
	const { events } = shellScan(text, shell);
	const parts = [];
	let current = "";
	let separator = null;
	for (const event of events) {
		if (event.separator === undefined) {
			current += event.raw;
			continue;
		}
		if (current.trim()) parts.push({ text: current.trim(), separator, shell });
		current = "";
		separator = event.separator;
	}
	if (current.trim()) parts.push({ text: current.trim(), separator, shell });
	return parts;
}

function lastCommandPart(command) {
	return commandParts(command).at(-1) ?? null;
}

function isGitCommitCommand(command, shell = "bash") {
	const words = shellTokens(command, shell) ?? [];
	return isGitCommitWords(words);
}

function isCommitCommand(command) {
	const part = lastCommandPart(command);
	return Boolean(
		part &&
			commandStatusIsEvent(part) &&
			isGitCommitCommand(part.text, part.shell),
	);
}

function isFastLadderCommand(command) {
	const part = lastCommandPart(command);
	if (!part || !commandStatusIsEvent(part)) return false;
	const words = shellTokens(part.text, part.shell) ?? [];
	return Boolean(
		(words.length === 3 &&
			/^node(?:\.exe)?$/i.test(words[0] ?? "") &&
			words[1] === "scripts/verify.mjs" &&
			words[2] === "fast") ||
			(words.length === 2 &&
				/^pnpm(?:\.cmd)?$/i.test(words[0] ?? "") &&
				words[1] === "verify:fast"),
	);
}

function timestampWithOffset(date) {
	const offsetMinutes = -date.getTimezoneOffset();
	const sign = offsetMinutes < 0 ? "-" : "+";
	const absolute = Math.abs(offsetMinutes);
	const local = new Date(date.getTime() + offsetMinutes * 60_000);
	const timestamp = local.toISOString().slice(0, -1);
	const hours = String(Math.floor(absolute / 60)).padStart(2, "0");
	const minutes = String(absolute % 60).padStart(2, "0");
	return `${timestamp}${sign}${hours}:${minutes}`;
}

async function recordTurn(run, worktree, result, stopReason) {
	const endedAt = new Date();
	let head = null;
	try {
		head = readGit(worktree, ["rev-parse", "HEAD"]);
	} catch {
		// A missing head is recorded as null so the turn remains diagnosable.
	}
	const record = {
		start: timestampWithOffset(result.startedAt),
		end: timestampWithOffset(endedAt),
		durationMs: Math.max(0, endedAt.getTime() - result.startedAt.getTime()),
		exitCode: result.code,
		stopReason,
		head,
		events: path.basename(result.events),
		stderr: path.basename(result.stderr),
	};
	try {
		await appendFile(
			path.join(run, "turns.jsonl"),
			`${JSON.stringify(record)}\n`,
		);
	} catch (error) {
		console.error(`codex-round: turn record not written: ${error.message}`);
	}
}

function resolveCommitClaim(candidates, worktree, launchHead) {
	const resolved = [];
	for (const candidate of candidates) {
		try {
			resolved.push({
				candidate,
				resolved: readGit(worktree, ["rev-parse", `${candidate}^{commit}`]),
			});
		} catch {
			// A candidate that does not resolve cannot confirm the claim.
		}
	}
	const failures = [];
	if (!resolved.length) {
		if (candidates.length)
			failures.push(`commit ${candidates.join(", ")}: no such commit object`);
		return { failures, resolved, head: null, matching: null };
	}
	let head = null;
	try {
		head = readGit(worktree, ["rev-parse", "HEAD"]);
	} catch (error) {
		failures.push(`commit: cannot read worktree HEAD: ${error.message}`);
	}
	const matching =
		head === null ? null : resolved.find(({ resolved }) => resolved === head);
	if (head !== null && !matching)
		failures.push(
			`commit ${resolved.map(({ candidate }) => candidate).join(", ")}: resolves to ${resolved
				.map(({ resolved }) => resolved)
				.join(", ")}, not worktree HEAD ${head}`,
		);
	const launchClaims = resolved.filter(
		({ resolved }) => resolved === launchHead,
	);
	if (launchClaims.length && (!matching || matching.resolved === launchHead))
		failures.push(
			`commit ${launchClaims.map(({ candidate }) => candidate).join(", ")}: equals launch HEAD ${launchHead}`,
		);
	return { failures, resolved, head, matching };
}

function lineageAndDiffFailures(worktree, head, matching, launchHead) {
	if (
		!matching ||
		head === null ||
		head === launchHead ||
		typeof launchHead !== "string"
	)
		return [];
	const failures = [];
	let descends = true;
	try {
		readGit(worktree, ["merge-base", "--is-ancestor", launchHead, head]);
	} catch (error) {
		descends = false;
		if (error.status === 1) {
			failures.push(
				`commit ${matching.candidate}: worktree HEAD ${head} does not descend from launch HEAD ${launchHead}`,
			);
		} else {
			failures.push(
				`commit ${matching.candidate}: cannot verify worktree HEAD descends from launch HEAD ${launchHead}: ${error.message}`,
			);
		}
	}
	if (!descends) return failures;
	let diff;
	try {
		diff = readGit(worktree, ["diff", "--name-only", launchHead, head]);
	} catch (error) {
		failures.push(
			`commit ${matching.candidate}: cannot read the diff from launch HEAD ${launchHead} to worktree HEAD ${head}: ${error.message}`,
		);
	}
	if (diff === "")
		failures.push(
			`commit ${matching.candidate}: worktree HEAD ${head} has an empty diff against launch HEAD ${launchHead}`,
		);
	return failures;
}

function commitRecordFailures(records, worktree, head) {
	const commits = records.filter(
		({ command, exitCode }) => exitCode === 0 && isCommitCommand(command),
	);
	if (!commits.length)
		return [
			"commit: no successful git commit command with exit code 0 is recorded in this run's events",
		];
	const failures = [];
	const abbreviated = head?.slice(0, 7);
	const recorded = commitHeaderSha(commits.at(-1).output);
	if (abbreviated && (!recorded || !head.toLowerCase().startsWith(recorded)))
		failures.push(
			`commit: the last successful git commit output does not name worktree HEAD ${abbreviated}`,
		);
	let status;
	try {
		status = readGit(worktree, ["status", "--short"]);
	} catch (error) {
		failures.push(`commit: cannot read worktree status: ${error.message}`);
	}
	if (status) failures.push("commit: worktree is not clean after the commit");
	return failures;
}

function ladderRecordFailures(records, verifyIds) {
	const lastCommit = records.reduce(
		(last, record, index) =>
			record.exitCode === 0 && isCommitCommand(record.command) ? index : last,
		-1,
	);
	const lastFast = records.reduce(
		(last, record, index) =>
			record.exitCode === 0 && isFastLadderCommand(record.command)
				? index
				: last,
		-1,
	);
	if (lastFast < 0)
		return [
			`verify.mjs fast: PASS is claimed for ${verifyIds.join(", ")} without a successful fast-ladder command in this run's events`,
		];
	if (lastFast < lastCommit)
		return [
			"verify.mjs fast: the last successful fast-ladder command precedes the last successful git commit in this run's events",
		];
	return [];
}

async function reportClaimFailures(
	report,
	brief,
	metadata,
	run,
	delivers,
	events,
) {
	const activity = await readRunActivity(run, metadata.worktree);
	const rowMatch = await matchReportRows(report, activity, {
		worktree: metadata.worktree,
		freshEvidence: delivers === "commit",
	});
	const failures = [...report.failures, ...rowMatch.failures];
	let claimed = { resolved: [], head: null, matching: null };
	if (delivers === "commit") {
		claimed = resolveCommitClaim(
			report.commitShas,
			metadata.worktree,
			metadata.head,
		);
		failures.push(...claimed.failures);
		if (claimed.resolved.length) {
			failures.push(
				...lineageAndDiffFailures(
					metadata.worktree,
					claimed.head,
					claimed.matching,
					metadata.head,
				),
			);
			failures.push(
				...commitRecordFailures(
					activity.records,
					metadata.worktree,
					claimed.head,
				),
			);
		}
		const verifyIds = [...passedIds(report)].filter((id) =>
			/\bverify\.mjs[ \t]+fast\b|\bverify:fast\b/i.test(
				outcomeTextFromBrief(brief, id),
			),
		);
		if (verifyIds.length)
			failures.push(...ladderRecordFailures(activity.records, verifyIds));
	}
	const record = {
		events: path.basename(events),
		accepted: false,
		stopped: report.stopped,
		delivers,
		commitSha: report.commitShas[0] ?? null,
		commitResolved:
			claimed.matching?.resolved ?? claimed.resolved[0]?.resolved ?? null,
		rows: rowMatch.rows,
		refusals: failures,
	};
	return { failures, record };
}

export { recordTurn, reportClaimFailures };
