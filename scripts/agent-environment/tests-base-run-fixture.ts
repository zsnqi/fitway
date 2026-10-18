import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

export type BaseRunFixtureSpec = {
	baseFiles: Record<string, string>;
	resultFiles: Record<string, string | null>;
	installMarker?: boolean;
};

export function fixtureFile(
	files: Record<string, string | null>,
	file: string,
	text: string,
) {
	files[file] = text;
}

function write(root: string, file: string, text: string) {
	const absolute = path.resolve(root, file);
	mkdirSync(path.dirname(absolute), { recursive: true });
	writeFileSync(absolute, text);
}

function writeFixtureBase(root: string, spec: BaseRunFixtureSpec) {
	if (spec.installMarker !== false)
		mkdirSync(path.join(root, "node_modules", ".cache"), { recursive: true });
	write(root, ".gitignore", "node_modules/\n");
	write(
		root,
		"package.json",
		`${JSON.stringify(
			{
				private: true,
				type: "module",
				scripts: {},
			},
			null,
			2,
		)}\n`,
	);
	write(
		root,
		"vitest.config.ts",
		`import { defineConfig } from "vitest/config";
export default defineConfig({
	test: {
		exclude: [
			"**/node_modules/**",
			"tests/browser/**",
			"**/*.integration.test.ts",
			".agents/skills/verify-fitway/**/*.test.mjs"
		]
	}
});
`,
	);
	for (const [file, text] of Object.entries(spec.baseFiles))
		write(root, file, text);
}

function fixtureGit(root: string) {
	return (...args: string[]) =>
		execFileSync("git", args, {
			cwd: root,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "pipe"],
			windowsHide: true,
		}).trim();
}

function applyResult(
	root: string,
	resultFiles: BaseRunFixtureSpec["resultFiles"],
) {
	for (const [file, text] of Object.entries(resultFiles)) {
		if (text === null) {
			try {
				rmSync(path.resolve(root, file));
			} catch {}
			continue;
		}
		write(root, file, text);
	}
}

export function createBaseRunFixture(spec: BaseRunFixtureSpec) {
	const root = mkdtempSync(
		path.join(process.cwd(), "node_modules", ".cache", "base-run-case-"),
	);
	writeFixtureBase(root, spec);
	const git = fixtureGit(root);
	git("init", "--quiet");
	git("config", "user.name", "Base run fixture");
	git("config", "user.email", "base-run@example.invalid");
	git("config", "commit.gpgsign", "false");
	git("add", ".");
	git("commit", "--quiet", "-m", "base");
	const base = git("rev-parse", "HEAD");
	applyResult(root, spec.resultFiles);
	git("add", "-A");
	git("commit", "--quiet", "--allow-empty", "-m", "result");
	const result = git("rev-parse", "HEAD");
	return {
		root,
		base,
		result,
		git,
		run: (
			args: string[] = [],
			entry = path.resolve("scripts/agent-environment/tests-base-run-cli.mjs"),
		) =>
			spawnSync(process.execPath, [entry, ...args], {
				cwd: root,
				encoding: "utf8",
				windowsHide: true,
			}),
		cleanup: () =>
			rmSync(root, { recursive: true, force: true, maxRetries: 5 }),
	};
}

export function runBase(
	fixture: ReturnType<typeof createBaseRunFixture>,
	extra: string[] = [],
) {
	return fixture.run([
		"--base",
		fixture.base,
		"--result",
		fixture.result,
		...extra,
	]);
}

export function judgedClasses(stdout: string) {
	return stdout
		.split(/\r?\n/)
		.filter((line) =>
			/^(?:assertion|missing-module|wrong-reason|green-on-base) /.test(line),
		)
		.map((line) => line.match(/^([^ ]+) /)?.[1] ?? "");
}
