import { createHash } from "node:crypto";

export type AuthenticatedDevice = {
	id: string;
	name: string;
	enabled: boolean;
};

export const EDGE_AUTH_ERROR = { error: "unauthorized" } as const;

export function parseBearerToken(header: string | undefined): string | null {
	if (!header || header.includes(",")) return null;
	const match = /^Bearer ([^\s]+)$/.exec(header);
	if (!match?.[1] || match[1].length < 43) return null;
	return match[1];
}

export function hashDeviceToken(token: string): string {
	return createHash("sha256").update(token, "utf8").digest("hex");
}

export async function authenticateDevice(
	header: string | undefined,
	findByHash: (hash: string) => Promise<AuthenticatedDevice | null>,
): Promise<AuthenticatedDevice | null> {
	const token = parseBearerToken(header);
	if (!token) return null;
	const device = await findByHash(hashDeviceToken(token));
	return device?.enabled ? device : null;
}
