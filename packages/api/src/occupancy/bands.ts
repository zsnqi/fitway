export type OccupancyBand = "quiet" | "moderate" | "busy" | "packed";

export type BandThresholds = {
	quietMaxPercent: number;
	moderateMaxPercent: number;
	busyMaxPercent: number;
};

export function assertBandSettings(
	capacity: number,
	thresholds: BandThresholds,
): void {
	if (!Number.isInteger(capacity) || capacity <= 0) {
		throw new RangeError("Capacity must be a positive integer");
	}
	const { quietMaxPercent, moderateMaxPercent, busyMaxPercent } = thresholds;
	if (
		![quietMaxPercent, moderateMaxPercent, busyMaxPercent].every(
			Number.isInteger,
		) ||
		quietMaxPercent < 0 ||
		quietMaxPercent >= moderateMaxPercent ||
		moderateMaxPercent >= busyMaxPercent ||
		busyMaxPercent > 100
	) {
		throw new RangeError("Band thresholds must be ascending percentages");
	}
}

export function floorOccupancy(value: number): number {
	if (!Number.isSafeInteger(value)) {
		throw new RangeError("Occupancy must be a safe integer");
	}
	return Math.max(0, value);
}

export function bandFor(
	count: number,
	capacity: number,
	thresholds: BandThresholds,
): OccupancyBand {
	assertBandSettings(capacity, thresholds);
	const normalizedCount = floorOccupancy(count);
	const percent = (normalizedCount / capacity) * 100;
	if (percent <= thresholds.quietMaxPercent) return "quiet";
	if (percent <= thresholds.moderateMaxPercent) return "moderate";
	if (percent <= thresholds.busyMaxPercent) return "busy";
	return "packed";
}
