import { describe, expect, it } from "vitest";
import { commitHeaderSha } from "./commit-header.mjs";

const escapePrefix =
	"\u001b[?9001h\u001b[?1004h\u001b[?25l\u001b[2J\u001b[m\u001b[H\u001b]0;C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe\u0007\u001b[?25h";

const recordedPowerShellOutput =
	"\u001b[?9001h\u001b[?1004h\u001b[?25l\u001b[2J\u001b[m\u001b[H\u001b]0;C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe\u0007\u001b[?25h[tooling-ratchet 7c28d15a6502173761195facafc20d2d5bf1b180] Ratchet\r\n 16 files changed, 1794 insertions(+), 65 deletions(-)\r\n create mode 100644 docs/agent-context/CODE_HEALTH_BASELINE.json\r\n create mode 100644 scripts/agent-environment/check-code-health.mjs\r\n create mode 100644 scripts/agent-environ";

describe("commitHeaderSha", () => {
	it("reads the SHA from real PowerShell output that puts terminal escape codes before the header", () => {
		expect(commitHeaderSha(recordedPowerShellOutput)).toBe(
			"7c28d15a6502173761195facafc20d2d5bf1b180",
		);
	});

	it("reads the SHA from a clean header", () => {
		expect(commitHeaderSha("[main 1a2b3c4] subject\n")).toBe("1a2b3c4");
	});

	it("reads the SHA from a root-commit header", () => {
		expect(commitHeaderSha("[main (root-commit) 1a2b3c4] subject")).toBe(
			"1a2b3c4",
		);
	});

	it("reads the header's SHA, never a bracketed SHA in the subject", () => {
		expect(commitHeaderSha("[main 1a2b3c4] fix [x 9f9f9f9]")).toBe("1a2b3c4");
	});

	it("returns null when escape codes are followed by text with no header", () => {
		expect(commitHeaderSha(`${escapePrefix}nothing to commit\r\n`)).toBeNull();
	});

	it("reads the SHA after an OSC title ended by ESC backslash instead of BEL", () => {
		expect(
			commitHeaderSha(
				"\u001b]0;Windows PowerShell\u001b\\[main 1a2b3c4] subject",
			),
		).toBe("1a2b3c4");
	});
});
