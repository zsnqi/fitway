import { execFileSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	utimesSync,
	writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { cleanup } from "./cleanup.mjs";
import { references } from "./facts.mjs";
import * as survey from "./survey.mjs";

describe("gardener round 16c repair", () => {
	it.each([
		"NN-<state>-<ar|en>.png",
		"NN-*.png",
		"NN-?.png",
		"NN-{state}-{ar,en}.png",
	])("R8: %s protects complete segments before its patterned segment", async (pattern) => {
		const tempRoot = "D:/fitway-temp";
		const spellings = [
			`D:/fitway-temp/owner-r04-k02/out/sheets/${pattern}`,
			`D:\\FITWAY-TEMP\\OWNER-R04-K02\\out\\sheets\\${pattern}`,
			`/d/fitway-temp/owner-r04-k02/out/sheets/${pattern}`,
			`fitway-temp/owner-r04-k02/out/sheets/${pattern}`,
		];
		for (const spelling of spellings) {
			const records = [
				{ source: "closed.md", text: `# Evidence\nKeep \`${spelling}\`` },
			];
			const cached = await survey.collectFolderRecords(records, {
				trackedFiles: [],
				tempRoot,
			});
			for (const sources of [records, cached]) {
				for (const folder of [
					"owner-r04-k02",
					"owner-r04-k02/out/sheets",
					"owner-r04-k02/out/sheets/child",
				])
					expect(
						references(`${tempRoot}/${folder}`, sources, { tempRoot }),
					).toEqual([
						expect.objectContaining({
							source: "closed.md",
							line: 2,
							text: `Keep \`${spelling.replaceAll("\\", "/")}\``,
						}),
					]);
				for (const folder of [
					"owner-r04-k02-other",
					"owner-r04-k02/out/sheets-other",
					"uncited",
				])
					expect(
						references(`${tempRoot}/${folder}`, sources, { tempRoot }),
					).toEqual([]);
			}
		}
		console.log(
			`R8 PROOF: ${pattern} protects only complete prefix segments, with source/line; all spellings and cached citations agree`,
		);
	});

	it("R8: placeholders in the first segment below the root protect no folder", async () => {
		const tempRoot = "D:/fitway-temp/nested";
		const patterns = ["<run>", "verify-fitway-*", "run?", "{run}"];
		const records = patterns.map((pattern, index) => ({
			source: `template-${index}.md`,
			text: `Work in \`${tempRoot}/${pattern}/out/report.md\`; also ${tempRoot}/${pattern}`,
		}));
		const cached = await survey.collectFolderRecords(records, {
			trackedFiles: [],
			tempRoot,
		});
		for (const sources of [records, cached]) {
			for (const folder of [
				"run",
				"verify-fitway-",
				"verify-fitway-one",
				"uncited",
				"run/child",
			])
				expect(
					references(`${tempRoot}/${folder}`, sources, { tempRoot }),
				).toEqual([]);
		}
		console.log(
			"R8 PROOF: <run>, verify-fitway-*, ?, and {run} in first segment protect nothing under a custom root",
		);
	});

	it("R8: only patterned prefixes below the root qualify; quotes, prose and proposal rules hold", () => {
		const tempRoot = "D:/fitway-temp";
		const records = [
			{
				source: "evidence.md",
				text: [
					"Evidence <D:/fitway-temp/keep/out/NN-<state>.png>",
					"Evidence `D:/fitway-temp/space folder/out/{state}.png`",
					"Evidence D:/fitway-temp/unquoted/out/NN-*.png",
					"Evidence D:/fitway-temp/partial-<run>/out/report.md",
					"Root D:/fitway-temp/<run>/; drive D:/*; above D:/<temp>/keep",
					"Evidence **D:/fitway-temp/bold/out/*.png**",
					"Prose keep unquoted uncited.",
				].join("\n"),
			},
			{
				source: ".agents/skills/gardener/REPORT.md",
				text: "## Folder removal proposals\n- `D:/fitway-temp/proposed/out/*.png`\n## Evidence\nKeep D:/fitway-temp/recorded/out/?.png\n",
			},
		];
		for (const [folder, source, line] of [
			["keep", "evidence.md", 1],
			["space folder", "evidence.md", 2],
			["unquoted", "evidence.md", 3],
			["bold", "evidence.md", 6],
			["recorded", ".agents/skills/gardener/REPORT.md", 4],
		] as const)
			expect(
				references(`${tempRoot}/${folder}`, records, { tempRoot }),
			).toEqual([expect.objectContaining({ source, line })]);
		for (const folder of ["partial-", "partial-one", "proposed", "uncited"])
			expect(
				references(`${tempRoot}/${folder}`, records, { tempRoot }),
			).toEqual([]);
		console.log(
			"R8 PROOF: quoted/unquoted/angle-wrapped evidence protects named prefixes; partial folder names, roots, prose and proposals do not",
		);
	});

	it("R8: tracked patterned evidence is withheld by survey and by fresh cleanup citations", async () => {
		const base = path.resolve(process.env.GARDENER_TEST_RUN ?? os.tmpdir());
		mkdirSync(base, { recursive: true });
		const run = mkdtempSync(path.join(base, "gardener-round16c-"));
		const checkout = path.join(run, "checkout");
		const tempRoot = path.join(run, "temp");
		mkdirSync(checkout);
		mkdirSync(tempRoot);
		const git = (args: string[]) =>
			execFileSync("git", args, {
				cwd: checkout,
				encoding: "utf8",
				windowsHide: true,
			});
		const previousExit = process.exitCode;
		try {
			git(["init", "--initial-branch=main"]);
			git(["config", "core.autocrlf", "false"]);
			writeFileSync(
				path.join(checkout, "PROJECT_STATE.yaml"),
				"milestones: {}\n",
			);
			writeFileSync(
				path.join(checkout, "closed.md"),
				`# Evidence\nKeep ${tempRoot}/keep/out/NN-<state>-<ar|en>.png\nTemplate ${tempRoot}/<run>/out/*.png\n`,
			);
			git(["add", "."]);
			git([
				"-c",
				"user.name=Gardener fixture",
				"-c",
				"user.email=gardener@example.test",
				"commit",
				"-m",
				"fixture",
			]);
			git(["update-ref", "refs/remotes/origin/main", "HEAD"]);
			for (const name of ["keep", "late", "uncited"]) {
				const folder = path.join(tempRoot, name);
				mkdirSync(folder);
				writeFileSync(path.join(folder, "sentinel.txt"), "evidence\n");
				const old = new Date(Date.now() - 9 * 86400000);
				for (const target of [path.join(folder, "sentinel.txt"), folder])
					utimesSync(target, old, old);
			}
			const context = await survey.collectRecords({ checkout });
			const folders = await survey.collectFolders(
				context.records,
				[],
				path.join(tempRoot, "out"),
				tempRoot,
				{ checkout },
			);
			expect(
				folders
					.filter((folder) => folder.candidate)
					.map((folder) => path.basename(folder.path))
					.sort(),
			).toEqual(["late", "uncited"]);
			expect(
				folders.find((folder) => path.basename(folder.path) === "keep")
					.protectedBy,
			).toEqual([expect.objectContaining({ source: "closed.md", line: 2 })]);
			writeFileSync(
				path.join(checkout, "late.md"),
				`# Newly tracked\nKeep ${tempRoot}/late/out/{state}.png\n`,
			);
			git(["add", "late.md"]);
			const errors = vi.spyOn(console, "error").mockImplementation(() => {});
			const logs = vi.spyOn(console, "log").mockImplementation(() => {});
			await cleanup(
				{
					root: checkout,
					tempRoot,
					records: context.records,
					folders: folders.filter(
						(folder) => path.basename(folder.path) === "late",
					),
				},
				{ checkout },
			);
			expect(errors.mock.calls.flat().join("\n")).toContain(
				"Folder cited by late.md:2",
			);
			expect(logs.mock.calls.flat().join("\n")).toContain(
				"CLEANUP FAIL: 1 proposed folders, 1 failures",
			);
			for (const name of ["keep", "late", "uncited"])
				expect(
					readFileSync(path.join(tempRoot, name, "sentinel.txt"), "utf8"),
				).toBe("evidence\n");
			expect(existsSync(path.join(tempRoot, "late"))).toBe(true);
			vi.restoreAllMocks();
			console.log(
				"R8 PROOF: survey withholds tracked closed.md:2 pattern; cleanup keeps newly tracked late.md:2 pattern and all sentinels survive",
			);
		} finally {
			vi.restoreAllMocks();
			process.exitCode = previousExit;
			expect(path.dirname(run)).toBe(base);
			expect(path.basename(run)).toMatch(/^gardener-round16c-/);
			rmSync(run, { recursive: true, force: true });
		}
	}, 60000);
});
