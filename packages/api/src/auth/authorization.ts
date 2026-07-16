import type { CanonicalAuthContext } from "@fitway/auth";
import { ORPCError } from "@orpc/server";

export function requireStaffOrOwner(
	auth: CanonicalAuthContext | null,
): CanonicalAuthContext {
	if (!auth?.active) throw new ORPCError("UNAUTHORIZED");
	return auth;
}

export function requireOwner(
	auth: CanonicalAuthContext | null,
): CanonicalAuthContext & { principalKind: "owner"; role: "owner" } {
	const authenticated = requireStaffOrOwner(auth);
	if (
		authenticated.role !== "owner" ||
		authenticated.principalKind !== "owner"
	) {
		throw new ORPCError("FORBIDDEN");
	}
	return authenticated as CanonicalAuthContext & {
		principalKind: "owner";
		role: "owner";
	};
}
