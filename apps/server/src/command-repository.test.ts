import { describe, expect, it, vi } from "vitest";

import { createRecentCommandReaderDatabase } from "./command-repository";

const rows = [
	{
		id: 44,
		type: "reset_zero" as const,
		targetValue: null,
		status: "applied" as const,
		reason: "Closing check",
		issuedAt: new Date("2026-07-27T12:04:00.000Z"),
		deliveredAt: new Date("2026-07-27T12:04:20.000Z"),
		appliedAt: new Date("2026-07-27T12:04:40.000Z"),
		supersededAt: null,
		supersededByCommandId: null,
	},
	{
		id: 43,
		type: "set_count" as const,
		targetValue: 17,
		status: "superseded" as const,
		reason: null,
		issuedAt: new Date("2026-07-27T12:03:00.000Z"),
		deliveredAt: new Date("2026-07-27T12:03:20.000Z"),
		appliedAt: null,
		supersededAt: new Date("2026-07-27T12:03:30.000Z"),
		supersededByCommandId: 44,
	},
];

describe("recent command repository reader", () => {
	it("returns the four most recent private lifecycle fields without audit or actor data", async () => {
		const limit = vi.fn(async () => rows);
		const orderBy = vi.fn(() => ({ limit }));
		const from = vi.fn(() => ({ orderBy }));
		const select = vi.fn(() => ({ from }));
		const database = { select };
		const readRecentCommands = createRecentCommandReaderDatabase(
			database as never,
		);

		expect(await readRecentCommands()).toEqual([
			{
				...rows[0],
				issuedAt: "2026-07-27T12:04:00.000Z",
				deliveredAt: "2026-07-27T12:04:20.000Z",
				appliedAt: "2026-07-27T12:04:40.000Z",
				supersededAt: null,
			},
			{
				...rows[1],
				issuedAt: "2026-07-27T12:03:00.000Z",
				deliveredAt: "2026-07-27T12:03:20.000Z",
				appliedAt: null,
				supersededAt: "2026-07-27T12:03:30.000Z",
			},
		]);
		expect(limit).toHaveBeenCalledWith(4);
	});
});
