// Build disposable coordinator repositories and briefs for the brief-check tests, and remove them after each test.
import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	realpathSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkBrief } from "./check-brief.mjs";
import { git, put } from "./fixtures";

export const repository = fileURLToPath(new URL("../../", import.meta.url));
export const script = path.join(
	repository,
	"scripts/agent-environment/check-brief.mjs",
);
export const environmentPath = "docs/agent-context/briefs/ENVIRONMENT.md";
export const environment = readFileSync(
	path.join(repository, environmentPath),
	"utf8",
);
const roots: string[] = [];

export function removeBriefFixtures() {
	for (const root of roots.splice(0)) {
		const absolute = realpathSync.native(root);
		const relative = path.relative(realpathSync.native(tmpdir()), absolute);
		if (
			relative.startsWith("..") ||
			path.isAbsolute(relative) ||
			!relative.startsWith("fitway-brief-test-")
		)
			throw new Error(`Unsafe fixture cleanup: ${absolute}`);
		rmSync(absolute, { recursive: true, force: true });
	}
}

export function fixture() {
	const root = mkdtempSync(path.join(tmpdir(), "fitway-brief-test-"));
	roots.push(root);
	const commandRepository = path.join(root, "coordinator");
	const worktree = path.join(root, "build");
	mkdirSync(commandRepository);
	put(commandRepository, environmentPath, environment);
	put(
		commandRepository,
		"docs/guide.md",
		"# Guide\n\n## Selected heading\nLast line.\n",
	);
	put(commandRepository, "docs/file with spaces.md", "Setext heading\n===\n");
	put(commandRepository, "LICENSE", "Fixture license\n");
	git(commandRepository, "init", "--initial-branch=coordinator");
	git(commandRepository, "config", "user.name", "Brief fixture");
	git(commandRepository, "config", "user.email", "brief@example.invalid");
	git(commandRepository, "config", "commit.gpgsign", "false");
	git(
		commandRepository,
		"config",
		"core.hooksPath",
		path.join(root, "empty-hooks"),
	);
	git(commandRepository, "add", ".");
	git(commandRepository, "commit", "-m", "fixture base");
	const head = git(commandRepository, "rev-parse", "--short", "HEAD");
	git(commandRepository, "worktree", "add", "-b", "feature/build", worktree);
	const valid = `<!-- brief-format: v1 role: codex delivers: report -->\n# Fixture brief\n\n- **Worktree:** \`${worktree.replaceAll("\\", "/")}\`, branch \`feature/build\`, HEAD \`${head}\`\n\n${environment}\n## Goal\n\nRead \`docs/guide.md:4\` §"Selected heading".\n\n## Scope\n\nWrite only in the fixture. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report.\n\n## Report\n\nFixture report.\n`;
	const briefPath = path.join(commandRepository, "brief.md");
	const check = async (text = valid, fillEnvironment = false) => {
		writeFileSync(briefPath, text);
		return checkBrief({
			repositoryRoot: commandRepository,
			briefPath,
			fillEnvironment,
		});
	};
	return { root, commandRepository, worktree, head, valid, briefPath, check };
}

// Review sources must sit under D:/fitway-temp; a CI runner has no such folder until something makes it.
export function createReviewSourceRoot() {
	mkdirSync("D:/fitway-temp", { recursive: true });
}
