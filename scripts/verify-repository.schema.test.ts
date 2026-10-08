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
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import {
	assertGardenerReport,
	assertProjectRecordUnion,
	assertProjectStateInvariants,
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
	])("names the milestone and field in %s", (location) => {
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
				writeFileSync(
					path.join(root, "PROJECT_STATE.yaml"),
					JSON.stringify(
						activeState({
							milestones:
								location === "ledger" ? { "faulty-milestone": record } : {},
						}),
					),
				);
				writeFileSync(
					path.join(root, "PROJECT_STATE_HISTORY.yaml"),
					JSON.stringify(
						historyState({
							milestones:
								location === "history" ? { "faulty-milestone": record } : {},
						}),
					),
				);
				const result = spawnSync(
					process.execPath,
					[path.join(repository, "scripts/verify-repository.mjs")],
					{ cwd: root, encoding: "utf8", windowsHide: true },
				);
				expect(result.status).toBe(1);
				expect(result.stderr).toMatch(/faulty-milestone[^\r\n]*supersededBy/);
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
		["future/my file.md", "future/*.md", "future/my file.md"],
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
		["future/my file.md", "future/my other.md"],
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
