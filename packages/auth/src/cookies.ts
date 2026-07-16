import { createHmac, timingSafeEqual } from "node:crypto";

import type { PrincipalKind } from "./contracts";

export const SESSION_COOKIE_NAMES = {
	staff: "fitway_staff_session",
	owner: "fitway_owner_session",
} as const;

export function sessionCookieName(kind: PrincipalKind) {
	return kind === "shared_staff"
		? SESSION_COOKIE_NAMES.staff
		: SESSION_COOKIE_NAMES.owner;
}

function signature(cookieName: string, token: string, secret: string) {
	return createHmac("sha256", secret)
		.update("fitway-session-cookie-v1\0", "utf8")
		.update(cookieName, "utf8")
		.update("\0", "utf8")
		.update(token, "utf8")
		.digest("base64url");
}

export function signCookieValue(
	cookieName: string,
	token: string,
	secret: string,
) {
	return `${token}.${signature(cookieName, token, secret)}`;
}

export function verifyCookieValue(
	cookieName: string,
	value: string,
	secret: string,
) {
	const separator = value.lastIndexOf(".");
	if (separator <= 0) return null;
	const token = value.slice(0, separator);
	const supplied = Buffer.from(value.slice(separator + 1), "base64url");
	const expected = Buffer.from(
		signature(cookieName, token, secret),
		"base64url",
	);
	return supplied.length === expected.length &&
		timingSafeEqual(supplied, expected)
		? token
		: null;
}

export function readCookie(cookieHeader: string | undefined, name: string) {
	if (!cookieHeader) return null;
	for (const entry of cookieHeader.split(";")) {
		const separator = entry.indexOf("=");
		if (separator < 0) continue;
		if (entry.slice(0, separator).trim() === name) {
			return entry.slice(separator + 1).trim();
		}
	}
	return null;
}

export function serializeSessionCookie(input: {
	name: string;
	value: string;
	expiresAt: Date;
	now: Date;
}) {
	const maxAge = Math.max(
		0,
		Math.floor((input.expiresAt.getTime() - input.now.getTime()) / 1_000),
	);
	return `${input.name}=${input.value}; Max-Age=${maxAge}; Expires=${input.expiresAt.toUTCString()}; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

export function serializeClearedSessionCookie(name: string) {
	return `${name}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; HttpOnly; Secure; SameSite=Lax`;
}
