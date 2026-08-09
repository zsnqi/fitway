export type PushAuthority = {
	writeHistory: boolean;
	writeCurrent: boolean;
	writeHealth: boolean;
	advanceSequence: boolean;
};

export function decidePushAuthority(value: {
	schemaVersion: 1 | 2;
	mode: "live" | "backfill";
	hasPendingCommand: boolean;
	liveSampleFresh: boolean;
}): PushAuthority {
	if (value.mode === "backfill") {
		return {
			writeHistory: true,
			writeCurrent: false,
			writeHealth: false,
			advanceSequence: true,
		};
	}
	if (value.schemaVersion === 2 && value.hasPendingCommand) {
		return {
			writeHistory: false,
			writeCurrent: false,
			writeHealth: false,
			advanceSequence: false,
		};
	}
	if (value.schemaVersion === 2 && !value.liveSampleFresh) {
		return {
			writeHistory: true,
			writeCurrent: false,
			writeHealth: false,
			advanceSequence: true,
		};
	}
	return {
		writeHistory: true,
		writeCurrent: true,
		writeHealth: true,
		advanceSequence: true,
	};
}
