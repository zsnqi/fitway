import { execFileSync, spawnSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	generateFrontierCandidate,
	hashDirectory,
	M0_BASE_COMMIT,
	PIPELINE_PINNED_SNAPSHOT_SHA256,
	POINTER_DOCUMENT_PATH,
	PREDECESSOR_MANIFEST_PATH,
	REPAIR_OWNED_EXCLUSIONS,
	sha256,
	verifyFrontierPreservation,
} from "./check-frontier-preservation.mjs";

const REAL_ROOT = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
);
const REAL_PREDECESSOR_BYTES = readFileSync(
	path.resolve(REAL_ROOT, PREDECESSOR_MANIFEST_PATH),
);

const SNAPSHOT_PATH = "fixture/frontier-anchor.json";
const BASELINE_PATH = "fixture/pre-existing-frontier.txt";
const FUTURE_TIMESTAMP = "2099-01-01T00:00:00.000Z";

interface SnapshotRecordFixture {
	status: string;
	path: string;
	kind: string;
	sha256: string;
	fileCount?: number;
}

interface SnapshotFixture {
	recordedAt: string;
	baselineListing: { path: string; sha256: string };
	repairOwnedExclusions: string[];
	protectedPaths: SnapshotRecordFixture[];
	baselineEntryCount: number;
	protectedEntryCount: number;
}

interface PointerFixture {
	schemaVersion: number;
	kind: string;
	recordedAt: string;
	m0BaseCommit?: string;
	pinnedSnapshot: { path: string; sha256: string; companionPath: string };
	predecessor: { path: string; sha256: string; note: string };
	repairOwnedExclusions: string[];
	transition: {
		recordedAt: string;
		addedExclusions: Array<{
			path: string;
			reason: string;
			pinnedSha256BeforeTransition: string;
		}>;
		roundOpenVerification: {
			command: string;
			result: string;
			note: string;
		};
	};
}

interface VerifyResult {
	mode: "dirty" | "clean-candidate";
	baseCommit?: string;
	baselineEntryCount: number;
	protectedEntryCount: number;
	excludedEntryCount: number;
	additionCount: number;
	pinnedSnapshotSha256: string;
	pinnedSnapshotPath: string;
	recordedAt: string;
	timestampsAuthoritative: boolean;
	protectedRecords: SnapshotRecordFixture[];
	excludedProtectedPaths: string[];
	baselineListing: { path: string; sha256: string };
	predecessorSha256: string;
}

interface Fixture {
	root: string;
	snapshotPath: string;
	snapshotSha256: string;
	snapshot: SnapshotFixture;
	pointer: PointerFixture;
	pinnedSnapshot: { path: string; sha256: string };
}

const fixtureRoots: string[] = [];

afterEach(() => {
	for (const root of fixtureRoots.splice(0)) {
		rmSync(root, { recursive: true, force: true, maxRetries: 3 });
	}
});

function writeFixtureFile(
	root: string,
	relativePath: string,
	content: string | Buffer,
): void {
	const absolute = path.resolve(root, relativePath);
	mkdirSync(path.dirname(absolute), { recursive: true });
	writeFileSync(absolute, content);
}

function readJson<T>(absolute: string): T {
	return JSON.parse(readFileSync(absolute, "utf8")) as T;
}

function fileSha(root: string, relativePath: string): string {
	return sha256(readFileSync(path.resolve(root, relativePath)));
}

function git(root: string, args: string[]): string {
	return execFileSync("git", args, { cwd: root, encoding: "utf8" });
}

async function createFixture(
	options: { repairOwnedTrackedDirectory?: boolean } = {},
): Promise<Fixture> {
	const root = mkdtempSync(path.join(tmpdir(), "fitway-frontier-fixture-"));
	fixtureRoots.push(root);
	git(root, ["init", "-q"]);
	git(root, ["config", "user.email", "fixture@example.test"]);
	git(root, ["config", "user.name", "Frontier Fixture"]);
	git(root, ["config", "core.autocrlf", "false"]);
	git(root, ["config", "commit.gpgsign", "false"]);

	const tracked = [
		{
			path: "PROJECT_STATE.yaml",
			head: "head-project-state\n",
			current: "current-project-state\n",
		},
		{
			path: "package.json",
			head: "head-package\n",
			current: "current-package\n",
		},
		{
			path: "protected/alpha.txt",
			head: "head-alpha\n",
			current: "current-alpha\n",
		},
		{
			path: "scripts/verify.mjs",
			head: "head-verify\n",
			current: "current-verify\n",
		},
	];
	if (options.repairOwnedTrackedDirectory) {
		tracked.push({
			path: ".impeccable/tracked.txt",
			head: "head-impeccable\n",
			current: "current-impeccable\n",
		});
	}
	for (const entry of tracked) {
		writeFixtureFile(root, entry.path, entry.head);
	}
	git(root, ["add", "--", ...tracked.map((entry) => entry.path)]);
	git(root, ["commit", "-q", "-m", "fixture base"]);
	for (const entry of tracked) {
		writeFixtureFile(root, entry.path, entry.current);
	}

	writeFixtureFile(root, "protected/bravo.txt", "untracked-bravo\n");
	writeFixtureFile(root, "protected/trees/one.txt", "tree-one\n");
	writeFixtureFile(root, "protected/trees/two.txt", "tree-two\n");
	if (!options.repairOwnedTrackedDirectory) {
		writeFixtureFile(root, ".impeccable/config.json", "{}\n");
	}

	writeFixtureFile(root, PREDECESSOR_MANIFEST_PATH, REAL_PREDECESSOR_BYTES);

	const baselineText = `${[
		" M PROJECT_STATE.yaml",
		" M package.json",
		" M protected/alpha.txt",
		" M scripts/verify.mjs",
		options.repairOwnedTrackedDirectory ? " M .impeccable/" : "?? .impeccable/",
		"?? protected/bravo.txt",
		"?? protected/trees/",
	].join("\n")}\n`;
	writeFixtureFile(root, BASELINE_PATH, baselineText);
	const baselineSha256 = fileSha(root, BASELINE_PATH);
	writeFixtureFile(
		root,
		`${BASELINE_PATH}.sha256`,
		`${baselineSha256}  ${path.basename(BASELINE_PATH)}\n`,
	);

	const trees = await hashDirectory(path.resolve(root, "protected/trees"));
	const records: SnapshotRecordFixture[] = [
		{
			status: " M",
			path: "protected/alpha.txt",
			kind: "file",
			sha256: fileSha(root, "protected/alpha.txt"),
		},
		{
			status: "??",
			path: "protected/bravo.txt",
			kind: "file",
			sha256: fileSha(root, "protected/bravo.txt"),
		},
		{
			status: "??",
			path: "protected/trees/",
			kind: "directory",
			sha256: trees.digest,
			fileCount: trees.fileCount,
		},
		{
			status: " M",
			path: "scripts/verify.mjs",
			kind: "file",
			sha256: fileSha(root, "scripts/verify.mjs"),
		},
	];

	const snapshot: SnapshotFixture = {
		recordedAt: "2026-09-01T00:00:00.000Z",
		baselineListing: { path: BASELINE_PATH, sha256: baselineSha256 },
		repairOwnedExclusions: REPAIR_OWNED_EXCLUSIONS.filter(
			(entry) => entry !== "scripts/verify.mjs",
		),
		protectedPaths: records,
		baselineEntryCount: 7,
		protectedEntryCount: 4,
	};
	const snapshotBytes = Buffer.from(
		`${JSON.stringify(snapshot, null, "\t")}\n`,
		"utf8",
	);
	writeFixtureFile(root, SNAPSHOT_PATH, snapshotBytes);
	const snapshotSha256 = sha256(snapshotBytes);
	writeFixtureFile(
		root,
		`${SNAPSHOT_PATH}.sha256`,
		`${snapshotSha256}  ${path.basename(SNAPSHOT_PATH)}\n`,
	);

	const pointer: PointerFixture = {
		schemaVersion: 1,
		kind: "frontier-evidence-policy-pointer",
		recordedAt: "2026-09-01T00:00:01.000Z",
		m0BaseCommit: M0_BASE_COMMIT,
		pinnedSnapshot: {
			path: SNAPSHOT_PATH,
			sha256: snapshotSha256,
			companionPath: `${SNAPSHOT_PATH}.sha256`,
		},
		predecessor: {
			path: PREDECESSOR_MANIFEST_PATH,
			sha256: sha256(REAL_PREDECESSOR_BYTES),
			note: "superseded pointer preserved byte-for-byte",
		},
		repairOwnedExclusions: [...REPAIR_OWNED_EXCLUSIONS],
		transition: {
			recordedAt: "2026-09-01T00:00:02.000Z",
			addedExclusions: [
				{
					path: "scripts/verify.mjs",
					reason:
						"fixture: the r04 round owns scripts/verify.mjs fast-ladder wiring",
					pinnedSha256BeforeTransition: records[3].sha256,
				},
			],
			roundOpenVerification: {
				command: "pnpm check:frontier",
				result: "fixture PASS",
				note: "fixture note",
			},
		},
	};
	writePointerFixture(root, pointer);

	return {
		root,
		snapshotPath: SNAPSHOT_PATH,
		snapshotSha256,
		snapshot,
		pointer,
		pinnedSnapshot: { path: SNAPSHOT_PATH, sha256: snapshotSha256 },
	};
}

function writePointerFixture(root: string, pointer: PointerFixture): void {
	writeFixtureFile(
		root,
		POINTER_DOCUMENT_PATH,
		`${JSON.stringify(pointer, null, "\t")}\n`,
	);
}

function trustedRelativePaths(fixture: Fixture): string[] {
	return [
		POINTER_DOCUMENT_PATH,
		fixture.snapshotPath,
		`${fixture.snapshotPath}.sha256`,
		PREDECESSOR_MANIFEST_PATH,
		BASELINE_PATH,
		`${BASELINE_PATH}.sha256`,
	];
}

function trustedHashes(fixture: Fixture): string[] {
	return trustedRelativePaths(fixture).map(
		(relativePath) =>
			`${relativePath} ${sha256(readFileSync(path.resolve(fixture.root, relativePath)))}`,
	);
}

function verifyOptions(fixture: Fixture) {
	return { root: fixture.root, pinnedSnapshot: fixture.pinnedSnapshot };
}

function createCleanCandidate(): string {
	const parent = mkdtempSync(path.join(tmpdir(), "fitway-frontier-candidate-"));
	fixtureRoots.push(parent);
	const candidate = path.join(parent, "candidate");
	git(parent, [
		"-c",
		"core.autocrlf=false",
		"clone",
		"--quiet",
		"--shared",
		"--no-checkout",
		REAL_ROOT,
		"candidate",
	]);
	git(candidate, ["config", "core.autocrlf", "false"]);
	git(candidate, ["config", "core.longpaths", "true"]);
	git(candidate, ["checkout", "-q", "HEAD"]);
	git(candidate, ["config", "user.email", "fixture@example.test"]);
	git(candidate, ["config", "user.name", "Frontier Fixture"]);
	const pointerPath = path.resolve(candidate, POINTER_DOCUMENT_PATH);
	const pointer = JSON.parse(
		readFileSync(pointerPath, "utf8"),
	) as PointerFixture;
	if (pointer.m0BaseCommit !== M0_BASE_COMMIT) {
		pointer.m0BaseCommit = M0_BASE_COMMIT;
		writeFileSync(pointerPath, `${JSON.stringify(pointer, null, "\t")}\n`);
		git(candidate, ["add", "--", POINTER_DOCUMENT_PATH]);
		git(candidate, ["commit", "-q", "-m", "pin M0 frontier base"]);
	}
	return candidate;
}

async function captureCleanCandidateFailure(
	root: string,
	options: Record<string, unknown> = {},
): Promise<{ message: string; output: string }> {
	const spy = vi.spyOn(console, "log").mockImplementation(() => {});
	let message = "";
	let failed = false;
	try {
		await verifyFrontierPreservation({
			root,
			mode: "clean-candidate",
			...options,
		} as never);
	} catch (error) {
		failed = true;
		message = error instanceof Error ? error.message : String(error);
	}
	const output = spy.mock.calls.map((args) => args.join(" ")).join("\n");
	spy.mockRestore();
	if (!failed) throw new Error("Expected clean-candidate verification to fail");
	return { message, output };
}

async function verifyQuietly(
	fixture: Fixture,
): Promise<{ result: VerifyResult; output: string }> {
	const spy = vi.spyOn(console, "log").mockImplementation(() => {});
	try {
		const result = (await verifyFrontierPreservation(
			verifyOptions(fixture),
		)) as VerifyResult;
		const output = spy.mock.calls.map((args) => args.join(" ")).join("\n");
		return { result, output };
	} finally {
		spy.mockRestore();
	}
}

async function captureVerificationFailure(
	fixture: Fixture,
): Promise<{ message: string; output: string }> {
	const spy = vi.spyOn(console, "log").mockImplementation(() => {});
	let message = "";
	let failed = false;
	try {
		await verifyFrontierPreservation(verifyOptions(fixture));
	} catch (error) {
		failed = true;
		message = error instanceof Error ? error.message : String(error);
	}
	const output = spy.mock.calls.map((args) => args.join(" ")).join("\n");
	spy.mockRestore();
	if (!failed) throw new Error("Expected verification to fail but it passed");
	return { message, output };
}

async function captureGenerateFailure(
	fixture: Fixture,
	candidatePath: string,
): Promise<{ message: string; output: string }> {
	const spy = vi.spyOn(console, "log").mockImplementation(() => {});
	let message = "";
	let failed = false;
	try {
		await generateFrontierCandidate({
			...verifyOptions(fixture),
			candidatePath,
		});
	} catch (error) {
		failed = true;
		message = error instanceof Error ? error.message : String(error);
	}
	const output = spy.mock.calls.map((args) => args.join(" ")).join("\n");
	spy.mockRestore();
	if (!failed) throw new Error("Expected generation to fail but it passed");
	return { message, output };
}

describe("real repository acceptance", () => {
	it("verifies the preserved real frontier with structured, non-temporal facts", async () => {
		const spy = vi.spyOn(console, "log").mockImplementation(() => {});
		try {
			const result = (await verifyFrontierPreservation({
				root: REAL_ROOT,
			})) as VerifyResult;
			const output = spy.mock.calls.map((args) => args.join(" ")).join("\n");
			expect(result.baselineEntryCount).toBe(116);
			expect(result.protectedEntryCount).toBe(104);
			expect(result.excludedEntryCount).toBe(9);
			expect(result.excludedProtectedPaths).toEqual([
				"scripts/verify.mjs",
				"tests/browser/phase2.browser.spec.ts",
				"tests/browser/staff-paper-fidelity.review.spec.ts",
				"scripts/check-owner-classes.mjs",
				"scripts/check-owner-classes.test.ts",
				"scripts/check-owner-spacing.mjs",
				"scripts/check-owner-spacing.test.ts",
				"scripts/owner-classes-allowlist.json",
				"scripts/owner-spacing-baseline.json",
			]);
			expect(result.pinnedSnapshotSha256).toBe(PIPELINE_PINNED_SNAPSHOT_SHA256);
			expect(result.timestampsAuthoritative).toBe(false);
			expect(result.recordedAt).toMatch(/^20\d{2}-\d{2}-\d{2}T/);
			expect(result.protectedRecords).toHaveLength(104);
			expect(output).toContain(PIPELINE_PINNED_SNAPSHOT_SHA256);
			expect(output).toMatch(/timestampsAuthoritative: false/);
			expect(output).toMatch(/not evidence of capture time/);
			expect(output).not.toMatch(/captured at/i);
			if (result.mode === "dirty") {
				expect(output).toContain("116 baseline entries");
				expect(output).toContain("104 non-excluded protected entries verified");
				expect(output).toContain("9 excluded protected entries");
				expect(output).toMatch(/additions are unconstrained/);
				expect(output).toMatch(/recorded in snapshot/);
			} else {
				expect(result.baseCommit).toBe(M0_BASE_COMMIT);
				expect(output).toContain("worktree is clean");
				expect(output).toContain(
					"104 non-excluded protected paths were not integrated",
				);
			}
		} finally {
			spy.mockRestore();
		}
	});

	it("verifies a clean M1 candidate against the frozen M0 base", async () => {
		const root = createCleanCandidate();
		const spy = vi.spyOn(console, "log").mockImplementation(() => {});
		try {
			const result = (await verifyFrontierPreservation({
				root,
			})) as VerifyResult & { mode: string; baseCommit: string };
			const output = spy.mock.calls.map((args) => args.join(" ")).join("\n");
			expect(result.mode).toBe("clean-candidate");
			expect(result.baseCommit).toBe(M0_BASE_COMMIT);
			expect(result.protectedEntryCount).toBe(104);
			expect(result.excludedEntryCount).toBe(9);
			expect(output).toContain(
				`not integrated relative to frozen M0 base ${M0_BASE_COMMIT}`,
			);
			expect(output).toContain("worktree is clean");
			expect(output).toContain("clean-checkout LF projection");
		} finally {
			spy.mockRestore();
		}
	}, 60_000);

	it("rejects clean-candidate integration of a protected path", async () => {
		const root = createCleanCandidate();
		const protectedPath = "apps/web/src/components/owner/access/messages.ts";
		writeFileSync(
			path.resolve(root, protectedPath),
			`${readFileSync(path.resolve(root, protectedPath), "utf8")}\nprotected integration\n`,
		);
		git(root, ["add", "--", protectedPath]);
		git(root, ["commit", "-q", "-m", "adversarial protected integration"]);
		const { message } = await captureCleanCandidateFailure(root);
		expect(message).toMatch(
			/Protected path was integrated relative to frozen M0 base .*owner\/access\/messages\.ts/,
		);
	}, 60_000);

	it("rejects a dirty clean-candidate worktree", async () => {
		const root = createCleanCandidate();
		writeFileSync(
			path.resolve(root, "AGENTS.md"),
			`${readFileSync(path.resolve(root, "AGENTS.md"), "utf8")}\nclean-mode dirt\n`,
		);
		const { message } = await captureCleanCandidateFailure(root);
		expect(message).toMatch(/Clean-candidate worktree is dirty/);
	}, 60_000);

	it.each([
		["assume-unchanged", "--assume-unchanged"],
		["skip-worktree", "--skip-worktree"],
	])(
		"rejects a clean candidate with a hidden %s path",
		async (_label, indexFlag) => {
			const root = createCleanCandidate();
			const hiddenPath = "AGENTS.md";
			git(root, ["update-index", indexFlag, hiddenPath]);
			writeFileSync(
				path.resolve(root, hiddenPath),
				`${readFileSync(path.resolve(root, hiddenPath), "utf8")}\nhidden clean-mode dirt\n`,
			);
			expect(git(root, ["status", "--short"]).trim()).toBe("");
			const { message } = await captureCleanCandidateFailure(root);
			expect(message).toMatch(
				/hidden from git status by an index flag \(assume-unchanged\/skip-worktree\).*AGENTS\.md/,
			);
		},
		60_000,
	);

	it("rejects a missing or invalid clean-candidate base", async () => {
		const root = createCleanCandidate();
		const { message } = await captureCleanCandidateFailure(root, {
			baseCommit: "0".repeat(40),
		});
		expect(message).toMatch(/not the frozen M0 base commit|invalid|missing/);
	}, 60_000);

	it("rejects a tampered policy before clean-tree acceptance", async () => {
		const root = createCleanCandidate();
		const pointerPath = path.resolve(root, POINTER_DOCUMENT_PATH);
		const pointer = JSON.parse(
			readFileSync(pointerPath, "utf8"),
		) as PointerFixture;
		pointer.repairOwnedExclusions = [
			...pointer.repairOwnedExclusions,
			"apps/web/src/evil.tsx",
		];
		writeFileSync(pointerPath, `${JSON.stringify(pointer, null, "\t")}\n`);
		const { message } = await captureCleanCandidateFailure(root);
		expect(message).toMatch(/repairOwnedExclusions does not exactly match/);
	}, 60_000);

	it("rejects the removed --write interface and advertises --generate", () => {
		const result = spawnSync(
			process.execPath,
			["scripts/check-frontier-preservation.mjs", "--write"],
			{ cwd: REAL_ROOT, encoding: "utf8" },
		);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain("--generate <new-path>");
	});
});

describe("pointer document validation", () => {
	it("rejects a self-consistent future recordedAt and produces no proof output", async () => {
		const fixture = await createFixture();
		const topLevel = structuredClone(fixture.pointer);
		topLevel.recordedAt = FUTURE_TIMESTAMP;
		writePointerFixture(fixture.root, topLevel);
		const topLevelFailure = await captureVerificationFailure(fixture);
		expect(topLevelFailure.message).toMatch(
			/Policy pointer recordedAt is in the future/,
		);
		expect(topLevelFailure.output).toBe("");

		const transition = structuredClone(fixture.pointer);
		transition.transition.recordedAt = FUTURE_TIMESTAMP;
		writePointerFixture(fixture.root, transition);
		const transitionFailure = await captureVerificationFailure(fixture);
		expect(transitionFailure.message).toMatch(
			/transition\.recordedAt is in the future/,
		);
		expect(transitionFailure.output).toBe("");
	});

	it("rejects a pinned snapshot digest that no longer matches the source pin", async () => {
		const fixture = await createFixture();
		const pointer = structuredClone(fixture.pointer);
		pointer.pinnedSnapshot.sha256 = "0".repeat(64);
		writePointerFixture(fixture.root, pointer);
		const { message } = await captureVerificationFailure(fixture);
		expect(message).toMatch(/pinnedSnapshot\.sha256/);
	});

	it("rejects a predecessor digest that no longer matches the preserved predecessor", async () => {
		const fixture = await createFixture();
		const pointer = structuredClone(fixture.pointer);
		pointer.predecessor.sha256 = "0".repeat(64);
		writePointerFixture(fixture.root, pointer);
		const { message } = await captureVerificationFailure(fixture);
		expect(message).toMatch(
			/predecessor\.sha256 does not match the preserved predecessor file/,
		);
	});

	it("rejects an exclusion added to the pointer that is not in source, and one hidden from it", async () => {
		const fixture = await createFixture();
		const added = structuredClone(fixture.pointer);
		added.repairOwnedExclusions = [
			...added.repairOwnedExclusions,
			"apps/web/src/evil.tsx",
		];
		writePointerFixture(fixture.root, added);
		const addedFailure = await captureVerificationFailure(fixture);
		expect(addedFailure.message).toMatch(
			/repairOwnedExclusions does not exactly match/,
		);

		const hidden = structuredClone(fixture.pointer);
		hidden.repairOwnedExclusions = hidden.repairOwnedExclusions.filter(
			(entry) => entry !== "scripts/verify.mjs",
		);
		writePointerFixture(fixture.root, hidden);
		const hiddenFailure = await captureVerificationFailure(fixture);
		expect(hiddenFailure.message).toMatch(
			/repairOwnedExclusions does not exactly match/,
		);
	});

	it("rejects free-text proves claims in the pointer document", async () => {
		const fixture = await createFixture();
		const pointer = structuredClone(fixture.pointer) as PointerFixture &
			Record<string, unknown>;
		pointer.proves = ["every protected file is byte-identical forever"];
		writePointerFixture(fixture.root, pointer);
		const { message } = await captureVerificationFailure(fixture);
		expect(message).toMatch(/must not carry free-text proves/);
	});

	it("requires the transition to name each newly excluded path with its before-transition hash", async () => {
		const fixture = await createFixture();
		const missing = structuredClone(fixture.pointer);
		missing.transition.addedExclusions = [];
		writePointerFixture(fixture.root, missing);
		const missingFailure = await captureVerificationFailure(fixture);
		expect(missingFailure.message).toMatch(
			/is missing the newly excluded path scripts\/verify\.mjs/,
		);

		const extra = structuredClone(fixture.pointer);
		extra.transition.addedExclusions = [
			...extra.transition.addedExclusions,
			{
				path: "package.json",
				reason: "extra",
				pinnedSha256BeforeTransition: "0".repeat(64),
			},
		];
		writePointerFixture(fixture.root, extra);
		const extraFailure = await captureVerificationFailure(fixture);
		expect(extraFailure.message).toMatch(
			/does not require as a newly excluded path/,
		);

		const wrongHash = structuredClone(fixture.pointer);
		wrongHash.transition.addedExclusions[0].pinnedSha256BeforeTransition =
			"0".repeat(64);
		writePointerFixture(fixture.root, wrongHash);
		const wrongHashFailure = await captureVerificationFailure(fixture);
		expect(wrongHashFailure.message).toMatch(
			/records pinnedSha256BeforeTransition/,
		);
	});
});

describe("protected entry verification", () => {
	it("detects a hand-edited protected hash in a self-consistent anchor-style document", async () => {
		const fixture = await createFixture();
		const snapshot = readJson<SnapshotFixture>(
			path.resolve(fixture.root, fixture.snapshotPath),
		);
		const alpha = snapshot.protectedPaths.find(
			(record) => record.path === "protected/alpha.txt",
		);
		if (!alpha) throw new Error("fixture snapshot is missing alpha");
		alpha.sha256 = "0".repeat(64);
		const snapshotBytes = Buffer.from(
			`${JSON.stringify(snapshot, null, "\t")}\n`,
			"utf8",
		);
		writeFixtureFile(fixture.root, fixture.snapshotPath, snapshotBytes);
		const snapshotSha256 = sha256(snapshotBytes);
		writeFixtureFile(
			fixture.root,
			`${fixture.snapshotPath}.sha256`,
			`${snapshotSha256}  ${path.basename(fixture.snapshotPath)}\n`,
		);
		const pointer = structuredClone(fixture.pointer);
		pointer.pinnedSnapshot.sha256 = snapshotSha256;
		writePointerFixture(fixture.root, pointer);

		const spy = vi.spyOn(console, "log").mockImplementation(() => {});
		let message = "";
		try {
			await verifyFrontierPreservation({
				root: fixture.root,
				pinnedSnapshot: {
					path: fixture.snapshotPath,
					sha256: snapshotSha256,
				},
			});
		} catch (error) {
			message = error instanceof Error ? error.message : String(error);
		} finally {
			spy.mockRestore();
		}
		expect(message).toMatch(/Protected file drifted: protected\/alpha\.txt/);
	});

	it("detects pinned snapshot bytes that no longer match the pinned digest", async () => {
		const fixture = await createFixture();
		const absolute = path.resolve(fixture.root, fixture.snapshotPath);
		writeFileSync(
			absolute,
			Buffer.concat([readFileSync(absolute), Buffer.from(" ", "utf8")]),
		);
		const { message } = await captureVerificationFailure(fixture);
		expect(message).toMatch(
			/does not SHA-256 to the source-owned pinned digest/,
		);
	});

	it("fails when a protected entry's content changes", async () => {
		const fixture = await createFixture();
		writeFixtureFile(fixture.root, "protected/alpha.txt", "drifted-alpha\n");
		const { message } = await captureVerificationFailure(fixture);
		expect(message).toMatch(/Protected file drifted: protected\/alpha\.txt/);
	});

	it("fails when a protected directory tree changes", async () => {
		const fixture = await createFixture();
		writeFixtureFile(
			fixture.root,
			"protected/trees/two.txt",
			"tree-two-drifted\n",
		);
		const { message } = await captureVerificationFailure(fixture);
		expect(message).toMatch(/Protected directory drifted: protected\/trees\//);
	});

	it("fails when a protected entry changes git status", async () => {
		const fixture = await createFixture();
		git(fixture.root, ["add", "--", "protected/alpha.txt"]);
		const { message } = await captureVerificationFailure(fixture);
		expect(message).toMatch(
			/Protected baseline entry changed status: protected\/alpha\.txt/,
		);
	});

	it("fails when a protected entry is deleted", async () => {
		const fixture = await createFixture();
		rmSync(path.resolve(fixture.root, "protected/alpha.txt"));
		const { message } = await captureVerificationFailure(fixture);
		expect(message).toMatch(
			/Protected baseline entry changed status: protected\/alpha\.txt/,
		);
	});
});

describe("repair-owned entry verification", () => {
	it("fails when a repair-owned tracked entry left git status while dirty against HEAD", async () => {
		// git reports assume-unchanged/skip-worktree worktree edits as clean, so
		// the only state where a repair-owned entry is absent from `git status
		// --short` while `git diff --quiet HEAD` still reports changes is a
		// tracked directory whose tree is dirty without a line of its own.
		const fixture = await createFixture({ repairOwnedTrackedDirectory: true });
		const statusLines = git(fixture.root, ["status", "--short"]).split(/\r?\n/);
		expect(statusLines).not.toContain(" M .impeccable/");
		const diff = spawnSync(
			"git",
			["diff", "--quiet", "HEAD", "--", ".impeccable/"],
			{ cwd: fixture.root },
		);
		expect(diff.status).toBe(1);
		const { message } = await captureVerificationFailure(fixture);
		expect(message).toMatch(
			/Repair-owned tracked baseline entry left git status but is dirty against HEAD: \.impeccable\//,
		);
	});

	it("fails when an assume-unchanged repair-owned tracked entry is dirty but hidden from git status", async () => {
		const fixture = await createFixture();
		git(fixture.root, ["add", "--", "scripts/verify.mjs"]);
		git(fixture.root, ["commit", "-q", "-m", "clean verify"]);
		git(fixture.root, [
			"update-index",
			"--assume-unchanged",
			"scripts/verify.mjs",
		]);
		writeFixtureFile(
			fixture.root,
			"scripts/verify.mjs",
			"current-verify\nhidden\n",
		);
		const statusLines = git(fixture.root, ["status", "--short"]).split(/\r?\n/);
		expect(statusLines).not.toContain(" M scripts/verify.mjs");
		expect(
			git(fixture.root, ["ls-files", "-v", "--", "scripts/verify.mjs"]),
		).toMatch(/^h scripts\/verify\.mjs/);
		const hiddenDiff = spawnSync(
			"git",
			["diff", "--quiet", "HEAD", "--", "scripts/verify.mjs"],
			{ cwd: fixture.root },
		);
		expect(hiddenDiff.status).toBe(0);
		const { message } = await captureVerificationFailure(fixture);
		expect(message).toMatch(
			/hidden from git status by an index flag \(assume-unchanged\/skip-worktree\) and cannot be verified: scripts\/verify\.mjs/,
		);
	});

	it("fails when a skip-worktree repair-owned tracked entry is dirty but hidden from git status", async () => {
		const fixture = await createFixture();
		git(fixture.root, ["add", "--", "scripts/verify.mjs"]);
		git(fixture.root, ["commit", "-q", "-m", "clean verify"]);
		git(fixture.root, [
			"update-index",
			"--skip-worktree",
			"scripts/verify.mjs",
		]);
		writeFixtureFile(
			fixture.root,
			"scripts/verify.mjs",
			"current-verify\nhidden\n",
		);
		const statusLines = git(fixture.root, ["status", "--short"]).split(/\r?\n/);
		expect(statusLines).not.toContain(" M scripts/verify.mjs");
		expect(
			git(fixture.root, ["ls-files", "-v", "--", "scripts/verify.mjs"]),
		).toMatch(/^S scripts\/verify\.mjs/);
		const hiddenDiff = spawnSync(
			"git",
			["diff", "--quiet", "HEAD", "--", "scripts/verify.mjs"],
			{ cwd: fixture.root },
		);
		expect(hiddenDiff.status).toBe(0);
		const { message } = await captureVerificationFailure(fixture);
		expect(message).toMatch(
			/hidden from git status by an index flag \(assume-unchanged\/skip-worktree\) and cannot be verified: scripts\/verify\.mjs/,
		);
	});

	it("passes when a repair-owned tracked entry leaves git status while clean against HEAD under a CRLF checkout", async () => {
		const fixture = await createFixture();
		git(fixture.root, ["add", "--", "scripts/verify.mjs"]);
		git(fixture.root, ["commit", "-q", "-m", "clean verify"]);
		git(fixture.root, ["config", "core.autocrlf", "true"]);
		rmSync(path.resolve(fixture.root, "scripts/verify.mjs"));
		git(fixture.root, ["checkout", "--", "scripts/verify.mjs"]);

		const workingText = readFileSync(
			path.resolve(fixture.root, "scripts/verify.mjs"),
			"utf8",
		);
		expect(workingText).toBe("current-verify\r\n");
		const headBlobText = execFileSync(
			"git",
			["show", "HEAD:scripts/verify.mjs"],
			{ cwd: fixture.root, encoding: "utf8" },
		);
		expect(headBlobText).toBe("current-verify\n");
		const statusLines = git(fixture.root, ["status", "--short"]).split(/\r?\n/);
		expect(statusLines).not.toContain(" M scripts/verify.mjs");
		const diff = spawnSync(
			"git",
			["diff", "--quiet", "HEAD", "--", "scripts/verify.mjs"],
			{ cwd: fixture.root },
		);
		expect(diff.status).toBe(0);

		const { result } = await verifyQuietly(fixture);
		expect(result.baselineEntryCount).toBe(7);
		expect(result.protectedEntryCount).toBe(3);
		expect(result.excludedEntryCount).toBe(1);
		expect(result.timestampsAuthoritative).toBe(false);
	});

	it("fails when a repair-owned untracked baseline entry disappears", async () => {
		const fixture = await createFixture();
		rmSync(path.resolve(fixture.root, ".impeccable"), {
			recursive: true,
			force: true,
		});
		const { message } = await captureVerificationFailure(fixture);
		expect(message).toMatch(
			/Repair-owned untracked baseline entry disappeared: \.impeccable\//,
		);
	});

	it("treats a new path as informational and says additions are unconstrained", async () => {
		const fixture = await createFixture();
		const before = await verifyQuietly(fixture);
		writeFixtureFile(fixture.root, "NEW-ADDITION.txt", "new\n");
		const after = await verifyQuietly(fixture);
		expect(after.result.additionCount).toBe(before.result.additionCount + 1);
		expect(after.output).toContain("NEW-ADDITION.txt");
		expect(after.output).toMatch(/additions are unconstrained/);
	});
});

describe("candidate generation", () => {
	it("refuses an existing candidate path or companion without truncating it", async () => {
		const fixture = await createFixture();
		writeFixtureFile(fixture.root, "candidate.json", "KEEP-ME\n");
		const existing = await captureGenerateFailure(fixture, "candidate.json");
		expect(existing.message).toMatch(/candidate path already exists/);
		expect(
			readFileSync(path.resolve(fixture.root, "candidate.json"), "utf8"),
		).toBe("KEEP-ME\n");

		writeFixtureFile(fixture.root, "companion-only.json.sha256", "keep\n");
		const companion = await captureGenerateFailure(
			fixture,
			"companion-only.json",
		);
		expect(companion.message).toMatch(
			/candidate \.sha256 companion already exists/,
		);
		expect(existsSync(path.resolve(fixture.root, "companion-only.json"))).toBe(
			false,
		);
	});

	it("fails before writing when a protected entry drifted and leaves trusted bytes unchanged", async () => {
		const fixture = await createFixture();
		writeFixtureFile(fixture.root, "protected/alpha.txt", "drifted-alpha\n");
		const before = trustedHashes(fixture);
		const { message } = await captureGenerateFailure(
			fixture,
			"candidate-drift.json",
		);
		expect(message).toMatch(/Protected file drifted: protected\/alpha\.txt/);
		expect(existsSync(path.resolve(fixture.root, "candidate-drift.json"))).toBe(
			false,
		);
		expect(
			existsSync(path.resolve(fixture.root, "candidate-drift.json.sha256")),
		).toBe(false);
		expect(trustedHashes(fixture)).toEqual(before);
	});

	it("writes a new candidate and companion with a predecessor link, leaving trusted bytes unchanged", async () => {
		const fixture = await createFixture();
		const before = trustedHashes(fixture);
		const spy = vi.spyOn(console, "log").mockImplementation(() => {});
		let candidate: Record<string, unknown> = {};
		try {
			candidate = (await generateFrontierCandidate({
				...verifyOptions(fixture),
				candidatePath: "candidate.json",
			})) as Record<string, unknown>;
		} finally {
			spy.mockRestore();
		}
		expect(trustedHashes(fixture)).toEqual(before);

		const candidateAbsolute = path.resolve(fixture.root, "candidate.json");
		const candidateBytes = readFileSync(candidateAbsolute);
		const companionText = readFileSync(`${candidateAbsolute}.sha256`, "utf8");
		expect(companionText).toBe(`${sha256(candidateBytes)}  candidate.json\n`);
		const parsed = JSON.parse(candidateBytes.toString("utf8")) as {
			predecessor: { path: string; sha256: string };
			protectedPaths: SnapshotRecordFixture[];
			repairOwnedExclusions: string[];
			timestampsAuthoritative: boolean;
			baselineEntryCount: number;
			protectedEntryCount: number;
			excludedEntryCount: number;
		};
		expect(parsed.predecessor).toEqual({
			path: fixture.pinnedSnapshot.path,
			sha256: fixture.pinnedSnapshot.sha256,
		});
		expect(parsed.protectedPaths.map((record) => record.path)).toEqual([
			"protected/alpha.txt",
			"protected/bravo.txt",
			"protected/trees/",
		]);
		expect(parsed.repairOwnedExclusions).toEqual([...REPAIR_OWNED_EXCLUSIONS]);
		expect(parsed.timestampsAuthoritative).toBe(false);
		expect(parsed.baselineEntryCount).toBe(7);
		expect(parsed.protectedEntryCount).toBe(3);
		expect(parsed.excludedEntryCount).toBe(1);
		expect(candidate).toEqual(parsed);
	});
});
