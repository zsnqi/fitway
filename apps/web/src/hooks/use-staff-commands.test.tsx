// @vitest-environment happy-dom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
	StaffCommandRecord,
	StaffCommandTransport,
} from "./use-staff-commands";
import { useStaffCommands } from "./use-staff-commands";

const pending: StaffCommandRecord = {
	id: 41,
	type: "set_count",
	targetValue: 38,
	status: "pending",
	reason: "Door recount",
	issuedAt: "2026-07-22T12:00:00.000Z",
	deliveredAt: "2026-07-22T12:00:10.000Z",
	appliedAt: null,
	supersededAt: null,
	supersededByCommandId: null,
};

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

	it("renders only the refreshed server lifecycle state after a mutation", async () => {
		const transport: StaffCommandTransport = {
			issueCorrection: vi.fn(async () => firstResult),
			issueReset: vi.fn(),
			readRecentCommands: vi
				.fn()
				.mockResolvedValueOnce([pending])
				.mockResolvedValueOnce([
					{
						...pending,
						status: "applied",
						appliedAt: "2026-07-22T12:00:20.000Z",
					},
				]),
		};
		const onAccepted = vi.fn(async () => undefined);

		function Harness() {
			const commands = useStaffCommands({ transport, onAccepted });
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
		expect(container.textContent).toBe("pending");
		await act(async () => container.querySelector("button")?.click());

		expect(transport.issueCorrection).toHaveBeenCalledWith({
			delta: 1,
			reason: "Door recount",
		});
		expect(transport.readRecentCommands).toHaveBeenCalledTimes(2);
		expect(container.textContent).toBe("applied");
		expect(onAccepted).toHaveBeenCalledOnce();
	});

	it("does not turn delivery metadata into a lifecycle status", async () => {
		const transport: StaffCommandTransport = {
			issueCorrection: vi.fn(),
			issueReset: vi.fn(),
			readRecentCommands: vi.fn(async () => [pending]),
		};

		function Harness() {
			const commands = useStaffCommands({ transport });
			return <output>{commands.history[0]?.status ?? "empty"}</output>;
		}

		await act(async () => root.render(<Harness />));
		expect(container.textContent).toBe("pending");
	});
});
