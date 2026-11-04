// Probe wait and decision behavior through the shared command contract.
import {
	appendFileSync,
	mkdirSync,
	mkdtempSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect } from "vitest";
import { readDecision } from "./decision.mjs";
import { toolEntry } from "./tool-contract.mjs";
import { type Probe, repository, runNode } from "./tool-contract-probes";

function temporaryRoot(prefix: string) {
	return mkdtempSync(path.join(tmpdir(), `fitway-${prefix}-`));
}

function write(root: string, relative: string, text: string) {
	const file = path.join(root, relative);
	mkdirSync(path.dirname(file), { recursive: true });
	writeFileSync(file, text);
	return file;
}

function fixture(decisions?: string, standing?: string | null) {
	const root = temporaryRoot("decision-case");
	const value =
		standing === undefined
			? "docs/phase-records/handoffs/elsewhere/DECISIONS.md"
			: standing;
	write(
		root,
		"docs/phase-records/handoffs/nested/fixture-r01-resume.md",
		value === null
			? "# Resume\n\nNo standing line.\n"
			: `# Resume\n\n- **Standing decisions:** \`${value}\` (fixture)\n`,
	);
	if (decisions !== undefined)
		write(
			root,
			"docs/phase-records/handoffs/elsewhere/DECISIONS.md",
			decisions,
		);
	return root;
}

function expectedItemWithTrailingBlank(source: string, lines: string[]) {
	return [source, ...lines, "", ""].join("\n");
}

function runWait(args: string[], afterSpawn?: () => void) {
	const entry = toolEntry("wait");
	return runNode({
		invocation: entry.invocation,
		args,
		commandName: entry.name,
		afterSpawn,
	});
}

async function timeoutResult(file: string) {
	const result = await runWait([file, "--pattern", "never", "--timeout", "1"]);
	expect(result.status).toBe(1);
	expect(result.stdout).toBe("");
	expect(result.stderr).toContain("never");
	return result;
}

async function withRoot<T>(root: string, run: () => Promise<T>) {
	try {
		return await run();
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
}

function waitImmediateProbes(): Probe[] {
	return [
		{
			label: "wait prints a matching line already in the file",
			run: async () => {
				const root = temporaryRoot("wait-existing");
				const file = path.join(root, "existing.log");
				writeFileSync(file, "before\nneedle is ready\nafter\n");
				await withRoot(root, async () => {
					const result = await runWait([file, "--pattern", "^needle"]);
					expect(result.status, result.stderr).toBe(0);
					expect(result.stdout).toBe("needle is ready\n");
					expect(result.stderr).toBe("");
				});
			},
		},
		{
			label: "wait accepts a file absent at the start",
			run: async () => {
				const root = temporaryRoot("wait-absent");
				const file = path.join(root, "later.log");
				await withRoot(root, async () => {
					const result = await runWait(
						[file, "--pattern", "ready", "--timeout", "3"],
						() => setTimeout(() => writeFileSync(file, "ready\n"), 100),
					);
					expect(result.status, result.stderr).toBe(0);
					expect(result.stdout).toBe("ready\n");
				});
			},
		},
	];
}

function waitIncrementalProbes(): Probe[] {
	return [
		{
			label: "wait reads only bytes appended after its first check",
			run: async () => {
				const root = temporaryRoot("wait-append");
				const file = path.join(root, "append.log");
				writeFileSync(file, "old line\n".repeat(1_000));
				await withRoot(root, async () => {
					const result = await runWait(
						[file, "--pattern", "appended", "--timeout", "4"],
						() =>
							setTimeout(
								() => appendFileSync(file, "appended match\nafter\n"),
								1_200,
							),
					);
					expect(result.status, result.stderr).toBe(0);
					expect(result.stdout).toBe("appended match\n");
				});
			},
		},
		{
			label: "wait does not match a partial line that completes differently",
			run: async () => {
				const root = temporaryRoot("wait-partial");
				const file = path.join(root, "partial.log");
				writeFileSync(file, "partial");
				await withRoot(root, async () => {
					const result = await runWait(
						[file, "--pattern", "^partial$|^needle$", "--timeout", "5"],
						() => {
							setTimeout(() => appendFileSync(file, "-changed\n"), 1_200);
							setTimeout(() => appendFileSync(file, "needle\n"), 2_400);
						},
					);
					expect(result.status, result.stderr).toBe(0);
					expect(result.stdout).toBe("needle\n");
				});
			},
		},
	];
}

function waitTimeoutProbes(): Probe[] {
	return [
		{
			label: "wait timeout names the pattern and last line",
			run: async () => {
				const root = temporaryRoot("wait-timeout");
				const file = path.join(root, "timeout.log");
				writeFileSync(file, "first\nlast line\n");
				await withRoot(root, async () => {
					const result = await timeoutResult(file);
					expect(result.stderr).toContain("last line");
					expect(result.stderr.trim().split(/\r?\n/)).toHaveLength(1);
				});
			},
		},
		{
			label: "wait timeout reports a file that never appeared",
			run: async () => {
				const root = temporaryRoot("wait-never");
				const file = path.join(root, "never.log");
				await withRoot(root, async () => {
					const result = await timeoutResult(file);
					expect(result.stderr).toContain("never appeared");
					expect(result.stderr.trim().split(/\r?\n/)).toHaveLength(1);
				});
			},
		},
	];
}

function waitUsageProbes(): Probe[] {
	return [
		{
			label: "wait refuses an invalid pattern and prints why",
			run: async () => {
				const root = temporaryRoot("wait-invalid-pattern");
				const file = path.join(root, "invalid.log");
				writeFileSync(file, "anything\n");
				await withRoot(root, async () => {
					const result = await runWait([file, "--pattern", "["]);
					expect(result.status).toBe(1);
					expect(result.stderr).toMatch(/^wait: FAIL: invalid --pattern/);
					expect(result.stderr).toContain("pnpm wait");
					expect(result.stdout).toBe("");
				});
			},
		},
		{
			label: "wait help prints the default timeout",
			run: async () => {
				const result = await runWait(["--help"]);
				expect(result.status, result.stderr).toBe(0);
				expect(result.stdout.startsWith("Usage: pnpm wait ")).toBe(true);
				expect(result.stdout).toContain("Default: 600 seconds.");
			},
		},
	];
}

function waitSideEffectProbe(): Probe {
	return {
		label: "wait performs no file or process mutations",
		run: async () => {
			const root = temporaryRoot("wait-read-only");
			const file = path.join(root, "read-only.log");
			writeFileSync(file, "ready\n");
			await withRoot(root, async () => {
				const result = await runWait([file, "--pattern", "ready"]);
				expect(result.status, result.stderr).toBe(0);
				expect(result.events).toEqual([]);
			});
		},
	};
}

function indexedDecisionProbe(): Probe {
	return {
		label: "decision follows an index line to its part",
		run: async () => {
			const root = fixture(
				"# Decisions\n\n4. **Indexed title** `parts/odd-folder/items.md`\n\n",
			);
			write(
				root,
				"docs/phase-records/handoffs/elsewhere/parts/odd-folder/items.md",
				[
					"# Part",
					"",
					"3. **Earlier item**",
					"   Earlier body.",
					"",
					"4. **Indexed title**",
					"   Full body.",
					"",
					"   - Indented detail.",
					"",
					"## Next section",
					"",
				].join("\n"),
			);
			await withRoot(root, async () => {
				await expect(
					readDecision("fixture-r01", 4, { repositoryRoot: root }),
				).resolves.toBe(
					expectedItemWithTrailingBlank(
						"docs/phase-records/handoffs/elsewhere/parts/odd-folder/items.md",
						[
							"4. **Indexed title**",
							"   Full body.",
							"",
							"   - Indented detail.",
						],
					),
				);
			});
		},
	};
}

function fullDecisionProbe(): Probe {
	return {
		label: "decision reads a full item from the index",
		run: async () => {
			const root = fixture(
				[
					"# Decisions",
					"",
					"2. **A decision held in the index** (fixture)",
					"   Its first continuation.",
					"",
					"   Its second paragraph.",
					"",
					"3. **Next decision**",
					"   Outside the requested item.",
					"",
				].join("\n"),
			);
			await withRoot(root, async () => {
				await expect(
					readDecision("fixture-r01", 2, { repositoryRoot: root }),
				).resolves.toBe(
					expectedItemWithTrailingBlank(
						"docs/phase-records/handoffs/elsewhere/DECISIONS.md",
						[
							"2. **A decision held in the index** (fixture)",
							"   Its first continuation.",
							"",
							"   Its second paragraph.",
						],
					),
				);
			});
		},
	};
}

function mixedDecisionProbe(): Probe {
	return {
		label: "decision reads full and indexed items from one mixed file",
		run: async () => {
			const root = fixture(
				[
					"# Decisions",
					"",
					"1. **The full item**",
					"   Full body.",
					"",
					"2. **The indexed item** `later/part.md`",
					"",
				].join("\n"),
			);
			write(
				root,
				"docs/phase-records/handoffs/elsewhere/later/part.md",
				"# Part\n\n2. **The indexed item**\n   Part body.\n\n",
			);
			await withRoot(root, async () => {
				await expect(
					readDecision("fixture-r01", 1, { repositoryRoot: root }),
				).resolves.toContain("1. **The full item**\n   Full body.");
				await expect(
					readDecision("fixture-r01", 2, { repositoryRoot: root }),
				).resolves.toBe(
					expectedItemWithTrailingBlank(
						"docs/phase-records/handoffs/elsewhere/later/part.md",
						["2. **The indexed item**", "   Part body."],
					),
				);
			});
		},
	};
}

function decisionFailureProbes(): Probe[] {
	return [
		{
			label: "decision reports an unknown milestone in one sentence",
			run: async () => {
				const root = temporaryRoot("decision-unknown");
				await withRoot(root, async () => {
					await expect(
						readDecision("unknown-r01", 1, { repositoryRoot: root }),
					).rejects.toThrow(
						/^decision: FAIL: milestone "unknown-r01".*unknown-r01-resume\.md.*highest item number there is none\.$/,
					);
				});
			},
		},
		{
			label: "decision reports a resume with no standing line",
			run: async () => {
				const root = fixture(undefined, null);
				await withRoot(root, async () => {
					await expect(
						readDecision("fixture-r01", 1, { repositoryRoot: root }),
					).rejects.toThrow(
						/^decision: FAIL: .*Standing decisions.*highest item number there is none\.$/,
					);
				});
			},
		},
		{
			label: "decision reports a missing decisions file",
			run: async () => {
				const root = fixture();
				await withRoot(root, async () => {
					await expect(
						readDecision("fixture-r01", 1, { repositoryRoot: root }),
					).rejects.toThrow(
						/^decision: FAIL: .*DECISIONS\.md.*highest item number there is none\.$/,
					);
				});
			},
		},
		{
			label: "decision reports an absent item and the highest item there",
			run: async () => {
				const root = fixture("1. **One**\n\n2. **Two**\n\n4. **Four**\n");
				await withRoot(root, async () => {
					await expect(
						readDecision("fixture-r01", 3, { repositoryRoot: root }),
					).rejects.toThrow(
						/^decision: FAIL: .*item 3.*highest item number there is 4\.$/,
					);
				});
			},
		},
	];
}

function realDecisionProbes(): Probe[] {
	return [
		{
			label: "decision prints agent-environment-r03 item 3",
			run: async () => {
				await expect(
					readDecision("agent-environment-r03", 3, {
						repositoryRoot: repository,
					}),
				).resolves.toMatch(
					/^docs\/phase-records\/handoffs\/agent-environment\/DECISIONS\.md\n3\. \*\*The least sufficient context/,
				);
			},
		},
		{
			label: "decision prints agent-tooling-r01 item 26",
			run: async () => {
				await expect(
					readDecision("agent-tooling-r01", 26, {
						repositoryRoot: repository,
					}),
				).resolves.toMatch(
					/^docs\/phase-records\/handoffs\/agent-tooling\/decisions\/025-040\.md\n26\. \*\*The retrospective's tooling lessons/,
				);
			},
		},
		{
			label: "decision prints public-redesign-r01 item 67",
			run: async () => {
				await expect(
					readDecision("public-redesign-r01", 67, {
						repositoryRoot: repository,
					}),
				).resolves.toMatch(
					/^docs\/phase-records\/handoffs\/public-redesign\/decisions\/061-080\.md\n67\. \*\*The user's answers/,
				);
			},
		},
	];
}

export function waitDecisionProbes(): Probe[] {
	return [
		...waitImmediateProbes(),
		...waitIncrementalProbes(),
		...waitTimeoutProbes(),
		...waitUsageProbes(),
		waitSideEffectProbe(),
		indexedDecisionProbe(),
		fullDecisionProbe(),
		mixedDecisionProbe(),
		...decisionFailureProbes(),
		...realDecisionProbes(),
	];
}
