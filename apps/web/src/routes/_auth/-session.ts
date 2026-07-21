import { redirect } from "@tanstack/react-router";

import {
	getSession,
	isUnauthorizedAuthError,
	type StaffSession,
} from "@/lib/auth-client";

export async function sessionOrNull(): Promise<StaffSession | null> {
	try {
		return await getSession();
	} catch (error) {
		if (isUnauthorizedAuthError(error)) return null;
		throw error;
	}
}

export async function requireStaffSession() {
	const session = await sessionOrNull();
	if (!session) throw redirect({ to: "/login", replace: true });
	return session;
}
