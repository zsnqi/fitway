export type HumanAuditAction =
	| "correction_delta"
	| "correction_absolute"
	| "reset";

export type HumanAuditEntry = {
	actorPrincipalId: string;
	actorPrincipalKind: "shared_staff" | "owner";
	actorRole: "staff" | "owner";
	commandId: number;
	action: HumanAuditAction;
	priorValue: number | null;
	requestedDelta: number | null;
	requestedValue: number | null;
	effectiveValue: number;
	reason: string | null;
	createdAt: Date;
};

export type SystemAuditEntry = {
	actorPrincipalId: null;
	actorPrincipalKind: "system";
	actorRole: null;
	commandId: number;
	commandIssuerClass: "system";
	action: "reset";
	priorValue: number | null;
	requestedDelta: null;
	requestedValue: 0;
	effectiveValue: 0;
	reason: string;
	createdAt: Date;
};

export type AuditEntry = HumanAuditEntry | SystemAuditEntry;
