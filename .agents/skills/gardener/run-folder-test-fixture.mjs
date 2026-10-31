// Test fixture: writes the provenance record a run folder carries (manifest, run or review).
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import path from "node:path";

export function sha256(bytes) {
	return createHash("sha256").update(bytes).digest("hex");
}

// `kind` is "manifest" (with BRIEF.md), "run", or "review" (with brief.md); `commit` is the held
// commit the record names. Returns the brief's sha256.
export function writeProvenance(folder, kind, commit = "") {
	const brief = "brief\n";
	const hash = sha256(brief);
	const report = path.join(folder, "REPORT.md");
	const heldCommit = commit.trim();
	if (kind === "manifest") {
		writeFileSync(path.join(folder, "BRIEF.md"), brief);
		writeFileSync(
			path.join(folder, "manifest.json"),
			JSON.stringify({
				version: 1,
				for: "fixture",
				briefSha256: hash,
				commit: heldCommit,
				report,
			}),
		);
	}
	if (kind === "run") {
		writeFileSync(
			path.join(folder, "run.json"),
			JSON.stringify({
				version: 1,
				briefSha256: hash,
				head: heldCommit,
				report,
			}),
		);
	}
	if (kind === "review") {
		writeFileSync(path.join(folder, "brief.md"), brief);
		writeFileSync(
			path.join(folder, "review.json"),
			JSON.stringify({ sha256: hash, status: "running" }),
		);
	}
	return hash;
}
