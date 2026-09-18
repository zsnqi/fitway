import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
	assertVitestVersionOutput,
	checkTestRuntime,
	formatDiagnosticReport,
} from "./check-test-runtime.mjs";
import { revalidateVitestRuntimeSession } from "./vitest-runtime.mjs";

const DIAGNOSTIC_ENTRY = fileURLToPath(
	new URL("./check-test-runtime.mjs", import.meta.url),
);

const VITEST_VERSION = "4.1.10";

// Vitest workers start with visible `--require`/`--conditions` exec arguments,
// so in-process acquisitions in this suite exercise the documented test-only
// dirty-bootstrap escape hatch. The CLI child assertions below run with a clean
// environment and cover the strict rejection.
const FIXTURE_ACQUISITION_OPTIONS = { allowVisibleDirtyBootstrap: true };

const temporaryRoots: string[] = [];
const environmentRestorations: Array<() => void> = [];

afterEach(() => {
	for (const restore of environmentRestorations.splice(0)) restore();
	for (const temporaryRoot of temporaryRoots.splice(0)) {
		rmSync(temporaryRoot, { recursive: true, force: true, maxRetries: 5 });
	}
});

function restoreEnvironment(name: string): void {
	const previous = process.env[name];
	environmentRestorations.push(() => {
		if (previous === undefined) {
			delete process.env[name];
			return;
		}
		process.env[name] = previous;
	});
}

const descriptorStub = {
	nodeVersion: process.versions.node,
	vitestCliRealPath: path.join(
		process.cwd(),
		"node_modules",
		"vitest",
		"vitest.mjs",
	),
	vitestVersion: VITEST_VERSION,
};

function writeFixtureFile(
	root: string,
	relativePath: string,
	text: string,
): void {
	const target = path.join(root, relativePath);
	mkdirSync(path.dirname(target), { recursive: true });
	writeFileSync(target, text);
}

function writeFixtureJson(
	root: string,
	relativePath: string,
	value: unknown,
): void {
	writeFixtureFile(root, relativePath, JSON.stringify(value, null, 2));
}

function defaultLockfile(vitestVersion = VITEST_VERSION): string {
	return [
		"lockfileVersion: '9.0'",
		"",
		"importers:",
		"",
		"  .:",
		"    devDependencies:",
		"      vitest:",
		"        specifier: ^4.1.10",
		`        version: ${vitestVersion}(@types/node@22.20.1)`,
		"",
	].join("\n");
}

function fixtureVersionLine(): string {
	return `vitest/${VITEST_VERSION} ${process.platform}-${process.arch} node-v${process.versions.node}`;
}

function fixturePlatformBindingPackageName(): string {
	if (process.platform === "win32") {
		return `@rolldown/binding-win32-${process.arch}-msvc`;
	}
	if (process.platform === "linux") {
		return process.arch === "arm"
			? "@rolldown/binding-linux-arm-gnueabihf"
			: `@rolldown/binding-linux-${process.arch}-gnu`;
	}
	if (process.platform === "darwin") {
		return `@rolldown/binding-darwin-${process.arch}`;
	}
	return `@rolldown/binding-${process.platform}-${process.arch}`;
}

const BINDING_PACKAGE_NAME = fixturePlatformBindingPackageName();
const BINDING_NATIVE_FILE_NAME = "rolldown-binding.fixture.node";

type FixtureOptions = {
	omitConfigUnit?: boolean;
	omitVitestPackage?: boolean;
};

type Fixture = {
	base: string;
	cliRealPath: string;
	root: string;
};

// A disposable fixture that satisfies the full bounded integrity set. It never
// touches the real install.
function createFixture(options: FixtureOptions = {}): Fixture {
	const base = mkdtempSync(path.join(tmpdir(), "fitway-check-test-runtime-"));
	temporaryRoots.push(base);
	const root = path.join(base, "root");
	mkdirSync(root, { recursive: true });
	writeFixtureJson(root, "package.json", {
		name: "check-test-runtime-fixture",
		private: true,
	});
	writeFixtureFile(root, "pnpm-lock.yaml", defaultLockfile());
	if (!options.omitConfigUnit) {
		writeFixtureFile(root, "vitest.config.ts", "export default {};\n");
	}
	writeFixtureFile(
		root,
		"vitest.integration.config.ts",
		"export default {};\n",
	);
	for (const fileName of [
		"vitest-runtime.mjs",
		"check-test-runtime.mjs",
		"repository-fingerprint.mjs",
		"run-vitest.mjs",
		"verify.mjs",
	]) {
		writeFixtureFile(
			root,
			path.join("scripts", fileName),
			`// fixture trust script ${fileName}\n`,
		);
	}
	let cliRealPath = path.join(root, "node_modules", "vitest", "vitest.mjs");
	if (!options.omitVitestPackage) {
		writeFixtureJson(root, "node_modules/vitest/package.json", {
			name: "vitest",
			version: VITEST_VERSION,
			bin: { vitest: "./vitest.mjs" },
		});
		writeFixtureFile(
			root,
			"node_modules/vitest/vitest.mjs",
			`console.log(${JSON.stringify(fixtureVersionLine())});\n`,
		);
		cliRealPath = path.join(root, "node_modules", "vitest", "vitest.mjs");
	}
	writeFixtureJson(root, "node_modules/vite/package.json", {
		name: "vite",
		version: "8.1.4",
		exports: { ".": "./dist/index.js", "./package.json": "./package.json" },
		dependencies: { rolldown: "1.1.5" },
	});
	writeFixtureFile(
		root,
		"node_modules/vite/dist/index.js",
		'export const version = "8.1.4";\n',
	);
	writeFixtureJson(root, "node_modules/rolldown/package.json", {
		name: "rolldown",
		version: "1.1.5",
		exports: { ".": "./dist/index.mjs", "./package.json": "./package.json" },
		optionalDependencies: { [BINDING_PACKAGE_NAME]: "1.1.5" },
	});
	writeFixtureFile(
		root,
		"node_modules/rolldown/dist/index.mjs",
		'import { marker } from "./shared/binding-Fixture0001.mjs";\nexport { marker };\n',
	);
	writeFixtureFile(
		root,
		"node_modules/rolldown/dist/shared/binding-Fixture0001.mjs",
		"export const marker = 1;\n",
	);
	const bindingDir = path.join(
		root,
		"node_modules",
		...BINDING_PACKAGE_NAME.split("/"),
	);
	writeFixtureJson(bindingDir, "package.json", {
		name: BINDING_PACKAGE_NAME,
		version: "1.1.5",
		main: BINDING_NATIVE_FILE_NAME,
		os: [process.platform],
		cpu: [process.arch],
	});
	writeFixtureFile(bindingDir, BINDING_NATIVE_FILE_NAME, "fixture-native\n");
	return { base, cliRealPath, root };
}

function runDiagnosticCli(
	root: string,
	env: Record<string, string | undefined> = process.env,
) {
	return spawnSync(process.execPath, [DIAGNOSTIC_ENTRY, root], {
		encoding: "utf8",
		env,
	});
}

describe("assertVitestVersionOutput", () => {
	it("accepts the observed version line with the exact version and node tokens", () => {
		const observed = assertVitestVersionOutput(
			`vitest/4.1.10 win32-x64 node-v${process.versions.node}\n`,
			descriptorStub,
		);
		expect(observed.vitestToken).toBe("vitest/4.1.10");
		expect(observed.nodeToken).toBe(`node-v${process.versions.node}`);
	});

	it("accepts a line without a node token", () => {
		const observed = assertVitestVersionOutput(
			"vitest/4.1.10\n",
			descriptorStub,
		);
		expect(observed.vitestToken).toBe("vitest/4.1.10");
		expect(observed.nodeToken).toBeNull();
	});

	it("rejects a wrong version token", () => {
		expect(() =>
			assertVitestVersionOutput("vitest/9.9.9 win32-x64\n", descriptorStub),
		).toThrow(/cli-version-token/);
	});

	it("rejects the expected version embedded in a longer token", () => {
		expect(() =>
			assertVitestVersionOutput("vitest/4.1.10-extra\n", descriptorStub),
		).toThrow(/cli-version-token/);
	});

	it("rejects mixed output where the expected token is not on the first line", () => {
		expect(() =>
			assertVitestVersionOutput(
				"spoofed preamble\nvitest/4.1.10 win32-x64\n",
				descriptorStub,
			),
		).toThrow(/cli-version-token/);
	});

	it("rejects duplicate or contradictory vitest tokens", () => {
		expect(() =>
			assertVitestVersionOutput("vitest/9.9.9 vitest/4.1.10\n", descriptorStub),
		).toThrow(/cli-version-token/);
	});

	it("rejects a mismatched node token", () => {
		expect(() =>
			assertVitestVersionOutput(
				"vitest/4.1.10 win32-x64 node-v0.0.0\n",
				descriptorStub,
			),
		).toThrow(/cli-node-token/);
	});

	it("rejects empty output", () => {
		expect(() => assertVitestVersionOutput("  \n\n", descriptorStub)).toThrow(
			/cli-output-empty/,
		);
	});
});

describe("checkTestRuntime on the real repository", () => {
	const acquisitionOptions = FIXTURE_ACQUISITION_OPTIONS;

	it("passes and reports bounded diagnostic provenance without a package-manager claim", () => {
		const result = checkTestRuntime(process.cwd(), {
			acquisitionOptions,
			callerIdentity: "check-test-runtime.test.ts",
		});
		expect(result.session.vitestVersion).toBe(
			result.session.lockfileResolution,
		);
		expect(result.observed.vitestToken).toBe(
			`vitest/${result.session.vitestVersion}`,
		);
		const report = formatDiagnosticReport(result);
		expect(report.startsWith("Vitest runtime diagnostic provenance")).toBe(
			true,
		);
		expect(report).toContain(result.session.repositoryRootRealPath);
		expect(report).toContain('"check-test-runtime.test.ts"');
		expect(report).toContain(`vitest version: ${result.session.vitestVersion}`);
		expect(report).toContain(result.session.vitestManifestRealPath);
		expect(report).toContain(result.session.vitestCliRealPath);
		expect(report).toContain(result.session.nodeExecutableRealPath);
		expect(report).toContain(`node-v${result.session.nodeVersion}`);
		expect(report).toContain(
			`lockfile resolution: ${result.session.lockfileResolution}`,
		);
		expect(report).toContain(
			`platform: ${result.session.platform}-${result.session.arch}`,
		);
		expect(report).toContain(result.session.integrity.digest);
		expect(report).toContain(
			`over ${result.session.integrity.members.length} members`,
		);
		for (const member of result.session.integrity.members) {
			expect(report).toContain(`member ${member.id}`);
			expect(report).toContain(member.sha256);
			expect(report).toContain(member.realPath);
		}
		for (const config of result.session.configs) {
			expect(report).toContain(`config ${config.path}`);
			expect(report).toContain(config.sha256);
		}
		expect(report).toContain(
			`observed CLI version line: ${JSON.stringify(result.observed.firstLine)}`,
		);
		expect(report).toContain("not reusable authority for any later process");
		expect(report).toContain(
			"not an authentication, attestation, sandbox, or dependency-safety claim",
		);
		expect(report).not.toMatch(/pnpm[ /]?\d/i);
		expect(report).not.toContain("packageManager");
	});

	it("is unaffected by a spoofed npm_config_user_agent", () => {
		restoreEnvironment("npm_config_user_agent");
		delete process.env.npm_config_user_agent;
		const baseline = checkTestRuntime(process.cwd(), {
			acquisitionOptions,
			callerIdentity: "check-test-runtime.test.ts",
		});
		process.env.npm_config_user_agent =
			"pnpm/0.0.0 npm/? node/v0.0.0 win32 x64";
		const spoofed = checkTestRuntime(process.cwd(), {
			acquisitionOptions,
			callerIdentity: "check-test-runtime.test.ts",
		});
		expect(spoofed.session.integrity.digest).toBe(
			baseline.session.integrity.digest,
		);
		expect(formatDiagnosticReport(spoofed)).toBe(
			formatDiagnosticReport(baseline),
		);
		expect(formatDiagnosticReport(spoofed)).not.toContain("0.0.0");
	});
});

describe("check-test-runtime CLI on disposable fixtures", () => {
	it("passes end-to-end and prints every bounded member and config hash", () => {
		const fixture = createFixture();
		const result = runDiagnosticCli(fixture.root);
		expect(result.status).toBe(0);
		expect(result.stderr).toBe("");
		expect(result.stdout).toContain(
			"diagnostic provenance (this invocation only)",
		);
		expect(result.stdout).toContain(fixture.root);
		expect(result.stdout).toContain(`vitest version: ${VITEST_VERSION}`);
		expect(result.stdout).toContain("vitest/4.1.10");
		expect(result.stdout).toContain("bounded set: sha256");
		expect(result.stdout).toContain("member vitest-cli");
		expect(result.stdout).toContain("member rolldown-platform-binding");
		expect(result.stdout).toContain("config vitest.config.ts");
		expect(result.stdout).toContain("config vitest.integration.config.ts");
		expect(result.stdout).toContain("observed CLI version line");
		expect(result.stdout).toContain("not reusable authority");
	});

	it("fails nonzero on an invalid root", () => {
		const emptyRoot = mkdtempSync(
			path.join(tmpdir(), "fitway-diagnostic-empty-"),
		);
		temporaryRoots.push(emptyRoot);
		const result = runDiagnosticCli(emptyRoot);
		expect(result.status).toBe(1);
		expect(result.stderr.startsWith("FAILED: ")).toBe(true);
		expect(result.stderr).toContain('Vitest runtime rule "');
		expect(result.stdout).not.toContain("diagnostic provenance");
	});

	it("fails nonzero when the bounded integrity set is incomplete", () => {
		const fixture = createFixture({ omitConfigUnit: true });
		const result = runDiagnosticCli(fixture.root);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain("integrity-member-unresolved");
		expect(result.stderr).toContain("config-unit");
		expect(result.stdout).not.toContain("diagnostic provenance");
	});

	it("rejects visible dirty bootstrap state with defense-in-depth wording", () => {
		const fixture = createFixture();
		restoreEnvironment("NODE_OPTIONS");
		process.env.NODE_OPTIONS = "--require ./injected-preload.cjs";
		let caught: Error | undefined;
		try {
			checkTestRuntime(fixture.root);
		} catch (error) {
			caught = error as Error;
		}
		expect(caught).toBeInstanceOf(Error);
		expect(caught?.message).toMatch(/dirty-bootstrap-visible/);
		expect(caught?.message).toContain("NODE_OPTIONS");
		expect(caught?.message).toContain("defense in depth");
		expect(caught?.message).toContain("cannot prove");

		delete process.env.NODE_OPTIONS;
		const result = runDiagnosticCli(fixture.root, {
			...process.env,
			NODE_PATH: path.join(process.cwd(), "node_modules"),
		});
		expect(result.status).toBe(1);
		expect(result.stderr).toContain("dirty-bootstrap-visible");
		expect(result.stderr).toContain("NODE_PATH");
		expect(result.stderr).toContain("defense in depth");
		expect(result.stderr).toContain("cannot prove");
		expect(result.stdout).not.toContain("diagnostic provenance");
	});

	it("fails when the integrity set changes during the diagnostic run", () => {
		const fixture = createFixture();
		let caught: Error | undefined;
		try {
			checkTestRuntime(fixture.root, {
				acquisitionOptions: FIXTURE_ACQUISITION_OPTIONS,
				callerIdentity: "check-test-runtime.test.ts",
				spawnSyncImpl: () => {
					writeFileSync(fixture.cliRealPath, "// changed during the run\n");
					return { status: 0, stderr: "", stdout: fixtureVersionLine() };
				},
			});
		} catch (error) {
			caught = error as Error;
		}
		expect(caught).toBeInstanceOf(Error);
		expect(caught?.message).toMatch(/post-launch-integrity/);
		expect(caught?.message).toContain("vitest-cli");
	});

	it("names the changed member when revalidation follows a mutation", () => {
		const fixture = createFixture();
		const result = checkTestRuntime(fixture.root, {
			acquisitionOptions: FIXTURE_ACQUISITION_OPTIONS,
			callerIdentity: "check-test-runtime.test.ts",
		});
		const unitConfig = result.session.configs.find(
			(config: { path: string }) => config.path === "vitest.config.ts",
		);
		writeFileSync(unitConfig.realPath, "export default { changed: true };\n");
		let caught: Error | undefined;
		try {
			revalidateVitestRuntimeSession(result.session, "pre-launch");
		} catch (error) {
			caught = error as Error;
		}
		expect(caught).toBeInstanceOf(Error);
		expect(caught?.message).toMatch(/integrity-member-changed/);
		expect(caught?.message).toContain("config-unit");
		expect(caught?.message).toContain(unitConfig.realPath);
	});
});
