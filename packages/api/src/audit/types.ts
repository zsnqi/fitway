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

export type AuditAppender = {
	appendAudit(value: HumanAuditEntry): Promise<number>;
};
