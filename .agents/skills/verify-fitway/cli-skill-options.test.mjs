import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test as nodeTest } from "node:test";
import { fileURLToPath } from "node:url";
import { help } from "./cli.mjs";
import { verificationPairs } from "./core.mjs";
import { assertGuideOptions } from "./guide-options.mjs";
import { verificationTest } from "./skip-gate.mjs";

const test = verificationTest(nodeTest);

const measureSeparatorRejectCases = [
	[
		"semicolon attached to the preceding token",
		"`measure --tool focus -- --allowed;node $cli drive --invented-semicolon`",
	],
	[
		"semicolon at the start of the next token",
		"`measure --tool focus -- --allowed ;node $cli drive --invented-leading-semicolon`",
	],
	[
		"semicolon separated from both commands",
		"`measure --tool focus -- --max-stops 40; node $cli drive --invented-attached-semicolon`",
	],
	[
		"single ampersand",
		"`measure --tool focus -- --allowed & node $cli drive --invented-ampersand`",
	],
	[
		"double ampersand attached to the preceding token",
		"`measure --tool focus -- --max-stops 40&&node $cli drive --invented-and`",
	],
	[
		"double pipe attached to the preceding token",
		"`measure --tool focus -- --max-stops 40||node $cli drive --invented-or`",
	],
	[
		"pipe inside a token",
		"`measure --tool focus -- --max-stops a|b --invented-pipe`",
	],
	[
		"fenced semicolon",
		"```powershell\nmeasure --tool focus -- --allowed;node $cli drive --invented-fenced-semicolon\n```",
	],
];

const measureSeparatorAcceptCases = [
	[
		"single-quoted pipe",
		"`measure --tool focus -- --pattern 'a|b' --invented-single-quoted`",
	],
	[
		"double-quoted pipe",
		'`measure --tool focus -- --pattern "a|b" --invented-double-quoted`',
	],
];

test("V5: SKILL names CLI options, ports and rendered artifacts without drift", async () => {
	const skill = await readFile(
		fileURLToPath(new URL("./SKILL.md", import.meta.url)),
		"utf8",
	);
	assertGuideOptions(skill, help);
	const plant = (text) => `${skill}\n${text}\n`;
	for (const text of [
		"`--invented-prose`",
		"```\n--invented-fence\n```",
		"`pnpm --invented-pnpm`",
		"measure --tool focus -- --invented-plain",
		"`measure --invented-before -- --allowed`",
		"`compare --concept x -- --invented-other`",
		"`measure --tool focus -- --allowed && other --invented-other`",
		"`pnpm run-folder:new x --invented-run-folder`",
		...measureSeparatorRejectCases.map(([, text]) => text),
	])
		assert.throws(
			() => assertGuideOptions(plant(text), help),
			/--invented-/,
			text,
		);
	for (const text of [
		"`measure --tool focus --out <folder> -- --invented-tool`",
		"`node $cli measure --tool focus --out <folder> -- --invented-tool-prefix`",
		"```powershell\nmeasure --tool focus --out <folder> -- --invented-tool-fence\n```",
		"`sheet --out <folder> -- -- --row 'a=b.png'`",
		...measureSeparatorAcceptCases.map(([, text]) => text),
	])
		assert.doesNotThrow(() => assertGuideOptions(plant(text), help), text);
	for (const pair of skill.match(/\b31\d\d-31\d\d\b/g) || [])
		if (pair !== "3178-3185")
			assert.ok(
				verificationPairs.some(([a, b]) => pair === `${a}-${b}`),
				`${pair} is not a verification pair`,
			);
	assert.match(skill, /does not render language sheets/);
	assert.doesNotMatch(skill, /language sheets remain after cleanup/);
	assert.match(
		await readFile(
			fileURLToPath(new URL("./runner.mjs", import.meta.url)),
			"utf8",
		),
		/comparisonCapture[\s\S]*break/,
	);
});

test("Y1: every unquoted separator ends a measure tool-argument exemption", async () => {
	const skill = await readFile(
		fileURLToPath(new URL("./SKILL.md", import.meta.url)),
		"utf8",
	);
	const plant = (text) => `${skill}\n${text}\n`;
	const leaked = [];
	for (const [label, text] of measureSeparatorRejectCases) {
		try {
			assertGuideOptions(plant(text), help);
			leaked.push(label);
		} catch (error) {
			assert.match(error.message, /--invented-/, label);
		}
	}
	assert.deepEqual(
		leaked,
		[],
		`Unquoted separators left the next option exempt: ${leaked.join(", ")}`,
	);
	for (const [label, text] of measureSeparatorAcceptCases)
		assert.doesNotThrow(() => assertGuideOptions(plant(text), help), label);
});
