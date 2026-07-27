import type { AuthenticationResult, CanonicalAuthContext } from "@fitway/auth";
import type { Context as HonoContext } from "hono";
import type { DailyAnalytics } from "./analytics/daily-analytics";
import type { AnalyticsTimeContext } from "./analytics/time-context";
import type { CommandService } from "./commands/service";
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
	commandService?: CommandService;
};

/**
 * The request context every procedure resolves against. `readOperationalSnapshot`
 * is injected by the server transport; it is optional here so leaves that never
 * use it (and direct `call` unit tests) need not construct it.
 */
export type Context = {
	auth: CanonicalAuthContext | null;
	readOperationalSnapshot?: () => Promise<OperationalSnapshot>;
	readDailyAnalytics?: (businessDay?: string) => Promise<DailyAnalytics>;
	readAnalyticsTimeContext?: (
		settingsVersions: readonly number[],
	) => Promise<AnalyticsTimeContext>;
	commandService?: CommandService;
};

export async function createContext({
	context,
	authenticate,
	readOperationalSnapshot,
	readDailyAnalytics,
	readAnalyticsTimeContext,
	commandService,
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
		commandService,
	};
}
