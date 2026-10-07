import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import {
	fixture,
	HANDOFF,
	MARKED,
	MILESTONE,
	NOW,
	PACKET,
	put,
} from "./fixtures";
import {
	createResumePoint,
	localTimestamp,
	parseHandoffArgs,
	replaceYamlScalars,
} from "./new-handoff.mjs";
import { validateResumePoint } from "./resume-point.mjs";

const roots: string[] = [];
const script = fileURLToPath(new URL("./new-handoff.mjs", import.meta.url));
afterEach(() => {
	for (const root of roots.splice(0))
		rmSync(root, { recursive: true, force: true });
});
const target = `docs/phase-records/handoffs/fixture/${MILESTONE}-resume.md`;
function options(root: string) {
	return {
		repositoryRoot: root,
		milestoneId: MILESTONE,
		now: NOW,
		git: (_root: string, args: string[]) =>
			args[0] === "symbolic-ref"
				? "feature/resume"
				: args[0] === "rev-list"
					? "0"
					: args.includes("--short")
						? "abc1234"
						: "origin/main",
	};
}
function bytes(root: string, file: string) {
	return readFileSync(path.join(root, file));
}
function snapshot(root: string) {
	return [
		bytes(root, "PROJECT_STATE.yaml"),
		bytes(root, PACKET),
		bytes(root, HANDOFF),
	];
}

describe("M4: one resume file and one ledger pointer", () => {
	it("creates the stable file from the template, changing only the ledger handoff scalar", async () => {
		const { root, state } = fixture(roots, true);
		const before = snapshot(root);
		const result = await createResumePoint(options(root));
		expect(result.newPath).toBe(target);
		expect(bytes(root, "PROJECT_STATE.yaml").toString()).toBe(
			state.replace(`'${HANDOFF}'`, `'${target}'`),
		);
		expect(bytes(root, PACKET)).toEqual(before[1]);
		expect(bytes(root, HANDOFF)).toEqual(before[2]);
		const text = bytes(root, target).toString();
		expect(text).toContain(`# ${MILESTONE}: resume point`);
		expect(text).not.toContain("Previous resume point");
		expect(text).toContain(
			`- **As of:** \`feature/resume\` at \`abc1234\`, ${localTimestamp(new Date(NOW)).label}`,
		);
		await expect(
			validateResumePoint({
				repositoryRoot: root,
				handoffPath: target,
				bytes: bytes(root, target),
			}),
		).rejects.toThrow(/template placeholder/);
	});
	it.each([
		"\n",
		"\r\n",
	])("preserves every existing byte except As of, including Unicode and old header, with %j", async (newline) => {
		const { root } = fixture(roots);
		const original =
			`${MARKED}\nExtra user text: \u0643\u0645\u0644 <milestone-id>\n`
				.replace(/\r?\n/g, newline)
				.replace(
					"- **Standing decisions:**",
					"- **Previous resume point:** `gone/previous.md`" +
						newline +
						"- **Standing decisions:**",
				);
		put(root, target, original);
		// Existing resume files never need the template.
		rmSync(path.join(root, "docs/agent-context/HANDOFF_TEMPLATE.md"));
		const result = await createResumePoint(options(root));
		const expected = original.replace(
			/^- \*\*As of:\*\*[^\r\n]*/m,
			`- **As of:** \`feature/resume\` at \`abc1234\`, ${localTimestamp(new Date(NOW)).label}`,
		);
		expect(bytes(root, target)).toEqual(Buffer.from(expected));
		expect(result.output).toContain(`Updated resume point: ${target}`);
		const state = bytes(root, "PROJECT_STATE.yaml");
		await createResumePoint({
			...options(root),
			now: "2026-10-03T20:40:12+03:00",
		});
		expect(bytes(root, "PROJECT_STATE.yaml")).toEqual(state);
		expect(parseYaml(state.toString()).milestones[MILESTONE].handoff).toBe(
			target,
		);
	});
	it("M2: creates a resume without heartbeat, expiry, pin or ledger task class", async () => {
		const { root, state } = fixture(roots);
		const minimal = state.replace(
			/^ {4}(taskClass|taskPacketSha256|lastHeartbeatAt|leaseExpiresAt):[^\r\n]*\r?\n/gm,
			"",
		);
		put(root, "PROJECT_STATE.yaml", minimal);
		await createResumePoint(options(root));
		expect(bytes(root, "PROJECT_STATE.yaml").toString()).toBe(
			minimal.replace(`'${HANDOFF}'`, `'${target}'`),
		);
	});
	it.each([
		"#round",
		"docs/run #1",
		"[round]",
		".",
	])("uses --dir %s and changes no packet bytes", async (directory) => {
		const { root } = fixture(roots);
		const packet = bytes(root, PACKET);
		const result = await createResumePoint({ ...options(root), directory });
		expect(result.newPath).toBe(
			path.posix.join(directory, `${MILESTONE}-resume.md`),
		);
		expect(bytes(root, PACKET)).toEqual(packet);
		expect(
			parseYaml(bytes(root, "PROJECT_STATE.yaml").toString()).milestones[
				MILESTONE
			].handoff,
		).toBe(result.newPath);
	});
	it.each([
		false,
		true,
	])("rolls back resume and ledger on a failed ledger write, existing=%s", async (existing) => {
		const { root } = fixture(roots);
		if (existing) put(root, target, MARKED);
		const before = snapshot(root);
		const original = existing ? bytes(root, target) : null;
		await expect(
			createResumePoint({
				...options(root),
				writeFileImpl: async (
					file: string,
					content: string,
					config?: { flag: string },
				) => {
					if (path.basename(file) === "PROJECT_STATE.yaml")
						throw new Error("Persistent state failure");
					return writeFile(file, content, config);
				},
			}),
		).rejects.toThrow("Persistent state failure");
		expect(snapshot(root)).toEqual(before);
		if (original) expect(bytes(root, target)).toEqual(original);
		else expect(existsSync(path.join(root, target))).toBe(false);
	});
	it("restores a partially written ledger and original resume", async () => {
		const { root } = fixture(roots);
		put(root, target, MARKED);
		const before = snapshot(root);
		let failed = false;
		await expect(
			createResumePoint({
				...options(root),
				writeFileImpl: async (
					file: string,
					content: string,
					config?: { flag: string },
				) => {
					if (path.basename(file) === "PROJECT_STATE.yaml" && !failed) {
						failed = true;
						await writeFile(file, "partial");
						throw new Error("Partial write");
					}
					return writeFile(file, content, config);
				},
			}),
		).rejects.toThrow("Partial write");
		expect(snapshot(root)).toEqual(before);
		expect(bytes(root, target).toString()).toBe(MARKED);
	});
	it("fails before writes on malformed existing As of headers", async () => {
		const { root } = fixture(roots);
		put(root, target, "User content without a header\n");
		const before = snapshot(root);
		await expect(createResumePoint(options(root))).rejects.toThrow(
			/requires one As of header/,
		);
		expect(bytes(root, target).toString()).toBe(
			"User content without a header\n",
		);
		expect(snapshot(root)).toEqual(before);
	});
	it("detects a concurrent ledger edit without overwriting it", async () => {
		const { root, state } = fixture(roots);
		const updated = `${state}# Concurrent coordinator edit\r\n`;
		await expect(
			createResumePoint({
				...options(root),
				git: (cwd: string, args: string[]) => {
					if (args[0] === "symbolic-ref")
						put(root, "PROJECT_STATE.yaml", updated);
					return options(root).git(cwd, args);
				},
			}),
		).rejects.toThrow(/State or resume point changed/);
		expect(bytes(root, "PROJECT_STATE.yaml").toString()).toBe(updated);
		expect(existsSync(path.join(root, target))).toBe(false);
	});
	it("keeps a competing exclusive-create file on failure", async () => {
		const { root } = fixture(roots);
		const before = snapshot(root);
		await expect(
			createResumePoint({
				...options(root),
				writeFileImpl: async (
					file: string,
					content: string,
					config?: { flag: string },
				) => {
					put(root, target, "Competing file\n");
					return writeFile(file, content, config);
				},
			}),
		).rejects.toThrow();
		expect(bytes(root, target).toString()).toBe("Competing file\n");
		expect(snapshot(root)).toEqual(before);
	});
	it("rejects detached HEAD and unexpected git failures before writes", async () => {
		for (const status of [1, 128]) {
			const { root } = fixture(roots);
			const before = snapshot(root);
			const failure = Object.assign(new Error("git failed"), { status });
			await expect(
				createResumePoint({
					...options(root),
					git: () => {
						throw failure;
					},
				}),
			).rejects.toThrow(
				status === 1 ? /branch must be checked out/ : /git failed/,
			);
			expect(snapshot(root)).toEqual(before);
			expect(existsSync(path.join(root, target))).toBe(false);
		}
	});
	it("CLI help describes the stable file and has no lease option", () => {
		const result = spawnSync(process.execPath, [script, "--help"], {
			encoding: "utf8",
			windowsHide: true,
		});
		expect(result.status).toBe(0);
		expect(result.stdout).toContain("writes <milestone-id>-resume.md");
		expect(result.stdout).not.toContain("lease-hours");
	});
	it.each([
		"--lease-hours",
		"--slug",
		"--unknown",
	])("rejects obsolete or unknown option %s", (option) => {
		expect(() => parseHandoffArgs([option, "3"])).toThrow(/Unknown argument/);
	});
	it.each(
		[
			[],
			["--milestone"],
			["--milestone", "bad ID"],
			["--milestone", MILESTONE, "--now", "2026-02-30T00:00:00Z"],
			["--milestone", MILESTONE, "--dir", "../outside"],
		].map((args) => ({ args })),
	)("invalid arguments do not write %j", async ({ args }) => {
		const { root } = fixture(roots);
		const before = snapshot(root);
		const result = spawnSync(process.execPath, [script, ...args], {
			cwd: root,
			encoding: "utf8",
			windowsHide: true,
		});
		expect(result.status).toBe(1);
		expect(snapshot(root)).toEqual(before);
		expect(existsSync(path.join(root, target))).toBe(false);
	});
	it("scalar patching preserves quotes, comments, Unicode and CRLF", () => {
		const text =
			"plain: old # keep\r\nsingle: 'old'\r\ndouble: \"old\" # \u0643\u0645\u0644\r\n";
		expect(
			replaceYamlScalars(
				text,
				[
					[["plain"], "#new"],
					[["single"], "it's new"],
					[["double"], "new"],
				],
				"fixture",
			),
		).toBe(
			"plain: \"#new\" # keep\r\nsingle: 'it''s new'\r\ndouble: \"new\" # \u0643\u0645\u0644\r\n",
		);
	});
});
