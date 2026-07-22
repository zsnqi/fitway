// @vitest-environment happy-dom

import type { OperationalSnapshot } from "@fitway/api/health/snapshot";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
	acceptStaffCommand,
	reconcileStaffCommands,
	type StaffCommandTransport,
	useStaffCommands,
} from "./use-staff-commands";

const snapshot = {
	schemaVersion: 1,
	computedAt: "2026-07-22T12:00:30.000Z",
	occupancy: {
		schemaVersion: 2,
		freshness: "fresh",
		timeZone: "Asia/Riyadh",
		band: "moderate",
		count: 38,
		lastUpdatedAt: "2026-07-22T12:00:30.000Z",
		freshUntil: "2026-07-22T12:02:00.000Z",
		source: "edge",
		computedAt: "2026-07-22T12:00:30.000Z",
		trend: null,
	},
	capacity: 100,
	source: "edge",
	health: {
		freshness: "current",
		condition: "healthy",
		process: "ok",
		camera: "ok",
		feed: "ok",
		detectorFps: 7.5,
		edgeObservedAt: "2026-07-22T12:00:29.000Z",
		receivedAt: "2026-07-22T12:00:30.000Z",
		lastSeenAt: "2026-07-22T12:00:30.000Z",
		staleAt: "2026-07-22T12:05:30.000Z",
	},
} satisfies OperationalSnapshot;

const firstResult = {
	command: {
		id: 41,
		type: "set_count" as const,
		targetValue: 38,
		status: "pending" as const,
		reason: "Door recount",
		issuedAt: "2026-07-22T12:00:00.000Z",
	},
	auditId: 81,
};

describe("staff command session lifecycle", () => {
	it("keeps a new command pending and supersedes an older pending command", () => {
		const first = acceptStaffCommand([], firstResult);
		const second = acceptStaffCommand(first, {
			command: {
				...firstResult.command,
				id: 42,
				targetValue: 40,
				issuedAt: "2026-07-22T12:00:10.000Z",
			},
			auditId: 82,
		});

		expect(second.map(({ id, status }) => ({ id, status }))).toEqual([
			{ id: 42, status: "pending" },
			{ id: 41, status: "superseded" },
		]);
	});

	it("marks pending applied only after an advanced matching edge reading", () => {
		const pending = acceptStaffCommand([], firstResult);
		expect(
			reconcileStaffCommands(pending, {
				...snapshot,
				occupancy: {
					...snapshot.occupancy,
					lastUpdatedAt: "2026-07-22T11:59:59.000Z",
				},
			})[0]?.status,
		).toBe("pending");
		expect(
			reconcileStaffCommands(pending, {
				...snapshot,
				occupancy: { ...snapshot.occupancy, count: 39 },
			})[0]?.status,
		).toBe("pending");
		expect(reconcileStaffCommands(pending, snapshot)[0]?.status).toBe(
			"applied",
		);
	});
});

describe("useStaffCommands", () => {
	let root: Root;
	let container: HTMLDivElement;

	beforeEach(() => {
		Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
		container = document.createElement("div");
		document.body.append(container);
		root = createRoot(container);
	});

	afterEach(async () => {
		await act(async () => root.unmount());
		container.remove();
	});

	it("submits through the integrated transport, records the result, and refreshes", async () => {
		const transport: StaffCommandTransport = {
			issueCorrection: vi.fn(async () => firstResult),
			issueReset: vi.fn(),
		};
		const onAccepted = vi.fn(async () => undefined);

		function Harness() {
			const commands = useStaffCommands({
				snapshot,
				transport,
				onAccepted,
			});
			return (
				<button
					type="button"
					onClick={() =>
						void commands.issueCorrection({
							delta: 1,
							reason: "Door recount",
						})
					}
				>
					{commands.history[0]?.status ?? "empty"}
				</button>
			);
		}

		await act(async () => root.render(<Harness />));
		await act(async () => container.querySelector("button")?.click());

		expect(transport.issueCorrection).toHaveBeenCalledWith({
			delta: 1,
			reason: "Door recount",
		});
		expect(container.textContent).toBe("applied");
		expect(onAccepted).toHaveBeenCalledOnce();
	});
});
