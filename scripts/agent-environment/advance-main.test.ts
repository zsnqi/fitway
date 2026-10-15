import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { advanceMain } from "./advance-main.mjs";

const roots: string[] = [];

afterEach(() => {
	for (const root of roots.splice(0)) {
		rmSync(root, { recursive: true, force: true });
	}
});

function git(cwd: string, ...args: string[]): string {
	return execFileSync("git", args, {
		cwd,
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
		windowsHide: true,
	}).trim();
}

function remoteMain(remote: string): string {
	return execFileSync(
		"git",
		["--git-dir", remote, "rev-parse", "refs/heads/main"],
		{ encoding: "utf8", windowsHide: true },
	).trim();
}

function successRun(sha: string, createdAt = "2026-10-15T10:00:00Z") {
	return {
		databaseId: 1,
		status: "completed",
		conclusion: "success",
		createdAt,
		headSha: sha,
	};
}

function fixture({ pushed = true, diverged = false } = {}) {
	const root = mkdtempSync(path.join(tmpdir(), "fitway-main-advance-"));
	roots.push(root);
	const remote = path.join(root, "remote.git");
	const local = path.join(root, "local");
	mkdirSync(local);
	git(root, "init", "--bare", "--initial-branch=main", remote);
	git(local, "init", "--initial-branch=main");
	git(local, "config", "user.name", "Fixture");
	git(local, "config", "user.email", "fixture@example.invalid");
	git(local, "config", "commit.gpgsign", "false");
	writeFileSync(path.join(local, "base.txt"), "base\n");
	git(local, "add", ".");
	git(local, "commit", "-m", "base");
	git(local, "remote", "add", "origin", remote);
	git(local, "push", "--set-upstream", "origin", "main");
	git(local, "checkout", "-b", "candidate");
	writeFileSync(path.join(local, "candidate.txt"), "candidate\n");
	git(local, "add", ".");
	git(local, "commit", "-m", "candidate");
	const candidate = git(local, "rev-parse", "HEAD");
	if (pushed) git(local, "push", "--set-upstream", "origin", "candidate");
	if (diverged) {
		git(local, "checkout", "main");
		writeFileSync(path.join(local, "diverged.txt"), "diverged\n");
		git(local, "add", ".");
		git(local, "commit", "-m", "diverge main");
		git(local, "push", "origin", "main");
	}
	return { root, remote, local, candidate };
}

describe("main:advance", () => {
	it("refuses a commit that is not pushed", async () => {
		const f = fixture({ pushed: false });
		const before = remoteMain(f.remote);
		await expect(
			advanceMain({
				commit: f.candidate,
				cwd: f.local,
				listRuns: async () => [successRun(f.candidate)],
			}),
		).rejects.toThrow(/not pushed/);
		expect(remoteMain(f.remote)).toBe(before);
	});

	it("refuses a non-fast-forward move", async () => {
		const f = fixture({ diverged: true });
		const before = remoteMain(f.remote);
		await expect(
			advanceMain({
				commit: f.candidate,
				cwd: f.local,
				listRuns: async () => [successRun(f.candidate)],
			}),
		).rejects.toThrow(/not an ancestor/);
		expect(remoteMain(f.remote)).toBe(before);
	});

	it("refuses a queued or in-progress run", async () => {
		const f = fixture();
		const before = remoteMain(f.remote);
		await expect(
			advanceMain({
				commit: f.candidate,
				cwd: f.local,
				listRuns: async () => [
					{
						...successRun(f.candidate),
						status: "in_progress",
						conclusion: null,
					},
				],
			}),
		).rejects.toThrow(/is in_progress/);
		expect(remoteMain(f.remote)).toBe(before);
	});

	it("refuses the newest failed run even when an older run passed", async () => {
		const f = fixture();
		const before = remoteMain(f.remote);
		await expect(
			advanceMain({
				commit: f.candidate,
				cwd: f.local,
				listRuns: async () => [
					successRun(f.candidate, "2026-10-15T09:00:00Z"),
					{
						...successRun(f.candidate, "2026-10-15T10:00:00Z"),
						databaseId: 2,
						conclusion: "failure",
					},
				],
			}),
		).rejects.toThrow(/newest .* concluded failure/);
		expect(remoteMain(f.remote)).toBe(before);
	});

	it("checks CI again immediately before pushing", async () => {
		const f = fixture();
		const before = remoteMain(f.remote);
		let calls = 0;
		await expect(
			advanceMain({
				commit: f.candidate,
				cwd: f.local,
				listRuns: async () => {
					calls += 1;
					if (calls === 1) return [successRun(f.candidate)];
					return [
						{
							...successRun(f.candidate),
							status: "queued",
							conclusion: null,
						},
					];
				},
			}),
		).rejects.toThrow(/is queued/);
		expect(calls).toBe(2);
		expect(remoteMain(f.remote)).toBe(before);
	});

	it("dry-run makes every check and pushes nothing", async () => {
		const f = fixture();
		const before = remoteMain(f.remote);
		const result = await advanceMain({
			commit: f.candidate,
			cwd: f.local,
			dryRun: true,
			listRuns: async () => [successRun(f.candidate)],
		});
		expect(result).toMatchObject({
			sha: f.candidate,
			previous: before,
			dryRun: true,
		});
		expect(remoteMain(f.remote)).toBe(before);
	});

	it("moves remote main only after two green checks", async () => {
		const f = fixture();
		const before = remoteMain(f.remote);
		const result = await advanceMain({
			commit: f.candidate,
			cwd: f.local,
			listRuns: async () => [successRun(f.candidate)],
		});
		expect(result).toMatchObject({
			sha: f.candidate,
			previous: before,
			dryRun: false,
		});
		expect(remoteMain(f.remote)).toBe(f.candidate);
	});
});
