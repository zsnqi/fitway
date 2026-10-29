import {
	copyFileSync,
	existsSync,
	mkdirSync,
	readFileSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { repositoryRoot, sha256 } from "./codex-environment.mjs";
import { readGit } from "./git-context.mjs";
import { beginToolCommand } from "./tool-contract.mjs";

export function defaultRunFolderRoot() {
	return process.platform === "win32" ? "D:/fitway-temp" : tmpdir();
}

function validName(name) {
	return (
		typeof name === "string" &&
		name.length > 0 &&
		name !== "." &&
		name !== ".." &&
		path.basename(name) === name &&
		/[<>:"|?*\0]/.test(name) === false
	);
}

export function createRunFolder({
	name,
	brief,
	for: owner,
	report = "REPORT.md",
	root = repositoryRoot,
	tempRoot = process.env.FITWAY_TEMP_ROOT ?? defaultRunFolderRoot(),
	now = () => new Date(),
} = {}) {
	if (!validName(name))
		throw new Error(`run folder name must be one path segment: ${name}`);
	if (typeof owner !== "string" || !owner.trim())
		throw new Error("--for must name who creates the run folder");
	const repository = path.resolve(root);
	const briefPath = path.resolve(repository, brief);
	let briefDetails;
	try {
		briefDetails = statSync(briefPath);
	} catch (error) {
		if (error.code === "ENOENT") throw new Error(`brief not found: ${brief}`);
		throw error;
	}
	if (!briefDetails.isFile())
		throw new Error(`brief is not a file: ${briefPath}`);
	const folder = path.resolve(tempRoot, name);
	if (existsSync(folder))
		throw new Error(`run folder already exists: ${folder}`);
	const briefBytes = readFileSync(briefPath);
	const branch = readGit(repository, ["rev-parse", "--abbrev-ref", "HEAD"]);
	const commit = readGit(repository, ["rev-parse", "HEAD"]);
	const reportPath = path.resolve(folder, report);
	const manifest = {
		version: 1,
		worktree: repository,
		commit,
		branch,
		createdAt: now().toISOString(),
		for: owner.trim(),
		briefPath: briefPath.replaceAll("\\", "/"),
		briefSha256: sha256(briefBytes),
		report: reportPath,
	};
	mkdirSync(path.dirname(folder), { recursive: true });
	mkdirSync(folder, { recursive: false });
	copyFileSync(briefPath, path.join(folder, "BRIEF.md"));
	writeFileSync(
		path.join(folder, "manifest.json"),
		`${JSON.stringify(manifest, null, 2)}\n`,
		{ flag: "wx" },
	);
	return { folder, manifest };
}

export function runFolderOptions(parsed) {
	return {
		name: parsed.positionals[0],
		brief: parsed.options?.brief,
		for: parsed.options?.for,
		report: parsed.options?.report,
	};
}

function main(options) {
	const result = createRunFolder(options);
	console.log(`Run folder: ${result.folder}`);
	console.log(`Report: ${result.manifest.report}`);
}

if (
	process.argv[1] &&
	path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
	try {
		main(
			runFolderOptions(
				beginToolCommand("run-folder:new", process.argv.slice(2)),
			),
		);
	} catch (error) {
		console.error(`run-folder:new: FAIL: ${error.message}`);
		process.exitCode = 1;
	}
}
