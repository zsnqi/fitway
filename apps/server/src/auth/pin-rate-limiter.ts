export type PinRateLimitResult =
	| { allowed: true }
	| { allowed: false; retryAfterSeconds: number };

export class PinRateLimiter {
	readonly #maximumFailures: number;
	readonly #windowMs: number;
	#failures: number[] = [];

	constructor(maximumFailures = 5, windowMs = 15 * 60 * 1_000) {
		this.#maximumFailures = maximumFailures;
		this.#windowMs = windowMs;
	}

	check(now = new Date()): PinRateLimitResult {
		const cutoff = now.getTime() - this.#windowMs;
		this.#failures = this.#failures.filter((attempt) => attempt > cutoff);
		if (this.#failures.length < this.#maximumFailures) return { allowed: true };
		const firstFailure = this.#failures[0];
		if (firstFailure === undefined) return { allowed: true };
		return {
			allowed: false,
			retryAfterSeconds: Math.max(
				1,
				Math.ceil((firstFailure + this.#windowMs - now.getTime()) / 1_000),
			),
		};
	}

	recordFailure(now = new Date()) {
		this.#failures.push(now.getTime());
	}

	reset() {
		this.#failures = [];
	}
}
