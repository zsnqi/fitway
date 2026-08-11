import { describe, expect, it } from "vitest";

import { decidePushAuthority } from "./reconciliation";

describe("offline reconciliation authority", () => {
	it("keeps backfill history-only and blocks v2 live authority behind pending commands", () => {
		expect(
			decidePushAuthority({
				schemaVersion: 2,
				mode: "backfill",
				hasPendingCommand: true,
				liveSampleFresh: false,
			}),
		).toEqual({
			writeHistory: true,
			writeCurrent: false,
			writeHealth: false,
			advanceSequence: true,
		});
		expect(
			decidePushAuthority({
				schemaVersion: 2,
				mode: "live",
				hasPendingCommand: true,
				liveSampleFresh: true,
			}),
		).toEqual({
			writeHistory: false,
			writeCurrent: false,
			writeHealth: false,
			advanceSequence: false,
		});
		expect(
			decidePushAuthority({
				schemaVersion: 2,
				mode: "live",
				hasPendingCommand: false,
				liveSampleFresh: true,
			}),
		).toEqual({
			writeHistory: true,
			writeCurrent: true,
			writeHealth: true,
			advanceSequence: true,
		});
	});

	it("settles stale v2 live history without restoring current or health authority", () => {
		expect(
			decidePushAuthority({
				schemaVersion: 2,
				mode: "live",
				hasPendingCommand: false,
				liveSampleFresh: false,
			}),
		).toEqual({
			writeHistory: true,
			writeCurrent: false,
			writeHealth: false,
			advanceSequence: true,
		});
	});
});
