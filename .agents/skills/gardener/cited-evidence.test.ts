import { writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { assertTrackedTempCitations } from "../../../scripts/verify-repository.mjs";
import { evidenceFixture } from "./evidence-test-fixture.mjs";

describe("tracked temp citation audit", () => {
	it("fails a changed missing citation, accepts a marked loss, and names the record line", async () => {
		const f = evidenceFixture("gardener-cited-evidence-");
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
		const f = evidenceFixture("gardener-cited-evidence-");
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
});
