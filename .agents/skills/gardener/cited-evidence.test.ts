import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { assertTrackedTempCitations } from "../../../scripts/verify-repository.mjs";
import { checkoutFixture } from "./checkout-test-fixture.mjs";

const lostEvidencePath = "docs/agent-context/LOST_TEMP_EVIDENCE.tsv";

function writeLostEvidence(
	checkout: string,
	rows: Array<{ path: string; record: string; line: number; cause?: string }>,
) {
	const target = path.join(checkout, lostEvidencePath);
	mkdirSync(path.dirname(target), { recursive: true });
	writeFileSync(
		target,
		[
			"path\trecord\tline\tcause",
			...rows.map(
				(row) =>
					`${row.path}\t${row.record}\t${row.line}\t${row.cause ?? "cause not found"}`,
			),
			"",
		].join("\n"),
	);
}

function trackRemoteBranch(
	f: ReturnType<typeof checkoutFixture>,
	branch: string,
	trackedBranch: string,
) {
	f.git(["config", "remote.origin.url", "https://example.invalid/fitway.git"]);
	f.git([
		"config",
		"remote.origin.fetch",
		"+refs/heads/*:refs/remotes/origin/*",
	]);
	f.git(["config", `branch.${branch}.remote`, "origin"]);
	f.git(["config", `branch.${branch}.merge`, `refs/heads/${trackedBranch}`]);
}

function auditFiles(
	f: ReturnType<typeof checkoutFixture>,
	trackedFiles = ["PROJECT_STATE.yaml", "record.txt"],
) {
	return assertTrackedTempCitations({
		checkout: f.checkout,
		tempRoot: f.tempRoot,
		trackedFiles,
	});
}

function trackedBranchFixture() {
	const f = checkoutFixture("gardener-cited-evidence-");
	const missing = path.join(f.tempRoot, "gone", "target");
	writeFileSync(path.join(f.checkout, "record.txt"), `Held: \`${missing}\`\n`);
	f.commit();
	f.git(["update-ref", "refs/remotes/origin/integration", "HEAD"]);
	f.git(["checkout", "-b", "topic"]);
	trackRemoteBranch(f, "topic", "integration");
	return { f, missing };
}

describe("tracked temp citation audit", () => {
	it("fails a changed missing citation, accepts a marked loss, and names the record line", async () => {
		const f = checkoutFixture("gardener-cited-evidence-");
		try {
			writeFileSync(path.join(f.checkout, "record.txt"), "No evidence yet.\n");
			f.commit();
			const missing = path.join(f.tempRoot, "gone", "folder");
			writeFileSync(
				path.join(f.checkout, "record.txt"),
				`Evidence: \`${missing}\`\n`,
			);
			const trackedFiles = ["PROJECT_STATE.yaml", "record.txt"];
			await expect(
				assertTrackedTempCitations({
					checkout: f.checkout,
					tempRoot: f.tempRoot,
					trackedFiles,
				}),
			).rejects.toThrow(/record\.txt:1/);
			writeFileSync(
				path.join(f.checkout, "record.txt"),
				`Evidence: \`${missing}\` (gone: disposable fixture loss)\n`,
			);
			const audit = await assertTrackedTempCitations({
				checkout: f.checkout,
				tempRoot: f.tempRoot,
				trackedFiles,
			});
			expect(audit.dead).toEqual([]);
			console.log(
				"E3 PASS: changed missing citation failed at record.txt:1; same line with (gone: reason) passed",
			);
		} finally {
			f.dispose();
		}
	});

	it("counts an unchanged missing nested file from a .txt record without failing", async () => {
		const f = checkoutFixture("gardener-cited-evidence-");
		try {
			const missing = path.join(
				f.tempRoot,
				"existing-folder",
				"nested",
				"missing.log",
			);
			writeFileSync(
				path.join(f.checkout, "record.txt"),
				`Nested evidence: \`${missing}\`\n`,
			);
			f.commit();
			const audit = await assertTrackedTempCitations({
				checkout: f.checkout,
				tempRoot: f.tempRoot,
				trackedFiles: ["PROJECT_STATE.yaml", "record.txt"],
			});
			expect(audit.changed).toEqual([]);
			expect(audit.unchanged).toHaveLength(1);
			expect(audit.unchanged[0]).toMatchObject({
				line: 1,
				source: "record.txt",
			});
			expect(audit.unchanged[0].path.toLowerCase()).toBe(
				missing.replaceAll("\\", "/").toLowerCase(),
			);
			console.log(
				"E3 PASS: unchanged missing nested .txt citation counted=1, changed=0, no failure",
			);
		} finally {
			f.dispose();
		}
	});

	it("measures branch changes from the fork with its integration target", async () => {
		const { f, missing } = trackedBranchFixture();
		try {
			const held = await auditFiles(f);
			expect(held.base).toBe("origin/integration merge base");
			expect(held.changed).toEqual([]);
			expect(held.unchanged).toHaveLength(1);

			writeFileSync(
				path.join(f.checkout, "record.txt"),
				`Held: \`${missing}\`\nWritten: \`${missing}\`\n`,
			);
			await expect(auditFiles(f)).rejects.toThrow(/record\.txt:2/);
		} finally {
			f.dispose();
		}
	});

	it("does not count an origin/main rewrite made after the fork", async () => {
		const { f } = trackedBranchFixture();
		try {
			f.git(["checkout", "main"]);
			writeFileSync(
				path.join(f.checkout, "record.txt"),
				"Main replaced this line after the fork.\n",
			);
			f.commit();
			f.git(["checkout", "topic"]);

			const audit = await auditFiles(f);
			expect(audit.changed).toEqual([]);
			expect(audit.unchanged).toHaveLength(1);
		} finally {
			f.dispose();
		}
	});

	it("uses origin/main when a branch tracks its own remote copy", async () => {
		const f = checkoutFixture("gardener-cited-evidence-");
		try {
			const missing = path.join(f.tempRoot, "gone", "target");
			f.git(["checkout", "-b", "codex/owner-redesign-r04"]);
			writeFileSync(
				path.join(f.checkout, "record.txt"),
				`Pushed: \`${missing}\`\n`,
			);
			f.git(["add", "--all"]);
			f.git(["commit", "-qm", "branch citation"]);
			f.git([
				"update-ref",
				"refs/remotes/origin/codex/owner-redesign-r04",
				"HEAD",
			]);
			trackRemoteBranch(
				f,
				"codex/owner-redesign-r04",
				"codex/owner-redesign-r04",
			);
			await expect(auditFiles(f)).rejects.toThrow(
				/origin\/main.*record\.txt:1/s,
			);
		} finally {
			f.dispose();
		}
	});

	it("accepts one listed changed citation per path and record", async () => {
		const f = checkoutFixture("gardener-cited-evidence-");
		try {
			const missing = path.join(f.tempRoot, "gone", "target");
			const listedPath = missing.replaceAll("\\", "/").toLowerCase();
			writeFileSync(path.join(f.checkout, "record.txt"), "No evidence yet.\n");
			writeFileSync(path.join(f.checkout, "other.txt"), "No evidence yet.\n");
			f.commit();
			writeFileSync(
				path.join(f.checkout, "record.txt"),
				`Evidence: \`${missing}\`\n`,
			);
			writeLostEvidence(f.checkout, [
				{ path: listedPath, record: "record.txt", line: 1 },
			]);
			const trackedFiles = [
				"PROJECT_STATE.yaml",
				"record.txt",
				lostEvidencePath,
			];
			const listed = await auditFiles(f, trackedFiles);
			expect(listed.listed).toHaveLength(1);
			expect(listed.changed).toEqual([]);

			writeFileSync(
				path.join(f.checkout, "record.txt"),
				`Evidence: \`${missing}\`\nAgain: \`${missing}\`\n`,
			);
			await expect(auditFiles(f, trackedFiles)).rejects.toThrow(
				/record\.txt:2/,
			);

			writeFileSync(
				path.join(f.checkout, "record.txt"),
				`Evidence: \`${missing}\`\n`,
			);
			writeFileSync(
				path.join(f.checkout, "other.txt"),
				`Other evidence: \`${missing}\`\n`,
			);
			await expect(
				auditFiles(f, [
					"PROJECT_STATE.yaml",
					"record.txt",
					"other.txt",
					lostEvidencePath,
				]),
			).rejects.toThrow(/other\.txt:1/);
		} finally {
			f.dispose();
		}
	});

	it("leaves a listed citation on an unchanged line out of the unchanged count", async () => {
		const f = checkoutFixture("gardener-cited-evidence-");
		try {
			const listedMissing = path.join(f.tempRoot, "gone", "listed");
			const unlistedMissing = path.join(f.tempRoot, "gone", "unlisted");
			const listedPath = listedMissing.replaceAll("\\", "/").toLowerCase();
			const trackedFiles = [
				"PROJECT_STATE.yaml",
				"record.txt",
				lostEvidencePath,
			];
			writeFileSync(
				path.join(f.checkout, "record.txt"),
				`Listed: \`${listedMissing}\`\n`,
			);
			writeLostEvidence(f.checkout, [
				{ path: listedPath, record: "record.txt", line: 1 },
			]);
			f.commit();
			const listedOnly = await auditFiles(f, trackedFiles);
			expect(listedOnly.listed).toHaveLength(1);
			expect(listedOnly.changed).toEqual([]);
			expect(listedOnly.unchanged).toEqual([]);

			writeFileSync(
				path.join(f.checkout, "record.txt"),
				`Listed: \`${listedMissing}\`\nUnlisted: \`${unlistedMissing}\`\n`,
			);
			f.commit();
			const beside = await auditFiles(f, trackedFiles);
			expect(beside.listed).toHaveLength(1);
			expect(beside.changed).toEqual([]);
			expect(beside.unchanged).toHaveLength(1);
			expect(beside.unchanged[0]).toMatchObject({
				line: 2,
				source: "record.txt",
			});
			expect(beside.unchanged[0].path.toLowerCase()).toBe(
				unlistedMissing.replaceAll("\\", "/").toLowerCase(),
			);
		} finally {
			f.dispose();
		}
	});

	it("rejects a returned listed path and a row whose record dropped it", async () => {
		const f = checkoutFixture("gardener-cited-evidence-");
		try {
			const returned = path.join(f.tempRoot, "returned", "target");
			const listedPath = returned.replaceAll("\\", "/").toLowerCase();
			mkdirSync(path.dirname(returned), { recursive: true });
			writeFileSync(returned, "back\n");
			writeFileSync(
				path.join(f.checkout, "record.txt"),
				`Evidence: \`${returned}\`\n`,
			);
			writeLostEvidence(f.checkout, [
				{ path: listedPath, record: "record.txt", line: 1 },
			]);
			await expect(
				auditFiles(f, ["PROJECT_STATE.yaml", "record.txt", lostEvidencePath]),
			).rejects.toThrow(
				new RegExp(`${lostEvidencePath.replaceAll(".", "\\.")}:2`),
			);

			writeFileSync(
				path.join(f.checkout, "record.txt"),
				"The citation was removed.\n",
			);
			rmSync(f.tempRoot, { recursive: true, force: true });
			await expect(
				auditFiles(f, ["PROJECT_STATE.yaml", "record.txt", lostEvidencePath]),
			).rejects.toThrow(/LOST_TEMP_EVIDENCE\.tsv:2/);
		} finally {
			f.dispose();
		}
	});

	it.each([
		["malformed row", "path\trecord\n"],
		[
			"unknown cause",
			"d:/fitway-temp/gone/record.txt\trecord.txt\t1\tinvented cause\n",
		],
	])("rejects a %s in the lost-evidence list", async (_name, row) => {
		const f = checkoutFixture("gardener-cited-evidence-");
		try {
			mkdirSync(path.dirname(path.join(f.checkout, lostEvidencePath)), {
				recursive: true,
			});
			writeFileSync(
				path.join(f.checkout, lostEvidencePath),
				`path\trecord\tline\tcause\n${row}`,
			);
			await expect(auditFiles(f)).rejects.toThrow(/LOST_TEMP_EVIDENCE\.tsv:2/);
		} finally {
			f.dispose();
		}
	});
});
