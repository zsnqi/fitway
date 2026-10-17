import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";

function shortWindowsPath(value) {
	const result = spawnSync(
		"powershell.exe",
		[
			"-NoProfile",
			"-Command",
			"(New-Object -ComObject Scripting.FileSystemObject).GetFolder($env:FITWAY_SHORT_PATH).ShortPath",
		],
		{
			encoding: "utf8",
			env: { ...process.env, FITWAY_SHORT_PATH: value },
			windowsHide: true,
		},
	);
	if (result.error) throw result.error;
	if (result.status !== 0)
		throw new Error(`short path lookup failed: ${result.stderr}`);
	return result.stdout.trim();
}

export function firstShortWindowsPath() {
	const drives = [];
	for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
		const drive = `${letter}:/`;
		try {
			readdirSync(drive);
			drives.push(drive);
		} catch {
			// A missing or unavailable drive is not a short-name candidate.
		}
	}
	for (const drive of drives) {
		let entries;
		try {
			entries = readdirSync(drive, { withFileTypes: true });
		} catch {
			continue;
		}
		for (const entry of entries) {
			if (!entry.isDirectory()) continue;
			const long = path.join(drive, entry.name);
			try {
				const short = shortWindowsPath(long);
				if (short.includes("~")) return { drives, long, short };
			} catch {
				// Some system folders reject a short-name lookup.
			}
		}
	}
	return { drives };
}
