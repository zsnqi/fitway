import type { AuthenticationResult, CanonicalAuthContext } from "@fitway/auth";
import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
	context: HonoContext;
	authenticate: (
		cookieHeader: string | undefined,
	) => Promise<AuthenticationResult>;
};

export async function createContext({
	context,
	authenticate,
}: CreateContextOptions) {
	const result = await authenticate(context.req.header("Cookie"));
	for (const cookie of result.cookieHeaders) {
		context.header("Set-Cookie", cookie, { append: true });
	}
	return {
		auth:
			result.status === "authenticated"
				? result.context
				: (null as CanonicalAuthContext | null),
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
