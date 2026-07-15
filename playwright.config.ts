import { createHash } from "node:crypto";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const runIdPattern = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;

function parseBoolean(name: string, fallback = false) {
	const value = process.env[name];
	if (value === undefined) return fallback;
	if (value === "true") return true;
	if (value === "false") return false;
	throw new Error(`${name} must be true or false`);
}

function parsePort(value: string | undefined, fallback: number) {
	if (value === undefined) return fallback;
	const port = Number(value);
	if (!Number.isInteger(port) || port < 1024 || port > 65_535) {
		throw new Error(
			"FITWAY_PLAYWRIGHT_PORT must be an integer from 1024 to 65535",
		);
	}
	return port;
}

function resolveOutputPath(name: string, fallback: string) {
	return path.resolve(process.env[name] ?? fallback);
}

const worktreeHash = createHash("sha256")
	.update(path.resolve(process.cwd()).toLowerCase())
	.digest("hex")
	.slice(0, 12);
const runId = process.env.FITWAY_RUN_ID ?? `local_${worktreeHash}`;
if (runId.length < 8 || runId.length > 40 || !runIdPattern.test(runId)) {
	throw new Error(
		"FITWAY_RUN_ID must be 8-40 lowercase letters, digits, or single underscores",
	);
}
const portHash = Number.parseInt(
	createHash("sha256").update(runId).digest("hex").slice(0, 8),
	16,
);
const port = parsePort(
	process.env.FITWAY_PLAYWRIGHT_PORT,
	4_200 + (portHash % 20_000),
);
const localBaseUrl = `http://127.0.0.1:${port}`;
const baseURL = process.env.FITWAY_PLAYWRIGHT_BASE_URL ?? localBaseUrl;
const skipWebServer = parseBoolean("FITWAY_PLAYWRIGHT_SKIP_WEBSERVER");
let parsedBaseUrl: URL;
try {
	parsedBaseUrl = new URL(baseURL);
} catch {
	throw new Error("FITWAY_PLAYWRIGHT_BASE_URL must be a valid URL");
}
if (!skipWebServer && parsedBaseUrl.origin !== localBaseUrl) {
	throw new Error(
		"FITWAY_PLAYWRIGHT_BASE_URL must match the configured local port unless FITWAY_PLAYWRIGHT_SKIP_WEBSERVER=true",
	);
}

const outputRoot = resolveOutputPath(
	"FITWAY_PLAYWRIGHT_OUTPUT_DIR",
	path.join("output", "playwright", runId),
);
const reportDirectory = resolveOutputPath(
	"FITWAY_PLAYWRIGHT_REPORT_DIR",
	path.join(outputRoot, "report"),
);
const reviewDirectory = resolveOutputPath(
	"FITWAY_PLAYWRIGHT_REVIEW_DIR",
	path.join(outputRoot, "review"),
);
const snapshotDirectory = resolveOutputPath(
	"FITWAY_PLAYWRIGHT_SNAPSHOT_DIR",
	path.join("tests", "browser", "__screenshots__"),
);

// Review captures are disposable per-run evidence. Canonical assertion snapshots
// remain shared and read-only unless a designated baseline owner updates them.
process.env.FITWAY_PLAYWRIGHT_REVIEW_DIR = reviewDirectory;
process.env.FITWAY_RUN_ID = runId;

export default defineConfig({
	testDir: "./tests/browser",
	fullyParallel: false,
	forbidOnly: Boolean(process.env.CI),
	retries: 0,
	outputDir: path.join(outputRoot, "test-results"),
	snapshotPathTemplate: path.join(
		snapshotDirectory,
		"{platform}",
		"{projectName}",
		"{testFilePath}",
		"{arg}{ext}",
	),
	reporter: [
		["line"],
		["html", { open: "never", outputFolder: reportDirectory }],
		["junit", { outputFile: path.join(outputRoot, "results.xml") }],
	],
	expect: {
		toHaveScreenshot: { animations: "disabled", caret: "hide" },
	},
	use: {
		baseURL,
		trace: "retain-on-failure",
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: skipWebServer
		? undefined
		: {
				command: `pnpm --filter web dev --host 127.0.0.1 --port ${port} --strictPort`,
				env: {
					...process.env,
					FITWAY_PLAYWRIGHT_REVIEW_DIR: reviewDirectory,
					VITE_HIDE_DEVTOOLS: "1",
				},
				url: localBaseUrl,
				reuseExistingServer: false,
				timeout: 30_000,
			},
});
