// Bootstrap-independent trust layer for the Vitest runtime session.
//
// This suite uses node:test and node:assert only, so it can establish the
// runtime trust layer before any Vitest evidence exists. Fixtures live in the
// OS temp directory and never modify the real install.
//
// Run directly:
//   node --test scripts/vitest-runtime.bootstrap.test.mjs

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	realpathSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { afterEach, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
	acquireVitestRuntimeSession,
	describeVitestRuntimeSession,
	revalidateVitestRuntimeSession,
	runVitest,
	runVitestSync,
} from "./vitest-runtime.mjs";

const REPOSITORY_ROOT = fileURLToPath(new URL("..", import.meta.url));
const RUNTIME_MODULE_URL = pathToFileURL(
	path.join(REPOSITORY_ROOT, "scripts", "vitest-runtime.mjs"),
).href;
const RUN_VITEST_ENTRY = fileURLToPath(
	new URL("./run-vitest.mjs", import.meta.url),
);

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

const temporaryRoots = [];
const environmentRestorations = [];

afterEach(() => {
	for (const restore of environmentRestorations.splice(0)) restore();
	for (const root of temporaryRoots.splice(0)) {
		rmSync(root, { recursive: true, force: true, maxRetries: 5 });
	}
});

function restoreEnvironment(name) {
	const previous = process.env[name];
	environmentRestorations.push(() => {
		if (previous === undefined) {
			delete process.env[name];
			return;
		}
		process.env[name] = previous;
	});
}

function writeFixtureFile(root, relativePath, text) {
	const target = path.join(root, relativePath);
	mkdirSync(path.dirname(target), { recursive: true });
	writeFileSync(target, text);
}

function writeFixtureJson(root, relativePath, value) {
	writeFixtureFile(root, relativePath, JSON.stringify(value, null, 2));
}

function defaultLockfile(vitestVersion = VITEST_VERSION) {
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
		"packages:",
		"",
		`  vitest@${vitestVersion}(@types/node@22.20.1):`,
		"    resolution: {integrity: sha512-fixture}",
		"",
	].join("\n");
}

function fixtureCliSource(markerPath, output, exitCode, mutationPath) {
	const lines = [
		'import { writeFileSync } from "node:fs";',
		`writeFileSync(${JSON.stringify(markerPath)}, "ran", "utf8");`,
	];
	if (typeof mutationPath === "string") {
		lines.push(
			`writeFileSync(${JSON.stringify(mutationPath)}, "mutated", "utf8");`,
		);
	}
	lines.push(`console.log(${JSON.stringify(output)});`);
	if (exitCode !== 0) {
		lines.push(`process.exitCode = ${exitCode};`);
	}
	return `${lines.join("\n")}\n`;
}

function fixturePlatformBindingPackageName() {
	const platform = process.platform;
	const arch = process.arch;
	if (platform === "win32") return `@rolldown/binding-win32-${arch}-msvc`;
	if (platform === "linux") {
		return arch === "arm"
			? "@rolldown/binding-linux-arm-gnueabihf"
			: `@rolldown/binding-linux-${arch}-gnu`;
	}
	if (platform === "darwin") return `@rolldown/binding-darwin-${arch}`;
	return `@rolldown/binding-${platform}-${arch}`;
}

const BINDING_PACKAGE_NAME = fixturePlatformBindingPackageName();
const BINDING_NATIVE_FILE_NAME = "rolldown-binding.fixture.node";

function createFixture(options = {}) {
	const base = mkdtempSync(path.join(tmpdir(), "fitway-runtime-bootstrap-"));
	temporaryRoots.push(base);
	const root = path.join(base, "root");
	mkdirSync(root, { recursive: true });
	const markerPath = path.join(base, "cli-marker.txt");
	let lockfileSymlinkCreated = false;

	writeFixtureJson(root, "package.json", {
		name: "vitest-runtime-bootstrap-fixture",
		private: true,
	});
	if (!options.omitLockfile) {
		const lockfileText = defaultLockfile(
			options.lockfileVitestVersion ?? VITEST_VERSION,
		);
		if (options.lockfileSymlinkEscape) {
			const outsideLockfile = path.join(base, "outside-lockfile.yaml");
			writeFixtureFile(base, "outside-lockfile.yaml", lockfileText);
			try {
				symlinkSync(outsideLockfile, path.join(root, "pnpm-lock.yaml"), "file");
				lockfileSymlinkCreated = true;
			} catch {
				// The probe skips when the host cannot create file symlinks.
			}
		} else {
			writeFixtureFile(root, "pnpm-lock.yaml", lockfileText);
		}
	}
	if (!options.omitConfigUnit) {
		writeFixtureFile(root, "vitest.config.ts", "export default {};\n");
	}
	if (!options.omitConfigIntegration) {
		writeFixtureFile(
			root,
			"vitest.integration.config.ts",
			"export default {};\n",
		);
	}
	const omittedScripts = new Set(options.omitTrustScripts ?? []);
	const trustScripts = {
		"script-check-test-runtime": "check-test-runtime.mjs",
		"script-repository-fingerprint": "repository-fingerprint.mjs",
		"script-run-vitest": "run-vitest.mjs",
		"script-verify": "verify.mjs",
		"script-vitest-runtime": "vitest-runtime.mjs",
	};
	for (const [id, fileName] of Object.entries(trustScripts)) {
		if (omittedScripts.has(id)) continue;
		writeFixtureFile(
			root,
			path.join("scripts", fileName),
			`// fixture trust script ${fileName}\n`,
		);
	}

	const nodeModulesDir = path.join(root, "node_modules");
	if (options.omitNodeModules) {
		return {
			base,
			bindingCreated: false,
			junctionCreated: false,
			markerPath,
			root,
		};
	}
	mkdirSync(nodeModulesDir, { recursive: true });

	if (!options.omitVitestPackage) {
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
				fixtureCliSource(
					markerPath,
					`vitest/${VITEST_VERSION} ${process.platform}-${process.arch}`,
					0,
				),
			);
			symlinkSync(
				outsidePackageDir,
				path.join(nodeModulesDir, "vitest"),
				"junction",
			);
		} else {
			const packageDir = path.join(nodeModulesDir, "vitest");
			mkdirSync(packageDir, { recursive: true });
			let binTarget = { vitest: "./vitest.mjs" };
			let cliRelativePath = "vitest.mjs";
			if (options.junctionEscapeTo === "outside") {
				const outsideDir = path.join(base, "outside");
				mkdirSync(outsideDir, { recursive: true });
				writeFixtureFile(
					outsideDir,
					"outside-vitest.mjs",
					fixtureCliSource(
						markerPath,
						`vitest/${VITEST_VERSION} ${process.platform}-${process.arch}`,
						0,
					),
				);
				symlinkSync(outsideDir, path.join(packageDir, "escape"), "junction");
				binTarget = { vitest: "./escape/outside-vitest.mjs" };
				cliRelativePath = path.join("escape", "outside-vitest.mjs");
			}
			if (typeof options.directoryTarget === "string") {
				mkdirSync(path.join(packageDir, options.directoryTarget), {
					recursive: true,
				});
			}
			const manifest = {
				name: "vitest",
				version: VITEST_VERSION,
				...(options.manifestOverrides ?? {}),
			};
			if (typeof options.bin !== "undefined") {
				manifest.bin = options.bin;
			} else if (!options.omitBin) {
				manifest.bin = binTarget;
			}
			writeFixtureJson(packageDir, "package.json", manifest);
			if (options.writeCliFile !== false) {
				writeFixtureFile(
					packageDir,
					cliRelativePath,
					fixtureCliSource(
						markerPath,
						options.cliOutput ??
							`vitest/${VITEST_VERSION} ${process.platform}-${process.arch} node-v${process.versions.node}`,
						options.cliExitCode ?? 0,
						typeof options.cliMutationRelativePath === "string"
							? path.join(root, options.cliMutationRelativePath)
							: undefined,
					),
				);
			}
		}
	}

	if (!options.omitVite) {
		writeFixtureJson(nodeModulesDir, "vite/package.json", {
			name: "vite",
			version: "8.1.4",
			exports: {
				".": "./dist/index.js",
				"./package.json": "./package.json",
			},
			dependencies: { rolldown: "1.1.5" },
		});
		writeFixtureFile(
			root,
			path.join("node_modules", "vite", "dist", "index.js"),
			'export const version = "8.1.4";\n',
		);
	}

	if (!options.omitRolldown) {
		writeFixtureJson(nodeModulesDir, "rolldown/package.json", {
			name: "rolldown",
			version: "1.1.5",
			exports: {
				".": "./dist/index.mjs",
				"./package.json": "./package.json",
			},
			optionalDependencies: { [BINDING_PACKAGE_NAME]: "1.1.5" },
		});
		writeFixtureFile(
			root,
			path.join("node_modules", "rolldown", "dist", "index.mjs"),
			'import { marker } from "./shared/binding-Fixture0001.mjs";\nexport { marker };\n',
		);
		writeFixtureFile(
			root,
			path.join(
				"node_modules",
				"rolldown",
				"dist",
				"shared",
				"binding-Fixture0001.mjs",
			),
			"export const marker = 1;\n",
		);
	}

	if (!options.omitBinding) {
		const bindingDir = path.join(
			nodeModulesDir,
			...BINDING_PACKAGE_NAME.split("/"),
		);
		writeFixtureJson(bindingDir, "package.json", {
			name: BINDING_PACKAGE_NAME,
			version: "1.1.5",
			main: BINDING_NATIVE_FILE_NAME,
			os: [process.platform],
			cpu: [process.arch],
		});
		writeFixtureFile(
			bindingDir,
			BINDING_NATIVE_FILE_NAME,
			"fixture-native-binding\n",
		);
	}

	return {
		base,
		bindingCreated: !options.omitBinding,
		junctionCreated: options.junctionEscapeTo === "outside",
		lockfileSymlinkCreated,
		markerPath,
		root,
	};
}

function createGitFixture(options = {}) {
	const fixture = createFixture(options);
	for (const args of [
		["init", "--quiet"],
		["config", "user.email", "bootstrap-suite@example.invalid"],
		["config", "user.name", "Bootstrap Suite"],
		["add", "--all"],
		["commit", "--quiet", "-m", "fixture baseline"],
	]) {
		const result = spawnSync("git", args, {
			cwd: fixture.root,
			encoding: "utf8",
		});
		assert.equal(
			result.status,
			0,
			`git ${args.join(" ")} failed: ${result.stderr}`,
		);
	}
	return fixture;
}

function fixtureSelectionLine(fixture) {
	const bytes = readFileSync(path.join(fixture.root, "vitest.config.ts"));
	return `selected config for this launch: vitest.config.ts sha256 ${createHash("sha256").update(bytes).digest("hex")} ${bytes.byteLength} bytes`;
}

function fixtureSelectionLines(stderr) {
	return stderr
		.split(/\r?\n/)
		.filter((line) => line.startsWith("selected config for this launch:"));
}

function acquireFixtureSession(fixture, callerIdentity = "bootstrap-suite") {
	return acquireVitestRuntimeSession(fixture.root, callerIdentity);
}

function captureError(callback) {
	try {
		callback();
		return null;
	} catch (error) {
		return error;
	}
}

function assertRuleError(error, pattern, label) {
	assert.ok(
		error instanceof Error,
		`${label}: expected an Error, got ${error}`,
	);
	assert.match(error.message, /^Vitest runtime rule "/, label);
	assert.match(error.message, pattern, label);
}

function expectedMarker() {
	return `vitest/${VITEST_VERSION} ${process.platform}-${process.arch} node-v${process.versions.node}`;
}

function fakeChild(outcome) {
	const child = {
		once(event, listener) {
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

function recordSpawn(calls, outcome = { status: 0 }) {
	return (execPath, argv, options) => {
		calls.push({ argv: [...argv], execPath, options });
		return fakeChild(outcome);
	};
}

function recomputeDigest(members) {
	const hash = createHash("sha256");
	for (const member of members) {
		hash.update(
			`${member.id}\0${member.kind}\0${member.realPath}\0${member.sha256}\0${member.byteLength}\0`,
			"utf8",
		);
	}
	return hash.digest("hex");
}

test("acquires a deeply frozen session with the bounded integrity set on a valid fixture", () => {
	const fixture = createFixture();
	const session = acquireFixtureSession(fixture);

	assert.equal(session.vitestVersion, VITEST_VERSION);
	assert.equal(session.lockfileResolution, VITEST_VERSION);
	assert.equal(session.nodeExecutableRealPath, realpathSync(process.execPath));
	assert.equal(session.nodeVersion, process.versions.node);
	assert.equal(session.platform, process.platform);
	assert.equal(session.arch, process.arch);
	assert.equal(session.repositoryRootRealPath, realpathSync(fixture.root));
	assert.match(session.integrity.digest, /^[0-9a-f]{64}$/);
	assert.deepEqual(
		session.integrity.members.map((member) => member.id),
		EXPECTED_MEMBER_IDS,
	);
	assert.equal(
		session.integrity.digest,
		recomputeDigest(session.integrity.members),
	);
	assert.equal(session.integrity.members.length, EXPECTED_MEMBER_IDS.length);

	const cliMember = session.integrity.members.find(
		(member) => member.id === "vitest-cli",
	);
	const cliBytes = readFileSync(session.vitestCliRealPath);
	assert.equal(cliMember.realPath, session.vitestCliRealPath);
	assert.equal(cliMember.byteLength, cliBytes.byteLength);
	assert.equal(
		cliMember.sha256,
		createHash("sha256").update(cliBytes).digest("hex"),
	);

	const rootManifestMember = session.integrity.members.find(
		(member) => member.id === "root-package-json",
	);
	const rootManifestBytes = readFileSync(
		path.join(fixture.root, "package.json"),
	);
	assert.equal(rootManifestMember.byteLength, rootManifestBytes.byteLength);
	assert.equal(
		rootManifestMember.sha256,
		createHash("sha256").update(rootManifestBytes).digest("hex"),
	);

	const nativeMember = session.integrity.members.find(
		(member) => member.id === "rolldown-platform-binding",
	);
	assert.equal(path.extname(nativeMember.realPath), ".node");
	assert.equal(nativeMember.kind, "native-binding");
	assert.equal(session.platformBindingPackageName, BINDING_PACKAGE_NAME);

	assert.ok(Object.isFrozen(session));
	assert.ok(Object.isFrozen(session.integrity));
	assert.ok(Object.isFrozen(session.integrity.members));
	assert.ok(Object.isFrozen(session.configs));
	assert.throws(() => {
		session.vitestVersion = "9.9.9";
	});

	const provenance = describeVitestRuntimeSession(session);
	assert.match(provenance, /vitest 4\.1\.10/);
	assert.match(provenance, new RegExp(`${VITEST_VERSION}`));
	assert.ok(provenance.includes(session.vitestManifestRealPath));
	assert.ok(provenance.includes(session.vitestCliRealPath));
	assert.ok(provenance.includes(session.nodeExecutableRealPath));
	assert.ok(provenance.includes(session.integrity.digest));
	assert.ok(provenance.includes("vitest.config.ts"));
	assert.ok(provenance.includes("vitest.integration.config.ts"));
	assert.match(provenance, /not an authentication, attestation/);
	assert.doesNotMatch(provenance, /sandboxed|sandboxing/);

	const second = acquireFixtureSession(fixture, "bootstrap-suite-second");
	assert.equal(second.integrity.digest, session.integrity.digest);
	assert.deepEqual(
		second.integrity.members.map((member) => member.sha256),
		session.integrity.members.map((member) => member.sha256),
	);

	assert.doesNotThrow(() =>
		revalidateVitestRuntimeSession(session, "manual-check"),
	);
});

test("rejects visible dirty bootstrap state with defense-in-depth wording and a test-only bypass", () => {
	const fixture = createFixture();

	restoreEnvironment("NODE_OPTIONS");
	process.env.NODE_OPTIONS = "--require ./injected-preload.cjs";
	const nodeOptionsError = captureError(() => acquireFixtureSession(fixture));
	assertRuleError(nodeOptionsError, /dirty-bootstrap-visible/, "NODE_OPTIONS");
	assert.match(nodeOptionsError.message, /NODE_OPTIONS/);
	assert.match(nodeOptionsError.message, /defense in depth/);
	assert.match(nodeOptionsError.message, /cannot prove/);

	restoreEnvironment("NODE_PATH");
	delete process.env.NODE_OPTIONS;
	process.env.NODE_PATH = path.join(process.cwd(), "node_modules");
	const nodePathError = captureError(() => acquireFixtureSession(fixture));
	assertRuleError(nodePathError, /dirty-bootstrap-visible/, "NODE_PATH");
	assert.match(nodePathError.message, /NODE_PATH/);
	assert.match(nodePathError.message, /defense in depth/);

	const bypassed = acquireVitestRuntimeSession(
		fixture.root,
		"bootstrap-suite",
		{
			allowVisibleDirtyBootstrap: true,
		},
	);
	assert.equal(bypassed.vitestVersion, VITEST_VERSION);
});

test("rejects an acquisition made inside a process started with a preload argument", () => {
	const fixture = createFixture();
	const preloadPath = path.join(fixture.base, "injected-preload.cjs");
	writeFileSync(preloadPath, "// injected preload for the bootstrap probe\n");
	const script = [
		`import { acquireVitestRuntimeSession } from ${JSON.stringify(RUNTIME_MODULE_URL)};`,
		"try {",
		`  acquireVitestRuntimeSession(${JSON.stringify(fixture.root)}, "preloaded-child");`,
		'  console.log("ACCEPTED");',
		"} catch (error) {",
		'  console.log("REJECTED:" + error.message);',
		"}",
	].join("\n");
	const result = spawnSync(
		process.execPath,
		["--input-type=module", "--require", preloadPath, "-e", script],
		{ cwd: fixture.root, encoding: "utf8" },
	);
	assert.equal(result.status, 0, result.stderr);
	assert.match(
		result.stdout,
		/REJECTED:Vitest runtime rule "dirty-bootstrap-visible"/,
	);
	assert.match(result.stdout, /--require/);
	assert.match(result.stdout, /defense in depth/);
	assert.match(result.stdout, /cannot prove/);
});

test("launches only the session's recorded Node, CLI, cwd, argv, and environment", async () => {
	const fixture = createFixture();
	const session = acquireFixtureSession(fixture);
	const calls = [];
	const result = await runVitest(session, ["run", "--reporter=json"], {
		configPath: "vitest.config.ts",
		spawnImpl: recordSpawn(calls),
	});

	assert.equal(calls.length, 1);
	assert.equal(calls[0].execPath, session.nodeExecutableRealPath);
	assert.deepEqual(calls[0].argv, [
		session.vitestCliRealPath,
		"run",
		"--reporter=json",
		"--config",
		"vitest.config.ts",
	]);
	assert.equal(calls[0].options.cwd, session.repositoryRootRealPath);
	assert.equal(calls[0].options.env, process.env);
	assert.equal(calls[0].options.shell, false);
	assert.equal(calls[0].options.windowsHide, true);
	assert.equal(Object.hasOwn(calls[0].options, "execArgv"), false);

	assert.equal(result.session, session);
	assert.equal(result.execPath, session.nodeExecutableRealPath);
	assert.equal(result.status, 0);
	assert.equal(result.signal, null);
	assert.equal(result.configPath, "vitest.config.ts");
	assert.equal(result.configSha256, session.configs[0].sha256);
	assert.equal(result.integrityDigest, session.integrity.digest);
});

test("selects the integration config hash and rejects unrecorded config paths", async () => {
	const fixture = createFixture();
	const session = acquireFixtureSession(fixture);
	const integrationConfig = session.configs.find(
		(config) => config.path === "vitest.integration.config.ts",
	);
	const calls = [];
	const result = await runVitest(session, ["run"], {
		configPath: "vitest.integration.config.ts",
		spawnImpl: recordSpawn(calls),
	});
	assert.equal(result.configPath, "vitest.integration.config.ts");
	assert.equal(result.configSha256, integrationConfig.sha256);

	const unknownCalls = [];
	let caught;
	try {
		await runVitest(session, ["run"], {
			configPath: "some.other.config.ts",
			spawnImpl: recordSpawn(unknownCalls),
		});
	} catch (error) {
		caught = error;
	}
	assertRuleError(caught, /unknown-config-path/, "unknown configPath");
	assert.equal(unknownCalls.length, 0);
});

test("default focused invocation selects and reports the recorded unit config", async () => {
	const fixture = createFixture();
	const session = acquireFixtureSession(fixture);
	const calls = [];
	const result = await runVitest(session, ["run", "a.test.ts"], {
		spawnImpl: recordSpawn(calls),
	});
	const unitConfig = session.configs.find(
		(config) => config.path === "vitest.config.ts",
	);
	assert.equal(calls.length, 1);
	assert.deepEqual(calls[0].argv, [
		session.vitestCliRealPath,
		"run",
		"a.test.ts",
		"--config",
		"vitest.config.ts",
	]);
	assert.equal(result.configPath, "vitest.config.ts");
	assert.equal(result.configSha256, unitConfig.sha256);
	assert.equal(result.configByteLength, unitConfig.byteLength);
});

test("all four config spellings select the same recorded config and reject unrecorded ones", async () => {
	const fixture = createFixture();
	const session = acquireFixtureSession(fixture);
	const integrationConfig = session.configs.find(
		(config) => config.path === "vitest.integration.config.ts",
	);
	const spellings = [
		["--config", "vitest.integration.config.ts"],
		["--config=vitest.integration.config.ts"],
		["-c", "vitest.integration.config.ts"],
		["-c=vitest.integration.config.ts"],
	];
	for (const spelling of spellings) {
		const calls = [];
		const result = await runVitest(session, ["run", ...spelling], {
			spawnImpl: recordSpawn(calls),
		});
		assert.equal(calls.length, 1, `spelling ${JSON.stringify(spelling)}`);
		assert.deepEqual(calls[0].argv.slice(-2), [
			"--config",
			"vitest.integration.config.ts",
		]);
		assert.equal(result.configPath, "vitest.integration.config.ts");
		assert.equal(result.configSha256, integrationConfig.sha256);
	}

	const lastRequestedCalls = [];
	const lastRequested = await runVitest(
		session,
		["run", "-c=vitest.integration.config.ts", "--config", "vitest.config.ts"],
		{ spawnImpl: recordSpawn(lastRequestedCalls) },
	);
	assert.equal(lastRequested.configPath, "vitest.config.ts");
	assert.deepEqual(lastRequestedCalls[0].argv.slice(-2), [
		"--config",
		"vitest.config.ts",
	]);

	for (const spelling of [
		["--config", "unrecorded.config.ts"],
		["--config=unrecorded.config.ts"],
		["-c", "unrecorded.config.ts"],
		["-c=unrecorded.config.ts"],
	]) {
		const calls = [];
		let caught;
		try {
			await runVitest(session, ["run", ...spelling], {
				spawnImpl: recordSpawn(calls),
			});
		} catch (error) {
			caught = error;
		}
		assertRuleError(
			caught,
			/unknown-config-path/,
			`unrecorded spelling ${JSON.stringify(spelling)}`,
		);
		assert.equal(calls.length, 0);
	}
});

test("every root selector spelling fails before spawn, including a cross-worktree root", async () => {
	const fixture = createFixture();
	const otherFixture = createFixture();
	const session = acquireFixtureSession(fixture);
	for (const tokens of [
		["--root", otherFixture.root],
		[`--root=${otherFixture.root}`],
		["-r", otherFixture.root],
		[`-r=${otherFixture.root}`],
	]) {
		const calls = [];
		let caught;
		try {
			await runVitest(session, ["run", ...tokens], {
				spawnImpl: recordSpawn(calls),
			});
		} catch (error) {
			caught = error;
		}
		assertRuleError(
			caught,
			/root-selector-unsupported/,
			`root selector ${JSON.stringify(tokens)}`,
		);
		assert.ok(
			caught.message.includes(JSON.stringify(tokens[0])),
			`${tokens[0]} must be named in ${caught.message}`,
		);
		assert.equal(calls.length, 0);
	}
	assert.equal(existsSync(fixture.markerPath), false);
	assert.equal(existsSync(otherFixture.markerPath), false);
});

test("a conflicting argv config and options.configPath fails before spawn", async () => {
	const fixture = createFixture();
	const session = acquireFixtureSession(fixture);
	const calls = [];
	let caught;
	try {
		await runVitest(session, ["run", "-c=vitest.integration.config.ts"], {
			configPath: "vitest.config.ts",
			spawnImpl: recordSpawn(calls),
		});
	} catch (error) {
		caught = error;
	}
	assertRuleError(
		caught,
		/conflicting-config-selection/,
		"conflicting config selection",
	);
	assert.equal(calls.length, 0);
});

test("explicit no-config contradicts a requested config and rejects bare non-diagnostic argv", async () => {
	const fixture = createFixture();
	const session = acquireFixtureSession(fixture);

	const configCalls = [];
	let caught;
	try {
		await runVitest(session, ["run", "-c=vitest.config.ts"], {
			configPath: null,
			spawnImpl: recordSpawn(configCalls),
		});
	} catch (error) {
		caught = error;
	}
	assertRuleError(
		caught,
		/conflicting-config-selection/,
		"explicit no-config with requested config",
	);
	assert.equal(configCalls.length, 0);

	const bareCalls = [];
	caught = undefined;
	try {
		await runVitest(session, ["run"], {
			configPath: null,
			spawnImpl: recordSpawn(bareCalls),
		});
	} catch (error) {
		caught = error;
	}
	assertRuleError(
		caught,
		/no-config-not-allowed/,
		"explicit no-config with bare run",
	);
	assert.equal(bareCalls.length, 0);
	assert.equal(existsSync(fixture.markerPath), false);
});

test("missing, empty, and boolean config values fail before spawn", async () => {
	const fixture = createFixture();
	const session = acquireFixtureSession(fixture);
	for (const args of [
		["run", "--config"],
		["run", "-c"],
		["run", "--config="],
		["run", "-c="],
		["run", "--config", "--reporter=json"],
		["run", "-c", "true"],
		["run", "--config=false"],
	]) {
		const calls = [];
		let caught;
		try {
			await runVitest(session, args, { spawnImpl: recordSpawn(calls) });
		} catch (error) {
			caught = error;
		}
		assertRuleError(
			caught,
			/config-value-missing/,
			`config value ${JSON.stringify(args)}`,
		);
		assert.equal(calls.length, 0);
	}
});

test("rejects a root lockfile that escapes the worktree through a file symlink", (context) => {
	const escaped = createFixture({ lockfileSymlinkEscape: true });
	if (!escaped.lockfileSymlinkCreated) {
		context.skip("file symlinks are unavailable in this environment");
		return;
	}
	const error = captureError(() => acquireFixtureSession(escaped));
	assertRuleError(error, /integrity-member-unresolved/, "outside lockfile");
	assert.match(error.message, /root-lockfile/);
	assert.equal(existsSync(escaped.markerPath), false);

	const regular = createFixture();
	assert.doesNotThrow(() => acquireFixtureSession(regular));
});

test("the focused runner fails on unbounded repository mutation and passes on a clean invocation", () => {
	const mutating = createGitFixture({
		cliMutationRelativePath: "runtime-mutation.txt",
	});
	const mutated = spawnSync(process.execPath, [RUN_VITEST_ENTRY, "run"], {
		cwd: mutating.root,
		encoding: "utf8",
	});
	assert.equal(mutated.status, 1, mutated.stderr);
	assert.equal(existsSync(mutating.markerPath), true);
	assert.match(
		mutated.stderr,
		/changed tracked or untracked repository content/,
	);
	assert.match(mutated.stdout, /runtime-mutation\.txt/);
	const mutatedSelectionLines = fixtureSelectionLines(mutated.stderr);
	assert.equal(mutatedSelectionLines.length, 1);
	assert.equal(mutatedSelectionLines[0], fixtureSelectionLine(mutating));

	const clean = createGitFixture();
	const passed = spawnSync(process.execPath, [RUN_VITEST_ENTRY, "run"], {
		cwd: clean.root,
		encoding: "utf8",
	});
	assert.equal(passed.status, 0, passed.stderr);
	assert.equal(existsSync(clean.markerPath), true);
	const passedSelectionLines = fixtureSelectionLines(passed.stderr);
	assert.equal(passedSelectionLines.length, 1);
	assert.equal(passedSelectionLines[0], fixtureSelectionLine(clean));
});

test("rejects a raw root, a plain object, and a forged session before spawning", async () => {
	const fixture = createFixture();
	const session = acquireFixtureSession(fixture);
	const calls = [];

	let caught;
	try {
		await runVitest(fixture.root, ["run"], { spawnImpl: recordSpawn(calls) });
	} catch (error) {
		caught = error;
	}
	assertRuleError(caught, /vitest-session-required/, "raw root");

	const forgedBySpread = { ...session };
	caught = captureError(() =>
		runVitestSync(forgedBySpread, ["--version"], {
			spawnSyncImpl: recordSpawn(calls),
		}),
	);
	assertRuleError(caught, /vitest-session-required/, "spread session");

	const equalLooking = {};
	for (const key of Object.keys(session)) equalLooking[key] = session[key];
	caught = captureError(() =>
		runVitestSync(equalLooking, ["--version"], {
			spawnSyncImpl: recordSpawn(calls),
		}),
	);
	assertRuleError(caught, /vitest-session-required/, "equal-looking copy");

	caught = captureError(() =>
		runVitestSync(fixture.root, ["--version"], {
			spawnSyncImpl: recordSpawn(calls),
		}),
	);
	assertRuleError(
		caught,
		/vitest-session-required/,
		"root string to sync launch",
	);
	assert.equal(calls.length, 0);
});

test("PATH decoys cannot supply node, pnpm, or vitest, and .bin is never required", () => {
	const fixture = createFixture();
	const decoyDir = path.join(fixture.base, "decoy-bin");
	mkdirSync(decoyDir, { recursive: true });
	const decoyMarker = path.join(fixture.base, "decoy-marker.txt");
	const decoyCommand = `@echo off\r\necho decoy>${decoyMarker}\r\nexit /b 0\r\n`;
	// The first entry is deliberately not a vitest name so this fixture text
	// stays clear of the repository bare-vitest source scan.
	for (const poison of [
		"pnpm.cmd",
		"node.cmd",
		"vitest.cmd",
		"vitest.ps1",
		"vitest",
	]) {
		const target = path.join(decoyDir, poison);
		writeFileSync(
			target,
			poison.endsWith(".cmd") ? decoyCommand : `decoy ${poison}\n`,
		);
	}
	const localBinDir = path.join(fixture.root, "node_modules", ".bin");
	assert.equal(existsSync(localBinDir), false);

	restoreEnvironment("PATH");
	restoreEnvironment("PATHEXT");
	process.env.PATH = `${decoyDir}${path.delimiter}${process.env.PATH ?? ""}`;
	process.env.PATHEXT = ".CMD;.BAT;.COM";

	const session = acquireFixtureSession(fixture);
	const calls = [];
	const mocked = runVitestSync(session, ["--version"], {
		spawnSyncImpl: (execPath, argv, options) => {
			calls.push({ argv: [...argv], execPath, options });
			return { status: 0, stderr: "", stdout: expectedMarker() };
		},
	});
	assert.ok(mocked);
	assert.equal(calls[0].execPath, session.nodeExecutableRealPath);
	assert.equal(calls[0].argv[0], session.vitestCliRealPath);

	const real = runVitestSync(session, ["--version"]);
	assert.equal(real.status, 0);
	assert.equal(real.stdout.trim().split(/\s+/)[0], `vitest/${VITEST_VERSION}`);
	assert.equal(readFileSync(fixture.markerPath, "utf8"), "ran");
	assert.equal(existsSync(decoyMarker), false);
	assert.equal(existsSync(localBinDir), false);
});

test("keeps stable rule ids for missing, mismatched, and incomplete installs", () => {
	const missingNodeModules = createFixture({ omitNodeModules: true });
	assertRuleError(
		captureError(() => acquireFixtureSession(missingNodeModules)),
		/node-modules-missing/,
		"missing node_modules",
	);

	const missingPackage = createFixture({ omitVitestPackage: true });
	assertRuleError(
		captureError(() => acquireFixtureSession(missingPackage)),
		/vitest-package-unresolved|package-manifest-outside-node-modules/,
		"missing local package",
	);

	const missingLockfile = createFixture({ omitLockfile: true });
	assertRuleError(
		captureError(() => acquireFixtureSession(missingLockfile)),
		/lockfile-unreadable/,
		"missing lockfile",
	);

	const mismatched = createFixture({ lockfileVitestVersion: "4.0.0" });
	assertRuleError(
		captureError(() => acquireFixtureSession(mismatched)),
		/lockfile-resolution-mismatch/,
		"lockfile mismatch",
	);

	const missingConfig = createFixture({ omitConfigUnit: true });
	const configError = captureError(() => acquireFixtureSession(missingConfig));
	assertRuleError(
		configError,
		/integrity-member-unresolved/,
		"missing unit config",
	);
	assert.match(configError.message, /config-unit/);
	assert.match(configError.message, /vitest\.config\.ts/);

	const integrationConfig = createFixture({ omitConfigIntegration: true });
	assertRuleError(
		captureError(() => acquireFixtureSession(integrationConfig)),
		/integrity-member-unresolved/,
		"missing integration config",
	);

	const missingScript = createFixture({ omitTrustScripts: ["script-verify"] });
	const scriptError = captureError(() => acquireFixtureSession(missingScript));
	assertRuleError(
		scriptError,
		/integrity-member-unresolved/,
		"missing trust script",
	);
	assert.match(scriptError.message, /script-verify/);

	const missingVite = createFixture({ omitVite: true });
	const viteError = captureError(() => acquireFixtureSession(missingVite));
	assertRuleError(viteError, /integrity-member-unresolved/, "missing vite");
	assert.match(viteError.message, /vite-manifest/);

	const missingRolldown = createFixture({ omitRolldown: true });
	const rolldownError = captureError(() =>
		acquireFixtureSession(missingRolldown),
	);
	assertRuleError(
		rolldownError,
		/integrity-member-unresolved/,
		"missing rolldown",
	);
	assert.match(rolldownError.message, /rolldown-manifest/);

	const missingBinding = createFixture({ omitBinding: true });
	const bindingError = captureError(() =>
		acquireFixtureSession(missingBinding),
	);
	assertRuleError(
		bindingError,
		/integrity-member-unresolved/,
		"missing binding",
	);
	assert.match(bindingError.message, /rolldown-platform-manifest/);
});

test("keeps stable rule ids for escaping and malformed bin declarations", () => {
	const traversal = createFixture({
		bin: { vitest: "../../../outside-vitest.mjs" },
	});
	const traversalError = captureError(() => acquireFixtureSession(traversal));
	assertRuleError(traversalError, /bin-traversal/, "bin traversal");
	assert.equal(existsSync(traversal.markerPath), false);

	const absolute = createFixture({
		bin: { vitest: "C:\\outside\\vitest.mjs" },
	});
	assertRuleError(
		captureError(() => acquireFixtureSession(absolute)),
		/bin-absolute/,
		"absolute bin",
	);

	const missingTarget = createFixture({ writeCliFile: false });
	assertRuleError(
		captureError(() => acquireFixtureSession(missingTarget)),
		/bin-missing/,
		"missing CLI target",
	);

	const directoryTarget = createFixture({
		bin: { vitest: "./subdir" },
		directoryTarget: "subdir",
	});
	assertRuleError(
		captureError(() => acquireFixtureSession(directoryTarget)),
		/bin-not-file/,
		"directory CLI target",
	);

	const junction = createFixture({ junctionEscapeTo: "outside" });
	if (junction.junctionCreated) {
		assertRuleError(
			captureError(() => acquireFixtureSession(junction)),
			/bin-package-escape/,
			"junction escape",
		);
		assert.equal(existsSync(junction.markerPath), false);
	}

	const outsidePackage = createFixture({ packageOutside: true });
	assertRuleError(
		captureError(() => acquireFixtureSession(outsidePackage)),
		/package-manifest-outside-node-modules/,
		"package outside node_modules",
	);
});

test("revalidation names the changed member for CLI, config, and missing sentinels", () => {
	const fixture = createFixture();
	const session = acquireFixtureSession(fixture);

	writeFileSync(
		session.vitestCliRealPath,
		"// substituted CLI after acquisition\n",
	);
	const cliError = captureError(() =>
		revalidateVitestRuntimeSession(session, "pre-launch"),
	);
	assertRuleError(cliError, /integrity-member-changed/, "CLI mutation");
	assert.ok(cliError.message.includes(session.vitestCliRealPath));
	assert.match(cliError.message, /vitest-cli/);

	const configFixture = createFixture();
	const configSession = acquireFixtureSession(configFixture);
	const unitConfig = configSession.configs.find(
		(config) => config.path === "vitest.config.ts",
	);
	writeFileSync(unitConfig.realPath, "export default { changed: true };\n");
	const configError = captureError(() =>
		revalidateVitestRuntimeSession(configSession, "post-launch"),
	);
	assertRuleError(configError, /integrity-member-changed/, "config mutation");
	assert.ok(configError.message.includes(unitConfig.realPath));
	assert.match(configError.message, /config-unit/);

	const lockfileFixture = createFixture();
	const lockfileSession = acquireFixtureSession(lockfileFixture);
	rmSync(path.join(lockfileFixture.root, "pnpm-lock.yaml"), { force: true });
	const missingError = captureError(() =>
		revalidateVitestRuntimeSession(lockfileSession, "pre-launch"),
	);
	assertRuleError(missingError, /integrity-member-missing/, "removed lockfile");
	assert.match(missingError.message, /root-lockfile/);

	const phaseError = captureError(() =>
		revalidateVitestRuntimeSession(session, ""),
	);
	assertRuleError(phaseError, /revalidation-phase/, "empty phase");
});

test("selected-file mutation before launch rejects the launch and spawns nothing", async () => {
	const fixture = createFixture();
	const session = acquireFixtureSession(fixture);
	writeFileSync(
		path.join(fixture.root, "vitest.integration.config.ts"),
		"export default { mutated: true };\n",
	);

	const calls = [];
	let caught;
	try {
		await runVitest(session, ["run"], { spawnImpl: recordSpawn(calls) });
	} catch (error) {
		caught = error;
	}
	assertRuleError(caught, /integrity-member-changed/, "pre-launch mutation");
	assert.ok(caught.message.includes("vitest.integration.config.ts"));
	assert.equal(calls.length, 0);
	assert.equal(existsSync(fixture.markerPath), false);

	const syncFixture = createFixture();
	const syncSession = acquireFixtureSession(syncFixture);
	writeFileSync(
		syncSession.vitestCliRealPath,
		"// mutated before sync launch\n",
	);
	const syncCalls = [];
	const syncError = captureError(() =>
		runVitestSync(syncSession, ["--version"], {
			spawnSyncImpl: recordSpawn(syncCalls),
		}),
	);
	assertRuleError(
		syncError,
		/integrity-member-changed/,
		"sync pre-launch mutation",
	);
	assert.equal(syncCalls.length, 0);
});

test("mutation between launches is caught at the next pre-launch revalidation", async () => {
	const fixture = createFixture();
	const session = acquireFixtureSession(fixture);
	const calls = [];

	const first = await runVitest(session, ["run"], {
		spawnImpl: recordSpawn(calls),
	});
	assert.equal(first.status, 0);
	assert.equal(calls.length, 1);

	writeFileSync(
		path.join(fixture.root, "vitest.config.ts"),
		"export default { changed: true };\n",
	);

	let caught;
	try {
		await runVitest(session, ["run"], { spawnImpl: recordSpawn(calls) });
	} catch (error) {
		caught = error;
	}
	assertRuleError(caught, /integrity-member-changed/, "between launches");
	assert.match(caught.message, /config-unit/);
	assert.equal(calls.length, 1);
});

test("mutation during a fake child run fails the launch through post-launch-integrity", async () => {
	const fixture = createFixture();
	const session = acquireFixtureSession(fixture);

	let caught;
	try {
		await runVitest(session, ["run"], {
			spawnImpl: (execPath, argv, options) => {
				writeFileSync(
					session.vitestCliRealPath,
					"// mutated during the child run\n",
				);
				return recordSpawn([], { status: 0 })(execPath, argv, options);
			},
		});
	} catch (error) {
		caught = error;
	}
	assertRuleError(
		caught,
		/post-launch-integrity/,
		"async post-launch mutation",
	);
	assert.match(caught.message, /vitest-cli/);
	assert.match(caught.message, /changed/);

	const syncFixture = createFixture();
	const syncSession = acquireFixtureSession(syncFixture);
	const syncError = captureError(() =>
		runVitestSync(syncSession, ["--version"], {
			spawnSyncImpl: () => {
				writeFileSync(
					syncSession.vitestCliRealPath,
					"// mutated during sync run\n",
				);
				return { status: 0, stderr: "", stdout: expectedMarker() };
			},
		}),
	);
	assertRuleError(
		syncError,
		/post-launch-integrity/,
		"sync post-launch mutation",
	);
	assert.equal(syncError.message.includes("vitest-cli"), true);
});

test("propagates exit status and signal exactly and reports launch failures", async () => {
	const fixture = createFixture();
	const session = acquireFixtureSession(fixture);

	const exit = await runVitest(session, ["run"], {
		spawnImpl: recordSpawn([], { status: 7 }),
	});
	assert.equal(exit.status, 7);
	assert.equal(exit.signal, null);

	const signalled = await runVitest(session, ["run"], {
		spawnImpl: recordSpawn([], { signal: "SIGTERM", status: null }),
	});
	assert.equal(signalled.status, null);
	assert.equal(signalled.signal, "SIGTERM");

	let caught;
	try {
		await runVitest(session, ["run"], {
			spawnImpl: () => fakeChild({ error: new Error("EPERM") }),
		});
	} catch (error) {
		caught = error;
	}
	assertRuleError(caught, /cli-launch/, "spawn error");

	caught = undefined;
	try {
		await runVitest(session, [42], { spawnImpl: recordSpawn([]) });
	} catch (error) {
		caught = error;
	}
	assertRuleError(caught, /vitest-arguments/, "non-string argument");
});

test("does not re-resolve after acquisition: a substituted CLI is detected, not re-baselined", async () => {
	const fixture = createFixture();
	const session = acquireFixtureSession(fixture);
	const substitutedSource = fixtureCliSource(
		fixture.markerPath,
		`vitest/${VITEST_VERSION} substituted-after-acquisition`,
		0,
	);
	writeFileSync(session.vitestCliRealPath, substitutedSource);
	const calls = [];
	let caught;
	try {
		await runVitest(session, ["run"], { spawnImpl: recordSpawn(calls) });
	} catch (error) {
		caught = error;
	}
	assertRuleError(
		caught,
		/integrity-member-changed/,
		"substitution is not re-baselined",
	);
	assert.equal(calls.length, 0);
	assert.equal(existsSync(fixture.markerPath), false);
});

test("runtime does not deny native loading, forks, Workers, or child processes", () => {
	const runtimeText = readFileSync(
		path.join(REPOSITORY_ROOT, "scripts", "vitest-runtime.mjs"),
		"utf8",
	);
	const denialPatterns = [
		["process.dlopen interception", /process\.dlopen\b/],
		["process.binding interception", /process\.binding\b/],
		["Worker wrapping", /new Worker\b/],
		["pool restriction", /--pool\b/],
		["vmForks restriction", /vmForks/],
		["child_process monkeypatching", /child_process\.\w+\s*=/],
		["native denial rule", /native-(?:denied|forbidden|blocked)/],
	];
	for (const [label, pattern] of denialPatterns) {
		assert.doesNotMatch(
			runtimeText,
			pattern,
			`${label} must not appear in the runtime`,
		);
	}
	assert.match(runtimeText, /spawnImpl \?\? spawn/);
	assert.match(runtimeText, /native-binding/);
});

test("acquires and launches the real repository runtime without Vitest", () => {
	const session = acquireVitestRuntimeSession(
		REPOSITORY_ROOT,
		"bootstrap-suite-real-repository",
	);
	assert.equal(session.vitestVersion, session.lockfileResolution);
	assert.match(session.integrity.digest, /^[0-9a-f]{64}$/);
	assert.deepEqual(
		session.integrity.members.map((member) => member.id),
		EXPECTED_MEMBER_IDS,
	);
	assert.equal(session.nodeExecutableRealPath, realpathSync(process.execPath));
	assert.doesNotThrow(() =>
		revalidateVitestRuntimeSession(session, "manual-check"),
	);

	const nativeMember = session.integrity.members.find(
		(member) => member.id === "rolldown-platform-binding",
	);
	assert.equal(path.extname(nativeMember.realPath), ".node");
	assert.ok(existsSync(nativeMember.realPath));

	const launched = runVitestSync(session, ["--version"]);
	assert.equal(launched.status, 0);
	assert.equal(launched.execPath, session.nodeExecutableRealPath);
	assert.equal(launched.argv[0], session.vitestCliRealPath);
	assert.equal(
		launched.stdout.trim().split(/\s+/)[0],
		`vitest/${session.vitestVersion}`,
	);
});
