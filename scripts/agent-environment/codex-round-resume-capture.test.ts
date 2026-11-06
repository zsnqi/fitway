import * as fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
	argumentKeys,
	expectedArgs,
	fallbackReportMessage,
	fixture,
	refused,
} from "./codex-round-test-support.ts";

describe("L2 resume", () => {
	it("resumes the first-line thread with all flags before resume and preserves earlier captures", async () => {
		const f = fixture();
		f.laterHead();
		expect(f.invoke(undefined, { ROUND_EXIT: "37" }).status).toBe(37);
		const original = fs.readFileSync(path.join(f.run, "events.jsonl"));
		const input = fs.readFileSync(path.join(f.run, "input.md"));
		fs.writeFileSync(
			path.join(f.worktree, "unfinished.ts"),
			"// interrupted round\n",
		);
		fs.writeFileSync(f.brief, "the saved input must be used\n");
		for (let attempt = 0; attempt < 2; attempt += 1) {
			const result = f.invoke(["resume", f.run], { ROUND_EXIT: "19" });
			expect(result.status, result.output).toBe(19);
			expect(await argumentKeys(f.captured().args)).toEqual(
				await argumentKeys(expectedArgs(f, "last-message.md", true)),
			);
			expect(Buffer.from(f.captured().input, "base64")).toEqual(input);
		}
		expect(fs.readFileSync(path.join(f.run, "events.jsonl"))).toEqual(original);
		expect(
			fs
				.readdirSync(f.run)
				.filter((file) => file.startsWith("events") && file.endsWith(".jsonl")),
		).toEqual(["events-resume-2.jsonl", "events-resume.jsonl", "events.jsonl"]);
		expect(fs.readFileSync(path.join(f.run, "last-message.md"), "utf8")).toBe(
			fallbackReportMessage("stand-in resumed message"),
		);
	});
	it.each([
		"",
		"توقف بسبب حد الاستخدام؛ تبدّل الحساب «كما هو» & %PATH% ! ^",
		"  العربية\r\nresumed\n ",
	])("sends the exact optional resume message %j instead of the launch input", async (message) => {
		const f = fixture();
		f.laterHead();
		expect(f.invoke(undefined, { ROUND_EXIT: "37" }).status).toBe(37);
		const input = fs.readFileSync(path.join(f.run, "input.md"));
		const result = f.invoke(["resume", f.run, "--message", message]);
		expect(result.status, result.output).toBe(0);
		expect(await argumentKeys(f.captured().args)).toEqual(
			await argumentKeys(expectedArgs(f, "last-message.md", true)),
		);
		expect(Buffer.from(f.captured().input, "base64")).toEqual(
			Buffer.from(message, "utf8"),
		);
		expect(fs.readFileSync(path.join(f.run, "input.md"))).toEqual(input);
		const fallback = f.invoke(["resume", f.run]);
		expect(fallback.status, fallback.output).toBe(0);
		expect(Buffer.from(f.captured().input, "base64")).toEqual(input);
	});
	it("sends a message file byte for byte", async () => {
		const f = fixture();
		expect(f.invoke(undefined, { ROUND_EXIT: "37" }).status).toBe(37);
		const message = Buffer.from(
			`line 1 has "double" and 'single' quotes, a backslash before a quote: \\"\nالعربية «كما هي» and $PATH\r\nline 3`,
			"utf8",
		);
		const messageFile = path.join(f.root, "resume message.txt");
		fs.writeFileSync(messageFile, message);
		const result = f.invoke(["resume", f.run, "--message-file", messageFile]);
		expect(result.status, result.output).toBe(0);
		expect(Buffer.from(f.captured().input, "base64")).toEqual(message);
	});
	it.each([
		[
			"UTF-8 BOM",
			(text: string) =>
				Buffer.concat([
					Buffer.from([0xef, 0xbb, 0xbf]),
					Buffer.from(text, "utf8"),
				]),
		],
		["UTF-8", (text: string) => Buffer.from(text, "utf8")],
		[
			"UTF-16LE BOM",
			(text: string) =>
				Buffer.concat([
					Buffer.from([0xff, 0xfe]),
					Buffer.from(text, "utf16le"),
				]),
		],
		[
			"UTF-16BE BOM",
			(text: string) => {
				const littleEndian = Buffer.from(text, "utf16le");
				for (let index = 0; index < littleEndian.length; index += 2)
					[littleEndian[index], littleEndian[index + 1]] = [
						littleEndian[index + 1],
						littleEndian[index],
					];
				return Buffer.concat([Buffer.from([0xfe, 0xff]), littleEndian]);
			},
		],
	])("decodes %s message files and keeps line endings", async (_name, encode) => {
		const f = fixture();
		expect(f.invoke(undefined, { ROUND_EXIT: "37" }).status).toBe(37);
		const text = `quotes: "double" and 'single'\r\nالعربية «كما هي»\n`;
		const expected = Buffer.from(text, "utf8");
		const messageFile = path.join(f.root, "encoded message.txt");
		fs.writeFileSync(messageFile, encode(text));
		const result = f.invoke(["resume", f.run, "--message-file", messageFile]);
		expect(result.status, result.output).toBe(0);
		expect(Buffer.from(f.captured().input, "base64")).toEqual(expected);
	});
	it("refuses invalid UTF-8 without a BOM and names the file", () => {
		const f = fixture();
		expect(f.invoke(undefined, { ROUND_EXIT: "37" }).status).toBe(37);
		fs.rmSync(f.capture);
		const messageFile = path.join(f.root, "invalid message.txt");
		fs.writeFileSync(messageFile, Buffer.from([0x61, 0xc3, 0x28]));
		const result = f.invoke(["resume", f.run, "--message-file", messageFile]);
		expect(
			refused(f, result, "message file is not valid UTF-8; write it as UTF-8"),
		).toMatchObject({ status: 1 });
		expect(result.stderr).toContain(messageFile);
	});
	it.each([
		["missing", "message file not found"],
		["empty", "message file is empty"],
	])("refuses a %s message file", (kind, reason) => {
		const f = fixture();
		expect(f.invoke(undefined, { ROUND_EXIT: "37" }).status).toBe(37);
		fs.rmSync(f.capture);
		const messageFile = path.join(f.root, `${kind} message.txt`);
		if (kind === "empty") fs.writeFileSync(messageFile, Buffer.alloc(0));
		expect(
			refused(
				f,
				f.invoke(["resume", f.run, "--message-file", messageFile]),
				reason,
			),
		).toMatchObject({ status: 1 });
	});
	it.each([
		[
			["--message"],
			"expected resume <folder> [--message <text> | --message-file <file>]",
		],
		[
			["--unknown", "text"],
			"codex:round: FAIL: unknown option --unknown (run codex:round --help)",
		],
		[
			["--message", "text", "extra"],
			"expected resume <folder> [--message <text> | --message-file <file>]",
		],
	])("refuses malformed resume options %j without starting Codex", (options, reason) => {
		const f = fixture();
		expect(
			refused(f, f.invoke(["resume", f.run, ...options]), reason),
		).toMatchObject({ status: 1 });
		expect(fs.existsSync(f.run)).toBe(false);
	});
	it("refuses a run whose first event has no thread", () => {
		const f = fixture();
		f.invoke();
		fs.rmSync(f.capture);
		fs.writeFileSync(
			path.join(f.run, "events.jsonl"),
			'{}\n{"type":"thread.started","thread_id":"wrong-line"}\n',
		);
		expect(
			refused(f, f.invoke(["resume", f.run]), "first event has no thread id"),
		).toMatchObject({ status: 1 });
		expect(fs.existsSync(path.join(f.run, "events-resume.jsonl"))).toBe(false);
	});
	it("refuses to resume a saved input with no outcome IDs", () => {
		const f = fixture();
		expect(f.invoke().status).toBe(0);
		fs.rmSync(f.capture);
		fs.writeFileSync(path.join(f.run, "input.md"), "No outcome IDs.\n");
		expect(
			refused(f, f.invoke(["resume", f.run]), "brief has no outcome IDs"),
		).toMatchObject({ status: 1 });
		expect(fs.existsSync(f.capture)).toBe(false);
	});
});
