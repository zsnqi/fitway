import type {
	AuditAction,
	AuditActorKind,
	AuditCursor,
	AuditEntryView,
	AuditListFilters,
	AuditListPage,
} from "@fitway/api/audit/list";
import {
	AUDIT_PAGE_LIMIT_DEFAULT,
	auditListOutputSchema,
} from "@fitway/api/audit/list";
import { useInfiniteQuery } from "@tanstack/react-query";

import { client } from "@/utils/orpc";

import { useOwnerDailyAnalytics } from "./use-owner-daily-analytics";

/**
 * The owner's filter form state. It is deliberately raw: the form holds text and
 * gym-local calendar days, and this hook is the single place that turns them into
 * the strict transport filters. Nothing in the component tree does date math.
 */
export type OwnerAuditFilterSelection = {
	action: "any" | AuditAction;
	actor: "any" | AuditActorKind;
	priorMode: "any" | "value" | "missing";
	priorValue: string;
	effectiveMode: "any" | "value" | "missing";
	effectiveValue: string;
	occurredFromDay: string;
	occurredToDay: string;
	reasonMode: "any" | "contains" | "missing";
	reasonText: string;
};

export const emptyOwnerAuditSelection: OwnerAuditFilterSelection = {
	action: "any",
	actor: "any",
	priorMode: "any",
	priorValue: "",
	effectiveMode: "any",
	effectiveValue: "",
	occurredFromDay: "",
	occurredToDay: "",
	reasonMode: "any",
	reasonText: "",
};

const GYM_DAY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

function zoneOffsetMs(instant: number, timeZone: string): number {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone,
		hourCycle: "h23",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	}).formatToParts(instant);
	const read = (type: Intl.DateTimeFormatPartTypes) =>
		Number(parts.find((part) => part.type === type)?.value ?? Number.NaN);
	const asUtc = Date.UTC(
		read("year"),
		read("month") - 1,
		read("day"),
		read("hour"),
		read("minute"),
		read("second"),
	);
	if (!Number.isFinite(asUtc)) {
		throw new Error(`Gym timezone ${timeZone} cannot be resolved`);
	}
	return asUtc - instant;
}

/**
 * The UTC instant at which a gym-local calendar day begins.
 *
 * The two passes settle the offset across a DST transition. Only the configured
 * gym timezone is ever consulted, so the browser's own zone cannot move a filter
 * boundary.
 */
export function gymDayStartUtc(day: string, timeZone: string): Date {
	if (!GYM_DAY.test(day))
		throw new Error("A gym day must be an ISO calendar day");
	const naive = Date.parse(`${day}T00:00:00.000Z`);
	if (!Number.isFinite(naive)) throw new Error("A gym day must be a real date");
	let instant = naive;
	for (let pass = 0; pass < 2; pass += 1) {
		instant = naive - zoneOffsetMs(instant, timeZone);
	}
	return new Date(instant);
}

/** Calendar-day successor. Plain date arithmetic, never an instant offset. */
function nextGymDay(day: string): string {
	return new Date(Date.parse(`${day}T00:00:00.000Z`) + DAY_MS)
		.toISOString()
		.slice(0, 10);
}

function parseCount(value: string): number | undefined {
	const trimmed = value.trim();
	if (!trimmed) return undefined;
	const parsed = Number(trimmed);
	return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

/**
 * Selection to transport filters. An unusable field contributes no predicate
 * rather than a silently coerced one, and "not recorded" stays an explicit null.
 */
export function toAuditFilters(
	selection: OwnerAuditFilterSelection,
	timeZone: string,
): AuditListFilters | undefined {
	const filters: AuditListFilters = {};
	if (selection.action !== "any") filters.actions = [selection.action];
	if (selection.actor !== "any") filters.actorKind = selection.actor;
	if (selection.priorMode === "missing") {
		filters.priorValue = null;
	} else if (selection.priorMode === "value") {
		const prior = parseCount(selection.priorValue);
		if (prior !== undefined) filters.priorValue = prior;
	}
	if (selection.effectiveMode === "missing") {
		filters.effectiveValue = null;
	} else if (selection.effectiveMode === "value") {
		const effective = parseCount(selection.effectiveValue);
		if (effective !== undefined) filters.effectiveValue = effective;
	}
	if (GYM_DAY.test(selection.occurredFromDay)) {
		filters.occurredFrom = gymDayStartUtc(
			selection.occurredFromDay,
			timeZone,
		).toISOString();
	}
	if (GYM_DAY.test(selection.occurredToDay)) {
		// Inclusive of the whole selected gym day; the server bound is `<=`.
		filters.occurredTo = new Date(
			gymDayStartUtc(nextGymDay(selection.occurredToDay), timeZone).getTime() -
				1,
		).toISOString();
	}
	if (selection.reasonMode === "missing") {
		filters.reason = null;
	} else if (selection.reasonMode === "contains") {
		const reason = selection.reasonText.trim().slice(0, 240);
		if (reason) filters.reason = reason;
	}
	if (
		filters.occurredFrom !== undefined &&
		filters.occurredTo !== undefined &&
		Date.parse(filters.occurredFrom) > Date.parse(filters.occurredTo)
	) {
		delete filters.occurredTo;
	}
	return Object.keys(filters).length === 0 ? undefined : filters;
}

export type OwnerAuditResult = {
	/** `unavailable` means the gym timezone is not resolved, so no row can be dated. */
	status: "unavailable" | "pending" | "error" | "success";
	entries: AuditEntryView[];
	timeZone: string | null;
	hasNextPage: boolean;
	isFetchingNextPage: boolean;
	fetchNextPage: () => void;
	retry: () => void;
};

/**
 * Owner audit history.
 *
 * The configured gym timezone is one fact, and `/admin` has already resolved it:
 * `useOwnerDailyAnalytics` fetches it alongside the day's curve. This hook reads
 * that same query rather than asking for the timezone a second time, so mounting
 * the audit section issues no request beyond `admin.audit.list` and leaves the
 * request behaviour of the Phase 9 surface exactly as it was.
 *
 * While that shared query is pending or failed the section is `unavailable` and
 * renders nothing: no row can be dated without the gym timezone, and `/admin`
 * already carries one louder live region and one retry for that same cause.
 *
 * Every page is validated against the shared transport schema, so a malformed row
 * surfaces as an error instead of rendering as a plausible-looking audit record.
 */
export function useOwnerAudit(
	selection: OwnerAuditFilterSelection,
): OwnerAuditResult {
	const analytics = useOwnerDailyAnalytics();
	const timeZone = analytics.data?.timeContext.current.timeZone ?? null;
	const filters = timeZone ? toAuditFilters(selection, timeZone) : undefined;
	const history = useInfiniteQuery({
		queryKey: ["owner", "audit", "list", filters ?? null],
		enabled: timeZone !== null,
		initialPageParam: null as AuditCursor | null,
		queryFn: async ({ pageParam }): Promise<AuditListPage> =>
			auditListOutputSchema.parse(
				await client.admin.audit.list({
					limit: AUDIT_PAGE_LIMIT_DEFAULT,
					cursor: pageParam,
					...(filters ? { filters } : {}),
				}),
			),
		getNextPageParam: (lastPage) => lastPage.nextCursor,
		retry: false,
		refetchOnWindowFocus: false,
	});

	const status: OwnerAuditResult["status"] =
		timeZone === null
			? "unavailable"
			: history.isError
				? "error"
				: history.isPending
					? "pending"
					: "success";

	return {
		status,
		entries: history.data?.pages.flatMap((page) => page.entries) ?? [],
		timeZone,
		hasNextPage: history.hasNextPage,
		isFetchingNextPage: history.isFetchingNextPage,
		fetchNextPage: () => void history.fetchNextPage(),
		retry: () => void history.refetch(),
	};
}
