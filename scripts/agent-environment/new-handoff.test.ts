import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import {
	fixture,
	git,
	gitFixture,
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

describe("O4: coordinator handoff creation without unrelated byte changes", () => {
	it("S1: CLI usage documents the canonical resume-point filename", () => {
		const result = spawnSync(process.execPath, [script, "--help"], {
			encoding: "utf8",
			windowsHide: true,
		});
		expect(result.status, result.stderr).toBe(0);
		expect(result.stdout.trim().split(/\r?\n/)).toHaveLength(1);
		expect(result.stdout).toContain(
			"writes <YYYYMMDD-HHMMSS>-<milestone-id>-resume.md",
		);
		expect(result.stdout).not.toContain("--slug");
	});
	it.each([
		"resume",
		"coordinator-resume",
		"resume-activation",
	])("S1: CLI rejects the former --slug option %s without writes", (slug) => {
		const { root } = fixture(roots);
		const before = snapshot(root);
		const result = spawnSync(
			process.execPath,
			[script, "--milestone", MILESTONE, "--slug", slug, "--now", NOW],
			{ cwd: root, encoding: "utf8", windowsHide: true },
		);
		expect(result.status).toBe(1);
		expect(result.stdout).toBe("");
		expect(result.stderr.trim()).toBe(
			"handoff:new FAILED: Unknown argument: --slug",
		);
		expect(snapshot(root)).toEqual(before);
		expect(readdirSync(path.join(root, path.dirname(HANDOFF)))).toEqual([
			"old.md",
		]);
	});
	it("S2: a newly generated template must be completed before validation", async () => {
		const { root } = fixture(roots);
		const result = await createResumePoint(options(root));
		await expect(
			validateResumePoint({
				repositoryRoot: root,
				handoffPath: result.newPath,
				bytes: bytes(root, result.newPath),
			}),
		).rejects.toThrow(/line 6:.*template placeholder/);
	});
	it("S4: preserves Git failures unrelated to detached HEAD without writes", async () => {
		const { root } = fixture(roots);
		const before = snapshot(root);
		const failure = Object.assign(new Error("Git unavailable"), {
			status: 128,
		});
		await expect(
			createResumePoint({
				...options(root),
				git: () => {
					throw failure;
				},
			}),
		).rejects.toBe(failure);
		expect(snapshot(root)).toEqual(before);
		expect(readdirSync(path.join(root, path.dirname(HANDOFF)))).toEqual([
			"old.md",
		]);
	});
	it("S4: detached HEAD exits non-zero with one branch-checkout instruction and no writes", () => {
		const { root } = fixture(roots);
		gitFixture(root);
		git(root, "checkout", "--detach");
		const before = snapshot(root);
		const result = spawnSync(
			process.execPath,
			[script, "--milestone", MILESTONE, "--now", NOW],
			{ cwd: root, encoding: "utf8", windowsHide: true },
		);
		expect(result.status).toBe(1);
		expect(result.stdout).toBe("");
		expect(result.stderr.trim().split(/\r?\n/)).toEqual([
			"handoff:new FAILED: A branch must be checked out before creating a resume point.",
		]);
		expect(snapshot(root)).toEqual(before);
		expect(readdirSync(path.join(root, path.dirname(HANDOFF)))).toEqual([
			"old.md",
		]);
	});
	it.each([
		"#round",
		"docs/run #1",
		"[round]",
		".",
	])("safely updates plain pointer scalars for directory %s", async (directory) => {
		const { root, packet, state, hash } = fixture(roots);
		const plainPacket = packet.replace(`"${HANDOFF}"`, HANDOFF);
		put(root, PACKET, plainPacket);
		put(
			root,
			"PROJECT_STATE.yaml",
			state
				.replace(`'${HANDOFF}'`, HANDOFF)
				.replace(hash, createHash("sha256").update(plainPacket).digest("hex")),
		);
		const result = await createResumePoint({ ...options(root), directory });
		expect(
			parseYaml(bytes(root, PACKET).toString("utf8")).continuity.currentHandoff,
		).toBe(result.newPath);
		expect(
			parseYaml(bytes(root, "PROJECT_STATE.yaml").toString("utf8")).milestones[
				MILESTONE
			].handoff,
		).toBe(result.newPath);
		expect(existsSync(path.join(root, result.newPath))).toBe(true);
	});
	it("restores the packet and removes the new file when a persistent state write fails before changing it", async () => {
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
					if (path.basename(file) === "PROJECT_STATE.yaml")
						throw new Error("Persistent state write failure");
					return writeFile(file, content, config);
				},
			}),
		).rejects.toThrow("Persistent state write failure");
		expect(snapshot(root)).toEqual(before);
		expect(readdirSync(path.join(root, path.dirname(HANDOFF)))).toEqual([
			"old.md",
		]);
	});
	it("retains the new file and reports failed restoration so pointers cannot dangle", async () => {
		const { root, packet } = fixture(roots);
		await expect(
			createResumePoint({
				...options(root),
				writeFileImpl: async (
					file: string,
					content: string,
					config?: { flag: string },
				) => {
					if (
						path.basename(file) === "PROJECT_STATE.yaml" ||
						(file.endsWith(`${MILESTONE}.yaml`) && content === packet)
					)
						throw new Error("Persistent write failure");
					return writeFile(file, content, config);
				},
			}),
		).rejects.toThrow(/rollback failed.*File retained/);
		const updatedPacket = parseYaml(bytes(root, PACKET).toString("utf8"));
		expect(
			existsSync(path.join(root, updatedPacket.continuity.currentHandoff)),
		).toBe(true);
		expect(bytes(root, HANDOFF).toString("utf8")).toBe(
			"# Legacy handoff\nOld narrative.\n",
		);
	});
	it.each([
		false,
		true,
	])("creates a new short file from legacy=%s, refreshes pointers, hash and 72-hour lease, and preserves every other byte", async (marked) => {
		const { root, state, packet, hash } = fixture(roots, marked);
		const before = snapshot(root);
		const result = await createResumePoint(options(root));
		const timestamp = localTimestamp(new Date(NOW));
		const expiry = localTimestamp(
			new Date(new Date(NOW).getTime() + 72 * 3_600_000),
		);
		expect(result.newPath).toBe(
			`docs/phase-records/handoffs/fixture/${timestamp.filename}-${MILESTONE}-resume.md`,
		);
		const content = bytes(root, result.newPath).toString("utf8");
		expect(content).toContain(`# ${MILESTONE}: resume point`);
		expect(content).toContain(
			`- **As of:** \`feature/resume\` at \`abc1234\`, ${timestamp.label}`,
		);
		expect(content).toContain(`- **Previous resume point:** \`${HANDOFF}\``);
		expect(content).toContain("## Waiting on the user");
		expect(content).not.toContain("template:start");
		expect(content).not.toContain("Old narrative.");
		expect(bytes(root, HANDOFF)).toEqual(before[2]);
		const expectedPacket = packet.replace(
			`"${HANDOFF}"`,
			`"${result.newPath}"`,
		);
		expect(bytes(root, PACKET)).toEqual(Buffer.from(expectedPacket));
		const nextHash = createHash("sha256").update(expectedPacket).digest("hex");
		const expectedState = state
			.replace(
				"updatedAt: '2026-10-01T10:00:00+03:00'",
				`updatedAt: '${timestamp.iso}'`,
			)
			.replace(`taskPacketSha256: '${hash}'`, `taskPacketSha256: '${nextHash}'`)
			.replace(`handoff: '${HANDOFF}'`, `handoff: '${result.newPath}'`)
			.replace(
				"lastHeartbeatAt: 2026-10-01T10:00:00+03:00",
				`lastHeartbeatAt: ${timestamp.iso}`,
			)
			.replace(
				'leaseExpiresAt: "2026-10-04T10:00:00+03:00"',
				`leaseExpiresAt: "${expiry.iso}"`,
			);
		expect(bytes(root, "PROJECT_STATE.yaml")).toEqual(
			Buffer.from(expectedState),
		);
		expect(result.output).toBe(
			`Created resume point: ${result.newPath}\nNext actions: fill every section; git add "${result.newPath}"; run pnpm check:repository; commit; push.`,
		);
		expect(existsSync(path.join(root, ".git"))).toBe(false);
	});
	it("carries marked sections forward without opening the template, supports a new directory and a fractional lease", async () => {
		const { root } = fixture(roots, true);
		put(root, HANDOFF, `${MARKED}\nCarried evidence: abcdef0.\n`);
		rmSync(path.join(root, "docs/agent-context/HANDOFF_TEMPLATE.md"));
		const result = await createResumePoint({
			...options(root),
			directory: "docs/new/rounds",
			leaseHours: "1.5",
		});
		expect(result.newPath.startsWith("docs/new/rounds/")).toBe(true);
		expect(bytes(root, result.newPath).toString("utf8")).toContain(
			"Carried evidence: abcdef0.",
		);
		expect(
			parseYaml(bytes(root, "PROJECT_STATE.yaml").toString("utf8")).milestones[
				MILESTONE
			].leaseExpiresAt,
		).toBe(
			localTimestamp(new Date(new Date(NOW).getTime() + 1.5 * 3_600_000)).iso,
		);
	});
	it("refuses an existing filename without changing it, the old handoff, ledger or packet", async () => {
		const { root } = fixture(roots);
		const target = `docs/phase-records/handoffs/fixture/${localTimestamp(new Date(NOW)).filename}-${MILESTONE}-resume.md`;
		put(root, target, "Do not overwrite.");
		const before = snapshot(root);
		await expect(createResumePoint(options(root))).rejects.toThrow(
			/Refusing to overwrite/,
		);
		expect(snapshot(root)).toEqual(before);
		expect(bytes(root, target).toString("utf8")).toBe("Do not overwrite.");
	});
	it.each([
		[{ milestoneId: "../escape" }, /--milestone/],
		[{ milestoneId: "" }, /--milestone/],
		[{ milestoneId: "absent" }, /Unknown active milestone/],
		[{ directory: "../outside" }, /Unsafe/],
		[{ directory: "C:/outside" }, /Unsafe/],
		[{ directory: "C:outside" }, /Unsafe/],
		[{ directory: "/outside" }, /Unsafe/],
		[
			{ directory: "docs/agent-context/HANDOFF_TEMPLATE.md" },
			/must target a directory/,
		],
		[{ leaseHours: 0 }, /positive finite/],
		[{ leaseHours: -1 }, /positive finite/],
		[{ leaseHours: "NaN" }, /positive finite/],
		[{ leaseHours: Number.POSITIVE_INFINITY }, /positive finite/],
		[{ now: "yesterday" }, /ISO-8601/],
		[{ now: "2026-10-02T20:40:12" }, /ISO-8601/],
		[{ now: "2026-02-30T20:40:12Z" }, /ISO-8601/],
	])("fails before mutations on invalid options %j", async (invalid, message) => {
		const { root } = fixture(roots);
		const before = snapshot(root);
		await expect(
			createResumePoint({ ...options(root), ...invalid }),
		).rejects.toThrow(message);
		expect(snapshot(root)).toEqual(before);
		expect(readdirSync(path.join(root, path.dirname(HANDOFF)))).toEqual([
			"old.md",
		]);
	});
	it.each([
		"hash",
		"continuity",
		"identity",
		"template",
		"header",
		"scalar",
		"packet",
		"handoff",
	])("fails before mutations for stale or missing %s", async (fault) => {
		const { root, state, packet, hash } = fixture(roots, fault === "header");
		if (fault === "hash")
			put(root, "PROJECT_STATE.yaml", state.replace(hash, "a".repeat(64)));
		if (fault === "continuity" || fault === "identity") {
			const changed =
				fault === "continuity"
					? packet.replace(`"${HANDOFF}"`, '"elsewhere.md"')
					: packet.replace(
							`milestoneId: ${MILESTONE}`,
							"milestoneId: other-r01",
						);
			put(root, PACKET, changed);
			put(
				root,
				"PROJECT_STATE.yaml",
				state.replace(hash, createHash("sha256").update(changed).digest("hex")),
			);
		}
		if (fault === "template")
			put(root, "docs/agent-context/HANDOFF_TEMPLATE.md", "No block.");
		if (fault === "header")
			put(root, HANDOFF, (MARKED ?? "").replace("- **As of:**", "- **Old:**"));
		if (fault === "scalar")
			put(
				root,
				"PROJECT_STATE.yaml",
				state.replace(/ {4}lastHeartbeatAt:[^\r\n]*\r\n/, ""),
			);
		if (fault === "packet") rmSync(path.join(root, PACKET));
		if (fault === "handoff") rmSync(path.join(root, HANDOFF));
		const beforeState = bytes(root, "PROJECT_STATE.yaml");
		const beforePacket = existsSync(path.join(root, PACKET))
			? bytes(root, PACKET)
			: null;
		await expect(createResumePoint(options(root))).rejects.toThrow();
		expect(bytes(root, "PROJECT_STATE.yaml")).toEqual(beforeState);
		if (beforePacket) expect(bytes(root, PACKET)).toEqual(beforePacket);
		expect(readdirSync(path.join(root, path.dirname(HANDOFF)))).toEqual(
			fault === "handoff" ? [] : ["old.md"],
		);
	});
	it("reports the same behind-upstream warning after creating a handoff", async () => {
		const { root } = fixture(roots);
		const base = options(root);
		const result = await createResumePoint({
			...base,
			git: (root: string, args: string[]) =>
				args[0] === "rev-list" ? "3" : base.git(root, args),
		});
		expect(result.output.split("\n").at(-1)).toContain(
			"behind origin/main by 3 commit(s)",
		);
	});
	it.each([
		".",
		"docs/phase-records",
	])("R1/O4: CLI accepts both argument forms from %s, honors --now in local time, and never commits", (workingDirectory) => {
		const outputs: string[] = [];
		for (const separator of [false, true]) {
			const { root } = fixture(roots);
			gitFixture(root);
			const result = spawnSync(
				process.execPath,
				[
					script,
					...(separator ? ["--"] : []),
					"--milestone",
					MILESTONE,
					"--now",
					NOW,
					"--lease-hours",
					"12",
				],
				{
					cwd: path.join(root, workingDirectory),
					encoding: "utf8",
					windowsHide: true,
					env: { ...process.env, TZ: "Asia/Riyadh" },
				},
			);
			expect(result.status, result.stderr).toBe(0);
			outputs.push(result.stdout);
			const newPath = result.stdout
				.match(/Created resume point: (.+)/)?.[1]
				.trim();
			expect(newPath).toBe(
				`docs/phase-records/handoffs/fixture/20261002-204012-${MILESTONE}-resume.md`,
			);
			expect(bytes(root, newPath ?? "").toString("utf8")).toContain(
				"2026-10-02 20:40 +03:00",
			);
			expect(
				parseYaml(bytes(root, "PROJECT_STATE.yaml").toString("utf8"))
					.milestones[MILESTONE].leaseExpiresAt,
			).toBe("2026-10-03T08:40:12+03:00");
			expect(git(root, "rev-list", "--count", "HEAD")).toBe("1");
		}
		// Fixture commits have different HEADs; the command output contains paths only.
		expect(outputs[1]).toBe(outputs[0]);
	});
	it.each([
		{
			zone: "UTC",
			now: "2026-10-02T20:40:12.987+03:00",
			filename: "20261002-174012",
			label: "2026-10-02 17:40 +00:00",
			iso: "2026-10-02T17:40:12+00:00",
			expiry: "2026-10-05T17:40:12+00:00",
		},
		{
			zone: "Asia/Riyadh",
			now: "2026-10-02T20:40:12.987+03:00",
			filename: "20261002-204012",
			label: "2026-10-02 20:40 +03:00",
			iso: "2026-10-02T20:40:12+03:00",
			expiry: "2026-10-05T20:40:12+03:00",
		},
		{
			zone: "Asia/Kathmandu",
			now: "2026-10-02T20:40:12.987+03:00",
			filename: "20261002-232512",
			label: "2026-10-02 23:25 +05:45",
			iso: "2026-10-02T23:25:12+05:45",
			expiry: "2026-10-05T23:25:12+05:45",
		},
		{
			zone: "America/New_York",
			now: "2026-10-31T23:40:12.987-04:00",
			filename: "20261031-234012",
			label: "2026-10-31 23:40 -04:00",
			iso: "2026-10-31T23:40:12-04:00",
			expiry: "2026-11-03T22:40:12-05:00",
		},
	])("R2/R3: CLI writes consistent local timestamps and ordered next actions in $zone", ({
		zone,
		now,
		filename,
		label,
		iso,
		expiry,
	}) => {
		const { root } = fixture(roots);
		gitFixture(root);
		const result = spawnSync(
			process.execPath,
			[script, "--milestone", MILESTONE, "--now", now],
			{
				cwd: root,
				encoding: "utf8",
				windowsHide: true,
				env: { ...process.env, TZ: zone },
			},
		);
		expect(result.status, result.stderr).toBe(0);
		const newPath = `docs/phase-records/handoffs/fixture/${filename}-${MILESTONE}-resume.md`;
		expect(bytes(root, newPath).toString("utf8")).toContain(`, ${label}`);
		const state = parseYaml(bytes(root, "PROJECT_STATE.yaml").toString("utf8"));
		expect(state.updatedAt).toBe(iso);
		expect(state.milestones[MILESTONE].lastHeartbeatAt).toBe(iso);
		expect(state.milestones[MILESTONE].leaseExpiresAt).toBe(expiry);
		expect(new Date(expiry).getTime() - new Date(iso).getTime()).toBe(
			72 * 3_600_000,
		);
		expect(result.stdout.trim()).toBe(
			`Created resume point: ${newPath}\nNext actions: fill every section; git add "${newPath}"; run pnpm check:repository; commit; push.`,
		);
	});
	it("R3: next actions stage the quoted new path before checking, committing and pushing", async () => {
		const { root } = fixture(roots);
		const result = await createResumePoint({
			...options(root),
			directory: "docs/run #1",
		});
		expect(result.output.split("\n")[1]).toBe(
			`Next actions: fill every section; git add "${result.newPath}"; run pnpm check:repository; commit; push.`,
		);
	});
	it("argument validation rejects unknown flags, missing values, duplicate flags and non-leading separators", () => {
		for (const args of [
			["--unknown"],
			["--milestone"],
			["--milestone", "--dir"],
			["--milestone", "a", "--milestone", "b"],
			["--milestone", "a", "--"],
			["--milestone", MILESTONE, "--slug", "run"],
		])
			expect(() => parseHandoffArgs(args)).toThrow();
		expect(parseHandoffArgs(["--", "--milestone", MILESTONE])).toEqual(
			parseHandoffArgs(["--milestone", MILESTONE]),
		);
	});
	it("scalar patching preserves plain, double and single quotes, comments, Unicode and CRLF", () => {
		const text = "# كمّل\r\na: plain # keep\r\nb: \"double\"\r\nc: 'single'\r\n";
		expect(
			replaceYamlScalars(
				text,
				[
					[["a"], "next"],
					[["b"], "new"],
					[["c"], "it's"],
				],
				"fixture",
			),
		).toBe("# كمّل\r\na: next # keep\r\nb: \"new\"\r\nc: 'it''s'\r\n");
		expect(() =>
			replaceYamlScalars("a: [list]\n", [[["a"], "new"]], "fixture"),
		).toThrow(/unsupported scalar/);
	});
});
