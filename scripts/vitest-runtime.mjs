// Repository-owned Vitest runtime session for prepared-worktree provenance.
//
// Under the r07 prepared-worktree threat model this module does not attempt to
// sandbox Vitest, Node, native code, Workers, forks, child processes, or
// external executables. It provides one explicit lifecycle object per direct
// top-level invocation:
//
//   * `acquireVitestRuntimeSession(root, callerIdentity)` resolves the
//     repository-local Vitest package, manifest-declared CLI, Vite and
//     Rolldown entries, and the selected native binding, validates the
//     lockfile resolution and declared bin target, records the Node identity
//     and visible bootstrap state, and hashes a bounded integrity set;
//   * `revalidateVitestRuntimeSession(session, phase)` re-checks that bounded
//     set and fails closed, naming the changed member;
//   * `runVitest(session, args, options)` and `runVitestSync(session, args,
//     options)` revalidate immediately before spawning and again after the
//     child closes, and reject the result on any post-run change.
//
// Every launch requires one brand-verified session object returned by this
// module. There is no overload that accepts a repository root and silently
// resolves a new target; object identity is a lifecycle aid, not a security
// boundary, and no cryptographic unforgeability is claimed.
//
// The recorded hashes are mutation sentinels for the listed files only. They
// are not an authentication, attestation, dependency-safety, or sandbox claim,
// and they say nothing about bytes outside the bounded set.
//
// Usage:
//   import {
//     acquireVitestRuntimeSession,
//     describeVitestRuntimeSession,
//     runVitest,
//   } from "./vitest-runtime.mjs";
//   const session = acquireVitestRuntimeSession(process.cwd(), "direct-runner");
//   await runVitest(session, ["run"], { configPath: "vitest.config.ts" });

import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";

export const VITEST_PACKAGE_NAME = "vitest";
export const VITEST_RUNTIME_RULE_PREFIX = "Vitest runtime rule";
export const VITEST_RUNTIME_SESSION_API_VERSION = 1;

// Private session brand. A non-enumerable symbol property so object spread,
// Object.assign, structuredClone, and JSON round-trips lose it. This rejects
// forged or equal-looking plain objects; it is not a cryptographic guarantee.
const SESSION_BRAND = Symbol("fitway.vitest-runtime-session");

// Test-only escape hatch for the visible dirty-bootstrap check. Fixture suites
// run inside runners that legitimately inject preload arguments, so they pass
// `{ allowVisibleDirtyBootstrap: true }`; no authoritative entry may.
const TEST_ONLY_DIRTY_BOOTSTRAP_OPTION = "allowVisibleDirtyBootstrap";

const PRELOAD_EXEC_ARGV_FLAGS = new Set([
	"--require",
	"--import",
	"--loader",
	"--experimental-loader",
	"--preload",
]);

const INTEGRITY_ALGORITHM = "sha256";

export function vitestRuntimeRuleError(ruleId, detail) {
	return new Error(`${VITEST_RUNTIME_RULE_PREFIX} "${ruleId}": ${detail}`);
}

function fail(ruleId, detail) {
	throw vitestRuntimeRuleError(ruleId, detail);
}

function isPlainObject(value) {
	if (value === null || typeof value !== "object" || Array.isArray(value)) {
		return false;
	}
	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}

// Strict realpath containment: `childRealPath` must be a proper descendant of
// `parentRealPath`. Equality is not containment, a `..` segment is an escape,
// and a relative path on another drive (absolute on Windows) is an escape.
export function isPathContained(parentRealPath, childRealPath) {
	const relative = path.relative(parentRealPath, childRealPath);
	if (relative === "" || relative === "..") return false;
	if (relative.startsWith(`..${path.sep}`)) return false;
	if (path.isAbsolute(relative)) return false;
	return true;
}

function deepFreeze(value) {
	if (value === null || typeof value !== "object") return value;
	for (const key of Object.keys(value)) {
		deepFreeze(value[key]);
	}
	return Object.freeze(value);
}

function readTextFile(filePath, ruleId, label) {
	try {
		return readFileSync(filePath, "utf8");
	} catch (error) {
		fail(ruleId, `${label} could not be read at ${filePath}: ${error.message}`);
	}
}

function readJsonFile(filePath, ruleId, label) {
	const text = readTextFile(filePath, ruleId, label);
	try {
		return JSON.parse(text);
	} catch (error) {
		fail(ruleId, `${label} at ${filePath} is not valid JSON: ${error.message}`);
	}
}

function sha256Hex(bytes) {
	return createHash("sha256").update(bytes).digest("hex");
}

function keyLinePattern(indent) {
	return new RegExp(`^ {${indent}}(?:'([^']+)'|"([^"]+)"|([^:\\s]+)):\\s*$`);
}

function stripYamlScalar(value) {
	const trimmed = value.trim();
	const quote = trimmed[0];
	if (
		trimmed.length >= 2 &&
		(quote === "'" || quote === '"') &&
		trimmed.endsWith(quote)
	) {
		return trimmed.slice(1, -1);
	}
	return trimmed;
}

// Some packages do not export "./package.json". Resolving the bare package and
// walking up to the nearest package.json with the expected name keeps the
// fallback anchored to the same local install the entry resolved from.
export function findPackageJsonForName(startDirectory, packageName) {
	let directory = path.resolve(startDirectory);
	for (;;) {
		const candidate = path.join(directory, "package.json");
		if (existsSync(candidate)) {
			let parsed;
			try {
				parsed = JSON.parse(readFileSync(candidate, "utf8"));
			} catch {
				parsed = undefined;
			}
			if (parsed && parsed.name === packageName) {
				return candidate;
			}
		}
		const parent = path.dirname(directory);
		if (parent === directory) {
			return undefined;
		}
		directory = parent;
	}
}

export function findVitestPackageJson(startDirectory) {
	return findPackageJsonForName(startDirectory, VITEST_PACKAGE_NAME);
}

export function resolveLocalVitestPackage(root) {
	const rootPackageJsonPath = path.join(root, "package.json");
	if (!existsSync(rootPackageJsonPath)) {
		fail(
			"root-package-json-missing",
			`repository root ${root} has no package.json; cannot resolve the local vitest package`,
		);
	}
	const requireFromRoot = createRequire(rootPackageJsonPath);
	let packageJsonPath;
	try {
		packageJsonPath = requireFromRoot.resolve("vitest/package.json");
	} catch (primaryError) {
		let entryPath;
		try {
			entryPath = requireFromRoot.resolve(VITEST_PACKAGE_NAME);
		} catch {
			fail(
				"vitest-package-unresolved",
				`cannot resolve the local vitest package from repository root ${root} (${primaryError.message}); a global or PATH-provided vitest is never accepted`,
			);
		}
		packageJsonPath = findVitestPackageJson(path.dirname(entryPath));
		if (packageJsonPath === undefined) {
			fail(
				"vitest-manifest-unresolved",
				`resolved vitest entry ${entryPath} but found no vitest package.json above it`,
			);
		}
	}
	return {
		packageJsonPath,
		packageJson: readJsonFile(
			packageJsonPath,
			"vitest-manifest-unreadable",
			"vitest package.json",
		),
	};
}

// Parses the root importer `.` -> devDependencies -> vitest -> version entry.
// The same `vitest:` shape appears in other importers, package snapshots, and
// peerDependenciesMeta, so the scan is scoped to the top-level importers
// section and to the two-space-indented `.` importer block.
export function parseLockfileVitestResolution(
	lockfileText,
	lockfileLabel = "pnpm-lock.yaml",
) {
	const lines = lockfileText.split(/\r?\n/);
	let importersIndex = -1;
	for (let index = 0; index < lines.length; index += 1) {
		if (/^importers:\s*(?:#.*)?$/.test(lines[index])) {
			importersIndex = index;
			break;
		}
	}
	if (importersIndex === -1) {
		fail(
			"lockfile-importers",
			`${lockfileLabel} has no top-level importers: section; cannot verify the root vitest resolution`,
		);
	}
	const importerPattern = keyLinePattern(2);
	const dependencyPattern = keyLinePattern(6);
	let blockStart = -1;
	let blockEnd = lines.length;
	for (let index = importersIndex + 1; index < lines.length; index += 1) {
		const line = lines[index];
		if (line.trim() === "") continue;
		if (/^\S/.test(line)) {
			blockEnd = index;
			break;
		}
		const match = importerPattern.exec(line);
		if (match === null) continue;
		const name = match[1] ?? match[2] ?? match[3];
		if (name === ".") {
			blockStart = index + 1;
			continue;
		}
		if (blockStart !== -1) {
			blockEnd = index;
			break;
		}
	}
	if (blockStart === -1) {
		fail(
			"lockfile-root-importer",
			`${lockfileLabel} has no root importer (.) entry`,
		);
	}
	let devDependenciesIndex = -1;
	for (let index = blockStart; index < blockEnd; index += 1) {
		if (/^ {4}devDependencies:\s*$/.test(lines[index])) {
			devDependenciesIndex = index;
			break;
		}
	}
	if (devDependenciesIndex === -1) {
		fail(
			"lockfile-dev-dependencies",
			`root importer in ${lockfileLabel} has no devDependencies section`,
		);
	}
	let vitestIndex = -1;
	for (let index = devDependenciesIndex + 1; index < blockEnd; index += 1) {
		const line = lines[index];
		if (line.trim() === "") continue;
		if (/^ {4}\S/.test(line)) break;
		const match = dependencyPattern.exec(line);
		if (match === null) continue;
		const name = match[1] ?? match[2] ?? match[3];
		if (name === VITEST_PACKAGE_NAME) {
			vitestIndex = index;
			break;
		}
	}
	if (vitestIndex === -1) {
		fail(
			"lockfile-vitest-entry",
			`root importer in ${lockfileLabel} has no devDependencies.vitest entry`,
		);
	}
	let rawResolution;
	for (let index = vitestIndex + 1; index < blockEnd; index += 1) {
		const line = lines[index];
		if (line.trim() === "") continue;
		if (/^ {0,6}\S/.test(line)) break;
		const match = /^ {8}version:\s*(.+?)\s*$/.exec(line);
		if (match !== null) {
			rawResolution = stripYamlScalar(match[1]);
			break;
		}
	}
	if (rawResolution === undefined || rawResolution === "") {
		fail(
			"lockfile-resolution-missing",
			`root devDependencies.vitest entry in ${lockfileLabel} has no resolution version`,
		);
	}
	const resolution = rawResolution.replace(/\(.*$/, "").trim();
	if (resolution === "") {
		fail(
			"lockfile-resolution-empty",
			`root devDependencies.vitest entry in ${lockfileLabel} has an empty resolution version`,
		);
	}
	return { resolution, rawResolution };
}

// Resolves the `bin` declaration to a fully validated CLI entry real path.
// Order: declaration type, empty target, absolute/drive-relative target,
// lexical traversal, existence, regular file, realpath containment in the
// package directory, realpath containment in the repository root.
export function resolveVitestCliEntry(
	packageDirectoryRealPath,
	packageJson,
	repositoryRootRealPath,
) {
	const bin = packageJson.bin;
	let target;
	if (typeof bin === "string") {
		target = bin;
	} else if (
		isPlainObject(bin) &&
		typeof bin[VITEST_PACKAGE_NAME] === "string"
	) {
		target = bin[VITEST_PACKAGE_NAME];
	} else {
		fail(
			"bin-declaration",
			`vitest package at ${packageDirectoryRealPath} declares no usable bin target for "${VITEST_PACKAGE_NAME}"; expected a non-empty string or a plain object with a string "${VITEST_PACKAGE_NAME}" member`,
		);
	}
	if (target.trim() === "") {
		fail(
			"bin-empty",
			`vitest package at ${packageDirectoryRealPath} declares an empty bin target`,
		);
	}
	if (
		path.isAbsolute(target) ||
		target.startsWith("/") ||
		target.startsWith("\\") ||
		/^[A-Za-z]:/.test(target)
	) {
		fail(
			"bin-absolute",
			`vitest package bin target ${JSON.stringify(target)} is absolute or drive-relative; the CLI must be a relative path inside the package`,
		);
	}
	const lexicallyResolved = path.resolve(packageDirectoryRealPath, target);
	if (!isPathContained(packageDirectoryRealPath, lexicallyResolved)) {
		fail(
			"bin-traversal",
			`vitest package bin target ${JSON.stringify(target)} resolves lexically outside the package directory ${packageDirectoryRealPath} (resolved: ${lexicallyResolved})`,
		);
	}
	let cliEntryRealPath;
	try {
		cliEntryRealPath = realpathSync(lexicallyResolved);
	} catch (error) {
		fail(
			"bin-missing",
			`vitest CLI entry ${lexicallyResolved} cannot be resolved: ${error.message}`,
		);
	}
	let stats;
	try {
		stats = statSync(cliEntryRealPath);
	} catch (error) {
		fail(
			"bin-not-file",
			`vitest CLI entry ${cliEntryRealPath} cannot be inspected: ${error.message}`,
		);
	}
	if (!stats.isFile()) {
		fail(
			"bin-not-file",
			`vitest CLI entry ${cliEntryRealPath} is not a regular file`,
		);
	}
	if (!isPathContained(packageDirectoryRealPath, cliEntryRealPath)) {
		fail(
			"bin-package-escape",
			`vitest CLI entry real path ${cliEntryRealPath} is outside the trusted package directory ${packageDirectoryRealPath}`,
		);
	}
	if (!isPathContained(repositoryRootRealPath, cliEntryRealPath)) {
		fail(
			"bin-root-escape",
			`vitest CLI entry real path ${cliEntryRealPath} is outside the repository root ${repositoryRootRealPath}`,
		);
	}
	return cliEntryRealPath;
}

// Visible dirty-bootstrap validation. Runs inside the already-started process,
// so it can only report visible state; it cannot prove that no earlier
// preload, loader injection, or host tampering happened before this code ran.
function assertVisibleCleanBootstrap() {
	const violations = [];
	for (const name of ["NODE_OPTIONS", "NODE_PATH"]) {
		const value = process.env[name];
		if (typeof value === "string" && value.trim() !== "") {
			violations.push(`${name}=${JSON.stringify(value)}`);
		}
	}
	for (const argument of process.execArgv) {
		const flag = argument.split("=", 1)[0];
		if (PRELOAD_EXEC_ARGV_FLAGS.has(flag)) {
			violations.push(`process.execArgv carries ${flag}`);
		}
	}
	if (violations.length > 0) {
		fail(
			"dirty-bootstrap-visible",
			`visible dirty bootstrap state: ${violations.join("; ")}. This check is defense in depth from inside the running process; it cannot prove that no earlier preload, loader, or host tampering happened before repository code started`,
		);
	}
}

function realPathOfRegularFile(candidatePath, ruleId, label) {
	let realPath;
	try {
		realPath = realpathSync(candidatePath);
	} catch (error) {
		fail(
			ruleId,
			`${label} at ${candidatePath} cannot be resolved: ${error.message}`,
		);
	}
	let stats;
	try {
		stats = statSync(realPath);
	} catch (error) {
		fail(
			ruleId,
			`${label} at ${realPath} cannot be inspected: ${error.message}`,
		);
	}
	if (!stats.isFile()) {
		fail(ruleId, `${label} at ${realPath} is not a regular file`);
	}
	return realPath;
}

function assertContainedIn(realPath, rootRealPath, ruleId, label) {
	if (!isPathContained(rootRealPath, realPath)) {
		fail(ruleId, `${label} real path ${realPath} is outside ${rootRealPath}`);
	}
}

function resolvePackageManifestFrom(requireFrom, packageName, label) {
	let manifestPath;
	try {
		manifestPath = requireFrom.resolve(`${packageName}/package.json`);
	} catch (primaryError) {
		let entryPath;
		try {
			entryPath = requireFrom.resolve(packageName);
		} catch {
			fail(
				"integrity-member-unresolved",
				`bounded-set member "${label}" cannot resolve package ${packageName}: ${primaryError.message}`,
			);
		}
		manifestPath = findPackageJsonForName(path.dirname(entryPath), packageName);
		if (manifestPath === undefined) {
			fail(
				"integrity-member-unresolved",
				`bounded-set member "${label}" resolved entry ${entryPath} but found no ${packageName} package.json above it`,
			);
		}
	}
	return manifestPath;
}

function resolvePackageEntryFrom(requireFrom, packageName, label) {
	let entryPath;
	try {
		entryPath = requireFrom.resolve(packageName);
	} catch (error) {
		fail(
			"integrity-member-unresolved",
			`bounded-set member "${label}" cannot resolve package ${packageName}: ${error.message}`,
		);
	}
	return entryPath;
}

function detectMuslLibc() {
	if (process.platform !== "linux") return null;
	try {
		if (readFileSync("/usr/bin/ldd", "utf8").includes("musl")) {
			return true;
		}
	} catch {
		// fall through to the runtime report
	}
	try {
		const report =
			process.report && typeof process.report.getReport === "function"
				? process.report.getReport()
				: null;
		if (report?.header?.glibcVersionRuntime) {
			return false;
		}
	} catch {
		// inconclusive
	}
	return null;
}

// Mirrors the installed Rolldown loader's own disambiguation between ABI
// variants of the same platform/architecture binding package.
function selectPlatformBindingAbi(candidates) {
	if (candidates.length <= 1) return candidates;
	if (process.platform === "win32") {
		const variables = process.config?.variables ?? {};
		const preferGnu =
			variables.shlib_suffix === "dll.a" ||
			variables.node_target_type === "shared_library";
		const suffix = preferGnu ? "-gnu" : "-msvc";
		return candidates.filter((candidate) =>
			candidate.packageName.endsWith(suffix),
		);
	}
	if (process.platform === "linux") {
		const musl = detectMuslLibc();
		if (musl === null) return candidates;
		const suffix = musl ? "-musl" : "-gnu";
		return candidates.filter((candidate) =>
			candidate.packageName.endsWith(suffix),
		);
	}
	return candidates;
}

function resolvePlatformBindingMembers(
	rolldownManifestRealPath,
	rolldownManifest,
	containmentRoots,
) {
	const requireFromRolldown = createRequire(rolldownManifestRealPath);
	const optionalDependencies = isPlainObject(
		rolldownManifest.optionalDependencies,
	)
		? rolldownManifest.optionalDependencies
		: {};
	const candidates = [];
	for (const packageName of Object.keys(optionalDependencies)) {
		if (!packageName.startsWith("@rolldown/binding-")) continue;
		let manifestPath;
		try {
			manifestPath = requireFromRolldown.resolve(`${packageName}/package.json`);
		} catch {
			continue;
		}
		const manifest = readJsonFile(
			manifestPath,
			"integrity-member-unresolved",
			`bounded-set member "rolldown-platform-manifest" (${packageName})`,
		);
		if (Array.isArray(manifest.os) && !manifest.os.includes(process.platform)) {
			continue;
		}
		if (Array.isArray(manifest.cpu) && !manifest.cpu.includes(process.arch)) {
			continue;
		}
		candidates.push({ packageName, manifestPath, manifest });
	}
	const selected = selectPlatformBindingAbi(candidates);
	if (selected.length === 0) {
		fail(
			"integrity-member-unresolved",
			`bounded-set member "rolldown-platform-manifest" has no installed Rolldown binding for ${process.platform}-${process.arch}; the bounded set is never silently shrunk`,
		);
	}
	if (selected.length > 1) {
		fail(
			"integrity-member-ambiguous",
			`bounded-set member "rolldown-platform-manifest" is ambiguous for ${process.platform}-${process.arch}: ${selected
				.map((candidate) => candidate.packageName)
				.join(", ")}`,
		);
	}
	const binding = selected[0];
	const manifestRealPath = realPathOfRegularFile(
		binding.manifestPath,
		"integrity-member-unresolved",
		'bounded-set member "rolldown-platform-manifest"',
	);
	const packageDirectoryRealPath = path.dirname(manifestRealPath);
	assertContainedIn(
		manifestRealPath,
		containmentRoots.nodeModules,
		"integrity-member-unresolved",
		'bounded-set member "rolldown-platform-manifest"',
	);
	assertContainedIn(
		manifestRealPath,
		containmentRoots.repositoryRoot,
		"integrity-member-unresolved",
		'bounded-set member "rolldown-platform-manifest"',
	);
	const main =
		typeof binding.manifest.main === "string"
			? binding.manifest.main.trim()
			: "";
	if (main === "") {
		fail(
			"integrity-member-unresolved",
			`bounded-set member "rolldown-platform-binding" (${binding.packageName}) declares no main entry`,
		);
	}
	const nativeRealPath = realPathOfRegularFile(
		path.resolve(packageDirectoryRealPath, main),
		"integrity-member-unresolved",
		'bounded-set member "rolldown-platform-binding"',
	);
	if (path.extname(nativeRealPath) !== ".node") {
		fail(
			"integrity-member-unresolved",
			`bounded-set member "rolldown-platform-binding" at ${nativeRealPath} is not a .node native binding`,
		);
	}
	assertContainedIn(
		nativeRealPath,
		packageDirectoryRealPath,
		"integrity-member-unresolved",
		'bounded-set member "rolldown-platform-binding"',
	);
	assertContainedIn(
		nativeRealPath,
		containmentRoots.nodeModules,
		"integrity-member-unresolved",
		'bounded-set member "rolldown-platform-binding"',
	);
	assertContainedIn(
		nativeRealPath,
		containmentRoots.repositoryRoot,
		"integrity-member-unresolved",
		'bounded-set member "rolldown-platform-binding"',
	);
	return {
		packageName: binding.packageName,
		manifestRealPath,
		nativeFileRealPath: nativeRealPath,
	};
}

// Derives the binding-loader module the installed Rolldown entry statically
// imports. The filename carries a per-install hash suffix, so the rule reads
// the entry's own relative `shared/binding-*.mjs` import instead of hardcoding
// one, and fails closed when the rule is not deterministic.
function resolveRolldownBindingLoader(
	rolldownEntryRealPath,
	rolldownPackageDirectoryRealPath,
) {
	const entryText = readTextFile(
		rolldownEntryRealPath,
		"integrity-member-unresolved",
		'bounded-set member "rolldown-entry"',
	);
	const matches = [
		...entryText.matchAll(/["'](\.[^"']*\/shared\/binding-[^"']*\.mjs)["']/g),
	];
	const resolved = new Set();
	for (const match of matches) {
		const candidatePath = path.resolve(
			path.dirname(rolldownEntryRealPath),
			match[1],
		);
		if (!existsSync(candidatePath)) {
			fail(
				"integrity-member-unresolved",
				`bounded-set member "rolldown-binding-loader" import ${match[1]} from ${rolldownEntryRealPath} does not exist`,
			);
		}
		const realPath = realPathOfRegularFile(
			candidatePath,
			"integrity-member-unresolved",
			'bounded-set member "rolldown-binding-loader"',
		);
		assertContainedIn(
			realPath,
			rolldownPackageDirectoryRealPath,
			"integrity-member-unresolved",
			'bounded-set member "rolldown-binding-loader"',
		);
		resolved.add(realPath);
	}
	if (resolved.size === 0) {
		fail(
			"integrity-member-unresolved",
			`bounded-set member "rolldown-binding-loader": ${rolldownEntryRealPath} has no relative shared/binding-*.mjs import to derive`,
		);
	}
	if (resolved.size > 1) {
		fail(
			"integrity-member-ambiguous",
			`bounded-set member "rolldown-binding-loader" has ${resolved.size} candidates: ${[...resolved].join(", ")}`,
		);
	}
	return [...resolved][0];
}

function recordMember(id, kind, realPath, containmentRoots) {
	assertContainedIn(
		realPath,
		containmentRoots.repositoryRoot,
		"integrity-member-unresolved",
		`bounded-set member "${id}"`,
	);
	if (containmentRoots.nodeModules !== undefined) {
		assertContainedIn(
			realPath,
			containmentRoots.nodeModules,
			"integrity-member-unresolved",
			`bounded-set member "${id}"`,
		);
	}
	let bytes;
	try {
		bytes = readFileSync(realPath);
	} catch (error) {
		fail(
			"integrity-member-unresolved",
			`bounded-set member "${id}" at ${realPath} cannot be read: ${error.message}`,
		);
	}
	return {
		byteLength: bytes.byteLength,
		id,
		kind,
		realPath,
		sha256: sha256Hex(bytes),
	};
}

function recordRootMember(id, kind, rootRealPath, relativePath) {
	const realPath = realPathOfRegularFile(
		path.join(rootRealPath, relativePath),
		"integrity-member-unresolved",
		`bounded-set member "${id}"`,
	);
	return recordMember(id, kind, realPath, {
		repositoryRoot: rootRealPath,
	});
}

function resolveContainedMemberPath(id, candidatePath, containmentRoots) {
	const label = `bounded-set member "${id}"`;
	const realPath = realPathOfRegularFile(
		candidatePath,
		"integrity-member-unresolved",
		label,
	);
	assertContainedIn(
		realPath,
		containmentRoots.repositoryRoot,
		"integrity-member-unresolved",
		label,
	);
	if (containmentRoots.nodeModules !== undefined) {
		assertContainedIn(
			realPath,
			containmentRoots.nodeModules,
			"integrity-member-unresolved",
			label,
		);
	}
	return realPath;
}

function digestIntegrityMembers(members) {
	const hash = createHash("sha256");
	for (const member of members) {
		hash.update(
			`${member.id}\0${member.kind}\0${member.realPath}\0${member.sha256}\0${member.byteLength}\0`,
			"utf8",
		);
	}
	return hash.digest("hex");
}

function isVitestRuntimeSession(value) {
	if (value === null || typeof value !== "object") return false;
	if (value[SESSION_BRAND] !== true) return false;
	if (!Object.isFrozen(value)) return false;
	if (value.apiVersion !== VITEST_RUNTIME_SESSION_API_VERSION) return false;
	const requiredStrings = [
		"callerIdentity",
		"repositoryRootRealPath",
		"vitestVersion",
		"vitestManifestRealPath",
		"vitestCliRealPath",
		"viteManifestRealPath",
		"viteEntryRealPath",
		"rolldownManifestRealPath",
		"rolldownEntryRealPath",
		"rolldownBindingLoaderRealPath",
		"platformBindingPackageName",
		"platformBindingManifestRealPath",
		"platformBindingNativeFileRealPath",
		"nodeExecutableRealPath",
		"nodeVersion",
		"lockfileResolution",
		"platform",
		"arch",
	];
	for (const key of requiredStrings) {
		if (typeof value[key] !== "string" || value[key] === "") return false;
	}
	if (
		!Array.isArray(value.configs) ||
		value.configs.length === 0 ||
		!value.configs.every(
			(config) =>
				config !== null &&
				typeof config === "object" &&
				typeof config.path === "string" &&
				typeof config.realPath === "string" &&
				typeof config.sha256 === "string" &&
				Number.isInteger(config.byteLength),
		)
	) {
		return false;
	}
	const integrity = value.integrity;
	if (
		integrity === null ||
		typeof integrity !== "object" ||
		integrity.algorithm !== INTEGRITY_ALGORITHM ||
		!/^[0-9a-f]{64}$/.test(integrity.digest) ||
		!Array.isArray(integrity.members) ||
		integrity.members.length === 0
	) {
		return false;
	}
	return integrity.members.every(
		(member) =>
			member !== null &&
			typeof member === "object" &&
			typeof member.id === "string" &&
			typeof member.kind === "string" &&
			typeof member.realPath === "string" &&
			typeof member.sha256 === "string" &&
			Number.isInteger(member.byteLength),
	);
}

function assertVitestRuntimeSession(session, caller) {
	if (!isVitestRuntimeSession(session)) {
		fail(
			"vitest-session-required",
			`${caller} requires the session object returned by acquireVitestRuntimeSession; a repository root, a plain object, or a forged equal-looking object is rejected before any launch (brand and structural validation; no cryptographic unforgeability is claimed)`,
		);
	}
}

export function acquireVitestRuntimeSession(
	repositoryRoot,
	callerIdentity,
	options = {},
) {
	if (typeof callerIdentity !== "string" || callerIdentity.trim() === "") {
		fail(
			"caller-identity",
			"caller identity must be a non-empty string naming the direct invocation that owns this session",
		);
	}
	if (options === null || typeof options !== "object") {
		fail(
			"acquisition-options",
			"acquisition options must be an object when provided",
		);
	}
	if (options[TEST_ONLY_DIRTY_BOOTSTRAP_OPTION] !== true) {
		assertVisibleCleanBootstrap();
	}
	if (typeof repositoryRoot !== "string" || repositoryRoot.trim() === "") {
		fail("root-argument", "repository root argument must be a non-empty path");
	}
	let repositoryRootRealPath;
	try {
		repositoryRootRealPath = realpathSync(path.resolve(repositoryRoot));
	} catch (error) {
		fail(
			"root-unresolved",
			`repository root ${repositoryRoot} cannot be resolved: ${error.message}`,
		);
	}
	const nodeModulesPath = path.join(repositoryRootRealPath, "node_modules");
	if (!existsSync(nodeModulesPath)) {
		fail(
			"node-modules-missing",
			`repository root ${repositoryRootRealPath} has no node_modules directory; run pnpm install --frozen-lockfile first`,
		);
	}
	let nodeModulesRealPath;
	try {
		nodeModulesRealPath = realpathSync(nodeModulesPath);
	} catch (error) {
		fail(
			"node-modules-unresolved",
			`node_modules at ${nodeModulesPath} cannot be resolved: ${error.message}`,
		);
	}
	const { packageJsonPath, packageJson } = resolveLocalVitestPackage(
		repositoryRootRealPath,
	);
	let packageManifestRealPath;
	try {
		packageManifestRealPath = realpathSync(packageJsonPath);
	} catch (error) {
		fail(
			"package-manifest-unresolved",
			`resolved vitest package.json ${packageJsonPath} is not accessible: ${error.message}`,
		);
	}
	if (!isPathContained(nodeModulesRealPath, packageManifestRealPath)) {
		fail(
			"package-manifest-outside-node-modules",
			`resolved vitest package ${packageManifestRealPath} is outside ${nodeModulesRealPath}; the resolver refuses a package that a global install could satisfy`,
		);
	}
	if (!isPathContained(repositoryRootRealPath, packageManifestRealPath)) {
		fail(
			"package-manifest-outside-root",
			`resolved vitest package ${packageManifestRealPath} is outside the repository root ${repositoryRootRealPath}`,
		);
	}
	const vitestPackageDirectoryRealPath = path.dirname(packageManifestRealPath);
	const version =
		typeof packageJson.version === "string" ? packageJson.version.trim() : "";
	if (version === "") {
		fail(
			"package-version-missing",
			`vitest package at ${packageManifestRealPath} declares no version`,
		);
	}
	// The root lockfile is recorded as a contained member of the prepared
	// worktree. A missing or unreadable lexical candidate keeps its stable
	// `lockfile-unreadable` rule; a real path that escapes the repository root
	// fails `integrity-member-unresolved` naming "root-lockfile".
	const lockfileRealPath = resolveContainedMemberPath(
		"root-lockfile",
		realPathOfRegularFile(
			path.join(repositoryRootRealPath, "pnpm-lock.yaml"),
			"lockfile-unreadable",
			"root pnpm-lock.yaml",
		),
		{ repositoryRoot: repositoryRootRealPath },
	);
	let lockfileBytes;
	try {
		lockfileBytes = readFileSync(lockfileRealPath);
	} catch (error) {
		fail(
			"lockfile-unreadable",
			`root pnpm-lock.yaml at ${lockfileRealPath} could not be read: ${error.message}`,
		);
	}
	const lockfile = parseLockfileVitestResolution(
		lockfileBytes.toString("utf8"),
	);
	if (lockfile.resolution !== version) {
		fail(
			"lockfile-resolution-mismatch",
			`installed vitest ${version} at ${packageManifestRealPath} does not match the pnpm-lock.yaml root devDependencies resolution ${lockfile.resolution}`,
		);
	}
	const vitestCliRealPath = resolveVitestCliEntry(
		vitestPackageDirectoryRealPath,
		packageJson,
		repositoryRootRealPath,
	);
	let nodeExecutableRealPath;
	try {
		nodeExecutableRealPath = realpathSync(process.execPath);
	} catch (error) {
		fail(
			"node-executable-unresolved",
			`cannot resolve the running Node executable ${process.execPath}: ${error.message}`,
		);
	}
	const containmentRoots = {
		nodeModules: nodeModulesRealPath,
		repositoryRoot: repositoryRootRealPath,
	};

	const requireFromVitest = createRequire(packageManifestRealPath);
	const viteManifestRealPath = resolveContainedMemberPath(
		"vite-manifest",
		resolvePackageManifestFrom(requireFromVitest, "vite", "vite-manifest"),
		containmentRoots,
	);
	const viteManifest = readJsonFile(
		viteManifestRealPath,
		"integrity-member-unresolved",
		'bounded-set member "vite-manifest"',
	);
	const viteEntryRealPath = resolveContainedMemberPath(
		"vite-entry",
		resolvePackageEntryFrom(requireFromVitest, "vite", "vite-entry"),
		containmentRoots,
	);

	const requireFromVite = createRequire(viteManifestRealPath);
	const rolldownManifestRealPath = resolveContainedMemberPath(
		"rolldown-manifest",
		resolvePackageManifestFrom(
			requireFromVite,
			"rolldown",
			"rolldown-manifest",
		),
		containmentRoots,
	);
	const rolldownManifest = readJsonFile(
		rolldownManifestRealPath,
		"integrity-member-unresolved",
		'bounded-set member "rolldown-manifest"',
	);
	const rolldownEntryRealPath = resolveContainedMemberPath(
		"rolldown-entry",
		resolvePackageEntryFrom(requireFromVite, "rolldown", "rolldown-entry"),
		containmentRoots,
	);
	const rolldownBindingLoaderRealPath = resolveContainedMemberPath(
		"rolldown-binding-loader",
		resolveRolldownBindingLoader(
			rolldownEntryRealPath,
			path.dirname(rolldownManifestRealPath),
		),
		containmentRoots,
	);
	const platformBinding = resolvePlatformBindingMembers(
		rolldownManifestRealPath,
		rolldownManifest,
		containmentRoots,
	);

	const rootMembers = [
		recordRootMember(
			"root-package-json",
			"root-manifest",
			repositoryRootRealPath,
			"package.json",
		),
		{
			byteLength: lockfileBytes.byteLength,
			id: "root-lockfile",
			kind: "lockfile",
			realPath: lockfileRealPath,
			sha256: sha256Hex(lockfileBytes),
		},
		recordRootMember(
			"config-unit",
			"config",
			repositoryRootRealPath,
			"vitest.config.ts",
		),
		recordRootMember(
			"config-integration",
			"config",
			repositoryRootRealPath,
			"vitest.integration.config.ts",
		),
		recordRootMember(
			"script-vitest-runtime",
			"trust-script",
			repositoryRootRealPath,
			path.join("scripts", "vitest-runtime.mjs"),
		),
		recordRootMember(
			"script-check-test-runtime",
			"trust-script",
			repositoryRootRealPath,
			path.join("scripts", "check-test-runtime.mjs"),
		),
		recordRootMember(
			"script-run-vitest",
			"trust-script",
			repositoryRootRealPath,
			path.join("scripts", "run-vitest.mjs"),
		),
		recordRootMember(
			"script-verify",
			"trust-script",
			repositoryRootRealPath,
			path.join("scripts", "verify.mjs"),
		),
		recordRootMember(
			"script-repository-fingerprint",
			"trust-script",
			repositoryRootRealPath,
			path.join("scripts", "repository-fingerprint.mjs"),
		),
	];

	const members = [
		...rootMembers,
		recordMember(
			"vitest-manifest",
			"package-manifest",
			packageManifestRealPath,
			containmentRoots,
		),
		recordMember(
			"vitest-cli",
			"cli-entry",
			vitestCliRealPath,
			containmentRoots,
		),
		recordMember(
			"vite-manifest",
			"dependency-manifest",
			viteManifestRealPath,
			containmentRoots,
		),
		recordMember(
			"vite-entry",
			"dependency-entry",
			viteEntryRealPath,
			containmentRoots,
		),
		recordMember(
			"rolldown-manifest",
			"dependency-manifest",
			rolldownManifestRealPath,
			containmentRoots,
		),
		recordMember(
			"rolldown-entry",
			"dependency-entry",
			rolldownEntryRealPath,
			containmentRoots,
		),
		recordMember(
			"rolldown-binding-loader",
			"binding-loader",
			rolldownBindingLoaderRealPath,
			containmentRoots,
		),
		recordMember(
			"rolldown-platform-manifest",
			"native-package-manifest",
			platformBinding.manifestRealPath,
			containmentRoots,
		),
		recordMember(
			"rolldown-platform-binding",
			"native-binding",
			platformBinding.nativeFileRealPath,
			containmentRoots,
		),
	];

	const configs = members
		.filter((member) => member.kind === "config")
		.map((member) =>
			Object.freeze({
				byteLength: member.byteLength,
				path: path
					.relative(repositoryRootRealPath, member.realPath)
					.replaceAll(path.sep, "/"),
				realPath: member.realPath,
				sha256: member.sha256,
			}),
		);

	const session = {
		apiVersion: VITEST_RUNTIME_SESSION_API_VERSION,
		arch: process.arch,
		callerIdentity,
		configs: Object.freeze(configs),
		integrity: Object.freeze({
			algorithm: INTEGRITY_ALGORITHM,
			digest: digestIntegrityMembers(members),
			members: Object.freeze(members),
		}),
		lockfileRawResolution: lockfile.rawResolution,
		lockfileResolution: lockfile.resolution,
		nodeExecutableRealPath,
		nodeVersion: process.versions.node,
		platform: process.platform,
		platformBindingManifestRealPath: platformBinding.manifestRealPath,
		platformBindingNativeFileRealPath: platformBinding.nativeFileRealPath,
		platformBindingPackageName: platformBinding.packageName,
		repositoryRootRealPath,
		rolldownBindingLoaderRealPath,
		rolldownEntryRealPath,
		rolldownManifestRealPath,
		rolldownVersion:
			typeof rolldownManifest.version === "string"
				? rolldownManifest.version
				: "",
		viteEntryRealPath,
		viteManifestRealPath,
		viteVersion:
			typeof viteManifest.version === "string" ? viteManifest.version : "",
		vitestCliRealPath,
		vitestManifestRealPath: packageManifestRealPath,
		vitestPackageDirectoryRealPath,
		vitestVersion: version,
	};
	Object.defineProperty(session, SESSION_BRAND, {
		configurable: false,
		enumerable: false,
		value: true,
		writable: false,
	});
	return deepFreeze(session);
}

// Re-reads every recorded member and fails closed, naming the member and path,
// when bytes, length, or real path differ from the acquisition baseline.
export function revalidateVitestRuntimeSession(session, phase) {
	assertVitestRuntimeSession(session, "revalidateVitestRuntimeSession");
	if (typeof phase !== "string" || phase.trim() === "") {
		fail(
			"revalidation-phase",
			"revalidation phase must be a non-empty string naming the point of the check",
		);
	}
	for (const member of session.integrity.members) {
		let bytes;
		try {
			bytes = readFileSync(member.realPath);
		} catch (error) {
			fail(
				"integrity-member-missing",
				`bounded-set member "${member.id}" at ${member.realPath} cannot be re-read during ${phase}: ${error.message}`,
			);
		}
		const observedSha256 = sha256Hex(bytes);
		if (
			observedSha256 !== member.sha256 ||
			bytes.byteLength !== member.byteLength
		) {
			fail(
				"integrity-member-changed",
				`bounded-set member "${member.id}" at ${member.realPath} changed since acquisition: expected ${INTEGRITY_ALGORITHM} ${member.sha256} (${member.byteLength} bytes), observed ${observedSha256} (${bytes.byteLength} bytes) during ${phase}`,
			);
		}
	}
	return {
		digest: session.integrity.digest,
		memberCount: session.integrity.members.length,
		phase,
	};
}

export function resolveConfigSelection(session, configPath) {
	if (configPath === undefined || configPath === null) {
		return { byteLength: null, path: null, sha256: null };
	}
	if (typeof configPath !== "string" || configPath.trim() === "") {
		fail(
			"unknown-config-path",
			"configPath must be one of the session's recorded configuration paths or null",
		);
	}
	const selected = session.configs.find((config) => config.path === configPath);
	if (selected === undefined) {
		fail(
			"unknown-config-path",
			`configPath ${JSON.stringify(configPath)} is not one of the session's recorded configuration paths: ${session.configs
				.map((config) => config.path)
				.join(", ")}`,
		);
	}
	return {
		byteLength: selected.byteLength,
		path: selected.path,
		sha256: selected.sha256,
	};
}

function resolveRequestedConfigSelection(session, requested) {
	const normalized = requested.replaceAll("\\", "/");
	const recordedByPath = session.configs.find(
		(config) => config.path === normalized,
	);
	if (recordedByPath !== undefined) return recordedByPath;
	let requestedRealPath = null;
	try {
		requestedRealPath = realpathSync(
			path.resolve(session.repositoryRootRealPath, requested),
		);
	} catch {
		requestedRealPath = null;
	}
	const recordedByRealPath =
		requestedRealPath === null
			? undefined
			: session.configs.find((config) => config.realPath === requestedRealPath);
	if (recordedByRealPath !== undefined) return recordedByRealPath;
	fail(
		"unknown-config-path",
		`--config ${JSON.stringify(requested)} is not one of the session's recorded configuration paths (${session.configs
			.map((config) => config.path)
			.join(
				", ",
			)}); the direct runner records the selected configuration hash and never launches with an unrecorded config`,
	);
}

function configSelectionOf(recorded) {
	return {
		byteLength: recorded.byteLength,
		path: recorded.path,
		sha256: recorded.sha256,
	};
}

function isRootSelectorToken(argument) {
	return (
		argument === "--root" ||
		argument.startsWith("--root=") ||
		argument === "-r" ||
		argument.startsWith("-r=")
	);
}

function configValueFromSelector(selectorToken, value) {
	if (
		value === undefined ||
		value === "" ||
		value.startsWith("-") ||
		value === "true" ||
		value === "false"
	) {
		fail(
			"config-value-missing",
			`configuration selector ${JSON.stringify(selectorToken)} requires a non-empty path value, but received ${value === undefined ? "no value" : JSON.stringify(value)}`,
		);
	}
	return value;
}

// One invocation normalizer for every focused launch. It rejects root
// selectors outright (r08 has no alternate-root mode), resolves the last
// requested --config/-c spelling to one recorded repository configuration
// exactly as Vitest selects it, removes every caller config spelling, and
// appends one canonical `--config <recorded-relative-path>` pair after the
// pass-through focus/filter arguments. The launch layer calls this itself, so
// contradictory argv and configPath metadata cannot reach a spawn.
export function normalizeVitestInvocation(session, args, options = {}) {
	assertVitestRuntimeSession(session, "normalizeVitestInvocation");
	if (
		!Array.isArray(args) ||
		args.some((argument) => typeof argument !== "string")
	) {
		fail("vitest-arguments", "vitest arguments must be an array of strings");
	}
	const passThrough = [];
	let requestedConfigValue;
	for (let index = 0; index < args.length; index += 1) {
		const argument = args[index];
		if (isRootSelectorToken(argument)) {
			fail(
				"root-selector-unsupported",
				`root selector token ${JSON.stringify(argument)} is not supported; this runtime launches only from the session's repository root ${session.repositoryRootRealPath} and has no alternate-root mode`,
			);
		}
		if (argument === "--config" || argument === "-c") {
			requestedConfigValue = configValueFromSelector(argument, args[index + 1]);
			index += 1;
			continue;
		}
		if (argument.startsWith("--config=") || argument.startsWith("-c=")) {
			requestedConfigValue = configValueFromSelector(
				argument.slice(0, argument.indexOf("=") + 1),
				argument.slice(argument.indexOf("=") + 1),
			);
			continue;
		}
		passThrough.push(argument);
	}
	const requestedConfig =
		requestedConfigValue === undefined
			? undefined
			: resolveRequestedConfigSelection(session, requestedConfigValue);
	let selected;
	if (requestedConfig !== undefined) {
		if (options.configPath === null) {
			fail(
				"conflicting-config-selection",
				`argv requests configuration ${JSON.stringify(requestedConfig.path)} but configPath is null (explicit no-config); the launch would otherwise be described as config-less while launching with a config`,
			);
		}
		if (
			typeof options.configPath === "string" &&
			options.configPath.trim() !== ""
		) {
			const optionConfig = resolveConfigSelection(session, options.configPath);
			if (optionConfig.path !== requestedConfig.path) {
				fail(
					"conflicting-config-selection",
					`argv requests configuration ${JSON.stringify(requestedConfig.path)} but configPath names ${JSON.stringify(optionConfig.path)}; the launch would otherwise be described by the wrong configuration hash`,
				);
			}
		}
		selected = configSelectionOf(requestedConfig);
	} else if (options.configPath === null) {
		if (passThrough.length !== 1 || passThrough[0] !== "--version") {
			fail(
				"no-config-not-allowed",
				`configPath: null (explicit no-config) is allowed only for the --version diagnostic; received argv ${JSON.stringify(passThrough)}`,
			);
		}
		selected = null;
	} else if (options.configPath === undefined) {
		selected = resolveConfigSelection(
			session,
			options.defaultConfigPath ?? "vitest.config.ts",
		);
	} else {
		selected = resolveConfigSelection(session, options.configPath);
	}
	return {
		argv:
			selected === null
				? passThrough
				: [...passThrough, "--config", selected.path],
		config: selected,
	};
}

function prepareVitestLaunch(session, args, options) {
	assertVitestRuntimeSession(session, "the Vitest launch API");
	const invocation = normalizeVitestInvocation(session, args, options);
	revalidateVitestRuntimeSession(session, "pre-launch");
	return {
		argv: [session.vitestCliRealPath, ...invocation.argv],
		config: invocation.config,
		cwd: session.repositoryRootRealPath,
		execPath: session.nodeExecutableRealPath,
	};
}

function describePostLaunchFailure(status, signal, error) {
	const outcome =
		signal !== null && signal !== undefined
			? `vitest was terminated with signal ${signal}`
			: `vitest exited with status ${status === null ? "null" : status}`;
	return `${outcome} but the bounded integrity set changed during the launch: ${error.message}`;
}

// Launches the session's resolved CLI: the session Node real path, the session
// CLI real path, cwd at the session repository root, no shell, no PATH or
// `.bin` lookup, environment passed explicitly. Resolves with the exact exit
// status and signal; rejects when the process cannot be launched at all or the
// bounded integrity set changes during the run.
export async function runVitest(session, args, options = {}) {
	const launch = prepareVitestLaunch(session, args, options);
	const spawnImpl = options.spawnImpl ?? spawn;
	return new Promise((resolve, reject) => {
		let child;
		try {
			child = spawnImpl(launch.execPath, launch.argv, {
				cwd: launch.cwd,
				env: options.env ?? process.env,
				shell: false,
				stdio: options.stdio ?? "inherit",
				windowsHide: true,
			});
		} catch (error) {
			reject(
				vitestRuntimeRuleError(
					"cli-launch",
					`could not launch the repository-local vitest CLI at ${launch.argv[0]}: ${error.message}`,
				),
			);
			return;
		}
		let settled = false;
		child.once("error", (error) => {
			if (settled) return;
			settled = true;
			reject(
				vitestRuntimeRuleError(
					"cli-launch",
					`could not launch the repository-local vitest CLI at ${launch.argv[0]}: ${error.message}`,
				),
			);
		});
		child.once("close", (status, signal) => {
			if (settled) return;
			settled = true;
			try {
				revalidateVitestRuntimeSession(session, "post-launch");
			} catch (error) {
				reject(
					vitestRuntimeRuleError(
						"post-launch-integrity",
						describePostLaunchFailure(status, signal, error),
					),
				);
				return;
			}
			resolve({
				argv: launch.argv,
				configByteLength: launch.config?.byteLength ?? null,
				configPath: launch.config?.path ?? null,
				configSha256: launch.config?.sha256 ?? null,
				execPath: launch.execPath,
				integrityDigest: session.integrity.digest,
				session,
				signal: signal ?? null,
				status,
			});
		});
	});
}

// Synchronous counterpart for the diagnostic `--version` path. Same session,
// pre-launch revalidation, and post-launch revalidation rules as `runVitest`.
export function runVitestSync(session, args, options = {}) {
	const launch = prepareVitestLaunch(session, args, options);
	const spawnSyncImpl = options.spawnSyncImpl ?? spawnSync;
	const result = spawnSyncImpl(launch.execPath, launch.argv, {
		cwd: launch.cwd,
		encoding: "utf8",
		env: options.env ?? process.env,
		shell: false,
		windowsHide: true,
	});
	if (result.error) {
		fail(
			"cli-launch",
			`could not launch the repository-local vitest CLI at ${launch.argv[0]}: ${result.error.message}`,
		);
	}
	try {
		revalidateVitestRuntimeSession(session, "post-launch");
	} catch (error) {
		fail(
			"post-launch-integrity",
			describePostLaunchFailure(result.status, result.signal, error),
		);
	}
	return {
		argv: launch.argv,
		configByteLength: launch.config?.byteLength ?? null,
		configPath: launch.config?.path ?? null,
		configSha256: launch.config?.sha256 ?? null,
		execPath: launch.execPath,
		integrityDigest: session.integrity.digest,
		session,
		signal: result.signal ?? null,
		status: result.status,
		stderr: result.stderr ?? "",
		stdout: result.stdout ?? "",
	};
}

// Human-readable provenance for one acquisition. Names what was observed and
// claims nothing outside the bounded set.
export function describeVitestRuntimeSession(session) {
	assertVitestRuntimeSession(session, "describeVitestRuntimeSession");
	const configHashes = session.configs
		.map(
			(config) =>
				`${config.path} ${INTEGRITY_ALGORITHM} ${config.sha256.slice(0, 12)}`,
		)
		.join(", ");
	const memberHashes = session.integrity.members
		.map((member) => `${member.id} ${member.sha256.slice(0, 8)}`)
		.join(", ");
	return [
		`Vitest runtime session: caller ${JSON.stringify(session.callerIdentity)}; vitest ${session.vitestVersion} manifest ${session.vitestManifestRealPath}; CLI ${session.vitestCliRealPath}; node ${session.nodeExecutableRealPath} (node-v${session.nodeVersion}); lockfile resolution ${session.lockfileResolution}; platform ${session.platform}-${session.arch};`,
		`config hashes ${configHashes}; bounded set ${INTEGRITY_ALGORITHM} ${session.integrity.digest} over ${session.integrity.members.length} members (${memberHashes});`,
		`this record describes only those listed files for this session's launches and is not an authentication, attestation, sandbox, dependency-safety, or same-image claim.`,
	].join(" ");
}

// Deprecated Stage-3 transition alias: returns a session, not the retired
// path-only descriptor. Entrypoints move to acquireVitestRuntimeSession.
export function resolveVitestRuntime(repositoryRoot) {
	return acquireVitestRuntimeSession(
		repositoryRoot,
		"legacy-resolve-vitest-runtime",
	);
}

export function formatVitestProvenance(session) {
	return describeVitestRuntimeSession(session);
}
