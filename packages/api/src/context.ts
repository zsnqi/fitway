import type { AuthenticationResult, CanonicalAuthContext } from "@fitway/auth";
import type { Context as HonoContext } from "hono";
import type {
	AccessListOutput,
	AccessMutationOutput,
	OwnerCredentialResetInput,
	OwnerDeactivateInput,
	OwnerProvisionInput,
	OwnerReactivateInput,
	StaffPinDeactivateInput,
	StaffPinRevealOutput,
} from "./access/contracts";
import type { DailyAnalytics } from "./analytics/daily-analytics";
import type {
	CsvRangeInput,
	Heatmap,
	ReportingDateRangeInput,
	ReportingRange,
	WeekComparison,
} from "./analytics/reporting/contracts";
import type { AnalyticsTimeContext } from "./analytics/time-context";
import type { AuditListInput, AuditListPage } from "./audit/list";
import type { HealthIncidentSummary } from "./health/incidents";
import type { OperationalSnapshot } from "./health/snapshot";

export type CreateContextOptions = {
	context: HonoContext;
	authenticate: (
		cookieHeader: string | undefined,
	) => Promise<AuthenticationResult>;
	readOperationalSnapshot: () => Promise<OperationalSnapshot>;
	readDailyAnalytics: (businessDay?: string) => Promise<DailyAnalytics>;
	readAnalyticsTimeContext: (
		settingsVersions: readonly number[],
	) => Promise<AnalyticsTimeContext>;
	streamCsv: (
		input: CsvRangeInput,
		signal?: AbortSignal,
	) => AsyncIterable<string>;
	readReportingRange: (
		input: ReportingDateRangeInput,
	) => Promise<ReportingRange>;
	readReportingHeatmap: (input: ReportingDateRangeInput) => Promise<Heatmap>;
	readWeekOverWeek: () => Promise<WeekComparison>;
	listAuditEntries: (input: AuditListInput) => Promise<AuditListPage>;
	readHealthIncidentSummary: () => Promise<HealthIncidentSummary>;
	listAccessPrincipals: () => Promise<AccessListOutput>;
	provisionStaffPin: (input: {
		actorPrincipalId: string;
	}) => Promise<StaffPinRevealOutput>;
	rotateStaffPin: (input: {
		actorPrincipalId: string;
	}) => Promise<StaffPinRevealOutput>;
	deactivateStaffPin: (
		input: { actorPrincipalId: string } & StaffPinDeactivateInput,
	) => Promise<AccessMutationOutput>;
	provisionOwner: (
		input: { actorPrincipalId: string } & OwnerProvisionInput,
	) => Promise<AccessMutationOutput>;
	deactivateOwner: (
		input: { actorPrincipalId: string } & OwnerDeactivateInput,
	) => Promise<AccessMutationOutput>;
	reactivateOwner: (
		input: { actorPrincipalId: string } & OwnerReactivateInput,
	) => Promise<AccessMutationOutput>;
	resetOwnerCredential: (
		input: { actorPrincipalId: string } & OwnerCredentialResetInput,
	) => Promise<AccessMutationOutput>;
};

/**
 * The request context every procedure resolves against. `readOperationalSnapshot`
 * is injected by the server transport; it is optional here so leaves that never
 * use it (and direct `call` unit tests) need not construct it.
 *
 * No command service is exposed here. `/staff` is monitoring-only
 * (`docs/adr/ADR-008-staff-monitoring-only.md`), and injecting the service would
 * be a standing re-exposure path for a retired surface. Internal issuers call
 * `commandService` from the server directly.
 */
export type Context = {
	auth: CanonicalAuthContext | null;
	readOperationalSnapshot?: () => Promise<OperationalSnapshot>;
	readDailyAnalytics?: (businessDay?: string) => Promise<DailyAnalytics>;
	readAnalyticsTimeContext?: (
		settingsVersions: readonly number[],
	) => Promise<AnalyticsTimeContext>;
	streamCsv?: (
		input: CsvRangeInput,
		signal?: AbortSignal,
	) => AsyncIterable<string>;
	/**
	 * Owner-only reporting reads. All three are reads with no writer beside them, and
	 * the comparison takes no argument at all: its window and comparability bar are
	 * resolved server-side so no caller can move either.
	 */
	readReportingRange?: (
		input: ReportingDateRangeInput,
	) => Promise<ReportingRange>;
	readReportingHeatmap?: (input: ReportingDateRangeInput) => Promise<Heatmap>;
	readWeekOverWeek?: () => Promise<WeekComparison>;
	/** Owner-only audit history read. The append path stays out of the context. */
	listAuditEntries?: (input: AuditListInput) => Promise<AuditListPage>;
	/**
	 * Owner-only incident and uptime read over the two Phase 8 append-only logs. It
	 * takes no input and exposes no writer, so the frozen alert evaluator remains the
	 * only thing that can append to either table.
	 */
	readHealthIncidentSummary?: () => Promise<HealthIncidentSummary>;
	/**
	 * Owner-only access management. These are the only writers in the context, and
	 * every one of them takes its actor from the caller rather than from its own
	 * input, so a procedure cannot attribute a change to a principal that did not
	 * make it. No PIN arrives through any of them; the two that reveal one return
	 * it and never accept it.
	 */
	listAccessPrincipals?: () => Promise<AccessListOutput>;
	provisionStaffPin?: (input: {
		actorPrincipalId: string;
	}) => Promise<StaffPinRevealOutput>;
	rotateStaffPin?: (input: {
		actorPrincipalId: string;
	}) => Promise<StaffPinRevealOutput>;
	deactivateStaffPin?: (
		input: { actorPrincipalId: string } & StaffPinDeactivateInput,
	) => Promise<AccessMutationOutput>;
	provisionOwner?: (
		input: { actorPrincipalId: string } & OwnerProvisionInput,
	) => Promise<AccessMutationOutput>;
	deactivateOwner?: (
		input: { actorPrincipalId: string } & OwnerDeactivateInput,
	) => Promise<AccessMutationOutput>;
	reactivateOwner?: (
		input: { actorPrincipalId: string } & OwnerReactivateInput,
	) => Promise<AccessMutationOutput>;
	resetOwnerCredential?: (
		input: { actorPrincipalId: string } & OwnerCredentialResetInput,
	) => Promise<AccessMutationOutput>;
};

export async function createContext({
	context,
	authenticate,
	readOperationalSnapshot,
	readDailyAnalytics,
	readAnalyticsTimeContext,
	streamCsv,
	readReportingRange,
	readReportingHeatmap,
	readWeekOverWeek,
	listAuditEntries,
	readHealthIncidentSummary,
	listAccessPrincipals,
	provisionStaffPin,
	rotateStaffPin,
	deactivateStaffPin,
	provisionOwner,
	deactivateOwner,
	reactivateOwner,
	resetOwnerCredential,
}: CreateContextOptions): Promise<Context> {
	const result = await authenticate(context.req.header("Cookie"));
	for (const cookie of result.cookieHeaders) {
		context.header("Set-Cookie", cookie, { append: true });
	}
	return {
		auth:
			result.status === "authenticated"
				? result.context
				: (null as CanonicalAuthContext | null),
		readOperationalSnapshot,
		readDailyAnalytics,
		readAnalyticsTimeContext,
		streamCsv,
		readReportingRange,
		readReportingHeatmap,
		readWeekOverWeek,
		listAuditEntries,
		readHealthIncidentSummary,
		listAccessPrincipals,
		provisionStaffPin,
		rotateStaffPin,
		deactivateStaffPin,
		provisionOwner,
		deactivateOwner,
		reactivateOwner,
		resetOwnerCredential,
	};
}
