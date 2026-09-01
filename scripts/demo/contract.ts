import path from "node:path";

export const DEMO_COMPOSE_PROJECT = "fitway-desktop-demo";
export const DEMO_DATABASE_NAME = "fitway_desktop_demo";
export const DEMO_DATABASE_URL =
	"postgresql://fitway_demo:fitway_demo_local@127.0.0.1:55432/fitway_desktop_demo";
export const DEMO_RUNTIME_RELATIVE_PATH = path.join(".local", "demo");
export const DEMO_OWNER_EMAIL = "owner@demo.fitway.local";
export const DEMO_WEB_URL = "http://localhost:3101";
export const DEMO_SERVER_URL = "http://localhost:3100";
export const DEMO_PROCESS_MARKERS = {
	server: "scripts/demo/server.ts",
	web: "apps/web/node_modules/vite/bin/vite.js",
	simulator: "edge/simulator.py",
} as const;

export type DemoProcessRole = keyof typeof DEMO_PROCESS_MARKERS;

function normalized(value: string) {
	return process.platform === "win32" ? value.toLowerCase() : value;
}

export function assertDemoDatabaseUrl(value: string | undefined) {
	if (!value) throw new Error("Demo DATABASE_URL is required");
	let parsed: URL;
	try {
		parsed = new URL(value);
	} catch {
		throw new Error("Demo DATABASE_URL must be a valid URL");
	}
	if (
		parsed.protocol !== "postgresql:" ||
		parsed.hostname !== "127.0.0.1" ||
		parsed.port !== "55432" ||
		parsed.username !== "fitway_demo" ||
		parsed.password !== "fitway_demo_local" ||
		parsed.pathname !== `/${DEMO_DATABASE_NAME}` ||
		parsed.search ||
		parsed.hash
	) {
		throw new Error(
			"Demo database must be the fixed loopback fitway_desktop_demo URL",
		);
	}
	return parsed;
}

export function assertDemoComposeProject(value: string | undefined) {
	if (value !== DEMO_COMPOSE_PROJECT) {
		throw new Error(
			`Compose project must exactly equal ${DEMO_COMPOSE_PROJECT}`,
		);
	}
	return value;
}

/** Resolves the only directory the harness is allowed to remove. */
export function assertDemoRuntimePath(workspace: string, candidate?: string) {
	const root = path.resolve(workspace);
	const expected = path.resolve(root, DEMO_RUNTIME_RELATIVE_PATH);
	const target = path.resolve(candidate ?? expected);
	const prefix = `${normalized(root)}${path.sep}`;
	if (
		normalized(target) !== normalized(expected) ||
		!normalized(target).startsWith(prefix)
	) {
		throw new Error("Demo runtime path must resolve to workspace/.local/demo");
	}
	return target;
}

export function assertDemoOperation(input: {
	databaseUrl?: string;
	composeProject?: string;
	workspace: string;
	runtimePath?: string;
}) {
	assertDemoDatabaseUrl(input.databaseUrl);
	assertDemoComposeProject(input.composeProject);
	return assertDemoRuntimePath(input.workspace, input.runtimePath);
}

export function assertOwnedProcessCommand(
	commandLine: string | undefined,
	marker: string,
) {
	if (!commandLine?.toLowerCase().includes(marker.toLowerCase())) {
		throw new Error(
			"Refusing to terminate a process not owned by the demo harness",
		);
	}
}

export function assertOwnedProcessRecord(value: unknown): asserts value is {
	role: DemoProcessRole;
	pid: number;
	marker: string;
} {
	if (!value || typeof value !== "object")
		throw new Error("Demo process record is malformed; refusing to act on it");
	const record = value as { role?: unknown; pid?: unknown; marker?: unknown };
	if (
		typeof record.role !== "string" ||
		!(record.role in DEMO_PROCESS_MARKERS) ||
		!Number.isSafeInteger(record.pid) ||
		Number(record.pid) <= 0 ||
		record.marker !== DEMO_PROCESS_MARKERS[record.role as DemoProcessRole]
	) {
		throw new Error("Demo process record is malformed; refusing to act on it");
	}
}
