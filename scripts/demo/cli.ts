import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createWriteStream, existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	assertDemoOperation,
	assertOwnedProcessCommand,
	assertOwnedProcessRecord,
	DEMO_BROWSER_VERIFICATION_FLAGS,
	DEMO_COMPOSE_PROJECT,
	DEMO_DATABASE_URL,
	DEMO_OWNER_EMAIL,
	DEMO_PROCESS_MARKERS,
	DEMO_SERVER_URL,
	DEMO_WEB_URL,
	type DemoProcessRole,
	withoutInteractiveDemoCredentials,
} from "./contract";
import { type DemoSeedResult, migrateDemoDatabase, seedDemo } from "./seed";

const workspace = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../..",
);
const composeFile = path.join(workspace, "compose.demo.yaml");
const runtime = assertDemoOperation({
	databaseUrl: DEMO_DATABASE_URL,
	composeProject: DEMO_COMPOSE_PROJECT,
	workspace,
});
const secretsFile = path.join(runtime, "runtime-secrets.json");
const processFile = path.join(runtime, "processes.json");
const profileFile = path.join(runtime, "profile.json");
const logDirectory = path.join(runtime, "logs");
const stopRequestFile = path.join(runtime, "stop-requested");

type RuntimeSecrets = { authSecret: string; edgeToken: string };
type OwnedProcess = {
	role: DemoProcessRole;
	pid: number;
	marker: string;
};
type Action =
	| "prepare"
	| "reset"
	| "start"
	| "status"
	| "verify"
	| "owner"
	| "stop"
	| "clean";

function child(
	command: string,
	args: string[],
	options: { env?: NodeJS.ProcessEnv; stdio?: "inherit" | "ignore" } = {},
) {
	return new Promise<void>((resolve, reject) => {
		const result = spawn(command, args, {
			cwd: workspace,
			env: options.env ?? withoutInteractiveDemoCredentials(process.env),
			stdio: options.stdio ?? "inherit",
			windowsHide: true,
		});
		result.once("error", reject);
		result.once("exit", (code) =>
			code === 0
				? resolve()
				: reject(new Error(`${command} exited with ${code ?? "no code"}`)),
		);
	});
}

function compose(args: string[]) {
	return child("docker", [
		"compose",
		"--project-name",
		DEMO_COMPOSE_PROJECT,
		"--file",
		composeFile,
		...args,
	]);
}

function capture(command: string, args: string[]) {
	return new Promise<string>((resolve, reject) => {
		const result = spawn(command, args, {
			cwd: workspace,
			env: withoutInteractiveDemoCredentials(process.env),
			windowsHide: true,
		});
		let stdout = "";
		let stderr = "";
		result.stdout.on("data", (chunk) => {
			stdout += String(chunk);
		});
		result.stderr.on("data", (chunk) => {
			stderr += String(chunk);
		});
		result.once("error", reject);
		result.once("exit", (code) => {
			if (code === 0) resolve(stdout.trim());
			else reject(new Error(stderr.trim() || `${command} exited with ${code}`));
		});
	});
}

function composeOutput(args: string[]) {
	return capture("docker", [
		"compose",
		"--project-name",
		DEMO_COMPOSE_PROJECT,
		"--file",
		composeFile,
		...args,
	]);
}

async function ensureRuntime() {
	assertDemoOperation({
		databaseUrl: DEMO_DATABASE_URL,
		composeProject: DEMO_COMPOSE_PROJECT,
		workspace,
		runtimePath: runtime,
	});
	await mkdir(logDirectory, { recursive: true });
}

async function secrets(): Promise<RuntimeSecrets> {
	await ensureRuntime();
	if (existsSync(secretsFile)) {
		const value = JSON.parse(
			await readFile(secretsFile, "utf8"),
		) as RuntimeSecrets;
		if (value.authSecret?.length >= 32 && value.edgeToken?.length >= 43)
			return value;
		throw new Error(
			"Demo runtime secrets are malformed; run demo:clean before recreating them",
		);
	}
	const value = {
		authSecret: randomBytes(32).toString("base64url"),
		edgeToken: randomBytes(32).toString("base64url"),
	};
	await writeFile(secretsFile, JSON.stringify(value), {
		encoding: "utf8",
		mode: 0o600,
	});
	return value;
}

function demoEnvironment(value: RuntimeSecrets): NodeJS.ProcessEnv {
	return {
		...withoutInteractiveDemoCredentials(process.env),
		DATABASE_URL: DEMO_DATABASE_URL,
		BETTER_AUTH_SECRET: value.authSecret,
		CRON_SECRET: value.authSecret,
		BETTER_AUTH_URL: `${DEMO_SERVER_URL}/api/auth`,
		CORS_ORIGIN: DEMO_WEB_URL,
		TELEGRAM_BOT_TOKEN: "desktop-demo-disabled",
		TELEGRAM_CHAT_ID: "desktop-demo-disabled",
		NODE_ENV: "development",
		PORT: "3100",
		FITWAY_EDGE_TOKEN: value.edgeToken,
	};
}

async function waitFor(url: string, label: string) {
	for (let attempt = 0; attempt < 30; attempt += 1) {
		try {
			if ((await fetch(url)).ok) return;
		} catch {
			/* bounded retry */
		}
		await new Promise((resolve) => setTimeout(resolve, 500));
	}
	throw new Error(`${label} did not become ready on its fixed loopback URL`);
}

async function isReady(url: string) {
	try {
		return (await fetch(url, { signal: AbortSignal.timeout(2_000) })).ok;
	} catch {
		return false;
	}
}

async function assertAvailableLoopbackPort(port: number, label: string) {
	await new Promise<void>((resolve, reject) => {
		const probe = net.createServer();
		probe.once("error", () =>
			reject(new Error(`${label} port ${port} is already in use`)),
		);
		probe.listen(port, "127.0.0.1", () => probe.close(() => resolve()));
	});
}

async function processCommandLine(pid: number) {
	return new Promise<string | undefined>((resolve) => {
		const query = spawn(
			"powershell.exe",
			[
				"-NoProfile",
				"-NonInteractive",
				"-Command",
				`(Get-CimInstance Win32_Process -Filter 'ProcessId = ${pid}').CommandLine`,
			],
			{ windowsHide: true },
		);
		let output = "";
		query.stdout.on("data", (chunk) => {
			output += String(chunk);
		});
		query.once("error", () => resolve(undefined));
		query.once("exit", (code) =>
			resolve(code === 0 ? output.trim() || undefined : undefined),
		);
	});
}

async function isLive(pid: number) {
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

async function readProcesses(): Promise<OwnedProcess[]> {
	if (!existsSync(processFile)) return [];
	const value = JSON.parse(
		await readFile(processFile, "utf8"),
	) as OwnedProcess[];
	if (!Array.isArray(value))
		throw new Error("Demo process record is malformed; refusing to act on it");
	for (const entry of value) assertOwnedProcessRecord(entry);
	return value;
}

async function stopProcesses() {
	for (const entry of await readProcesses()) {
		if (!(await isLive(entry.pid))) continue;
		const commandLine = await processCommandLine(entry.pid);
		// The foreground supervisor and a second-terminal stop intentionally race.
		// A process may exit after the liveness probe but before CIM returns its
		// command line. Treat only a confirmed exit as harmless; a still-live
		// process without the exact marker continues to fail closed.
		if (!commandLine && !(await isLive(entry.pid))) continue;
		assertOwnedProcessCommand(commandLine, entry.marker);
		try {
			await child("taskkill.exe", ["/PID", `${entry.pid}`, "/T", "/F"], {
				stdio: "ignore",
			});
		} catch (error) {
			// A second-terminal stop races intentionally with the foreground
			// supervisor. Ignore taskkill's "not found" only after liveness proves
			// the exact, already-validated PID is no longer present.
			if (await isLive(entry.pid)) throw error;
		}
	}
	if (existsSync(processFile)) await rm(processFile, { force: true });
}

async function requestStop() {
	await ensureRuntime();
	await writeFile(stopRequestFile, "requested\n", { encoding: "utf8" });
	await stopProcesses();
}

async function startPostgres() {
	await compose(["up", "-d", "--wait", "--wait-timeout", "60", "postgres"]);
	await compose([
		"exec",
		"-T",
		"postgres",
		"pg_isready",
		"-U",
		"fitway_demo",
		"-d",
		"fitway_desktop_demo",
	]);
}

function takeCredential(
	name: "FITWAY_DEMO_OWNER_PASSWORD" | "FITWAY_DEMO_STAFF_PIN",
) {
	const value = process.env[name];
	delete process.env[name];
	if (!value)
		throw new Error(
			"Credentials must be supplied by scripts/demo.ps1 secure prompts",
		);
	return value;
}

function requireCredentials() {
	return {
		ownerPassword: takeCredential("FITWAY_DEMO_OWNER_PASSWORD"),
		staffPin: takeCredential("FITWAY_DEMO_STAFF_PIN"),
	};
}

function requireOwnerPassword() {
	return takeCredential("FITWAY_DEMO_OWNER_PASSWORD");
}

async function reset() {
	const credentials = requireCredentials();
	await requestStop();
	// This is deliberately repeated immediately before the destructive Compose call.
	assertDemoOperation({
		databaseUrl: DEMO_DATABASE_URL,
		composeProject: DEMO_COMPOSE_PROJECT,
		workspace,
		runtimePath: runtime,
	});
	await compose(["down", "--volumes", "--remove-orphans"]);
	await rm(path.join(runtime, "simulator-state.json"), { force: true });
	await rm(path.join(runtime, "edge-token"), { force: true });
	await rm(profileFile, { force: true });
	await rm(stopRequestFile, { force: true });
	await rm(logDirectory, { recursive: true, force: true });
	await mkdir(logDirectory, { recursive: true });
	await startPostgres();
	const value = await secrets();
	const result = await seedDemo({
		databaseUrl: DEMO_DATABASE_URL,
		...credentials,
		...value,
	});
	await writeFile(profileFile, `${JSON.stringify(result, null, 2)}\n`, {
		encoding: "utf8",
		mode: 0o600,
	});
	console.log(
		`Demo profile prepared for ${result.ownerEmail}; profile fingerprint ${result.fingerprint}; Riyadh business day ${result.businessDay}.`,
	);
}

function startOwned(
	role: OwnedProcess["role"],
	marker: string,
	command: string,
	args: string[],
	environment: NodeJS.ProcessEnv,
): OwnedProcess {
	const log = path.join(logDirectory, `${role}.log`);
	const output = spawn(command, args, {
		cwd: workspace,
		env: environment,
		detached: false,
		windowsHide: true,
		stdio: ["ignore", "pipe", "pipe"],
	});
	const stream = createWriteStream(log, { flags: "a" });
	output.stdout.pipe(stream);
	output.stderr.pipe(stream);
	if (!output.pid) throw new Error(`Unable to start demo ${role}`);
	return { role, pid: output.pid, marker };
}

async function start() {
	await ensureRuntime();
	await rm(stopRequestFile, { force: true });
	if (!existsSync(profileFile))
		throw new Error("Demo profile is missing; run pnpm demo:reset first");
	const profile = JSON.parse(
		await readFile(profileFile, "utf8"),
	) as DemoSeedResult;
	if (
		!Number.isSafeInteger(profile.startingCount) ||
		profile.startingCount < 0 ||
		profile.startingCount > 120
	)
		throw new Error(
			"Demo profile is stale or malformed; run pnpm demo:reset before starting",
		);
	for (const entry of await readProcesses()) {
		if (await isLive(entry.pid))
			throw new Error(
				"Demo process record already exists; run demo:status or demo:stop first",
			);
	}
	await assertAvailableLoopbackPort(3100, "Demo server");
	await assertAvailableLoopbackPort(3101, "Demo web");
	await startPostgres();
	const value = await secrets();
	const environment = demoEnvironment(value);
	await writeFile(path.join(runtime, "edge-token"), value.edgeToken, {
		encoding: "utf8",
		mode: 0o600,
	});
	const processes = [
		startOwned(
			"server",
			DEMO_PROCESS_MARKERS.server,
			process.execPath,
			["--import", "tsx", "scripts/demo/server.ts"],
			environment,
		),
		startOwned(
			"web",
			DEMO_PROCESS_MARKERS.web,
			process.execPath,
			[
				"apps/web/node_modules/vite/bin/vite.js",
				"apps/web",
				"--host",
				"127.0.0.1",
				"--port",
				"3101",
			],
			{ ...environment, VITE_SERVER_URL: DEMO_SERVER_URL },
		),
		startOwned(
			"simulator",
			DEMO_PROCESS_MARKERS.simulator,
			"py",
			[
				"edge/simulator.py",
				"--base-url",
				DEMO_SERVER_URL,
				"--token-file",
				path.join(runtime, "edge-token"),
				"--state-file",
				path.join(runtime, "simulator-state.json"),
				"--starting-count",
				`${profile.startingCount}`,
			],
			environment,
		),
	];
	await writeFile(processFile, JSON.stringify(processes), {
		encoding: "utf8",
		mode: 0o600,
	});
	try {
		await waitFor(DEMO_SERVER_URL, "Demo server");
		await waitFor(DEMO_WEB_URL, "Demo web app");
	} catch (error) {
		await stopProcesses();
		throw error;
	}
	console.log(
		`Demo running: ${DEMO_WEB_URL} (web), ${DEMO_SERVER_URL} (server); owner ${DEMO_OWNER_EMAIL}.`,
	);
	let stopping = false;
	const shutdown = async (exitCode: number) => {
		if (stopping) return;
		stopping = true;
		try {
			await stopProcesses();
			await compose(["stop", "postgres"]);
		} finally {
			await rm(stopRequestFile, { force: true });
			process.exit(exitCode);
		}
	};
	for (const signal of ["SIGINT", "SIGTERM"] as const)
		process.once(signal, () => void shutdown(0));
	while (!stopping) {
		await new Promise((resolve) => setTimeout(resolve, 1_000));
		const stopped = [];
		for (const entry of processes)
			if (!(await isLive(entry.pid))) stopped.push(entry.role);
		if (stopped.length > 0) {
			if (existsSync(stopRequestFile)) await shutdown(0);
			console.error(
				`Demo component stopped unexpectedly: ${stopped.join(", ")}`,
			);
			await shutdown(1);
		}
	}
}

async function status() {
	console.log(
		`Postgres contract: ${DEMO_DATABASE_URL.replace("fitway_demo:fitway_demo_local@", "")}`,
	);
	const postgres = await composeOutput([
		"ps",
		"--status",
		"running",
		"--quiet",
		"postgres",
	]);
	console.log(`postgres: ${postgres ? "running" : "not running"}`);
	const processes = await readProcesses();
	for (const role of Object.keys(DEMO_PROCESS_MARKERS) as DemoProcessRole[]) {
		const entry = processes.find((candidate) => candidate.role === role);
		if (!entry || !(await isLive(entry.pid))) {
			console.log(`${role}: not running`);
			continue;
		}
		assertOwnedProcessCommand(
			await processCommandLine(entry.pid),
			entry.marker,
		);
		console.log(`${role}: running (owned process verified)`);
	}
	console.log(
		`server endpoint: ${(await isReady(DEMO_SERVER_URL)) ? "ready" : "not ready"}`,
	);
	console.log(
		`web endpoint: ${(await isReady(DEMO_WEB_URL)) ? "ready" : "not ready"}`,
	);
}

async function verify() {
	const credentials = requireCredentials();
	await waitFor(DEMO_SERVER_URL, "Demo server");
	const [publicResponse, staffResponse, ownerResponse] = await Promise.all([
		fetch(`${DEMO_SERVER_URL}/public/occupancy`),
		fetch(`${DEMO_SERVER_URL}/api/auth/staff/pin`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ pin: credentials.staffPin }),
		}),
		fetch(`${DEMO_SERVER_URL}/api/auth/owner/password`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				email: DEMO_OWNER_EMAIL,
				password: credentials.ownerPassword,
			}),
		}),
	]);
	if (!publicResponse.ok || !staffResponse.ok || !ownerResponse.ok)
		throw new Error(
			"Demo verification failed; public or real authentication route was not ready",
		);
	const publicPayload = (await publicResponse.json()) as {
		freshness?: unknown;
		count?: unknown;
	};
	if (
		publicPayload.freshness !== "fresh" ||
		typeof publicPayload.count !== "number" ||
		publicPayload.count <= 0
	)
		throw new Error(
			"Demo public route did not expose a live populated reading",
		);
	const playwrightCli = path.join(
		workspace,
		"node_modules",
		"@playwright",
		"test",
		"cli.js",
	);
	if (!existsSync(playwrightCli))
		throw new Error("Playwright is not installed in the workspace");
	await child(
		process.execPath,
		[
			playwrightCli,
			"test",
			"tests/browser/desktop-demo.browser.spec.ts",
			...DEMO_BROWSER_VERIFICATION_FLAGS,
		],
		{
			env: {
				...withoutInteractiveDemoCredentials(process.env),
				FITWAY_DEMO_OWNER_PASSWORD: credentials.ownerPassword,
				FITWAY_DEMO_STAFF_PIN: credentials.staffPin,
				FITWAY_RUN_ID: "desktop_demo_live",
				FITWAY_PLAYWRIGHT_BASE_URL: DEMO_WEB_URL,
				FITWAY_PLAYWRIGHT_SKIP_WEBSERVER: "true",
				FITWAY_PLAYWRIGHT_OUTPUT_DIR: path.join(runtime, "playwright"),
			},
		},
	);
	console.log(
		"Demo API, authentication, authorization, and live browser proof passed.",
	);
}

async function openOwner() {
	const ownerPassword = requireOwnerPassword();
	await waitFor(DEMO_SERVER_URL, "Demo server");
	await waitFor(DEMO_WEB_URL, "Demo web app");
	const { chromium } = await import("@playwright/test");
	const browser = await chromium.launch({ headless: false });
	try {
		const context = await browser.newContext();
		const page = await context.newPage();
		await page.goto(DEMO_WEB_URL);
		const statusCode = await page.evaluate(
			async ({ email, password, serverUrl }) =>
				(
					await fetch(`${serverUrl}/api/auth/owner/password`, {
						method: "POST",
						credentials: "include",
						headers: {
							Accept: "application/json",
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ email, password }),
					})
				).status,
			{
				email: DEMO_OWNER_EMAIL,
				password: ownerPassword,
				serverUrl: DEMO_SERVER_URL,
			},
		);
		if (statusCode !== 200)
			throw new Error(`Owner authentication failed with status ${statusCode}`);
		await page.goto(`${DEMO_WEB_URL}/admin`);
		console.log(
			"Owner walkthrough opened in an ephemeral authenticated Chromium window. Close the window to finish.",
		);
		await new Promise<void>((resolve) => browser.once("disconnected", resolve));
	} catch (error) {
		await browser.close();
		throw error;
	}
}

async function clean() {
	await requestStop();
	assertDemoOperation({
		databaseUrl: DEMO_DATABASE_URL,
		composeProject: DEMO_COMPOSE_PROJECT,
		workspace,
		runtimePath: runtime,
	});
	await compose(["down", "--volumes", "--remove-orphans"]);
	await rm(runtime, { recursive: true, force: true });
}

const action = process.argv[2] as Action | undefined;
if (
	!action ||
	![
		"prepare",
		"reset",
		"start",
		"status",
		"verify",
		"owner",
		"stop",
		"clean",
	].includes(action)
)
	throw new Error(
		"Usage: scripts/demo.ps1 <prepare|reset|start|status|verify|owner|stop|clean>",
	);
if (action === "prepare") {
	if (!existsSync(path.join(workspace, "node_modules")))
		throw new Error(
			"Dependencies are missing; run pnpm install --frozen-lockfile before preparing the demo",
		);
	await child(process.execPath, ["--version"]);
	if (!process.env.npm_execpath?.toLowerCase().includes("pnpm"))
		throw new Error("Run demo preparation through pnpm demo:prepare");
	await child("py", ["--version"]);
	await child("docker", ["version"]);
	await assertAvailableLoopbackPort(3100, "Demo server");
	await assertAvailableLoopbackPort(3101, "Demo web");
	const { chromium } = await import("@playwright/test");
	if (!existsSync(chromium.executablePath()))
		throw new Error(
			"Playwright Chromium is missing; run pnpm exec playwright install chromium",
		);
	await child(process.execPath, ["scripts/verify-repository.mjs"]);
	await startPostgres();
	await migrateDemoDatabase(DEMO_DATABASE_URL);
	await secrets();
	console.log(
		"Demo prerequisites, reviewed migrations, and loopback Postgres are ready.",
	);
} else if (action === "reset") await reset();
else if (action === "start") await start();
else if (action === "status") await status();
else if (action === "verify") await verify();
else if (action === "owner") await openOwner();
else if (action === "stop") {
	await requestStop();
	await compose(["stop", "postgres"]);
	console.log(
		"Demo processes and loopback Postgres stopped; volume preserved.",
	);
} else await clean();
