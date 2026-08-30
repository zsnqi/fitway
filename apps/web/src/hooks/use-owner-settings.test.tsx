// @vitest-environment happy-dom

import { ORPCError } from "@orpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { read, update } = vi.hoisted(() => ({
	read: vi.fn(),
	update: vi.fn(),
}));
vi.mock("@/utils/orpc", () => ({
	client: {
		admin: {
			settings: { read, update },
		},
	},
}));

import { useOwnerSettings } from "./use-owner-settings";

const snapshot = {
	version: 7,
	effectiveFromUtc: "2026-08-30T12:00:00.000Z",
	editable: {
		capacity: 220,
		thresholds: {
			quietMaxPercent: 30,
			moderateMaxPercent: 55,
			busyMaxPercent: 80,
		},
		weeklySchedule: {
			sun: { open: "06:00", close: "23:00" },
			mon: { open: "06:00", close: "23:00" },
			tue: { open: "06:00", close: "23:00" },
			wed: { open: "06:00", close: "23:00" },
			thu: { open: "06:00", close: "23:00" },
			fri: { open: "13:00", close: "01:00" },
			sat: null,
		},
		businessDayBoundary: "04:00",
		resetBufferMinutes: 15,
	},
	operational: {
		timezone: "Asia/Riyadh",
		pushIntervalSeconds: 20,
		freshForSeconds: 90,
		operationalStaleAfterSeconds: 180,
		publicPollSeconds: 60,
	},
};

const saveOutput = {
	settings: { ...snapshot, version: 8 },
	auditId: 42,
};

const updateInput = {
	expectedVersion: 7,
	editable: snapshot.editable,
};

function Probe({ enabled }: { enabled: boolean }) {
	const settings = useOwnerSettings({ enabled });
	const outcome = settings.save.outcome;
	return (
		<div
			data-status={settings.status}
			data-version={settings.snapshot?.version ?? ""}
			data-outcome={
				outcome.phase === "success"
					? `success:${outcome.output.settings.version}`
					: outcome.phase
			}
			data-reloading={settings.isReloading ? "1" : "0"}
		>
			<button type="button" data-do="retry" onClick={settings.retry}>
				r
			</button>
			<button
				type="button"
				data-do="reload"
				onClick={() => void settings.reload()}
			>
				l
			</button>
			<button
				type="button"
				data-do="submit"
				onClick={() => settings.save.submit(updateInput)}
			>
				s
			</button>
			<button type="button" data-do="reset" onClick={settings.save.reset}>
				x
			</button>
		</div>
	);
}

let root: Root | undefined;
let container: HTMLDivElement;
let lastQueryClient: QueryClient;

async function settle() {
	for (let pass = 0; pass < 4; pass += 1) {
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});
	}
}

async function render(enabled = true) {
	lastQueryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	await act(async () => {
		root?.render(
			<QueryClientProvider client={lastQueryClient}>
				<Probe enabled={enabled} />
			</QueryClientProvider>,
		);
	});
	await settle();
}

async function rerender(enabled: boolean) {
	await act(async () => {
		root?.render(
			<QueryClientProvider client={lastQueryClient}>
				<Probe enabled={enabled} />
			</QueryClientProvider>,
		);
	});
	await settle();
}

function probe() {
	const element = container.firstElementChild as HTMLElement;
	return {
		status: element.getAttribute("data-status"),
		version: element.getAttribute("data-version"),
		outcome: element.getAttribute("data-outcome"),
		button: (doWhat: string) =>
			element.querySelector(`[data-do="${doWhat}"]`) as HTMLButtonElement,
	};
}

async function click(doWhat: string) {
	await act(async () => {
		probe()
			.button(doWhat)
			.dispatchEvent(new MouseEvent("click", { bubbles: true }));
	});
	await settle();
}

beforeEach(() => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	read.mockReset();
	update.mockReset();
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	if (root) await act(async () => root?.unmount());
	container.remove();
});

describe("owner settings read", () => {
	it("stands down and issues no request until enablement is granted", async () => {
		read.mockResolvedValue(snapshot);
		await render(false);

		expect(probe().status).toBe("standby");
		expect(read).not.toHaveBeenCalled();

		await rerender(true);

		expect(probe().status).toBe("success");
		expect(read).toHaveBeenCalledTimes(1);
		expect(probe().version).toBe("7");
	});

	it("surfaces a transport failure as an error without substituting values", async () => {
		read.mockRejectedValue(new Error("Service Unavailable"));
		await render();

		expect(probe().status).toBe("error");
		expect(probe().version).toBe("");
	});

	it("surfaces a malformed payload as an error rather than rendering it", async () => {
		read.mockResolvedValue({
			...snapshot,
			editable: { ...snapshot.editable, capacity: 0 },
		});
		await render();

		expect(probe().status).toBe("error");
	});
});

describe("owner settings save", () => {
	it("reports success and adopts the appended snapshot as the new baseline", async () => {
		read.mockResolvedValue(snapshot);
		update.mockResolvedValue(saveOutput);
		await render();

		await click("submit");

		expect(probe().outcome).toBe("success:8");
		expect(probe().version).toBe("8");
		expect(update).toHaveBeenCalledWith(updateInput);
	});

	it("maps only the typed settings conflict to the conflict phase", async () => {
		read.mockResolvedValue(snapshot);
		update.mockRejectedValue(
			new ORPCError("CONFLICT", {
				message: "Settings were updated by someone else",
				data: { code: "settings_version_conflict" },
			}),
		);
		await render();

		await click("submit");

		expect(probe().outcome).toBe("conflict");
		// A conflict is never mistaken for a success: the baseline version is
		// unchanged until an explicit Discard reloads the server values.
		expect(probe().version).toBe("7");
	});

	it("reports unexpected failures as failed, not as a conflict", async () => {
		read.mockResolvedValue(snapshot);
		update.mockRejectedValue(new ORPCError("INTERNAL_SERVER_ERROR"));
		await render();

		await click("submit");

		expect(probe().outcome).toBe("failed");
	});

	it("clears the outcome on reset so the form returns to its clean phase", async () => {
		read.mockResolvedValue(snapshot);
		update.mockResolvedValue(saveOutput);
		await render();

		await click("submit");
		await click("reset");

		expect(probe().outcome).toBe("idle");
	});
});
