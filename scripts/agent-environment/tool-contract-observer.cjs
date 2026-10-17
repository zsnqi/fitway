const childProcess = require("node:child_process");
const fs = require("node:fs");

const logPath = process.env.FITWAY_TOOL_CONTRACT_LOG;
if (logPath) {
	const append = fs.appendFileSync;
	const record = (event) => {
		append(logPath, `${JSON.stringify(event)}\n`, "utf8");
	};
	const selectedPath = (value) => {
		if (typeof value === "number") return null;
		const resolved = String(value);
		return resolved === logPath ? null : resolved;
	};
	const recordWrite = (operation, value) => {
		const file = selectedPath(value);
		if (file) record({ kind: "file", operation, path: file });
	};
	const recordProcess = (operation, command) => {
		record({ kind: "process", operation, command: String(command) });
	};

	for (const name of [
		"spawn",
		"spawnSync",
		"exec",
		"execSync",
		"execFile",
		"execFileSync",
		"fork",
	]) {
		const original = childProcess[name];
		childProcess[name] = function observedChildProcess(...args) {
			const first = args[0];
			recordProcess(
				name,
				typeof first === "string"
					? first
					: (first?.command ?? process.execPath),
			);
			return original.apply(this, args);
		};
	}

	const onePath = [
		"appendFile",
		"appendFileSync",
		"chmod",
		"chmodSync",
		"chown",
		"chownSync",
		"mkdir",
		"mkdirSync",
		"mkdtemp",
		"mkdtempSync",
		"rm",
		"rmSync",
		"rmdir",
		"rmdirSync",
		"truncate",
		"truncateSync",
		"unlink",
		"unlinkSync",
		"utimes",
		"utimesSync",
		"writeFile",
		"writeFileSync",
	];
	const twoPaths = [
		"copyFile",
		"copyFileSync",
		"cp",
		"cpSync",
		"link",
		"linkSync",
		"rename",
		"renameSync",
		"symlink",
		"symlinkSync",
	];
	const open = ["open", "openSync"];
	const stream = ["createWriteStream"];
	const patch = (target, names, handler) => {
		for (const name of names) {
			const original = target[name];
			if (typeof original !== "function") continue;
			target[name] = function observedFileOperation(...args) {
				handler(name, args);
				return original.apply(this, args);
			};
		}
	};
	const handler = (name, args) => {
		if (open.includes(name)) {
			const flags = String(args[1] ?? "");
			if (/[wa+x]/.test(flags)) recordWrite(name, args[0]);
			return;
		}
		recordWrite(name, args[0]);
		if (twoPaths.includes(name)) recordWrite(name, args[1]);
	};
	patch(fs, onePath, handler);
	patch(fs, twoPaths, handler);
	patch(fs, open, handler);
	patch(fs, stream, handler);
	patch(fs.promises, onePath, handler);
	patch(fs.promises, twoPaths, handler);
	patch(fs.promises, open, handler);
}
