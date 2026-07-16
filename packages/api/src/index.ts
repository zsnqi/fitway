import { ORPCError, os } from "@orpc/server";

import { requireOwner, requireStaffOrOwner } from "./auth/authorization";
import type { Context } from "./context";

export const o = os.$context<Context>();

export const publicProcedure = o;

const requireAuth = o.middleware(async ({ context, next }) => {
	const auth = requireStaffOrOwner(context.auth);
	return next({
		context: {
			auth,
		},
	});
});

const requireOwnerRole = o.middleware(async ({ context, next }) => {
	const auth = requireOwner(context.auth);
	return next({ context: { auth } });
});

export const staffProcedure = publicProcedure.use(requireAuth);
export const ownerProcedure = publicProcedure.use(requireOwnerRole);
export const protectedProcedure = staffProcedure;

export { ORPCError };
