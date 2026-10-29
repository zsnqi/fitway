import { readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { checkoutFixture } from "../.agents/skills/gardener/checkout-test-fixture.mjs";
import { assertProjectStateInvariants } from "./project-state-invariants.mjs";
import { assertProjectStateUpdatedAt } from "./verify-repository.mjs";
import {
	LEASE_GATES,
	LEDGER_UPDATED_AT,
	ledgerWithLease,
} from "./verify-repository-ledger.fixture.ts";

const fixtures: ReturnType<typeof checkoutFixture>[] = [];

afterEach(() => {
	vi.useRealTimers();
	for (const fixture of fixtures.splice(0)) fixture.dispose();
});

function ledger(
	sharedLeases: string[],
	{
		status = "IN_PROGRESS",
		updatedAt = LEDGER_UPDATED_AT,
	}: { status?: string; updatedAt?: string } = {},
) {
	const result = ledgerWithLease("2026-10-30T14:35:00+03:00");
	result.state.updatedAt = updatedAt;
	const milestone = result.state.milestones["lease-fixture"];
	milestone.sharedLeases = sharedLeases;
	milestone.status = status;
	if (status === "DONE") {
		milestone.gates = { ...LEASE_GATES };
		milestone.integratedCommit = "abc1234";
	}
	return result;
}

function invariantError(value: ReturnType<typeof ledger>) {
	try {
		assertProjectStateInvariants(value.state, value.milestones);
	} catch (error) {
		return error instanceof Error ? error.message : String(error);
	}
	return "";
}

function gitFixture(prefix: string) {
	const fixture = checkoutFixture(prefix);
	fixtures.push(fixture);
	return fixture;
}

function writeLedger(
	fixture: ReturnType<typeof checkoutFixture>,
	state: ReturnType<typeof ledger>["state"],
) {
	writeFileSync(
		path.join(fixture.checkout, "PROJECT_STATE.yaml"),
		stringifyYaml(state),
		"utf8",
	);
}

function updatedAtCheck(fixture: ReturnType<typeof checkoutFixture>) {
	const currentText = readFileSync(
		path.join(fixture.checkout, "PROJECT_STATE.yaml"),
		"utf8",
	);
	return assertProjectStateUpdatedAt({
		repositoryRoot: fixture.checkout,
		currentText,
		state: parseYaml(currentText),
	});
}

function withGitDates<T>(date: string, action: () => T) {
	const previousAuthor = process.env.GIT_AUTHOR_DATE;
	const previousCommitter = process.env.GIT_COMMITTER_DATE;
	process.env.GIT_AUTHOR_DATE = date;
	process.env.GIT_COMMITTER_DATE = date;
	try {
		return action();
	} finally {
		if (previousAuthor === undefined) delete process.env.GIT_AUTHOR_DATE;
		else process.env.GIT_AUTHOR_DATE = previousAuthor;
		if (previousCommitter === undefined) delete process.env.GIT_COMMITTER_DATE;
		else process.env.GIT_COMMITTER_DATE = previousCommitter;
	}
}

function commitAt(fixture: ReturnType<typeof checkoutFixture>, date: string) {
	withGitDates(date, () => fixture.commit());
}

describe("shared lease ends", () => {
	it("accepts an end on the ledger date and rejects the previous day", () => {
		const current = ledger([
			"scripts/fixture.ts, a coordinator lease through 2026-09-15",
		]);
		expect(() =>
			assertProjectStateInvariants(current.state, current.milestones),
		).not.toThrow();

		const entry = "scripts/fixture.ts, a coordinator lease through 2026-09-14";
		const message = invariantError(ledger([entry]));
		expect(message).toContain("lease-fixture");
		expect(message).toContain(entry);
		expect(message).toContain("2026-09-14");
		expect(message).toContain(current.state.updatedAt);
		expect(message).toContain(
			"renew it with a later through YYYY-MM-DD date or drop it",
		);
	});

	it("uses only the ledger date when the wall clock changes", () => {
		const ledgers = [
			ledger(["scripts/fixture.ts, lease through 2026-09-15"]),
			ledger(["scripts/fixture.ts, lease through 2026-09-14"]),
		];
		vi.useFakeTimers();
		for (const now of ["2026-01-01T00:00:00Z", "2030-01-01T00:00:00Z"]) {
			vi.setSystemTime(new Date(now));
			expect(() =>
				assertProjectStateInvariants(ledgers[0].state, ledgers[0].milestones),
			).not.toThrow();
			expect(() =>
				assertProjectStateInvariants(ledgers[1].state, ledgers[1].milestones),
			).toThrow(/ended 2026-09-14/);
		}
	});

	it("accepts a lease with no end", () => {
		const value = ledger(["scripts/fixture.ts, a coordinator lease"]);
		expect(() =>
			assertProjectStateInvariants(value.state, value.milestones),
		).not.toThrow();
	});

	it.each([
		"scripts/fixture.ts, lease until 2026-12-01",
		"scripts/fixture.ts, lease end 2026-12-01",
		"scripts/fixture.ts, lease expiry=2026-12-01",
		"scripts/fixture.ts, lease expires on 2026-12-01",
		"scripts/fixture.ts, lease through 2026-11-15 and through 2026-12-15",
		"scripts/fixture.ts, lease through 2026-02-30",
		"scripts/fixture.ts, a coordinator lease expires 2026-10-23T00:00",
		"scripts/fixture.ts, a coordinator lease until 2026/10/23",
		"scripts/fixture.ts, lease through 2026.11.15",
		"scripts/fixture.ts, lease through 2026-11-15T00:00",
	])("rejects the lease form %s", (entry) => {
		const message = invariantError(ledger([entry]));
		expect(message).toContain(entry);
		expect(message).toContain("through YYYY-MM-DD");
	});

	it("accepts start and renewal dates beside the one end", () => {
		const value = ledger(
			[
				"scripts/fixture.ts, from 2026-10-28 through 2026-11-15 (renewed on 2026-10-29)",
			],
			{ updatedAt: "2026-10-29T14:35:00+03:00" },
		);
		expect(() =>
			assertProjectStateInvariants(value.state, value.milestones),
		).not.toThrow();
	});

	it("does not judge a terminal milestone's ended lease", () => {
		const value = ledger(["scripts/fixture.ts, lease through 2026-09-01"], {
			status: "DONE",
		});
		expect(() =>
			assertProjectStateInvariants(value.state, value.milestones),
		).not.toThrow();
	});
});

describe("ledger write time", () => {
	it("requires an edited ledger's updatedAt to move past HEAD", () => {
		const fixture = gitFixture("lease-write-edit-");
		const value = ledger(["scripts/fixture.ts, lease through 2026-11-15"], {
			updatedAt: "2026-10-29T10:00:00+03:00",
		});
		writeLedger(fixture, value.state);
		commitAt(fixture, "2026-10-29T10:05:00+03:00");

		value.state.baseline.validationRecord = "docs/validation-2.md";
		writeLedger(fixture, value.state);
		expect(() => updatedAtCheck(fixture)).toThrow(
			/updatedAt 2026-10-29T10:00:00\+03:00 is not later than HEAD's.*set updatedAt to the time of the write/,
		);

		value.state.updatedAt = "2026-10-29T11:00:00+03:00";
		writeLedger(fixture, value.state);
		expect(() => updatedAtCheck(fixture)).not.toThrow();
	});

	it("requires the ledger date to match its last committer date", () => {
		const fixture = gitFixture("lease-write-commit-");
		const value = ledger(["scripts/fixture.ts, lease through 2026-11-15"], {
			updatedAt: "2026-10-29T10:00:00+03:00",
		});
		writeLedger(fixture, value.state);
		commitAt(fixture, "2026-10-29T23:59:00+03:00");
		expect(() => updatedAtCheck(fixture)).not.toThrow();

		writeFileSync(path.join(fixture.checkout, "unrelated.txt"), "later\n");
		commitAt(fixture, "2030-01-01T00:00:00Z");
		expect(() => updatedAtCheck(fixture)).not.toThrow();
	});

	it.each([
		["after", "2026-10-30T08:00:00+03:00"],
		["before", "2026-10-28T23:59:00+03:00"],
	])("rejects a ledger committed a day %s its updatedAt", (_, date) => {
		const fixture = gitFixture(`lease-write-${date.slice(0, 10)}-`);
		const value = ledger(["scripts/fixture.ts, lease through 2026-11-15"], {
			updatedAt: "2026-10-29T10:00:00+03:00",
		});
		writeLedger(fixture, value.state);
		commitAt(fixture, date);
		expect(() => updatedAtCheck(fixture)).toThrow(
			new RegExp(
				`updatedAt 2026-10-29T10:00:00\\+03:00.*committer time ${date.replaceAll("+", "\\+")}.*set updatedAt to the time of the write`,
			),
		);
	});

	it("passes when HEAD holds no ledger and no commit changed it", () => {
		const fixture = gitFixture("lease-write-no-head-");
		rmSync(path.join(fixture.checkout, "PROJECT_STATE.yaml"));
		withGitDates("2026-10-29T10:00:00+03:00", () => {
			fixture.git(["add", "--all"]);
			fixture.git([
				"-c",
				"user.name=Gardener fixture",
				"-c",
				"user.email=gardener@example.test",
				"commit",
				"--amend",
				"--allow-empty",
				"--no-edit",
			]);
		});
		writeLedger(
			fixture,
			ledger(["scripts/fixture.ts, lease through 2026-11-15"]).state,
		);
		expect(() => updatedAtCheck(fixture)).not.toThrow();
	});
});
