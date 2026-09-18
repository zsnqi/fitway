import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	realpathSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
	acquireVitestRuntimeSession,
	describeVitestRuntimeSession,
	isPathContained,
	parseLockfileVitestResolution,
	revalidateVitestRuntimeSession,
	runVitest,
	runVitestSync,
} from "./vitest-runtime.mjs";

const REPOSITORY_ROOT = process.cwd();

const EXPECTED_MEMBER_IDS = [
	"root-package-json",
	"root-lockfile",
	"config-unit",
	"config-integration",
	"script-vitest-runtime",
	"script-check-test-runtime",
	"script-run-vitest",
	"script-verify",
	"script-repository-fingerprint",
	"vitest-manifest",
	"vitest-cli",
	"vite-manifest",
	"vite-entry",
	"rolldown-manifest",
	"rolldown-entry",
	"rolldown-binding-loader",
	"rolldown-platform-manifest",
	"rolldown-platform-binding",
];

const VITEST_VERSION = "4.1.10";

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

// Vitest workers start with visible `--require`/`--conditions` exec arguments,
// so every fixture acquisition inside this suite exercises the documented
// test-only dirty-bootstrap escape hatch. The bootstrap suite is the
// strict-bootstrap evidence layer; `real repository` tests below still
// validate every path, version, manifest, and integrity rule.
const FIXTURE_ACQUISITION_OPTIONS = { allowVisibleDirtyBootstrap: true };

function visibleBootstrapIsDirty(): boolean {
	if (
		typeof process.env.NODE_OPTIONS === "string" &&
		process.env.NODE_OPTIONS.trim() !== ""
	) {
		return true;
	}
	if (
		typeof process.env.NODE_PATH === "string" &&
		process.env.NODE_PATH.trim() !== ""
	) {
		return true;
	}
	const preloadFlags = new Set([
		"--require",
		"--import",
		"--loader",
		"--experimental-loader",
		"--preload",
	]);
	return process.execArgv.some((argument) =>
		preloadFlags.has(argument.split("=", 1)[0]),
	);
}

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

// The decoy vitest entries in `apps/server`, `packages`, and the 6-space
// `vitest:` key under a snapshot's peerDependenciesMeta make a naive regex
// return the wrong resolution. Only the root importer's entry is correct.
function defaultLockfile(vitestVersion = VITEST_VERSION): string {
	return [
		"lockfileVersion: '9.0'",
		"",
		"settings:",
		"  autoInstallPeers: true",
		"  excludeLinksFromLockfile: false",
		"",
		"importers:",
		"",
		"  .:",
		"    dependencies:",
		"      zod:",
		"        specifier: 'catalog:'",
		"        version: 4.4.3",
		"    devDependencies:",
		"      vitest:",
		"        specifier: ^4.1.10",
		`        version: ${vitestVersion}(@types/node@22.20.1)(happy-dom@20.10.6)`,
		"",
		"  apps/server:",
		"    devDependencies:",
		"      vitest:",
		"        specifier: ^9.9.9",
		"        version: 9.9.9(decoy)",
		"",
		"packages:",
		"",
		`  vitest@${vitestVersion}(@types/node@22.20.1):`,
		"    resolution: {integrity: sha512-fixture}",
		"",
		"snapshots:",
		"",
		`  vitest@${vitestVersion}(@types/node@22.20.1):`,
		"    resolution: {integrity: sha512-fixture}",
		"    peerDependenciesMeta:",
		"      vitest:",
		"        optional: true",
		"",
	].join("\n");
}

function defaultFirstLine(vitestVersion = VITEST_VERSION): string {
	return `vitest/${vitestVersion} ${process.platform}-${process.arch} node-v${process.versions.node}`;
}

function fixtureCliSource(
	markerPath: string,
	output: string,
	exitCode: number,
): string {
	const lines = [
		'import { writeFileSync } from "node:fs";',
		`writeFileSync(${JSON.stringify(markerPath)}, JSON.stringify({ argv: process.argv.slice(2), env: { NODE_OPTIONS: process.env.NODE_OPTIONS ?? null } }), "utf8");`,
		`console.log(${JSON.stringify(output)});`,
	];
	if (exitCode !== 0) {
		lines.push(`process.exitCode = ${exitCode};`);
	}
	return `${lines.join("\n")}\n`;
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
	bin?: unknown;
	cliExitCode?: number;
	cliOutput?: string;
	directoryTarget?: string;
	junctionEscapeTo?: "outside" | "repository";
	lockfileVitestVersion?: string;
	manifestOverrides?: Record<string, unknown>;
	omitBin?: boolean;
	omitBinding?: boolean;
	omitConfigUnit?: boolean;
	omitLockfile?: boolean;
	omitNodeModules?: boolean;
	omitRolldown?: boolean;
	omitTrustScripts?: string[];
	omitVite?: boolean;
	omitVitestPackage?: boolean;
	packageOutside?: boolean;
	writeCliFile?: boolean;
};

type Fixture = {
	base: string;
	junctionCreated: boolean;
	markerPath: string;
	packageDir: string;
	root: string;
};

function createFixture(options: FixtureOptions = {}): Fixture {
	const base = mkdtempSync(path.join(tmpdir(), "fitway-vitest-runtime-"));
	temporaryRoots.push(base);
	const root = path.join(base, "root");
	mkdirSync(root, { recursive: true });
	const markerPath = path.join(base, "cli-marker.json");
	writeFixtureJson(root, "package.json", {
		name: "vitest-runtime-fixture",
		private: true,
	});
	if (!options.omitLockfile) {
		writeFixtureFile(
			root,
			"pnpm-lock.yaml",
			defaultLockfile(options.lockfileVitestVersion ?? VITEST_VERSION),
		);
	}
	if (!options.omitConfigUnit) {
		writeFixtureFile(root, "vitest.config.ts", "export default {};\n");
	}
	writeFixtureFile(
		root,
		"vitest.integration.config.ts",
		"export default {};\n",
	);
	const omittedScripts = new Set(options.omitTrustScripts ?? []);
	for (const [id, fileName] of Object.entries({
		"script-check-test-runtime": "check-test-runtime.mjs",
		"script-repository-fingerprint": "repository-fingerprint.mjs",
		"script-run-vitest": "run-vitest.mjs",
		"script-verify": "verify.mjs",
		"script-vitest-runtime": "vitest-runtime.mjs",
	})) {
		if (omittedScripts.has(id)) continue;
		writeFixtureFile(
			root,
			path.join("scripts", fileName),
			`// fixture trust script ${fileName}\n`,
		);
	}

	const packageDir = path.join(root, "node_modules", "vitest");
	if (options.omitNodeModules) {
		return { base, junctionCreated: false, markerPath, packageDir, root };
	}
	mkdirSync(path.join(root, "node_modules"), { recursive: true });
	if (options.packageOutside) {
		const outsidePackageDir = path.join(base, "outside", "vitest");
		writeFixtureJson(outsidePackageDir, "package.json", {
			name: "vitest",
			version: VITEST_VERSION,
			bin: { vitest: "./vitest.mjs" },
		});
		writeFixtureFile(
			outsidePackageDir,
			"vitest.mjs",
			fixtureCliSource(markerPath, defaultFirstLine(), 0),
		);
		symlinkSync(outsidePackageDir, packageDir, "junction");
		return { base, junctionCreated: true, markerPath, packageDir, root };
	}
	if (options.omitVitestPackage) {
		// Keep the dependency tree valid minus the vitest package.
	} else {
		mkdirSync(packageDir, { recursive: true });
		let junctionCreated = false;
		let binTarget: unknown = options.omitBin
			? undefined
			: Object.hasOwn(options, "bin")
				? options.bin
				: { vitest: "./vitest.mjs" };
		let cliRelativePath = "vitest.mjs";
		if (options.junctionEscapeTo === "outside") {
			const outsideDir = path.join(base, "outside");
			mkdirSync(outsideDir, { recursive: true });
			writeFixtureFile(
				outsideDir,
				"outside-vitest.mjs",
				fixtureCliSource(markerPath, defaultFirstLine(), 0),
			);
			symlinkSync(outsideDir, path.join(packageDir, "escape"), "junction");
			junctionCreated = true;
			binTarget = { vitest: "./escape/outside-vitest.mjs" };
			cliRelativePath = path.join("escape", "outside-vitest.mjs");
		}
		if (options.junctionEscapeTo === "repository") {
			const toolsDir = path.join(root, "tools");
			mkdirSync(toolsDir, { recursive: true });
			writeFixtureFile(
				toolsDir,
				"repo-cli.mjs",
				fixtureCliSource(markerPath, defaultFirstLine(), 0),
			);
			symlinkSync(toolsDir, path.join(packageDir, "relocated"), "junction");
			junctionCreated = true;
			binTarget = { vitest: "./relocated/repo-cli.mjs" };
			cliRelativePath = path.join("relocated", "repo-cli.mjs");
		}
		if (typeof options.directoryTarget === "string") {
			mkdirSync(path.join(packageDir, options.directoryTarget), {
				recursive: true,
			});
		}
		const manifest: Record<string, unknown> = {
			name: "vitest",
			version: VITEST_VERSION,
			...options.manifestOverrides,
		};
		if (!options.omitBin) {
			manifest.bin = binTarget;
		}
		writeFixtureJson(packageDir, "package.json", manifest);
		if (options.writeCliFile !== false) {
			writeFixtureFile(
				packageDir,
				cliRelativePath,
				fixtureCliSource(
					markerPath,
					options.cliOutput ?? defaultFirstLine(),
					options.cliExitCode ?? 0,
				),
			);
		}
		if (options.junctionEscapeTo !== undefined) {
			return { base, junctionCreated, markerPath, packageDir, root };
		}
	}

	if (!options.omitVite) {
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
	}
	if (!options.omitRolldown) {
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
	}
	if (!options.omitBinding) {
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
	}
	return { base, junctionCreated: false, markerPath, packageDir, root };
}

function acquireFixtureSession(fixture: Fixture) {
	return acquireVitestRuntimeSession(
		fixture.root,
		"vitest-runtime-focused-suite",
		FIXTURE_ACQUISITION_OPTIONS,
	);
}

function expectAcquisitionRejection(fixture: Fixture, pattern: RegExp): void {
	let error: Error | undefined;
	try {
		acquireFixtureSession(fixture);
	} catch (caught) {
		error = caught as Error;
	}
	expect(error).toBeInstanceOf(Error);
	expect(error?.message).toMatch(/^Vitest runtime rule "/);
	expect(error?.message).toMatch(pattern);
	expect(existsSync(fixture.markerPath)).toBe(false);
}

type SpawnCall = {
	execPath: string;
	argv: readonly string[];
	options: Record<string, unknown>;
};

function fakeChild(outcome: {
	error?: Error;
	signal?: string | null;
	status?: number | null;
}) {
	const child = {
		once(event: string, listener: (...args: unknown[]) => void) {
			queueMicrotask(() => {
				if (event === "error" && outcome.error) {
					listener(outcome.error);
					return;
				}
				if (event === "close" && !outcome.error) {
					listener(
						outcome.status === undefined ? 0 : outcome.status,
						outcome.signal ?? null,
					);
				}
			});
			return child;
		},
	};
	return child;
}

function recordSpawn(calls: SpawnCall[]) {
	return (
		execPath: string,
		argv: readonly string[],
		options: Record<string, unknown>,
	) => {
		calls.push({ execPath, argv: [...argv], options });
		return fakeChild({ status: 0 });
	};
}

describe("acquireVitestRuntimeSession: positive resolution", () => {
	it("resolves the contained package, manifest, CLI, and bounded set from a normal fixture", () => {
		const fixture = createFixture();
		const session = acquireFixtureSession(fixture);
		const expectedManifest = realpathSync(
			path.join(fixture.root, "node_modules", "vitest", "package.json"),
		);
		const expectedCli = realpathSync(
			path.join(fixture.root, "node_modules", "vitest", "vitest.mjs"),
		);
		expect(session.repositoryRootRealPath).toBe(realpathSync(fixture.root));
		expect(session.vitestManifestRealPath).toBe(expectedManifest);
		expect(session.vitestPackageDirectoryRealPath).toBe(
			path.dirname(expectedManifest),
		);
		expect(session.vitestCliRealPath).toBe(expectedCli);
		expect(session.vitestVersion).toBe(VITEST_VERSION);
		expect(session.lockfileResolution).toBe(VITEST_VERSION);
		expect(session.nodeExecutableRealPath).toBe(realpathSync(process.execPath));
		expect(session.nodeVersion).toBe(process.versions.node);
		expect(session.platform).toBe(process.platform);
		expect(session.arch).toBe(process.arch);
		expect(session.integrity.digest).toMatch(/^[0-9a-f]{64}$/);
		expect(
			session.integrity.members.map((member: { id: string }) => member.id),
		).toEqual(EXPECTED_MEMBER_IDS);
		expect(isPathContained(fixture.root, session.vitestCliRealPath)).toBe(true);
		expect(
			isPathContained(
				session.vitestPackageDirectoryRealPath,
				session.vitestCliRealPath,
			),
		).toBe(true);
		expect(
			session.configs.map((config: { path: string }) => config.path),
		).toEqual(["vitest.config.ts", "vitest.integration.config.ts"]);
	});

	it("records SHA-256 and byte length for every bounded-set member", () => {
		const fixture = createFixture();
		const session = acquireFixtureSession(fixture);
		const cliBytes = readFileSync(session.vitestCliRealPath);
		const cliMember = session.integrity.members.find(
			(member: { id: string }) => member.id === "vitest-cli",
		);
		expect(cliMember.realPath).toBe(session.vitestCliRealPath);
		expect(cliMember.byteLength).toBe(cliBytes.byteLength);
		expect(cliMember.sha256).toBe(
			createHash("sha256").update(cliBytes).digest("hex"),
		);
		const digestHash = createHash("sha256");
		for (const member of session.integrity.members) {
			digestHash.update(
				`${member.id}\0${member.kind}\0${member.realPath}\0${member.sha256}\0${member.byteLength}\0`,
				"utf8",
			);
		}
		expect(session.integrity.digest).toBe(digestHash.digest("hex"));
		const nativeMember = session.integrity.members.find(
			(member: { id: string }) => member.id === "rolldown-platform-binding",
		);
		expect(path.extname(nativeMember.realPath)).toBe(".node");
		expect(nativeMember.kind).toBe("native-binding");
	});

	it("returns a deeply frozen session that cannot be mutated", () => {
		const fixture = createFixture();
		const session = acquireFixtureSession(fixture);
		expect(Object.isFrozen(session)).toBe(true);
		expect(Object.isFrozen(session.integrity)).toBe(true);
		expect(Object.isFrozen(session.integrity.members)).toBe(true);
		expect(Object.isFrozen(session.configs)).toBe(true);
		expect(() => {
			(session as { vitestVersion: string }).vitestVersion = "9.9.9";
		}).toThrow();
		expect(session.vitestVersion).toBe(VITEST_VERSION);
	});

	it("produces a stable bounded-set digest across repeated acquisitions", () => {
		const fixture = createFixture();
		expect(acquireFixtureSession(fixture).integrity.digest).toBe(
			acquireFixtureSession(fixture).integrity.digest,
		);
	});

	it("walks up from the resolved entry when the package does not export ./package.json", () => {
		const fixture = createFixture({
			manifestOverrides: { exports: { ".": "./vitest.mjs" } },
		});
		const session = acquireFixtureSession(fixture);
		expect(session.vitestManifestRealPath).toBe(
			realpathSync(
				path.join(fixture.root, "node_modules", "vitest", "package.json"),
			),
		);
	});

	it("accepts a string bin declaration", () => {
		const fixture = createFixture({ bin: "./entry.mjs" });
		writeFixtureFile(
			fixture.packageDir,
			"entry.mjs",
			fixtureCliSource(fixture.markerPath, defaultFirstLine(), 0),
		);
		const session = acquireFixtureSession(fixture);
		expect(session.vitestCliRealPath).toBe(
			realpathSync(path.join(fixture.packageDir, "entry.mjs")),
		);
	});

	it("rejects visible dirty bootstrap state unless the test-only bypass is passed", () => {
		const fixture = createFixture();
		if (visibleBootstrapIsDirty()) {
			expect(() =>
				acquireVitestRuntimeSession(fixture.root, "dirty-probe"),
			).toThrow(/dirty-bootstrap-visible/);
		}
		const session = acquireVitestRuntimeSession(
			fixture.root,
			"bypass-probe",
			FIXTURE_ACQUISITION_OPTIONS,
		);
		expect(session.vitestVersion).toBe(VITEST_VERSION);
	});
});

describe("acquisition: package containment", () => {
	it("fails when the repository has no node_modules directory", () => {
		const fixture = createFixture({ omitNodeModules: true });
		expectAcquisitionRejection(fixture, /node-modules-missing/);
	});

	it("fails closed when the local vitest package does not exist", () => {
		const fixture = createFixture({ omitVitestPackage: true });
		// The pnpm `.CMD` shim prepends its virtual store to NODE_PATH, so a
		// package reached that way is rejected by containment instead of the
		// resolution rule. Both are fail-closed rejections of a foreign vitest.
		expectAcquisitionRejection(
			fixture,
			/vitest-package-unresolved|package-manifest-outside-node-modules/,
		);
	});

	it("rejects a package reachable only through NODE_PATH outside the worktree", () => {
		const fixture = createFixture({ omitVitestPackage: true });
		const runtimeModuleUrl = pathToFileURL(
			fileURLToPath(new URL("./vitest-runtime.mjs", import.meta.url)),
		).href;
		const script = [
			`import { acquireVitestRuntimeSession } from ${JSON.stringify(runtimeModuleUrl)};`,
			"try {",
			'  acquireVitestRuntimeSession(process.argv[1], "node-path-probe", { allowVisibleDirtyBootstrap: true });',
			'  console.log("ACCEPTED");',
			"} catch (error) {",
			'  console.log("REJECTED " + error.message);',
			"}",
		].join("\n");
		const result = spawnSync(
			process.execPath,
			["--input-type=module", "-e", script, fixture.root],
			{
				encoding: "utf8",
				env: {
					...process.env,
					NODE_PATH: path.join(REPOSITORY_ROOT, "node_modules"),
				},
			},
		);
		expect(result.stdout).toContain("REJECTED");
		expect(result.stdout).toMatch(/package-manifest-outside-node-modules/);
	});

	it("fails when the resolved package real path escapes node_modules", () => {
		const fixture = createFixture({ packageOutside: true });
		expectAcquisitionRejection(
			fixture,
			/package-manifest-outside-node-modules/,
		);
	});

	it("fails when the installed version disagrees with the lockfile resolution", () => {
		const fixture = createFixture({ lockfileVitestVersion: "4.0.0" });
		expectAcquisitionRejection(fixture, /lockfile-resolution-mismatch/);
	});

	it("fails when the root lockfile cannot be read", () => {
		const fixture = createFixture({ omitLockfile: true });
		expectAcquisitionRejection(fixture, /lockfile-unreadable/);
	});
});

describe("acquisition: bin declaration rules", () => {
	const malformedValues: Array<[string, unknown]> = [
		["null", null],
		["a number", 42],
		["an array", ["./vitest.mjs", "./other.mjs"]],
		["a boolean", true],
		["an object without a vitest member", { v: "./vitest.mjs" }],
		["an object with a non-string vitest member", { vitest: 42 }],
		["an object with a null vitest member", { vitest: null }],
	];

	for (const [label, value] of malformedValues) {
		it(`rejects ${label} bin declaration`, () => {
			const fixture = createFixture({ bin: value });
			expectAcquisitionRejection(fixture, /bin-declaration/);
		});
	}

	it("rejects a missing bin declaration", () => {
		const fixture = createFixture({ omitBin: true });
		expectAcquisitionRejection(fixture, /bin-declaration/);
	});

	it("rejects empty and whitespace-only string targets", () => {
		const empty = createFixture({ bin: "" });
		expectAcquisitionRejection(empty, /bin-empty/);
		const whitespace = createFixture({ bin: { vitest: "   " } });
		expectAcquisitionRejection(whitespace, /bin-empty/);
	});

	const absoluteTargets: Array<[string, string]> = [
		["posix absolute", "/outside/vitest.mjs"],
		["posix absolute backslash", "\\outside\\vitest.mjs"],
		["unc path", "\\\\server\\share\\vitest.mjs"],
		["windows drive absolute", "C:\\outside\\vitest.mjs"],
		["windows drive relative", "C:outside/vitest.mjs"],
	];

	for (const [label, target] of absoluteTargets) {
		it(`rejects ${label} bin target`, () => {
			const fixture = createFixture({ bin: { vitest: target } });
			expectAcquisitionRejection(fixture, /bin-absolute/);
		});
	}

	const traversals: Array<[string, string]> = [
		["the audit fixture string", "../../../outside-vitest.mjs"],
		["a single parent step", "../outside-vitest.mjs"],
		["a windows-style parent step", "..\\outside-vitest.mjs"],
	];

	for (const [label, target] of traversals) {
		it(`rejects ${label} when it resolves outside the package`, () => {
			const fixture = createFixture({ bin: { vitest: target } });
			expectAcquisitionRejection(fixture, /bin-traversal/);
		});
	}

	it("rejects a missing CLI target", () => {
		const fixture = createFixture({ writeCliFile: false });
		expectAcquisitionRejection(fixture, /bin-missing/);
	});

	it("rejects a directory CLI target", () => {
		const fixture = createFixture({
			bin: { vitest: "./subdir" },
			directoryTarget: "subdir",
		});
		expectAcquisitionRejection(fixture, /bin-not-file/);
	});

	it("rejects a lexically contained target whose real path escapes the package through a junction", (context) => {
		const fixture = createFixture({ junctionEscapeTo: "outside" });
		if (!fixture.junctionCreated) {
			context.skip();
			return;
		}
		expectAcquisitionRejection(fixture, /bin-package-escape/);
	});

	it("rejects a fake CLI outside the package that prints the expected version text", (context) => {
		const fixture = createFixture({ junctionEscapeTo: "outside" });
		if (!fixture.junctionCreated) {
			context.skip();
			return;
		}
		expectAcquisitionRejection(fixture, /bin-package-escape/);
		expect(existsSync(fixture.markerPath)).toBe(false);
	});

	it("rejects a junction target inside the repository but outside the package", (context) => {
		const fixture = createFixture({ junctionEscapeTo: "repository" });
		if (!fixture.junctionCreated) {
			context.skip();
			return;
		}
		expectAcquisitionRejection(fixture, /bin-package-escape/);
	});
});

describe("runVitest: session-bound launch identity", () => {
	it("launches the session Node real path and CLI real path with the exact argv", async () => {
		const fixture = createFixture();
		const session = acquireFixtureSession(fixture);
		const calls: SpawnCall[] = [];
		const result = await runVitest(
			session,
			["run", "--config", "vitest.config.ts", "a.test.ts"],
			{ configPath: "vitest.config.ts", spawnImpl: recordSpawn(calls) },
		);
		expect(calls).toHaveLength(1);
		expect(calls[0].execPath).toBe(session.nodeExecutableRealPath);
		expect(calls[0].argv).toEqual([
			session.vitestCliRealPath,
			"run",
			"a.test.ts",
			"--config",
			"vitest.config.ts",
		]);
		expect(calls[0].options.cwd).toBe(session.repositoryRootRealPath);
		expect(calls[0].options.env).toBe(process.env);
		expect(calls[0].options.shell).toBe(false);
		expect(calls[0].options.windowsHide).toBe(true);
		expect(Object.hasOwn(calls[0].options, "execArgv")).toBe(false);
		expect(result.session).toBe(session);
		expect(result.execPath).toBe(session.nodeExecutableRealPath);
		expect(result.argv).toEqual([
			session.vitestCliRealPath,
			"run",
			"a.test.ts",
			"--config",
			"vitest.config.ts",
		]);
		expect(result.configPath).toBe("vitest.config.ts");
		expect(result.configSha256).toBe(session.configs[0].sha256);
		expect(result.integrityDigest).toBe(session.integrity.digest);
	});

	it("selects the integration config hash and rejects unrecorded config paths", async () => {
		const fixture = createFixture();
		const session = acquireFixtureSession(fixture);
		const integrationConfig = session.configs.find(
			(config: { path: string }) =>
				config.path === "vitest.integration.config.ts",
		);
		const calls: SpawnCall[] = [];
		const result = await runVitest(session, ["run"], {
			configPath: "vitest.integration.config.ts",
			spawnImpl: recordSpawn(calls),
		});
		expect(result.configPath).toBe("vitest.integration.config.ts");
		expect(result.configSha256).toBe(integrationConfig.sha256);
		expect(result.configByteLength).toBe(integrationConfig.byteLength);

		const unknownCalls: SpawnCall[] = [];
		await expect(
			runVitest(session, ["run"], {
				configPath: "unknown.config.ts",
				spawnImpl: recordSpawn(unknownCalls),
			}),
		).rejects.toThrow(/unknown-config-path/);
		expect(unknownCalls).toHaveLength(0);
	});

	it("rejects an unrecorded -c= spelling before spawn", async () => {
		const fixture = createFixture();
		const session = acquireFixtureSession(fixture);
		const calls: SpawnCall[] = [];
		await expect(
			runVitest(session, ["run", "-c=unrecorded.config.ts"], {
				spawnImpl: recordSpawn(calls),
			}),
		).rejects.toThrow(/unknown-config-path/);
		expect(calls).toHaveLength(0);
		expect(existsSync(fixture.markerPath)).toBe(false);
	});

	it("rejects every root selector spelling before spawn", async () => {
		const fixture = createFixture();
		const otherFixture = createFixture();
		const session = acquireFixtureSession(fixture);
		for (const tokens of [
			["--root", otherFixture.root],
			[`--root=${otherFixture.root}`],
			["-r", otherFixture.root],
			[`-r=${otherFixture.root}`],
		]) {
			const calls: SpawnCall[] = [];
			await expect(
				runVitest(session, ["run", ...tokens], {
					spawnImpl: recordSpawn(calls),
				}),
			).rejects.toThrow(/root-selector-unsupported/);
			expect(calls).toHaveLength(0);
		}
		expect(existsSync(fixture.markerPath)).toBe(false);
		expect(existsSync(otherFixture.markerPath)).toBe(false);
	});

	it("rejects a conflicting argv config and options.configPath before spawn", async () => {
		const fixture = createFixture();
		const session = acquireFixtureSession(fixture);
		const calls: SpawnCall[] = [];
		await expect(
			runVitest(session, ["run", "-c=vitest.integration.config.ts"], {
				configPath: "vitest.config.ts",
				spawnImpl: recordSpawn(calls),
			}),
		).rejects.toThrow(/conflicting-config-selection/);
		expect(calls).toHaveLength(0);
	});

	it("requires an explicit session: a raw root, a plain object, and a forged session fail before spawn", async () => {
		const fixture = createFixture();
		const session = acquireFixtureSession(fixture);
		const calls: SpawnCall[] = [];

		await expect(
			runVitest(fixture.root, ["run"], { spawnImpl: recordSpawn(calls) }),
		).rejects.toThrow(/vitest-session-required/);
		expect(() =>
			runVitestSync({ ...session }, ["--version"], {
				spawnSyncImpl: recordSpawn(calls),
			}),
		).toThrow(/vitest-session-required/);
		const equalLooking: Record<string, unknown> = {};
		for (const key of Object.keys(session)) {
			equalLooking[key] = (session as Record<string, unknown>)[key];
		}
		expect(() =>
			runVitestSync(equalLooking, ["--version"], {
				spawnSyncImpl: recordSpawn(calls),
			}),
		).toThrow(/vitest-session-required/);
		expect(() =>
			runVitestSync(fixture.root, ["--version"], {
				spawnSyncImpl: recordSpawn(calls),
			}),
		).toThrow(/vitest-session-required/);
		expect(calls).toHaveLength(0);
	});

	it("propagates the exact exit code and signal", async () => {
		const fixture = createFixture();
		const session = acquireFixtureSession(fixture);
		const calls: SpawnCall[] = [];
		const result = await runVitest(session, ["run"], {
			spawnImpl: (execPath, argv, options) => {
				calls.push({ execPath, argv: [...argv], options });
				return fakeChild({ status: 7 });
			},
		});
		expect(result.status).toBe(7);
		expect(result.signal).toBeNull();

		const signalled = await runVitest(session, ["run"], {
			spawnImpl: () => fakeChild({ signal: "SIGTERM", status: null }),
		});
		expect(signalled.status).toBeNull();
		expect(signalled.signal).toBe("SIGTERM");
	});

	it("throws a rule error when the process cannot be launched", async () => {
		const fixture = createFixture();
		const session = acquireFixtureSession(fixture);
		await expect(
			runVitest(session, ["run"], {
				spawnImpl: () => fakeChild({ error: new Error("EPERM") }),
			}),
		).rejects.toThrow(/cli-launch/);
	});

	it("rejects non-string arguments", async () => {
		const fixture = createFixture();
		const session = acquireFixtureSession(fixture);
		await expect(
			runVitest(session, [42 as unknown as string], {
				spawnImpl: recordSpawn([]),
			}),
		).rejects.toThrow(/vitest-arguments/);
	});

	it("does not re-resolve after acquisition: a substituted CLI is detected, not re-baselined", async () => {
		const fixture = createFixture();
		const session = acquireFixtureSession(fixture);
		writeFileSync(
			session.vitestCliRealPath,
			fixtureCliSource(
				fixture.markerPath,
				`vitest/${VITEST_VERSION} substituted`,
				0,
			),
		);
		const calls: SpawnCall[] = [];
		await expect(
			runVitest(session, ["run"], { spawnImpl: recordSpawn(calls) }),
		).rejects.toThrow(/integrity-member-changed/);
		expect(calls).toHaveLength(0);
		expect(existsSync(fixture.markerPath)).toBe(false);
	});
});

describe("lifecycle: one explicit session per invocation", () => {
	it("reuses the same session object and recorded launch identity across launches", async () => {
		const fixture = createFixture();
		const session = acquireFixtureSession(fixture);
		const calls: SpawnCall[] = [];
		const first = await runVitest(session, ["run", "one.test.ts"], {
			spawnImpl: recordSpawn(calls),
		});
		const second = await runVitest(session, ["run", "two.test.ts"], {
			configPath: "vitest.integration.config.ts",
			spawnImpl: recordSpawn(calls),
		});
		expect(first.session).toBe(session);
		expect(second.session).toBe(session);
		expect(calls).toHaveLength(2);
		expect(calls[0].execPath).toBe(session.nodeExecutableRealPath);
		expect(calls[1].execPath).toBe(session.nodeExecutableRealPath);
		expect(calls[0].argv[0]).toBe(session.vitestCliRealPath);
		expect(calls[1].argv[0]).toBe(session.vitestCliRealPath);
		expect(calls[0].options.cwd).toBe(session.repositoryRootRealPath);
		expect(calls[1].options.cwd).toBe(session.repositoryRootRealPath);
		expect(first.integrityDigest).toBe(second.integrityDigest);
	});

	it("invalidates a selected config mutated before launch and spawns nothing", async () => {
		const fixture = createFixture();
		const session = acquireFixtureSession(fixture);
		writeFileSync(
			path.join(fixture.root, "vitest.integration.config.ts"),
			"export default { mutated: true };\n",
		);
		const calls: SpawnCall[] = [];
		await expect(
			runVitest(session, ["run"], { spawnImpl: recordSpawn(calls) }),
		).rejects.toThrow(/integrity-member-changed/);
		await expect(
			runVitest(session, ["run"], { spawnImpl: recordSpawn(calls) }),
		).rejects.toThrow(/vitest\.integration\.config\.ts/);
		expect(calls).toHaveLength(0);
	});

	it("invalidates a selected file mutated between launches at the next pre-launch check", async () => {
		const fixture = createFixture();
		const session = acquireFixtureSession(fixture);
		const calls: SpawnCall[] = [];
		await runVitest(session, ["run"], { spawnImpl: recordSpawn(calls) });
		expect(calls).toHaveLength(1);
		writeFileSync(
			path.join(fixture.root, "vitest.config.ts"),
			"export default { changed: true };\n",
		);
		await expect(
			runVitest(session, ["run"], { spawnImpl: recordSpawn(calls) }),
		).rejects.toThrow(/integrity-member-changed/);
		expect(calls).toHaveLength(1);
		expect(() => revalidateVitestRuntimeSession(session, "pre-launch")).toThrow(
			/config-unit/,
		);
	});

	it("invalidates a selected file mutated during a fake child run even when the child exits zero", async () => {
		const fixture = createFixture();
		const session = acquireFixtureSession(fixture);
		await expect(
			runVitest(session, ["run"], {
				spawnImpl: (execPath, argv, options) => {
					writeFileSync(
						session.vitestCliRealPath,
						"// mutated during the child run\n",
					);
					return recordSpawn([])(execPath, argv, options);
				},
			}),
		).rejects.toThrow(/post-launch-integrity/);
	});

	it("names the changed member when revalidation fails directly", () => {
		const fixture = createFixture();
		const session = acquireFixtureSession(fixture);
		writeFileSync(session.vitestCliRealPath, "// replaced\n");
		let error: Error | undefined;
		try {
			revalidateVitestRuntimeSession(session, "pre-launch");
		} catch (caught) {
			error = caught as Error;
		}
		expect(error).toBeInstanceOf(Error);
		expect(error?.message).toMatch(
			/^Vitest runtime rule "integrity-member-changed"/,
		);
		expect(error?.message).toContain(session.vitestCliRealPath);
		expect(error?.message).toContain("vitest-cli");

		const missingFixture = createFixture();
		const missingSession = acquireFixtureSession(missingFixture);
		rmSync(path.join(missingFixture.root, "pnpm-lock.yaml"), { force: true });
		expect(() =>
			revalidateVitestRuntimeSession(missingSession, "pre-launch"),
		).toThrow(/integrity-member-missing/);
	});
});

describe("launcher decoys and direct launch", () => {
	function createDecoyLaunchers(base: string, root: string): string {
		const decoyDir = path.join(base, "shim-dir");
		mkdirSync(decoyDir, { recursive: true });
		const decoyMarker = path.join(base, "decoy-marker.json");
		for (const poison of [
			"pnpm.cmd",
			"node.cmd",
			"vitest.cmd",
			"vitest.ps1",
			"vitest",
		]) {
			const target = path.join(decoyDir, poison);
			if (poison.endsWith(".cmd")) {
				writeFileSync(
					target,
					`@echo off\r\necho decoy>${decoyMarker}\r\nexit /b 0\r\n`,
				);
				continue;
			}
			writeFileSync(target, `decoy ${poison}\n`);
		}
		mkdirSync(path.join(root, "node_modules", ".bin"), { recursive: true });
		writeFileSync(
			path.join(root, "node_modules", ".bin", "vitest.cmd"),
			"@echo off\r\nexit /b 0\r\n",
		);
		return decoyDir;
	}

	it("never selects a decoy .bin shim or PATH launcher and keeps the exact argv", async () => {
		const fixture = createFixture();
		const decoyDir = createDecoyLaunchers(fixture.base, fixture.root);
		restoreEnvironment("PATH");
		restoreEnvironment("PATHEXT");
		process.env.PATH = `${decoyDir}${path.delimiter}${process.env.PATH ?? ""}`;
		process.env.PATHEXT = ".CMD;.BAT;.COM";
		const session = acquireFixtureSession(fixture);
		const calls: SpawnCall[] = [];
		const result = await runVitest(session, ["run", "--reporter=verbose"], {
			spawnImpl: recordSpawn(calls),
		});
		expect(calls).toHaveLength(1);
		expect(calls[0].execPath).toBe(session.nodeExecutableRealPath);
		expect(calls[0].argv).toEqual([
			session.vitestCliRealPath,
			"run",
			"--reporter=verbose",
			"--config",
			"vitest.config.ts",
		]);
		expect(result.status).toBe(0);
		expect(existsSync(path.join(fixture.base, "decoy-marker.json"))).toBe(
			false,
		);
		expect(existsSync(fixture.markerPath)).toBe(false);
	});

	it("still launches the contained CLI when node_modules/.bin is absent", () => {
		const fixture = createFixture();
		expect(existsSync(path.join(fixture.root, "node_modules", ".bin"))).toBe(
			false,
		);
		const session = acquireFixtureSession(fixture);
		const result = runVitestSync(session, ["--version"]);
		expect(result.execPath).toBe(session.nodeExecutableRealPath);
		expect(result.argv[0]).toBe(session.vitestCliRealPath);
		expect(result.status).toBe(0);
		expect(result.stdout).toContain(`vitest/${VITEST_VERSION}`);
		const recorded = JSON.parse(readFileSync(fixture.markerPath, "utf8")) as {
			argv: string[];
		};
		expect(recorded.argv).toEqual([
			"--version",
			"--config",
			"vitest.config.ts",
		]);
	});

	it("real-launches the contained CLI with PATH decoys present", () => {
		const fixture = createFixture();
		const decoyDir = path.join(fixture.base, "decoy-bin");
		mkdirSync(decoyDir, { recursive: true });
		const decoyMarker = path.join(fixture.base, "decoy-marker.json");
		for (const poison of ["pnpm.cmd", "node.cmd", "vitest.cmd", "vitest"]) {
			writeFileSync(
				path.join(decoyDir, poison),
				poison.endsWith(".cmd")
					? `@echo off\r\necho decoy>${decoyMarker}\r\nexit /b 0\r\n`
					: `decoy ${poison}\n`,
			);
		}
		restoreEnvironment("PATH");
		process.env.PATH = `${decoyDir}${path.delimiter}${process.env.PATH ?? ""}`;
		const session = acquireFixtureSession(fixture);
		const result = runVitestSync(session, ["--version"]);
		expect(result.status).toBe(0);
		expect(result.stdout.trim().split(/\s+/)[0]).toBe(
			`vitest/${VITEST_VERSION}`,
		);
		expect(existsSync(fixture.markerPath)).toBe(true);
		expect(existsSync(decoyMarker)).toBe(false);
	});
});

describe("allowed behavior: native loading, forks, Workers, and child processes", () => {
	it("keeps the runtime free of native, Worker, pool, and child-process denial mechanisms", () => {
		const runtimeText = readFileSync(
			path.join(REPOSITORY_ROOT, "scripts", "vitest-runtime.mjs"),
			"utf8",
		);
		for (const pattern of [
			/process\.dlopen\b/,
			/process\.binding\b/,
			/new Worker\b/,
			/--pool\b/,
			/vmForks/,
			/child_process\.\w+\s*=/,
			/native-(?:denied|forbidden|blocked)/,
		]) {
			expect(runtimeText).not.toMatch(pattern);
		}
		expect(runtimeText).toMatch(/native-binding/);
		expect(runtimeText).toMatch(/spawnImpl \?\? spawn/);
	});

	it("records the native Rolldown binding as an accepted member instead of denying it", () => {
		const fixture = createFixture();
		const session = acquireFixtureSession(fixture);
		const nativeMember = session.integrity.members.find(
			(member: { id: string }) => member.id === "rolldown-platform-binding",
		);
		expect(path.extname(nativeMember.realPath)).toBe(".node");
		expect(existsSync(nativeMember.realPath)).toBe(true);
	});

	it("passes no pool, loader, or child-process restriction to the launched CLI", async () => {
		const fixture = createFixture();
		const session = acquireFixtureSession(fixture);
		const calls: SpawnCall[] = [];
		await runVitest(session, ["run", "--reporter=verbose"], {
			spawnImpl: recordSpawn(calls),
		});
		expect(calls[0].argv).toEqual([
			session.vitestCliRealPath,
			"run",
			"--reporter=verbose",
			"--config",
			"vitest.config.ts",
		]);
		expect(calls[0].options.env).toBe(process.env);
		expect(calls[0].options.shell).toBe(false);
		expect(calls[0].options.stdio).toBe("inherit");
	});
});

describe("trusted test route scan", () => {
	it("routes package.json test scripts through the repository runner as convenience routes", () => {
		const manifest = JSON.parse(
			readFileSync(path.join(REPOSITORY_ROOT, "package.json"), "utf8"),
		) as { scripts: Record<string, string> };
		expect(manifest.scripts.test).toBe("node scripts/run-vitest.mjs run");
		expect(manifest.scripts["test:integration"]).toBe(
			"node scripts/run-vitest.mjs run --config vitest.integration.config.ts",
		);
		expect(manifest.scripts["check:test-runtime"]).toBe(
			"node scripts/check-test-runtime.mjs",
		);
	});

	it("keeps scripts/verify.mjs free of bare vitest resolution", () => {
		const text = readFileSync(
			path.join(REPOSITORY_ROOT, "scripts", "verify.mjs"),
			"utf8",
		);
		const forbidden: Array<[string, RegExp]> = [
			["pnpm exec vitest", /\bpnpm\s+exec\s+vitest\b/],
			["exec vitest step", /["']exec["'],\s*["']vitest["']/],
			["bare pnpm test step", /\[\s*["']test["']\s*\]/],
			["node_modules/.bin", /node_modules[\\/]\.bin/],
			[
				"spawn a bare vitest executable",
				/\b(?:spawn|spawnSync|execFile|execFileSync)\s*\(\s*["']vitest["']/,
			],
		];
		for (const [name, pattern] of forbidden) {
			expect(text.match(pattern) ?? [], `forbidden route: ${name}`).toEqual([]);
		}
		expect(text).toContain("./vitest-runtime.mjs");
	});

	it("keeps scripts/run-vitest.mjs free of bare vitest resolution", () => {
		const text = readFileSync(
			path.join(REPOSITORY_ROOT, "scripts", "run-vitest.mjs"),
			"utf8",
		);
		const forbidden: Array<[string, RegExp]> = [
			["pnpm exec vitest", /\bpnpm\s+exec\s+vitest\b/],
			["node_modules/.bin", /node_modules[\\/]\.bin/],
			[
				"spawn a bare vitest executable",
				/\b(?:spawn|spawnSync|execFile|execFileSync)\s*\(\s*["']vitest["']/,
			],
		];
		for (const [name, pattern] of forbidden) {
			expect(text.match(pattern) ?? [], `forbidden route: ${name}`).toEqual([]);
		}
	});

	it("keeps the launch API session-only in source", () => {
		const text = readFileSync(
			path.join(REPOSITORY_ROOT, "scripts", "vitest-runtime.mjs"),
			"utf8",
		);
		expect(text).toContain("vitest-session-required");
		expect(text).toContain("acquireVitestRuntimeSession");
		expect(text).not.toMatch(/options\.descriptor/);
		expect(text).not.toMatch(/\?\?\s*resolveVitestRuntime/);
	});

	it("scans every repository launch surface for bare vitest reintroduction", () => {
		const inputs = repositoryScanInputs(REPOSITORY_ROOT);
		expect(inputs.length).toBeGreaterThan(0);
		expect(inputs.some((file) => file.path === "package.json")).toBe(true);
		expect(
			inputs.some((file) => file.path === "scripts/vitest-runtime.mjs"),
		).toBe(true);
		expect(
			inputs.some(
				(file) => file.path === "scripts/vitest-runtime.bootstrap.test.mjs",
			),
		).toBe(true);
		expect(inputs.some((file) => file.path === "lefthook.yml")).toBe(true);
		expect(
			inputs.every(
				(file) =>
					file.path.startsWith("scripts/") ||
					file.path === "package.json" ||
					file.path === "lefthook.yml",
			),
		).toBe(true);
		const findings = findBareVitestLaunches(inputs).filter(
			(finding) => !finding.allowed,
		);
		expect(
			findings,
			`bare vitest launches: ${findings
				.map((finding) => `${finding.path} (${finding.detail})`)
				.join("; ")}`,
		).toEqual([]);
	});

	it("flags crafted bare-vitest launches (scanner positive control)", () => {
		const offending: RepositoryScanFile[] = [
			{
				path: "package.json",
				text: JSON.stringify({
					scripts: {
						test: "vitest run",
						verify: "pnpm exec vitest run",
					},
				}),
			},
			{
				path: "scripts/offending-spawn.mjs",
				text: 'spawnSync("vitest", ["run"]);',
			},
			{
				path: "scripts/offending-step.mjs",
				text: 'runStep({ command: "vitest", args: ["run"] });',
			},
			{
				path: "scripts/offending-argv.mjs",
				text: 'steps.push(["vitest", "run"]);',
			},
			{
				path: "scripts/offending-exec.mjs",
				text: 'steps.push(["exec", "vitest", "run"]);',
			},
			{
				path: "scripts/offending-bin.mjs",
				text: 'const cli = "./node_modules/.bin/vitest";',
			},
		];
		const findings = findBareVitestLaunches(offending);
		expect(findings.length).toBe(7);
		expect(findings.every((finding) => !finding.allowed)).toBe(true);
		expect(findings.map((finding) => finding.path)).toEqual([
			"package.json",
			"package.json",
			"scripts/offending-spawn.mjs",
			"scripts/offending-step.mjs",
			"scripts/offending-argv.mjs",
			"scripts/offending-exec.mjs",
			"scripts/offending-bin.mjs",
		]);
		// Runtime-layer files are classified as allowed internals, not as
		// trusted bootstrap routes for other files.
		const sanctioned = findBareVitestLaunches([
			{ path: "scripts/run-vitest.mjs", text: 'spawnSync("vitest", ["run"]);' },
		]);
		expect(sanctioned).toEqual([
			{
				path: "scripts/run-vitest.mjs",
				detail: expect.any(String),
				allowed: true,
			},
		]);
	});
});

describe("real repository resolution", () => {
	// This suite runs inside a Vitest worker, which starts Node with visible
	// preload exec arguments; the strict visible-bootstrap evidence lives in
	// scripts/vitest-runtime.bootstrap.test.mjs under plain `node --test`.
	const realSessionOptions = { allowVisibleDirtyBootstrap: true };

	it("resolves the repository-local runtime with realpath containment and the bounded set", () => {
		const session = acquireVitestRuntimeSession(
			REPOSITORY_ROOT,
			"focused-suite-real-repository",
			realSessionOptions,
		);
		expect(session.repositoryRootRealPath).toBe(realpathSync(REPOSITORY_ROOT));
		expect(
			isPathContained(
				session.repositoryRootRealPath,
				session.vitestCliRealPath,
			),
		).toBe(true);
		expect(
			isPathContained(
				session.vitestPackageDirectoryRealPath,
				session.vitestCliRealPath,
			),
		).toBe(true);
		expect(session.vitestVersion).toBe(session.lockfileResolution);
		expect(session.nodeExecutableRealPath).toBe(realpathSync(process.execPath));
		expect(
			session.integrity.members.map((member: { id: string }) => member.id),
		).toEqual(EXPECTED_MEMBER_IDS);
		const nativeMember = session.integrity.members.find(
			(member: { id: string }) => member.id === "rolldown-platform-binding",
		);
		expect(path.extname(nativeMember.realPath)).toBe(".node");
		expect(existsSync(nativeMember.realPath)).toBe(true);
		expect(() =>
			revalidateVitestRuntimeSession(session, "manual-check"),
		).not.toThrow();
	});

	it("routes the real repository through the direct launcher", () => {
		const session = acquireVitestRuntimeSession(
			REPOSITORY_ROOT,
			"focused-suite-real-repository",
			realSessionOptions,
		);
		const result = runVitestSync(session, ["--version"]);
		expect(result.status).toBe(0);
		expect(result.execPath).toBe(realpathSync(process.execPath));
		expect(result.argv[0]).toBe(session.vitestCliRealPath);
		expect(result.stdout.trim().split(/\s+/)[0]).toBe(
			`vitest/${session.vitestVersion}`,
		);
	});
});

describe("parseLockfileVitestResolution", () => {
	it("reads only the root importer vitest resolution", () => {
		expect(parseLockfileVitestResolution(defaultLockfile())).toEqual({
			resolution: "4.1.10",
			rawResolution: "4.1.10(@types/node@22.20.1)(happy-dom@20.10.6)",
		});
	});

	it("accepts a quoted root importer key", () => {
		const lockfile = defaultLockfile().replace("\n  .:\n", "\n  '.':\n");
		expect(parseLockfileVitestResolution(lockfile).resolution).toBe("4.1.10");
	});

	it("fails when the lockfile has no importers section", () => {
		expect(() =>
			parseLockfileVitestResolution("lockfileVersion: '9.0'\n"),
		).toThrow(/lockfile-importers/);
	});

	it("fails when the root importer has no vitest dependency", () => {
		const block = [
			"      vitest:",
			"        specifier: ^4.1.10",
			"        version: 4.1.10(@types/node@22.20.1)(happy-dom@20.10.6)",
			"",
		].join("\n");
		const lockfile = defaultLockfile().replace(block, "");
		expect(() => parseLockfileVitestResolution(lockfile)).toThrow(
			/lockfile-vitest-entry/,
		);
	});

	it("fails when the root vitest entry has no resolution version", () => {
		const lockfile = defaultLockfile().replace(
			"        version: 4.1.10(@types/node@22.20.1)(happy-dom@20.10.6)\n",
			"",
		);
		expect(() => parseLockfileVitestResolution(lockfile)).toThrow(
			/lockfile-resolution-missing/,
		);
	});
});

describe("session provenance", () => {
	it("describes only the bounded observed set and makes no authentication claim", () => {
		const fixture = createFixture();
		const session = acquireFixtureSession(fixture);
		const line = describeVitestRuntimeSession(session);
		expect(line).toContain(`vitest ${VITEST_VERSION}`);
		expect(line).toContain(session.vitestManifestRealPath);
		expect(line).toContain(session.vitestCliRealPath);
		expect(line).toContain(session.nodeExecutableRealPath);
		expect(line).toContain(`node-v${session.nodeVersion}`);
		expect(line).toContain(session.lockfileResolution);
		expect(line).toContain(`${session.platform}-${session.arch}`);
		expect(line).toContain(session.integrity.digest);
		expect(line).toContain("vitest.config.ts");
		expect(line).toContain("vitest.integration.config.ts");
		expect(line).toContain("caller");
		expect(line).toMatch(/not an authentication, attestation/);
		expect(line).not.toMatch(/sandboxed|same-image guarantee/i);
		expect(line).not.toMatch(/package manager/i);
	});
});

type RepositoryScanFile = { path: string; text: string };

type BareVitestFinding = {
	path: string;
	detail: string;
	allowed: boolean;
};

// The sanctioned runtime layer resolves and launches the repository-local
// Vitest CLI by real path; its own internals legitimately reference the
// package name and launch mechanism, so it is classified as allowed rather
// than silently exempted. These files are not trusted bootstrap routes for
// any other file, and a package alias that runs them stays a convenience.
const SANCTIONED_RUNTIME_LAYER = new Set([
	"scripts/vitest-runtime.mjs",
	"scripts/run-vitest.mjs",
	"scripts/check-test-runtime.mjs",
]);

const bareVitestLaunchPatterns: Array<[string, RegExp]> = [
	["pnpm exec vitest", /\bpnpm\s+exec\s+vitest\b/],
	[
		"spawn of a bare vitest executable",
		/\b(?:spawn|spawnSync|exec|execSync|execFile|execFileSync)\s*\(\s*["']vitest(?:\.[a-z]+)?["']/,
	],
	[
		"step object commanding vitest",
		/\bcommand\s*:\s*["']vitest(?:\.[a-z]+)?["']/,
	],
	["step argv starting with vitest", /\[\s*["']vitest(?:\.[a-z]+)?["']\s*[,]/],
	[
		"exec step running vitest",
		/["']exec["']\s*,\s*["']vitest(?:\.[a-z]+)?["']/,
	],
	[
		"node_modules/.bin/vitest reference",
		/node_modules[\\/]\.bin[\\/]vitest(?:\.[a-z]+)?\b/,
	],
];

const bareVitestPackageScript = /\bpnpm\s+exec\s+vitest\b/;
const bareVitestCommandStart = /^(?:npx\s+)?vitest(?:\.[a-z]+)?(?:\s|$)/;

/**
 * Pure bare-Vitest reintroduction scanner. It reports every launch-shaped
 * reference with its path and detail; findings in the sanctioned runtime layer
 * are marked `allowed`, so callers can assert that every other finding is
 * empty instead of excluding files by location.
 */
// biome-ignore lint/suspicious/noExportsInTest: the review requires this pure scanner to be exported for reuse and for the positive-control test.
export function findBareVitestLaunches(
	files: RepositoryScanFile[],
): BareVitestFinding[] {
	const findings: BareVitestFinding[] = [];
	for (const file of files) {
		const filePath = file.path.replaceAll("\\", "/");
		const allowed = SANCTIONED_RUNTIME_LAYER.has(filePath);
		if (filePath.endsWith("package.json")) {
			let manifest: { scripts?: Record<string, unknown> };
			try {
				manifest = JSON.parse(file.text) as {
					scripts?: Record<string, unknown>;
				};
			} catch {
				findings.push({
					path: filePath,
					detail: "package.json is not valid JSON",
					allowed,
				});
				continue;
			}
			for (const [name, command] of Object.entries(manifest.scripts ?? {})) {
				if (typeof command !== "string") continue;
				const trimmed = command.trim();
				if (
					bareVitestPackageScript.test(trimmed) ||
					bareVitestCommandStart.test(trimmed)
				) {
					findings.push({
						path: filePath,
						detail: `script "${name}" resolves bare vitest: ${trimmed}`,
						allowed,
					});
				}
			}
			continue;
		}
		for (const [label, pattern] of bareVitestLaunchPatterns) {
			const match = file.text.match(pattern);
			if (match) {
				findings.push({
					path: filePath,
					detail: `${label}: ${match[0]}`,
					allowed,
				});
			}
		}
	}
	return findings;
}

function repositoryScanInputs(root: string): RepositoryScanFile[] {
	const files: RepositoryScanFile[] = [
		{
			path: "package.json",
			text: readFileSync(path.join(root, "package.json"), "utf8"),
		},
	];
	const walk = (directory: string, prefix: string): void => {
		for (const entry of readdirSync(directory, { withFileTypes: true })) {
			const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
			if (entry.isDirectory()) {
				walk(path.join(directory, entry.name), relative);
			} else if (entry.isFile() && entry.name.endsWith(".mjs")) {
				files.push({
					path: relative,
					text: readFileSync(path.join(directory, entry.name), "utf8"),
				});
			}
		}
	};
	walk(path.join(root, "scripts"), "scripts");
	const lefthookPath = path.join(root, "lefthook.yml");
	if (existsSync(lefthookPath)) {
		files.push({
			path: "lefthook.yml",
			text: readFileSync(lefthookPath, "utf8"),
		});
	}
	return files;
}
