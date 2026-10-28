import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	initializeGit,
	removeTemporaryRoots,
	runGit,
	temporaryRoot,
} from "./test-git-fixture.ts";

vi.mock("./codex-environment.mjs", async (importOriginal) => ({
	...(await importOriginal<typeof import("./codex-environment.mjs")>()),
	codexEnvironment: async () => ({}),
	findCodex: async () => "codex",
}));

vi.mock("./check-brief.mjs", async (importOriginal) => ({
	...(await importOriginal<typeof import("./check-brief.mjs")>()),
	checkBrief: vi.fn(async ({ briefPath }) => ({
		ok: true,
		role: "codex",
		delivers: "report",
		requiredChanges: [],
		worktree: process.env.FITWAY_METADATA_WORKTREE,
		briefPath,
		problems: [],
	})),
	formatBriefResult: () => "fixture brief passed",
}));

vi.mock("./codex-review-launch.mjs", async (importOriginal) => ({
	...(await importOriginal<typeof import("./codex-review-launch.mjs")>()),
	assertReviewSourcesAtLaunch: async () => {},
	inspectBriefReview: async () => ({}),
}));

import { prepareLaunch } from "./codex-session.mjs";

afterEach(removeTemporaryRoots);

function repository(root: string) {
	initializeGit(root, "metadata@example.invalid");
	runGit(root, ["commit", "--allow-empty", "-qm", "base"]);
}

describe("Codex launch metadata", () => {
	it("records the brief, round, and launcher report in run.json", async () => {
		const root = temporaryRoot("fitway-codex-metadata-");
		const coordinator = path.join(root, "coordinator");
		const worktree = path.join(root, "worktree");
		mkdirSync(coordinator);
		mkdirSync(worktree);
		repository(coordinator);
		repository(worktree);
		const head = runGit(worktree, ["rev-parse", "HEAD"]);
		const brief = path.join(coordinator, "brief.md");
		writeFileSync(
			brief,
			`<!-- brief-format: v1 role: codex delivers: report -->
# Codex brief: Metadata round (fixture, round one)

- **Worktree:** \`${worktree.replaceAll("\\", "/")}\`, branch \`fixture\`, HEAD \`${head}\`

- **K1.** Fixture outcome.
`,
		);
		runGit(coordinator, ["add", "."]);
		runGit(coordinator, ["commit", "-qm", "brief"]);
		const run = path.join(root, "run");
		process.env.FITWAY_METADATA_WORKTREE = worktree;
		try {
			await prepareLaunch({
				brief,
				model: "gpt-6.1-sol",
				level: "high",
				run,
			});
		} finally {
			delete process.env.FITWAY_METADATA_WORKTREE;
		}
		const metadata = JSON.parse(
			readFileSync(path.join(run, "run.json"), "utf8"),
		);
		expect(metadata).toMatchObject({
			briefPath: "brief.md",
			briefSha256: createHash("sha256")
				.update(readFileSync(brief))
				.digest("hex"),
			round: "Metadata round (fixture, round one)",
			report: path.join(run, "last-message.md"),
		});
	});
});
