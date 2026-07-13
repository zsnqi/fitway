export type RateLimitDecision =
	| { allowed: true }
	| { allowed: false; retryAfterSeconds: number };

type Bucket = { tokens: number; updatedAt: number; lastUsedAt: number };

export class DeviceRateLimiter {
	private readonly buckets = new Map<string, Bucket>();

	constructor(
		private readonly now: () => number = Date.now,
		private readonly capacity = 3,
		private readonly refillEveryMs = 5_000,
		private readonly idleTtlMs = 10 * 60_000,
		private readonly maxEntries = 1_000,
	) {}

	consume(deviceId: string): RateLimitDecision {
		const now = this.now();
		this.evict(now);
		if (!this.buckets.has(deviceId) && this.buckets.size >= this.maxEntries) {
			let oldest: [string, Bucket] | undefined;
			for (const entry of this.buckets) {
				if (!oldest || entry[1].lastUsedAt < oldest[1].lastUsedAt)
					oldest = entry;
			}
			if (oldest) this.buckets.delete(oldest[0]);
		}
		const bucket = this.buckets.get(deviceId) ?? {
			tokens: this.capacity,
			updatedAt: now,
			lastUsedAt: now,
		};
		const refill = (now - bucket.updatedAt) / this.refillEveryMs;
		bucket.tokens = Math.min(this.capacity, bucket.tokens + refill);
		bucket.updatedAt = now;
		bucket.lastUsedAt = now;
		this.buckets.set(deviceId, bucket);
		if (bucket.tokens < 1) {
			return {
				allowed: false,
				retryAfterSeconds: Math.max(
					1,
					Math.ceil(((1 - bucket.tokens) * this.refillEveryMs) / 1_000),
				),
			};
		}
		bucket.tokens -= 1;
		return { allowed: true };
	}

	private evict(now: number): void {
		for (const [key, value] of this.buckets) {
			if (now - value.lastUsedAt > this.idleTtlMs) this.buckets.delete(key);
		}
	}
}
