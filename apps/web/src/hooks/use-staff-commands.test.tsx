// @vitest-environment happy-dom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
	acceptStaffCommand,
	type StaffCommandTransport,
	useStaffCommands,
} from "./use-staff-commands";

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
	it("preserves server-reported statuses without inventing a transition", () => {
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
			{ id: 41, status: "pending" },
		]);
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
		expect(container.textContent).toBe("pending");
		expect(onAccepted).toHaveBeenCalledOnce();
	});
});
