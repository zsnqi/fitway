import { describe, expect, it, vi } from "vitest";

import { DEMO_DATABASE_URL } from "./contract";
import {
	DEMO_PRESENTATION_TEXT,
	type DemoTextLockTargets,
	type DemoTextSnapshot,
	type DemoTextStore,
	formatDemoTextUpdate,
	updateDemoPresentationText,
} from "./text-update";

const OWNER_ID = "00000000-0000-4000-8000-000000000001";
const STAFF_ID = "00000000-0000-4000-8000-000000000002";

type CommandFixture = {
	commandId: number;
	auditId: number;
	action: "correction_delta" | "correction_absolute" | "reset";
	actor: "owner" | "staff";
	priorValue: number;
	requestedDelta: number | null;
	requestedValue: number | null;
	effectiveValue: number;
	reason: string;
};

function principal(input: {
	id: string;
	kind: "owner" | "shared_staff";
	role: "owner" | "staff";
	email: string | null;
	name: string;
	createdAt: string;
}) {
	return {
		id: input.id,
		principal_kind: input.kind,
		role: input.role,
		active: true,
		owner_email: input.email,
		display_name: input.name,
		created_at: input.createdAt,
		updated_at: input.createdAt,
	};
}

function commandPair(fixture: CommandFixture) {
	const actorId = fixture.actor === "owner" ? OWNER_ID : STAFF_ID;
	const actorKind = fixture.actor === "owner" ? "owner" : "shared_staff";
	const actorRole = fixture.actor === "owner" ? "owner" : "staff";
	const issuedAt = `2026-09-${String(fixture.commandId).padStart(2, "0")}T12:00:00.000Z`;
	const appliedAt = `2026-09-${String(fixture.commandId).padStart(2, "0")}T12:00:35.000Z`;
	return {
		commandRecord: {
			id: fixture.commandId,
			device_id: "00000000-0000-4000-8000-000000000003",
			type: fixture.action === "reset" ? "reset_zero" : "set_count",
			target_value: fixture.action === "reset" ? null : fixture.effectiveValue,
			status: "applied",
			issuer_class: "human",
			issued_by_principal_id: actorId,
			reason: fixture.reason,
			issued_at: issuedAt,
			delivered_at: issuedAt.replace("00.000Z", "20.000Z"),
			applied_at: appliedAt,
			superseded_at: null,
			superseded_by_command_id: null,
		},
		auditRecord: {
			id: fixture.auditId,
			event_class: "command",
			actor_principal_id: actorId,
			actor_principal_kind: actorKind,
			actor_role: actorRole,
			command_id: fixture.commandId,
			command_issuer_class: "human",
			action: fixture.action,
			prior_value: fixture.priorValue,
			requested_delta: fixture.requestedDelta,
			requested_value: fixture.requestedValue,
			effective_value: fixture.effectiveValue,
			target_principal_id: null,
			prior_active: null,
			new_active: null,
			prior_credential_version: null,
			new_credential_version: null,
			settings_version: null,
			reason: fixture.reason,
			created_at: appliedAt,
		},
	};
}

function settingsAudit(id: number, settingsVersion: number, reason: string) {
	return {
		id,
		event_class: "settings",
		actor_principal_id: OWNER_ID,
		actor_principal_kind: "owner",
		actor_role: "owner",
		command_id: null,
		command_issuer_class: null,
		action: "settings_updated",
		prior_value: null,
		requested_delta: null,
		requested_value: null,
		effective_value: null,
		target_principal_id: null,
		prior_active: null,
		new_active: null,
		prior_credential_version: null,
		new_credential_version: null,
		settings_version: settingsVersion,
		reason,
		created_at: `2026-09-0${settingsVersion}T01:00:00.000Z`,
	};
}

function snapshot(final = false): DemoTextSnapshot {
	const reasons = final
		? [
				DEMO_PRESENTATION_TEXT.frontDeskReconciliation,
				DEMO_PRESENTATION_TEXT.occupancyReview,
				DEMO_PRESENTATION_TEXT.closingReset,
				DEMO_PRESENTATION_TEXT.entryGateReconciliation,
			]
		: [
				"Synthetic front-desk headcount reconciliation",
				"Synthetic occupancy review",
				"Synthetic closing walkthrough reset",
				"Synthetic turnstile reconciliation",
			];
	return {
		principals: [
			principal({
				id: OWNER_ID,
				kind: "owner",
				role: "owner",
				email: "owner@demo.fitway.local",
				name: final
					? DEMO_PRESENTATION_TEXT.ownerDisplayName
					: "FITWAY Demo Owner",
				createdAt: "2026-08-10T01:00:00.000Z",
			}),
			principal({
				id: STAFF_ID,
				kind: "shared_staff",
				role: "staff",
				email: null,
				name: final
					? DEMO_PRESENTATION_TEXT.staffDisplayName
					: "Shared front desk",
				createdAt: "2026-08-10T01:05:00.000Z",
			}),
		],
		commandPairs: [
			commandPair({
				commandId: 1,
				auditId: 4,
				action: "correction_delta",
				actor: "staff",
				priorValue: 34,
				requestedDelta: 3,
				requestedValue: null,
				effectiveValue: 37,
				reason: reasons[0] as string,
			}),
			commandPair({
				commandId: 2,
				auditId: 5,
				action: "correction_absolute",
				actor: "owner",
				priorValue: 28,
				requestedDelta: null,
				requestedValue: 25,
				effectiveValue: 25,
				reason: reasons[1] as string,
			}),
			commandPair({
				commandId: 3,
				auditId: 6,
				action: "reset",
				actor: "owner",
				priorValue: 7,
				requestedDelta: null,
				requestedValue: 0,
				effectiveValue: 0,
				reason: reasons[2] as string,
			}),
			commandPair({
				commandId: 4,
				auditId: 7,
				action: "correction_delta",
				actor: "staff",
				priorValue: 52,
				requestedDelta: -2,
				requestedValue: null,
				effectiveValue: 50,
				reason: reasons[3] as string,
			}),
			commandPair({
				commandId: 99,
				auditId: 99,
				action: "correction_delta",
				actor: "owner",
				priorValue: 99,
				requestedDelta: 1,
				requestedValue: null,
				effectiveValue: 100,
				reason: "Accumulated operator record",
			}),
		],
		settingsAudits: [
			settingsAudit(
				3,
				3,
				final
					? DEMO_PRESENTATION_TEXT.settingsBaseline
					: "Synthetic demo baseline",
			),
			settingsAudit(
				8,
				4,
				final
					? DEMO_PRESENTATION_TEXT.septemberSettings
					: "Synthetic owner-demo profile refresh",
			),
		],
	};
}

class MemoryStore implements DemoTextStore {
	events: string[] = [];
	readCount = 0;
	failUpdateAt: number | null = null;
	zeroUpdateAt: number | null = null;
	corruptUnrelatedAfterUpdates = false;
	private updateCount = 0;
	private backup: DemoTextSnapshot | null = null;

	constructor(public data: DemoTextSnapshot) {}

	async begin(mode: "preview" | "apply") {
		this.backup = structuredClone(this.data);
		this.events.push(`begin:${mode}`);
	}

	async readSnapshot() {
		this.readCount += 1;
		this.events.push("read");
		if (this.readCount === 3 && this.corruptUnrelatedAfterUpdates) {
			const unrelated = this.data.commandPairs.find(
				(pair) => pair.commandRecord.id === 99,
			);
			if (unrelated) unrelated.commandRecord.status = "pending";
		}
		return structuredClone(this.data);
	}

	async lockTargets(targets: DemoTextLockTargets) {
		this.events.push(
			`lock:${targets.principalIds.length}:${targets.commandIds.length}:${targets.auditIds.length}`,
		);
	}

	private update(
		table: "auth_principals" | "edge_commands" | "audit_log",
		id: string,
		field: "display_name" | "reason",
		oldText: string,
		newText: string,
	): number {
		this.updateCount += 1;
		this.events.push(`update:${table}:${id}`);
		if (this.failUpdateAt === this.updateCount) {
			throw new Error("injected update failure");
		}
		if (this.zeroUpdateAt === this.updateCount) return 0;
		const records =
			table === "auth_principals"
				? this.data.principals
				: table === "edge_commands"
					? this.data.commandPairs.map((pair) => pair.commandRecord)
					: [
							...this.data.commandPairs.map((pair) => pair.auditRecord),
							...this.data.settingsAudits,
						];
		const record = records.find((candidate) => String(candidate.id) === id);
		if (!record || record[field] !== oldText) return 0;
		record[field] = newText;
		return 1;
	}

	async updatePrincipal(id: string, oldText: string, newText: string) {
		return this.update("auth_principals", id, "display_name", oldText, newText);
	}

	async updateCommandReason(id: string, oldText: string, newText: string) {
		return this.update("edge_commands", id, "reason", oldText, newText);
	}

	async updateAuditReason(id: string, oldText: string, newText: string) {
		return this.update("audit_log", id, "reason", oldText, newText);
	}

	async commit() {
		this.backup = null;
		this.events.push("commit");
	}

	async rollback() {
		if (this.backup) this.data = structuredClone(this.backup);
		this.backup = null;
		this.events.push("rollback");
	}

	async close() {
		this.events.push("close");
	}
}

function factory(store: MemoryStore) {
	return async () => store;
}

describe("guarded desktop-demo presentation text update", () => {
	it("rejects every non-demo URL before creating a store", async () => {
		const storeFactory = vi.fn();
		await expect(
			updateDemoPresentationText({
				mode: "preview",
				databaseUrl:
					"postgresql://fitway_demo:fitway_demo_local@127.0.0.1:55432/postgres",
				storeFactory,
			}),
		).rejects.toThrow(/fixed loopback fitway_desktop_demo/);
		expect(storeFactory).not.toHaveBeenCalled();
	});

	it("previews every exact target in a read-only transaction without updating", async () => {
		const store = new MemoryStore(snapshot());
		const result = await updateDemoPresentationText({
			mode: "preview",
			databaseUrl: DEMO_DATABASE_URL,
			storeFactory: factory(store),
		});
		expect(result.records).toHaveLength(12);
		expect(result.records.every((record) => record.status === "change")).toBe(
			true,
		);
		expect(result.updatedRows).toBe(0);
		expect(store.events).toEqual([
			"begin:preview",
			"read",
			"rollback",
			"close",
		]);
		const output = formatDemoTextUpdate(result);
		expect(output).toContain("12 pending change(s); 0 row(s) updated");
		expect(output).toContain(`auth_principals#${OWNER_ID}`);
		expect(output).toContain(JSON.stringify("FITWAY Demo Owner"));
		expect(output).toContain(
			JSON.stringify(DEMO_PRESENTATION_TEXT.ownerDisplayName),
		);
	});

	it("updates paired rows once, preserves unrelated history, and is idempotent", async () => {
		const data = snapshot();
		const firstStore = new MemoryStore(data);
		const first = await updateDemoPresentationText({
			mode: "apply",
			storeFactory: factory(firstStore),
		});
		expect(first.updatedRows).toBe(12);
		expect(firstStore.events).toContain("lock:2:4:6");
		expect(firstStore.events.at(-2)).toBe("commit");
		expect(
			data.commandPairs.find((pair) => pair.commandRecord.id === 99)
				?.commandRecord.reason,
		).toBe("Accumulated operator record");
		for (const pair of data.commandPairs.slice(0, 4)) {
			expect(pair.commandRecord.reason).toBe(pair.auditRecord.reason);
		}

		const secondStore = new MemoryStore(data);
		const second = await updateDemoPresentationText({
			mode: "apply",
			storeFactory: factory(secondStore),
		});
		expect(second.updatedRows).toBe(0);
		expect(
			second.records.every((record) => record.status === "unchanged"),
		).toBe(true);
		expect(
			secondStore.events.some((event) => event.startsWith("update:")),
		).toBe(false);
		expect(formatDemoTextUpdate(second)).toContain("0 pending change(s)");
	});

	it("accepts the current source alternatives for the two diverged fixtures", async () => {
		const data = snapshot();
		const fourth = data.commandPairs.find(
			(pair) => pair.commandRecord.id === 4,
		);
		if (!fourth) throw new Error("fixture missing");
		fourth.commandRecord.reason = "Front desk count reconciliation";
		fourth.auditRecord.reason = "Front desk count reconciliation";
		const latest = data.settingsAudits.find(
			(record) => record.settings_version === 4,
		);
		if (!latest) throw new Error("fixture missing");
		latest.reason = "Updated September operating profile";
		await expect(
			updateDemoPresentationText({
				mode: "preview",
				storeFactory: factory(new MemoryStore(data)),
			}),
		).resolves.toMatchObject({ mode: "preview", updatedRows: 0 });
	});

	it("fails closed for missing, duplicate, unexpected, or mismatched targets", async () => {
		const cases: Array<[string, DemoTextSnapshot, RegExp]> = [];
		const missing = snapshot();
		missing.settingsAudits.pop();
		cases.push(["missing", missing, /found 0/]);

		const duplicate = snapshot();
		const copy = structuredClone(duplicate.commandPairs[0]);
		if (!copy) throw new Error("fixture missing");
		copy.commandRecord.id = 41;
		copy.auditRecord.id = 44;
		copy.auditRecord.command_id = 41;
		duplicate.commandPairs.push(copy);
		cases.push(["duplicate", duplicate, /found 2/]);

		const unexpected = snapshot();
		const unexpectedPair = unexpected.commandPairs[0];
		if (!unexpectedPair) throw new Error("fixture missing");
		unexpectedPair.commandRecord.reason = "Unexpected operator prose";
		unexpectedPair.auditRecord.reason = "Unexpected operator prose";
		cases.push([
			"unexpected",
			unexpected,
			/Unexpected correction_delta fixture reason/,
		]);

		const mismatch = snapshot();
		const mismatchPair = mismatch.commandPairs[0];
		if (!mismatchPair) throw new Error("fixture missing");
		mismatchPair.auditRecord.reason = "Synthetic occupancy review";
		cases.push(["mismatch", mismatch, /reasons differ/]);

		const unexpectedIdentity = snapshot();
		const unexpectedOwner = unexpectedIdentity.principals.find(
			(record) => record.principal_kind === "owner",
		);
		if (!unexpectedOwner) throw new Error("fixture missing");
		unexpectedOwner.owner_email = "OWNER@demo.fitway.local";
		cases.push(["unexpected identity", unexpectedIdentity, /found 0/]);

		const incompleteCommand = snapshot();
		const incompletePair = incompleteCommand.commandPairs[0];
		if (!incompletePair) throw new Error("fixture missing");
		delete incompletePair.commandRecord.delivered_at;
		cases.push(["incomplete command", incompleteCommand, /found 0/]);

		for (const [label, data, error] of cases) {
			const store = new MemoryStore(data);
			await expect(
				updateDemoPresentationText({
					mode: "apply",
					storeFactory: factory(store),
				}),
				label,
			).rejects.toThrow(error);
			expect(store.events).toContain("rollback");
			expect(store.events.at(-1)).toBe("close");
		}
	});

	it("rolls back an injected mid-transaction failure", async () => {
		const original = snapshot();
		const store = new MemoryStore(structuredClone(original));
		store.failUpdateAt = 5;
		await expect(
			updateDemoPresentationText({
				mode: "apply",
				storeFactory: factory(store),
			}),
		).rejects.toThrow("injected update failure");
		expect(store.events).toContain("rollback");
		expect(store.events).not.toContain("commit");
		expect(store.events.at(-1)).toBe("close");
		expect(store.data).toEqual(original);
	});

	it("requires every optimistic update to affect exactly one row", async () => {
		const original = snapshot();
		const store = new MemoryStore(structuredClone(original));
		store.zeroUpdateAt = 3;
		await expect(
			updateDemoPresentationText({
				mode: "apply",
				storeFactory: factory(store),
			}),
		).rejects.toThrow(/affected 0 rows/);
		expect(store.events).toContain("rollback");
		expect(store.events).not.toContain("commit");
		expect(store.data).toEqual(original);
	});

	it("deep comparison rejects any non-text change before commit", async () => {
		const store = new MemoryStore(snapshot());
		store.corruptUnrelatedAfterUpdates = true;
		await expect(
			updateDemoPresentationText({
				mode: "apply",
				storeFactory: factory(store),
			}),
		).rejects.toThrow(/Unexpected column change in edge_commands:99/);
		expect(store.events).toContain("rollback");
		expect(store.events).not.toContain("commit");
	});
});
