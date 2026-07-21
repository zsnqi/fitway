import { env } from "@fitway/env/web";

export type StaffSession = {
	principalId: string;
	principalKind: "shared_staff" | "owner";
	role: "staff" | "owner";
	sessionId: string;
	expiresAt: string;
	active: boolean;
};

type SessionEnvelope = { auth: StaffSession };

export class AuthRequestError extends Error {
	readonly status: number;
	readonly retryAfterSeconds: number | null;

	constructor(status: number, retryAfterSeconds: number | null = null) {
		super(`Authentication request failed with status ${status}`);
		this.name = "AuthRequestError";
		this.status = status;
		this.retryAfterSeconds = retryAfterSeconds;
	}
}

function serverOrigin(url: string) {
	const normalized = url.endsWith("/") ? url.slice(0, -1) : url;
	if (!normalized.startsWith("/")) return normalized;
	if (typeof window !== "undefined") return window.location.origin;
	return "http://localhost:3100";
}

function authUrl(path: string) {
	return new URL(
		`/api/auth/${path}`,
		serverOrigin(env.VITE_SERVER_URL),
	).toString();
}

function retryAfterSeconds(response: Response) {
	const value = Number(response.headers.get("Retry-After"));
	return Number.isFinite(value) && value > 0 ? Math.ceil(value) : null;
}

function isSessionEnvelope(value: unknown): value is SessionEnvelope {
	if (!value || typeof value !== "object" || !("auth" in value)) return false;
	const auth = value.auth;
	return Boolean(
		auth &&
			typeof auth === "object" &&
			"principalId" in auth &&
			typeof auth.principalId === "string" &&
			"principalKind" in auth &&
			(auth.principalKind === "shared_staff" ||
				auth.principalKind === "owner") &&
			"role" in auth &&
			(auth.role === "staff" || auth.role === "owner") &&
			"sessionId" in auth &&
			typeof auth.sessionId === "string" &&
			"expiresAt" in auth &&
			typeof auth.expiresAt === "string" &&
			"active" in auth &&
			auth.active === true,
	);
}

async function sessionFrom(response: Response) {
	if (!response.ok) {
		throw new AuthRequestError(response.status, retryAfterSeconds(response));
	}
	const value: unknown = await response.json();
	if (!isSessionEnvelope(value)) throw new AuthRequestError(502);
	return value.auth;
}

export function normalizeWesternPin(value: string) {
	return value.replace(/[^0-9]/gu, "").slice(0, 12);
}

export function isValidStaffPin(value: string) {
	return /^[0-9]{6,12}$/u.test(value);
}

export async function getSession(signal?: AbortSignal) {
	return sessionFrom(
		await fetch(authUrl("session"), {
			credentials: "include",
			headers: { Accept: "application/json" },
			signal,
		}),
	);
}

export async function loginWithStaffPin(pin: string) {
	if (!isValidStaffPin(pin)) throw new AuthRequestError(400);
	return sessionFrom(
		await fetch(authUrl("staff/pin"), {
			method: "POST",
			credentials: "include",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ pin }),
		}),
	);
}

export async function logoutStaff() {
	const response = await fetch(authUrl("logout"), {
		method: "POST",
		credentials: "include",
		headers: { Accept: "application/json" },
	});
	if (!response.ok) throw new AuthRequestError(response.status);
}

export function isUnauthorizedAuthError(error: unknown) {
	return error instanceof AuthRequestError && error.status === 401;
}
