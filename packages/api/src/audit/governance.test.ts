import { describe, expect, it } from "vitest";

import {
	buildAccessAuditEntry,
	buildSettingsAuditEntry,
	GovernanceAuditError,
	type PrincipalGovernanceSnapshot,
} from "./governance";

const actorPrincipalId = "00000000-0000-4000-8000-0000000000a1";
const targetPrincipalId = "00000000-0000-4000-8000-0000000000b2";
const createdAt = new Date("2026-08-16T18:00:00.000Z");

function snapshot(
	overrides: Partial<PrincipalGovernanceSnapshot> = {},
): PrincipalGovernanceSnapshot {
	return {
		principalId: targetPrincipalId,
		active: true,
		credentialVersion: 3,
		...overrides,
	};
}

describe("access governance audit builder", () => {
	it("writes only explicit governance linkage and non-secret state", () => {
		const entry = buildAccessAuditEntry({
			action: "staff_pin_rotated",
			actorPrincipalId,
			before: snapshot({ credentialVersion: 3 }),
			after: snapshot({ credentialVersion: 4 }),
			reason: null,
			createdAt,
		});

		expect(entry).toMatchObject({
			eventClass: "access",
			action: "staff_pin_rotated",
			actorPrincipalId,
			actorPrincipalKind: "owner",
			actorRole: "owner",
			targetPrincipalId,
			priorCredentialVersion: 3,
			newCredentialVersion: 4,
			commandId: null,
			commandIssuerClass: null,
			priorValue: null,
			requestedDelta: null,
			requestedValue: null,
			effectiveValue: null,
		});
		expect(Object.keys(entry).join(" ")).not.toMatch(
			/pin|password|hash|salt|pepper|session|token/i,
		);
	});

	it("takes credential versions from the supplied principal snapshots", () => {
		const entry = buildAccessAuditEntry({
			action: "credential_reset",
			actorPrincipalId,
			before: snapshot({ credentialVersion: 17 }),
			after: snapshot({ credentialVersion: 18 }),
			reason: "Owner-assisted reset",
			createdAt,
		});
		expect(entry.priorCredentialVersion).toBe(17);
		expect(entry.newCredentialVersion).toBe(18);
	});

	it("requires a reason for the two destructive actions only", () => {
		for (const action of [
			"staff_pin_deactivated",
			"owner_deactivated",
		] as const) {
			expect(() =>
				buildAccessAuditEntry({
					action,
					actorPrincipalId,
					before: snapshot(),
					after: snapshot({ active: false }),
					reason: null,
					createdAt,
				}),
			).toThrow(`${action} requires a reason`);
		}

		expect(() =>
			buildAccessAuditEntry({
				action: "staff_pin_rotated",
				actorPrincipalId,
				before: snapshot({ credentialVersion: 3 }),
				after: snapshot({ credentialVersion: 4 }),
				reason: null,
				createdAt,
			}),
		).not.toThrow();
	});

	it("records only the approved owner active transitions", () => {
		const deactivated = buildAccessAuditEntry({
			action: "owner_deactivated",
			actorPrincipalId,
			before: snapshot({ active: true }),
			after: snapshot({ active: false }),
			reason: "Owner left the organization",
			createdAt,
		});
		expect(deactivated.priorActive).toBe(true);
		expect(deactivated.newActive).toBe(false);

		const reactivated = buildAccessAuditEntry({
			action: "owner_reactivated",
			actorPrincipalId,
			before: snapshot({ active: false }),
			after: snapshot({ active: true }),
			reason: null,
			createdAt,
		});
		expect(reactivated.priorActive).toBe(false);
		expect(reactivated.newActive).toBe(true);

		expect(() =>
			buildAccessAuditEntry({
				action: "owner_deactivated",
				actorPrincipalId,
				before: snapshot({ active: false }),
				after: snapshot({ active: true }),
				reason: "Invalid transition",
				createdAt,
			}),
		).toThrow(/matching active transition/i);
	});

	it("rejects missing, non-advancing, or cross-principal credential snapshots", () => {
		for (const [beforeVersion, afterVersion] of [
			[null, 1],
			[3, null],
			[3, 3],
			[4, 3],
		] as const) {
			expect(() =>
				buildAccessAuditEntry({
					action: "staff_pin_rotated",
					actorPrincipalId,
					before: snapshot({ credentialVersion: beforeVersion }),
					after: snapshot({ credentialVersion: afterVersion }),
					reason: null,
					createdAt,
				}),
			).toThrow(GovernanceAuditError);
		}

		expect(() =>
			buildAccessAuditEntry({
				action: "credential_reset",
				actorPrincipalId,
				before: snapshot(),
				after: snapshot({
					principalId: actorPrincipalId,
					credentialVersion: 4,
				}),
				reason: null,
				createdAt,
			}),
		).toThrow(/one principal/i);
	});
});

describe("settings governance audit builder", () => {
	it("names the created settings version and closes every other state channel", () => {
		const entry = buildSettingsAuditEntry({
			actorPrincipalId,
			settingsVersion: 27,
			reason: "Updated weekend capacity",
			createdAt,
		});
		expect(entry).toEqual({
			eventClass: "settings",
			action: "settings_updated",
			actorPrincipalId,
			actorPrincipalKind: "owner",
			actorRole: "owner",
			settingsVersion: 27,
			targetPrincipalId: null,
			priorActive: null,
			newActive: null,
			priorCredentialVersion: null,
			newCredentialVersion: null,
			commandId: null,
			commandIssuerClass: null,
			priorValue: null,
			requestedDelta: null,
			requestedValue: null,
			effectiveValue: null,
			reason: "Updated weekend capacity",
			createdAt,
		});
	});

	it("rejects a non-persistable settings version", () => {
		for (const settingsVersion of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
			expect(() =>
				buildSettingsAuditEntry({
					actorPrincipalId,
					settingsVersion,
					reason: null,
					createdAt,
				}),
			).toThrow(/persisted settings version/i);
		}
	});
});
