// code-health-exception: giantFiles; until=2026-11-15; reason=giant-split moved imported names; the giant test files split next
import { execFileSync, spawnSync } from "node:child_process";
import {
	copyFileSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { afterEach, describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import { TERMINAL_STATUSES } from "./agent-context-rules.mjs";
import {
	assertProjectRecordUnion,
	assertProjectStateInvariants,
	scopePatterns,
} from "./project-state-invariants.mjs";
import { TRACKED_BOM_EXCEPTIONS } from "./repository-files.mjs";
import {
	assertClaudeAgentTable,
	assertGardenerReport,
	assertNoUnexpectedBom,
	listTrackedFiles,
	verifyGardenerRecord,
} from "./verify-repository.mjs";

const stateSchema = JSON.parse(
	readFileSync(
		new URL("../docs/schemas/project-state.schema.json", import.meta.url),
		"utf8",
	),
);
const historySchema = JSON.parse(
	readFileSync(
		new URL(
			"../docs/schemas/project-state-history.schema.json",
			import.meta.url,
		),
		"utf8",
	),
);
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
ajv.addSchema(stateSchema);
const validateState = ajv.compile(stateSchema);
const validateHistory = ajv.compile(historySchema);

const INTEGRATED_COMMIT = "4df79885ef7e039dcf2d27eb87cf41f8c78b73e2";
const UPDATED_AT = "2026-09-15T14:35:00+03:00";
const REAL_REPOSITORY = fileURLToPath(new URL("../", import.meta.url));
const temporaryRoots: string[] = [];

afterEach(() => {
	for (const root of temporaryRoots.splice(0)) {
		rmSync(root, { recursive: true, force: true });
	}
});

function committedAgentFixture(commit: string) {
	const root = mkdtempSync(path.join(tmpdir(), "fitway-agent-table-"));
	temporaryRoots.push(root);
	writeFileSync(
		path.join(root, "CLAUDE.md"),
		execFileSync("git", ["show", `${commit}:CLAUDE.md`], {
			cwd: REAL_REPOSITORY,
			encoding: "utf8",
		}),
	);
	const trackedFiles = execFileSync(
		"git",
		["ls-tree", "-r", "--name-only", commit, "--", ".claude/agents"],
		{
			cwd: REAL_REPOSITORY,
			encoding: "utf8",
		},
	)
		.trim()
		.split(/\r?\n/)
		.filter(Boolean)
		.map((entry) => entry.replaceAll("\\", "/"));
	for (const relativePath of trackedFiles) {
		const target = path.join(root, relativePath);
		mkdirSync(path.dirname(target), { recursive: true });
		writeFileSync(
			target,
			execFileSync("git", ["show", `${commit}:${relativePath}`], {
				cwd: REAL_REPOSITORY,
			}),
		);
	}
	return { root, trackedFiles };
}

function milestone(overrides: Record<string, unknown> = {}) {
	return {
		status: "DONE",
		dependencies: [],
		ownerSession: null,
		branch: null,
		worktree: null,
		baseCommit: null,
		ownedPaths: [],
		forbiddenPaths: [],
		sharedLeases: [],
		validationRepairAttempts: 0,
		handoff: null,
		stopReason: null,
		gates: {
			unit: "PASS",
			integration: "NOT_REQUIRED",
			browser: "PASS",
			accessibility: "PASS",
			visual: "PASS",
			independentReview: "PASS",
		},
		integratedCommit: INTEGRATED_COMMIT,
		...overrides,
	};
}

function activeMilestone(overrides: Record<string, unknown> = {}) {
	return milestone({
		status: "IN_PROGRESS",
		objective: "Validate the active migration frontier",
		taskClass: "repository-infrastructure",
		taskPacket: "docs/phase-records/task-packets/active-frontier.yaml",
		taskPacketSha256: "a".repeat(64),
		ownerSession: "coordinator-session",
		...overrides,
	});
}

function historyState(overrides: Record<string, unknown> = {}) {
	return {
		schemaVersion: 1,
		updatedAt: UPDATED_AT,
		milestones: { "closed-record": milestone() },
		...overrides,
	};
}

function activeState(overrides: Record<string, unknown> = {}) {
	return {
		schemaVersion: 2,
		updatedAt: UPDATED_AT,
		coordinator: {
			owner: "coordinator",
			stateFilePolicy: "coordinator-only",
		},
		baseline: {
			status: "DONE",
			branch: "main",
			integratedCommit: INTEGRATED_COMMIT,
			preservation: {
				mainCandidate: {
					branch: "preserve/main",
					commit: "b3a1d09217196d9c8f22b7f7f556a24ff722588f",
				},
				approvedVisualLab: {
					branch: "preserve/visual",
					commit: "40c4abd1c8aaa4806662af44c0036f9a93bcc8be",
				},
			},
			visualManifest: "visual-direction-gate/approved/APPROVAL_MANIFEST.yaml",
			validationRecord: null,
			independentVerification: null,
		},
		milestones: {
			"active-frontier": activeMilestone(),
		},
		...overrides,
	};
}

function withoutStopReason(record: Record<string, unknown>) {
	return Object.fromEntries(
		Object.entries(record).filter(([key]) => key !== "stopReason"),
	);
}

describe("project-state schemas", () => {
	it("checks the optional gardener report once even when there are no open milestones", async () => {
		const gardener = {
			date: "2026-09-15",
			outcome: "blocked",
			report: ".agents/skills/gardener/REPORT.md",
		};
		const state = activeState({ milestones: {}, gardener });
		let reads = 0;
		await verifyGardenerRecord(state, async (file: string) => {
			reads++;
			expect(file).toBe(gardener.report);
			return Buffer.from("---\ndate: '2026-09-15'\noutcome: blocked\n---\n");
		});
		expect(reads).toBe(1);
		await expect(
			verifyGardenerRecord(state, async () => {
				throw new Error("ENOENT");
			}),
		).rejects.toThrow("ENOENT");
		await verifyGardenerRecord(activeState({ milestones: {} }), async () => {
			throw new Error("should not read");
		});
	});
	it("accepts one optional gardener entry and rejects malformed entries", () => {
		const gardener = {
			date: "2026-09-15",
			outcome: "blocked",
			report: ".agents/skills/gardener/REPORT.md",
		};
		expect(validateState(activeState())).toBe(true);
		for (const outcome of ["clean", "changed", "blocked"]) {
			expect(
				validateState(activeState({ gardener: { ...gardener, outcome } })),
			).toBe(true);
		}
		for (const bad of [
			null,
			[],
			[gardener],
			{ ...gardener, date: "2026-02-30" },
			{ ...gardener, outcome: "PASS" },
			{ ...gardener, report: "../REPORT.md" },
			{ ...gardener, report: "D:/fitway-temp/report.md" },
			{ ...gardener, extra: true },
			{ date: gardener.date, outcome: gardener.outcome },
		]) {
			expect(validateState(activeState({ gardener: bad }))).toBe(false);
		}
		expect(validateHistory(historyState({ gardener }))).toBe(false);
	});
	it("validates the rolling report's date and outcome against the ledger", () => {
		const entry = { date: "2026-09-15", outcome: "blocked" };
		const text = "---\ndate: '2026-09-15'\noutcome: blocked\n---\n# Report\n";
		expect(() => assertGardenerReport(entry, text, UPDATED_AT)).not.toThrow();
		for (const bad of [
			"# Report",
			text.replace("blocked", "clean"),
			text.replace("2026-09-15", "2026-09-14"),
		]) {
			expect(() => assertGardenerReport(entry, bad, UPDATED_AT)).toThrow(
				/Gardener/,
			);
		}
		expect(() =>
			assertGardenerReport(entry, text, "2026-09-14T00:00:00Z"),
		).toThrow(/later/);
	});
	it("accepts a valid active-shaped document and rejects it in the history schema", () => {
		expect(validateState(activeState())).toBe(true);
		expect(validateHistory(activeState())).toBe(false);
	});

	it("accepts a valid history-shaped document and rejects it in the active schema", () => {
		expect(validateHistory(historyState())).toBe(true);
		expect(validateState(historyState())).toBe(false);
	});

	it("rejects a history-shaped document carrying coordinator or baseline", () => {
		const active = activeState();
		expect(
			validateHistory(historyState({ coordinator: active.coordinator })),
		).toBe(false);
		expect(validateHistory(historyState({ baseline: active.baseline }))).toBe(
			false,
		);
	});

	it("rejects unknown root keys in each shape", () => {
		expect(validateHistory(historyState({ archiveIndex: "legacy" }))).toBe(
			false,
		);
		expect(validateState(activeState({ archiveIndex: "legacy" }))).toBe(false);
	});

	it("accepts optional schema-version 1 packet fields and rejects malformed or unknown fields", () => {
		const packetFields = {
			taskClass: "backend-api-data",
			taskPacket: "docs/phase-records/task-packets/example-task.yaml",
			taskPacketSha256: "a".repeat(64),
		};
		expect(
			validateState(
				activeState({
					milestones: { "active-frontier": activeMilestone(packetFields) },
				}),
			),
		).toBe(true);
		expect(
			validateHistory(
				historyState({
					milestones: { "closed-record": milestone(packetFields) },
				}),
			),
		).toBe(true);

		const malformed = [
			{ taskPacket: "docs/phase-records/task-packets/Example-task.yaml" },
			{ taskPacket: "docs/phase-records/task-packets/example-task.json" },
			{ taskPacket: "docs/phase-records/task-packets/../escape.yaml" },
			{ packetStatus: "READY" },
		];
		for (const entry of malformed) {
			expect(
				validateState(
					activeState({
						milestones: {
							"active-frontier": activeMilestone({ ...packetFields, ...entry }),
						},
					}),
				),
			).toBe(false);
		}
	});

	it("rejects a milestone missing a required field in both shapes", () => {
		expect(
			validateState(
				activeState({
					milestones: {
						"active-frontier": withoutStopReason(activeMilestone()),
					},
				}),
			),
		).toBe(false);
		expect(
			validateHistory(
				historyState({
					milestones: { "closed-record": withoutStopReason(milestone()) },
				}),
			),
		).toBe(false);
	});

	it("rejects an open status in history", () => {
		expect(
			validateHistory(
				historyState({
					milestones: {
						"reopened-record": milestone({ status: "IN_PROGRESS" }),
					},
				}),
			),
		).toBe(false);
	});

	it("allows an empty active v2 state while requiring strict open milestone metadata", () => {
		expect(validateState(activeState({ milestones: {} }))).toBe(true);
		expect(
			validateState(
				activeState({
					milestones: {
						"active-frontier": {
							...(activeState().milestones as Record<string, unknown>)[
								"active-frontier"
							],
							status: "DONE",
						},
					},
				}),
			),
		).toBe(false);
		expect(
			validateState(
				activeState({
					milestones: {
						"active-frontier": activeMilestone({ ownerSession: null }),
					},
				}),
			),
		).toBe(false);
		expect(
			validateState(
				activeState({
					milestones: {
						"active-frontier": activeMilestone({
							ownerSession: "owner session prose",
						}),
					},
				}),
			),
		).toBe(false);
		expect(
			validateState(
				activeState({
					milestones: {
						"active-frontier": {
							...(activeState().milestones as Record<string, unknown>)[
								"active-frontier"
							],
							objective: undefined,
						},
					},
				}),
			),
		).toBe(false);
		expect(
			validateState(
				activeState({
					milestones: {
						"active-frontier": {
							...(activeState().milestones as Record<string, unknown>)[
								"active-frontier"
							],
							ownerSession: "x".repeat(129),
						},
					},
				}),
			),
		).toBe(false);
	});

	it("keeps frozen historical owner narratives valid", () => {
		expect(
			validateHistory(
				historyState({
					milestones: {
						closed: milestone({
							ownerSession: "historical narrative ".repeat(40),
						}),
					},
				}),
			),
		).toBe(true);
	});
	it("M2/M3: active schema requires no clock, pin or ledger task class", () => {
		const record = activeMilestone();
		delete (record as Record<string, unknown>).taskClass;
		delete (record as Record<string, unknown>).taskPacketSha256;
		expect(
			validateState(activeState({ milestones: { "active-frontier": record } })),
		).toBe(true);
	});
	it("M1: SUPERSEDED requires a stop reason and successor, and other statuses forbid it", () => {
		const valid = milestone({
			status: "SUPERSEDED",
			stopReason: "Carried by the successor",
			supersededBy: "successor",
		});
		expect(
			validateHistory(historyState({ milestones: { closed: valid } })),
		).toBe(true);
		for (const change of [
			{ supersededBy: undefined },
			{ supersededBy: "" },
			{ stopReason: null },
			{ stopReason: "" },
			{ stopReason: "   " },
		]) {
			expect(
				validateHistory(
					historyState({ milestones: { closed: { ...valid, ...change } } }),
				),
			).toBe(false);
		}
		for (const status of [
			"DONE",
			"BLOCKED",
			"NEEDS_HUMAN",
			"FAILED_VALIDATION",
		]) {
			expect(
				validateHistory(
					historyState({
						milestones: {
							closed: {
								...valid,
								status,
								stopReason: status === "DONE" ? null : "Stopped",
							},
						},
					}),
				),
			).toBe(false);
		}
	});
});

describe("R1: check:repository supersededBy diagnostics before schema errors", () => {
	it.each([
		"ledger",
		"history",
		"both",
	])("K5: names every misplaced supersededBy in %s", (location) => {
		const repository = fileURLToPath(new URL("../", import.meta.url));
		const root = mkdtempSync(
			path.join(tmpdir(), "fitway-repository-diagnostic-"),
		);
		try {
			const required = [
				"AGENTS.md",
				"FITWAY_PRODUCT.md",
				"SPEC.md",
				"DESIGN_GUIDE.md",
				"PHASES.md",
				"RESEARCH.md",
				"README.md",
				"docs/WORKFLOW.md",
				"docs/POLISH_BACKLOG.md",
				"visual-direction-gate/approved/APPROVAL_MANIFEST.yaml",
			];
			for (const file of required) {
				mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
				writeFileSync(path.join(root, file), "fixture\n");
			}
			for (const file of [
				"docs/schemas/project-state.schema.json",
				"docs/schemas/project-state-history.schema.json",
			]) {
				mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
				copyFileSync(path.join(repository, file), path.join(root, file));
			}
			execFileSync("git", ["init", "-q"], { cwd: root, windowsHide: true });
			execFileSync(
				"git",
				[
					"-c",
					"user.name=Fixture",
					"-c",
					"user.email=fixture@example.invalid",
					"-c",
					"commit.gpgsign=false",
					"-c",
					"core.hooksPath=disabled-hooks",
					"commit",
					"--allow-empty",
					"-qm",
					"fixture",
				],
				{ cwd: root, windowsHide: true },
			);
			for (const status of ["DONE", "SUPERSEDED"]) {
				const record =
					location === "ledger"
						? activeMilestone({ status: "PLANNED", supersededBy: "successor" })
						: milestone({ supersededBy: "successor" });
				if (status === "SUPERSEDED") {
					record.status = status;
					record.stopReason = "Carried forward";
					delete (record as Record<string, unknown>).supersededBy;
				}
				const faultyRecords = {
					"faulty-milestone": record,
					"another-faulty-milestone": { ...record },
				};
				writeFileSync(
					path.join(root, "PROJECT_STATE.yaml"),
					JSON.stringify(
						activeState({
							milestones: location !== "history" ? faultyRecords : {},
						}),
					),
				);
				writeFileSync(
					path.join(root, "PROJECT_STATE_HISTORY.yaml"),
					JSON.stringify(
						historyState({
							milestones: location !== "ledger" ? faultyRecords : {},
						}),
					),
				);
				const result = spawnSync(
					process.execPath,
					[path.join(repository, "scripts/verify-repository.mjs")],
					{ cwd: root, encoding: "utf8", windowsHide: true },
				);
				expect(result.status).toBe(1);
				const labels =
					location === "both"
						? ["PROJECT_STATE.yaml", "PROJECT_STATE_HISTORY.yaml"]
						: [
								location === "ledger"
									? "PROJECT_STATE.yaml"
									: "PROJECT_STATE_HISTORY.yaml",
							];
				const expected = labels.flatMap((label) =>
					Object.keys(faultyRecords).map(
						(id) =>
							`${label}: ${id}: ${
								status === "SUPERSEDED"
									? "SUPERSEDED requires non-empty supersededBy"
									: "only SUPERSEDED records may carry supersededBy"
							}`,
					),
				);
				expect(
					result.stderr
						.trim()
						.replace(/^FAILED_VALIDATION: /, "")
						.split(/\r?\n/),
				).toEqual(expected);
			}
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});
});

describe("R5: Impeccable discovery uses the running user's home", () => {
	it.each([
		".codex",
		".agents",
	])("finds the native engine under %s with no override or PATH engine", (folder) => {
		const repository = fileURLToPath(new URL("../", import.meta.url));
		const root = mkdtempSync(path.join(tmpdir(), "fitway-design-home-"));
		try {
			const binary = path.join(
				root,
				folder,
				"skills/impeccable/scripts/bin",
				`${process.platform === "win32" ? "windows" : process.platform}-${process.arch}`,
				process.platform === "win32" ? "impeccable.exe" : "impeccable",
			);
			mkdirSync(path.dirname(binary), { recursive: true });
			// Node answers --version, which proves discovery without requiring a global engine.
			copyFileSync(process.execPath, binary);
			const result = spawnSync(
				process.execPath,
				[path.join(repository, "scripts/check-design-context.mjs")],
				{
					cwd: repository,
					encoding: "utf8",
					windowsHide: true,
					env: {
						...process.env,
						HOME: root,
						USERPROFILE: root,
						PATH: root,
						IMPECCABLE_BIN: "",
					},
				},
			);
			expect(result.stdout).toContain(binary);
			expect(result.stdout).toContain("check:design-context: Impeccable");
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});
	it("lists PATH and both home locations when nothing runs", () => {
		const repository = fileURLToPath(new URL("../", import.meta.url));
		const root = mkdtempSync(path.join(tmpdir(), "fitway-design-missing-"));
		try {
			const result = spawnSync(
				process.execPath,
				[path.join(repository, "scripts/check-design-context.mjs")],
				{
					cwd: repository,
					encoding: "utf8",
					windowsHide: true,
					env: {
						...process.env,
						HOME: root,
						USERPROFILE: root,
						PATH: root,
						IMPECCABLE_BIN: "",
					},
				},
			);
			expect(result.status).toBe(1);
			expect(result.stderr).toContain("`impeccable` on PATH");
			for (const folder of [".codex", ".agents"])
				expect(result.stderr).toContain(
					path.join(root, folder, "skills/impeccable/scripts/bin"),
				);
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});
});

describe("R7: open milestone ownership intersections", () => {
	function records(
		left: string,
		right: string,
		leases: string[] = [],
		status = "IN_PROGRESS",
	) {
		const worker = (id: string, claim: string) =>
			activeMilestone({
				status,
				branch: id,
				worktree: `D:/fixture/${id}`,
				baseCommit: "abc1234",
				handoff: "fixture.md",
				ownedPaths: [claim],
				sharedLeases: id === "first" ? leases : [],
			});
		const state = activeState({
			baseline: {
				...activeState().baseline,
				validationRecord: "fixture.md",
				independentVerification: "fixture.md",
			},
			milestones: {
				first: worker("first", left),
				second: worker("second", right),
			},
		});
		const history = historyState({
			milestones: {
				"baseline-reconciliation-gate": milestone({
					gates: {
						unit: "PASS",
						integration: "PASS",
						browser: "PASS",
						accessibility: "PASS",
						visual: "PASS",
						independentReview: "PASS",
					},
				}),
			},
		});
		return { state, history };
	}
	it.each([
		["scripts/file.ts", "scripts/file.ts", "scripts/file.ts"],
		["scripts/*.ts", "scripts/check-*.ts", "scripts/check-"],
		["docs/", "docs/new.md", "docs/new.md"],
	])("L1: rejects two lease holders for %s and %s", (a, b, witness) => {
		const { state, history } = records("first/file.ts", "second/file.ts", [a]);
		state.milestones.second.sharedLeases = [b];
		expect(() => assertProjectRecordUnion(state, history)).toThrow(
			/first.*second.*sharedLeases/,
		);
		expect(() => assertProjectRecordUnion(state, history)).toThrow(witness);
	});
	it("L1: permits one holder on either side and ignores closed leases", () => {
		for (const holder of ["first", "second"] as const) {
			const { state, history } = records("scripts/file.ts", "scripts/**");
			state.milestones[holder].sharedLeases = ["scripts/file.ts"];
			(history.milestones as Record<string, unknown>).closed = milestone({
				sharedLeases: ["scripts/**"],
			});
			expect(() => assertProjectRecordUnion(state, history)).not.toThrow();
		}
	});
	it.each([
		[
			"one new document (and its companion) under docs/pointers/; earlier pointers stay unchanged",
			"docs/pointers/new.md",
			"docs/pointers/new.md",
		],
		[
			"packages/api/src/access/**, and its tests",
			"packages/api/src/access/new.ts",
			"packages/api/src/access/new.ts",
		],
		["Edit (SPEC.md), plus docs/new.md;", "SPEC.md", "SPEC.md"],
		["Edit (SPEC.md), plus docs/new.md;", "docs/new.md", "docs/new.md"],
	])("L2: finds path tokens in %s", (left, right, witness) => {
		const { state, history } = records(left, right);
		expect(() => assertProjectRecordUnion(state, history)).toThrow(witness);
	});
	it("L2: rejects an entry with no path and names the milestone and entry", () => {
		const entry = "one new policy document and its tests";
		const { state, history } = records(entry, "second/file.ts");
		expect(() => assertProjectRecordUnion(state, history)).toThrow(
			/first.*ownedPaths.*no repository path/,
		);
		expect(() => assertProjectRecordUnion(state, history)).toThrow(entry);
		state.milestones.first.ownedPaths = ["first/file.ts"];
		state.milestones.first.sharedLeases = [entry];
		expect(() => assertProjectRecordUnion(state, history)).toThrow(
			/first.*sharedLeases.*no repository path/,
		);
	});
	it("L2: extracts only whitespace-separated path tokens before colon-space", () => {
		const { state, history } = records(
			"future/my-file.md file.md",
			"future/my-file.md other.md",
		);
		expect(() => assertProjectRecordUnion(state, history)).toThrow(
			"future/my-file.md",
		);
		expect(
			scopePatterns([
				"packages/api/src/access/** and its tests",
				"future/my-file.md file.md",
				"one pointer (and its companion) under docs/pointers/; no other claim",
				"scripts/a.mjs and scripts/b.test.ts: ignore docs/other.md",
			]),
		).toEqual([
			"packages/api/src/access/**",
			"future/my-file.md",
			"file.md",
			"docs/pointers/**",
			"scripts/a.mjs",
			"scripts/b.test.ts",
		]);
	});
	it("L2: ignores paths after the first colon-space and prose words", () => {
		const { state, history } = records(
			"first/file.ts and its tests: docs/shared.md and second/file.ts",
			"second/file.ts",
		);
		expect(() => assertProjectRecordUnion(state, history)).not.toThrow();
	});
	it.each([
		"and/or",
		"RTL/LTR",
		"read/write",
		"layout/material",
		"either/or",
		"v1.2",
		"1.2.3",
	])("K3: never claims prose token %s", (prose) => {
		for (const token of [prose, `(${prose}),`, `\`${prose}\``]) {
			expect(
				scopePatterns([`${token} scripts/a.mjs: docs/ignored.md`]),
			).toEqual(["scripts/a.mjs"]);
			expect(() => scopePatterns([token])).toThrow(/no repository path/);
		}
		const { state, history } = records(
			`${prose} first/file.ts`,
			`${prose} second/file.ts`,
		);
		expect(() => assertProjectRecordUnion(state, history)).not.toThrow();
	});
	it("K3: keeps explicit path syntax, including extensionless paths", () => {
		expect(
			scopePatterns([
				"./future/my docs/LICENSE.md future/my/ docs/v1.2 scripts/*.mjs",
			]),
		).toEqual([
			"future/my",
			"docs/LICENSE.md",
			"future/my/**",
			"docs/v1.2",
			"scripts/*.mjs",
		]);
	});
	it("K3: ignores closed history scopes containing only prose", () => {
		const { state, history } = records("first/file.ts", "second/file.ts");
		(history.milestones as Record<string, unknown>).closed = milestone({
			ownedPaths: ["and/or layout/material v1.2"],
			sharedLeases: ["RTL/LTR read/write 1.2.3"],
		});
		expect(() => assertProjectRecordUnion(state, history)).not.toThrow();
	});
	it("K3: preserves every open milestone scope claim", () => {
		for (const file of ["PROJECT_STATE.yaml"]) {
			const records = parseYaml(
				readFileSync(new URL(`../${file}`, import.meta.url), "utf8"),
			);
			for (const [id, record] of Object.entries(records.milestones) as [
				string,
				{ status: string; ownedPaths?: string[]; sharedLeases?: string[] },
			][]) {
				if (TERMINAL_STATUSES.has(record.status)) continue;
				// These are the fields consumed by the ownership checker.
				for (const field of ["ownedPaths", "sharedLeases"] as const) {
					for (const entry of record[field] ?? []) {
						// Freeze the pre-K3 grammar here as a compatibility oracle.
						const before = entry
							.split(": ")[0]
							.split(/\s+/)
							.map((token) =>
								token
									.replace(/^[('"`]+|[.,;:)'"`]+$/g, "")
									.replaceAll("\\", "/"),
							)
							.filter((token) => token.includes("/") || /\.[\w-]+$/.test(token))
							.map((token) =>
								path.posix.normalize(
									token.endsWith("/") ? `${token}**` : token,
								),
							);
						if (before.length)
							expect(
								scopePatterns([entry]),
								`${file} ${id} ${field}: ${entry}`,
							).toEqual(before);
						else
							expect(
								() => scopePatterns([entry]),
								`${file} ${id} ${field}: ${entry}`,
							).toThrow(/no repository path/);
					}
				}
			}
		}
	});
	it.each([
		["future/my-file.md", "future/*.md", "future/my-file.md"],
		["future/./my.md", "future/my.md", "future/my.md"],
		["future/sub/../my.md", "future/my.md", "future/my.md"],
		["scripts/new.mjs", "scripts/new.mjs", "scripts/new.mjs"],
		["SPEC.md: one authorized line", "SPEC.md", "SPEC.md"],
		["scripts/**", "scripts/new.mjs", "scripts/new.mjs"],
		["scripts/*.mjs", "scripts/check-*.mjs", "scripts/check-"],
		["new/**/tests/*.ts", "new/features/**", "new/features/"],
		["scripts/check-?.mjs", "scripts/check-[a-c].mjs", "scripts/check-"],
		["docs/{api,ui}/**", "docs/ui/*.md", "docs/ui/"],
	])("rejects overlapping %s and %s with both ids and a witness", (left, right, witness) => {
		const { state, history } = records(left, right);
		expect(() => assertProjectRecordUnion(state, history)).toThrow(
			/first.*second|second.*first/,
		);
		expect(() => assertProjectRecordUnion(state, history)).toThrow(witness);
	});
	it("also compares PLANNED claims", () => {
		const { state, history } = records("new/file.ts", "new/**", [], "PLANNED");
		expect(() => assertProjectRecordUnion(state, history)).toThrow(
			/first.*second|second.*first/,
		);
	});
	it.each([
		["scripts/*.mjs", "scripts/deep/file.mjs"],
		["docs/api/**", "docs/ui/**"],
		["scripts/a?.mjs", "scripts/b*.mjs"],
		["future/my-file.md", "future/my-other.md"],
	])("accepts disjoint %s and %s", (left, right) => {
		const { state, history } = records(left, right);
		expect(() => assertProjectRecordUnion(state, history)).not.toThrow();
	});
	it("permits only leased shared paths, not unrelated leases or a single leased witness", () => {
		for (const leases of [["scripts/file.ts"], ["scripts/**"]]) {
			const { state, history } = records(
				"scripts/file.ts",
				"scripts/**",
				leases,
			);
			expect(() => assertProjectRecordUnion(state, history)).not.toThrow();
		}
		for (const leases of [["unrelated.ts"], ["scripts/file.ts"]]) {
			const { state, history } = records("scripts/**", "scripts/**", leases);
			expect(() => assertProjectRecordUnion(state, history)).toThrow(
				/first.*second|second.*first/,
			);
		}
	});
	it("ignores closed history claims and accepts the brief's ledger", () => {
		const { state, history } = records("scripts/a.mjs", "scripts/b.mjs");
		(history.milestones as Record<string, unknown>).closed = milestone({
			ownedPaths: ["scripts/**"],
		});
		expect(() => assertProjectRecordUnion(state, history)).not.toThrow();
		const read = (name: string) =>
			parseYaml(readFileSync(new URL(`../${name}`, import.meta.url), "utf8"));
		expect(() =>
			assertProjectRecordUnion(
				read("PROJECT_STATE.yaml"),
				read("PROJECT_STATE_HISTORY.yaml"),
			),
		).not.toThrow();
	});
});

describe("lease invariant", () => {
	const gates = {
		unit: "PASS",
		integration: "PASS",
		browser: "PASS",
		accessibility: "PASS",
		visual: "PASS",
		independentReview: "PASS",
	};
	function ledgerWithLease(leaseExpiresAt: string) {
		const baseline = {
			status: "DONE",
			dependencies: [],
			stopReason: null,
			integratedCommit: "abc1234",
			gates,
		};
		const milestone = {
			status: "IN_PROGRESS",
			dependencies: [],
			stopReason: null,
			ownerSession: "claude-code-desktop:test",
			branch: "lease-fixture",
			worktree: "D:/fixture",
			baseCommit: "abc1234",
			lastHeartbeatAt: UPDATED_AT,
			leaseExpiresAt,
			handoff: "docs/fixture.md",
			ownedPaths: ["docs/fixture/**"],
			sharedLeases: [],
			gates: { ...gates, unit: "PENDING" },
			integratedCommit: null,
		};
		const state = {
			updatedAt: UPDATED_AT,
			baseline: {
				status: "DONE",
				integratedCommit: "abc1234",
				validationRecord: "docs/validation.md",
				independentVerification: "docs/verification.md",
			},
			milestones: { "lease-fixture": milestone },
		};
		return {
			state,
			milestones: {
				"baseline-reconciliation-gate": baseline,
				"lease-fixture": milestone,
			},
		};
	}
	it("accepts a lease that was current when the ledger was written, whatever the wall clock says", () => {
		// The lease ends a day after the ledger's updatedAt and long before today: CI must still pass.
		const { state, milestones } = ledgerWithLease("2026-09-16T14:35:00+03:00");
		expect(() => assertProjectStateInvariants(state, milestones)).not.toThrow();
	});
	it("M2: ignores expired dates and accepts absent heartbeat and expiry", () => {
		const { state, milestones } = ledgerWithLease("2026-09-14T14:35:00+03:00");
		expect(() => assertProjectStateInvariants(state, milestones)).not.toThrow();
		delete (state.milestones["lease-fixture"] as Record<string, unknown>)
			.lastHeartbeatAt;
		delete (state.milestones["lease-fixture"] as Record<string, unknown>)
			.leaseExpiresAt;
		expect(() => assertProjectStateInvariants(state, milestones)).not.toThrow();
	});
});

describe("M1/M5: terminal record union without receipts", () => {
	function records() {
		const baseline = milestone({
			gates: {
				unit: "PASS",
				integration: "PASS",
				browser: "PASS",
				accessibility: "PASS",
				visual: "PASS",
				independentReview: "PASS",
			},
		});
		const state = activeState({
			milestones: {},
			baseline: {
				...activeState().baseline,
				validationRecord: "gone/validation.md",
				independentVerification: "gone/verification.md",
			},
		});
		const history = historyState({
			milestones: {
				"baseline-reconciliation-gate": baseline,
				closed: milestone(),
			},
		});
		return { state, history };
	}
	it("moves a terminal record from ledger to history with no receipt or declaration", () => {
		const { state, history } = records();
		state.milestones = {
			closing: activeMilestone({
				status: "READY_FOR_INTEGRATION",
				branch: "fixture",
				worktree: "D:/fixture",
				baseCommit: "abc1234",
				handoff: "gone/active.md",
				ownedPaths: ["scripts/**"],
			}),
		};
		expect(() => assertProjectRecordUnion(state, history)).not.toThrow();
		const closing = { ...state.milestones.closing, status: "DONE" };
		delete (state.milestones as Record<string, unknown>).closing;
		(history.milestones as Record<string, unknown>).closing = closing;
		expect(validateState(state)).toBe(true);
		expect(validateHistory(history)).toBe(true);
		expect(() => assertProjectRecordUnion(state, history)).not.toThrow();
	});
	it("allows successors in either ledger or history", () => {
		for (const active of [false, true]) {
			const { state, history } = records();
			(history.milestones as Record<string, unknown>).old = milestone({
				status: "SUPERSEDED",
				stopReason: "Carried forward",
				supersededBy: "successor",
			});
			if (active)
				(state.milestones as Record<string, unknown>).successor =
					activeMilestone({ status: "PLANNED" });
			else
				(history.milestones as Record<string, unknown>).successor = milestone();
			expect(() => assertProjectRecordUnion(state, history)).not.toThrow();
		}
	});
	it.each([
		false,
		true,
	])("K5: reports every supersededBy invariant fault (invalid targets: %s)", (invalidTargets) => {
		const { state, history } = records();
		const faulty = milestone(
			invalidTargets
				? {
						status: "SUPERSEDED",
						stopReason: "Carried forward",
						supersededBy: "missing",
					}
				: { supersededBy: "baseline-reconciliation-gate" },
		);
		(state.milestones as Record<string, unknown>).first = faulty;
		(history.milestones as Record<string, unknown>).second = { ...faulty };
		let message = "";
		try {
			assertProjectRecordUnion(state, history);
		} catch (error) {
			message = (error as Error).message;
		}
		const fault = invalidTargets
			? "supersededBy must name a different existing milestone"
			: "only SUPERSEDED records may carry supersededBy";
		expect(message.split("\n")).toEqual([
			`second: ${fault}`,
			`first: ${fault}`,
		]);
	});
	it("rejects self, missing, absent successors and stale supersededBy", () => {
		for (const successor of ["closed", "missing", undefined]) {
			const { state, history } = records();
			history.milestones.closed = milestone({
				status: "SUPERSEDED",
				stopReason: "Carried forward",
				supersededBy: successor,
			});
			expect(() => assertProjectRecordUnion(state, history)).toThrow(
				/supersededBy/,
			);
		}
		const { state, history } = records();
		history.milestones.closed = milestone({
			supersededBy: "baseline-reconciliation-gate",
		});
		expect(() => assertProjectRecordUnion(state, history)).toThrow(
			/only SUPERSEDED/,
		);
	});
	it("SUPERSEDED never satisfies a dependency; the DONE successor does", () => {
		const { state, history } = records();
		history.milestones.closed = milestone({
			status: "SUPERSEDED",
			stopReason: "Carried forward",
			supersededBy: "baseline-reconciliation-gate",
		});
		(history.milestones as Record<string, unknown>).dependent = milestone({
			dependencies: ["closed"],
		});
		expect(() => assertProjectRecordUnion(state, history)).toThrow(
			/closed is not DONE/,
		);
		(history.milestones as Record<string, unknown>).dependent = milestone({
			dependencies: ["baseline-reconciliation-gate"],
		});
		expect(() => assertProjectRecordUnion(state, history)).not.toThrow();
	});
	it("retains duplicate-id, open-history, unknown-dependency and DONE commit/gate checks", () => {
		const changes = [
			({ state }: ReturnType<typeof records>) => {
				(state.milestones as Record<string, unknown>).closed =
					activeMilestone();
			},
			({ history }: ReturnType<typeof records>) => {
				history.milestones.closed.status = "IN_PROGRESS";
			},
			({ history }: ReturnType<typeof records>) => {
				history.milestones.closed.dependencies = ["unknown"];
			},
			({ history }: ReturnType<typeof records>) => {
				history.milestones.closed.integratedCommit = null;
			},
			({ history }: ReturnType<typeof records>) => {
				history.milestones.closed.gates.unit = "PENDING";
			},
		];
		for (const [index, change] of changes.entries()) {
			const f = records();
			change(f);
			expect(
				() => assertProjectRecordUnion(f.state, f.history),
				`rule ${index}`,
			).toThrow(
				[
					/duplicated/,
					/only terminal/,
					/does not exist/,
					/without an integrated commit/,
					/while unit is PENDING/,
				][index],
			);
		}
	});
});

describe("tracked encoding and Claude agent definitions", () => {
	it("fails both historical agent-table drifts and passes the current definitions", () => {
		for (const commit of ["e86bc33e", "4d8e3f40"]) {
			const fixture = committedAgentFixture(commit);
			expect(
				() =>
					assertClaudeAgentTable({
						repositoryRoot: fixture.root,
						trackedFiles: fixture.trackedFiles,
					}),
				commit,
			).toThrow(/is not tracked/);
		}

		expect(() =>
			assertClaudeAgentTable({ repositoryRoot: REAL_REPOSITORY }),
		).not.toThrow();
	});

	it("rejects model, effort, missing-definition, and extra-definition drift", () => {
		const fixture = committedAgentFixture("HEAD");
		const instructionsPath = path.join(fixture.root, "CLAUDE.md");
		const instructions = readFileSync(instructionsPath, "utf8");
		const designerRow =
			"| `owner-direction-designer` | Opus | `xhigh` | new visual design and taste judgment |";
		const builderRow =
			"| `owner-direction-builder` | Opus | `high` | implementing an agreed, precisely specified decision |";
		expect(instructions).toContain(designerRow);
		expect(instructions).toContain(builderRow);

		writeFileSync(
			instructionsPath,
			instructions.replace(designerRow, designerRow.replace("Opus", "Sonnet")),
		);
		expect(() =>
			assertClaudeAgentTable({
				repositoryRoot: fixture.root,
				trackedFiles: fixture.trackedFiles,
			}),
		).toThrow(/model Sonnet does not match opus/);

		writeFileSync(
			instructionsPath,
			instructions.replace(builderRow, builderRow.replace("`high`", "`low`")),
		);
		expect(() =>
			assertClaudeAgentTable({
				repositoryRoot: fixture.root,
				trackedFiles: fixture.trackedFiles,
			}),
		).toThrow(/effort low does not match high/);

		writeFileSync(instructionsPath, instructions);
		const extraDefinition = ".claude/agents/extra-reviewer.md";
		const extraAbsolute = path.join(fixture.root, extraDefinition);
		mkdirSync(path.dirname(extraAbsolute), { recursive: true });
		writeFileSync(
			extraAbsolute,
			"---\nname: extra-reviewer\nmodel: sonnet\neffort: low\n---\n",
		);
		expect(() =>
			assertClaudeAgentTable({
				repositoryRoot: fixture.root,
				trackedFiles: [...fixture.trackedFiles, extraDefinition],
			}),
		).toThrow(/missing tracked definition/);

		const missingDefinition = fixture.trackedFiles.find((entry) =>
			entry.endsWith("/sonnet-scout.md"),
		);
		expect(missingDefinition).toBeDefined();
		expect(() =>
			assertClaudeAgentTable({
				repositoryRoot: fixture.root,
				trackedFiles: fixture.trackedFiles.filter(
					(entry) => entry !== missingDefinition,
				),
			}),
		).toThrow(/is not tracked/);
	});

	it("fails unexpected tracked BOMs and preserves only the named exceptions", () => {
		const trackedFiles = listTrackedFiles(REAL_REPOSITORY);
		const result = assertNoUnexpectedBom({
			repositoryRoot: REAL_REPOSITORY,
			trackedFiles,
		});
		expect(result.checked).toBe(trackedFiles.length);
		expect(result.allowed).toBe(TRACKED_BOM_EXCEPTIONS.length);
		for (const entry of TRACKED_BOM_EXCEPTIONS)
			expect(entry.reason.trim().length).toBeGreaterThan(0);

		const configBytes = readFileSync(
			path.join(REAL_REPOSITORY, ".impeccable/config.json"),
		);
		expect(
			configBytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])),
		).toBe(false);
		expect(JSON.parse(configBytes.toString("utf8"))).toEqual({
			buildPath: "code",
		});

		const root = mkdtempSync(path.join(tmpdir(), "fitway-bom-"));
		temporaryRoots.push(root);
		writeFileSync(
			path.join(root, "new-bom.txt"),
			Buffer.from([0xef, 0xbb, 0xbf, 0x78]),
		);
		expect(() =>
			assertNoUnexpectedBom({
				repositoryRoot: root,
				trackedFiles: ["new-bom.txt"],
				exceptions: [],
			}),
		).toThrow(/new-bom\.txt.*BOM/);
	});

	it("requires every BOM exception to be reasoned, unique, tracked, and BOM-prefixed", () => {
		const root = mkdtempSync(path.join(tmpdir(), "fitway-bom-exception-"));
		temporaryRoots.push(root);
		mkdirSync(path.join(root, "nested"));
		writeFileSync(
			path.join(root, "nested/bom.txt"),
			Buffer.from([0xef, 0xbb, 0xbf, 0x78]),
		);
		writeFileSync(path.join(root, "plain.txt"), "plain");
		const trackedFiles = ["nested/bom.txt", "plain.txt"];
		const check = (exceptions: { path: string; reason: string }[]) =>
			assertNoUnexpectedBom({
				repositoryRoot: root,
				trackedFiles,
				exceptions,
			});

		expect(() => check([{ path: "nested/bom.txt", reason: " \t " }])).toThrow(
			/nested[\\/]bom\.txt.*non-empty reason/,
		);
		expect(() =>
			check([
				{ path: "nested/bom.txt", reason: "Kept." },
				{ path: "NESTED\\BOM.TXT", reason: "Also kept." },
			]),
		).toThrow(/NESTED[\\/]BOM\.TXT.*duplicates nested[\\/]bom\.txt/);
		expect(() => check([{ path: "missing.txt", reason: "Kept." }])).toThrow(
			/missing\.txt.*is not a tracked file/,
		);
		expect(() => check([{ path: "plain.txt", reason: "Kept." }])).toThrow(
			/plain\.txt.*does not start with a UTF-8 BOM/,
		);
		expect(check([{ path: "NESTED\\BOM.TXT", reason: "Kept." }])).toEqual({
			checked: 2,
			allowed: 1,
		});
	});
});
