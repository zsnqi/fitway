import {
	createHash,
	createHmac,
	randomBytes,
	scrypt,
	timingSafeEqual,
} from "node:crypto";

const SCRYPT_KEY_LENGTH = 32;
const SCRYPT_COST = 32_768;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const SCRYPT_MAX_MEMORY = 64 * 1_024 * 1_024;

function derivePinInput(pin: string, pepper: string) {
	return createHmac("sha256", pepper)
		.update("fitway-pin-v1\0", "utf8")
		.update(pin, "utf8")
		.digest();
}

function deriveScrypt(input: Buffer, salt: string) {
	return new Promise<Buffer>((resolve, reject) => {
		scrypt(
			input,
			salt,
			SCRYPT_KEY_LENGTH,
			{
				N: SCRYPT_COST,
				r: SCRYPT_BLOCK_SIZE,
				p: SCRYPT_PARALLELIZATION,
				maxmem: SCRYPT_MAX_MEMORY,
			},
			(error, derivedKey) => {
				if (error) reject(error);
				else resolve(derivedKey as Buffer);
			},
		);
	});
}

export function createPinSalt() {
	return randomBytes(16).toString("base64url");
}

export async function hashStaffPin(
	pin: string,
	pepper: string,
	salt = createPinSalt(),
) {
	const digest = await deriveScrypt(derivePinInput(pin, pepper), salt);
	return {
		pinSalt: salt,
		pinHash: [
			"scrypt-v1",
			SCRYPT_COST,
			SCRYPT_BLOCK_SIZE,
			SCRYPT_PARALLELIZATION,
			digest.toString("base64url"),
		].join("$"),
	};
}

export async function hashOwnerPassword(
	password: string,
	pepper: string,
	salt = createPinSalt(),
) {
	const input = createHmac("sha256", pepper)
		.update("fitway-owner-password-v1\0", "utf8")
		.update(password, "utf8")
		.digest();
	const digest = await deriveScrypt(input, salt);
	return {
		passwordSalt: salt,
		passwordHash: [
			"scrypt-owner-v1",
			SCRYPT_COST,
			SCRYPT_BLOCK_SIZE,
			SCRYPT_PARALLELIZATION,
			digest.toString("base64url"),
		].join("$"),
	};
}

export async function verifyStaffPin(input: {
	pin: string;
	pepper: string;
	pinSalt: string;
	pinHash: string;
}) {
	const [algorithm, cost, blockSize, parallelization, encodedDigest] =
		input.pinHash.split("$");
	if (
		algorithm !== "scrypt-v1" ||
		cost !== `${SCRYPT_COST}` ||
		blockSize !== `${SCRYPT_BLOCK_SIZE}` ||
		parallelization !== `${SCRYPT_PARALLELIZATION}` ||
		!encodedDigest
	) {
		return false;
	}
	const expected = Buffer.from(encodedDigest, "base64url");
	const actual = await deriveScrypt(
		derivePinInput(input.pin, input.pepper),
		input.pinSalt,
	);
	return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function verifyOwnerPassword(input: {
	password: string;
	pepper: string;
	passwordSalt: string;
	passwordHash: string;
}) {
	const [algorithm, cost, blockSize, parallelization, encodedDigest] =
		input.passwordHash.split("$");
	if (
		algorithm !== "scrypt-owner-v1" ||
		cost !== `${SCRYPT_COST}` ||
		blockSize !== `${SCRYPT_BLOCK_SIZE}` ||
		parallelization !== `${SCRYPT_PARALLELIZATION}` ||
		!encodedDigest
	) {
		return false;
	}
	const expected = Buffer.from(encodedDigest, "base64url");
	const passwordInput = createHmac("sha256", input.pepper)
		.update("fitway-owner-password-v1\0", "utf8")
		.update(input.password, "utf8")
		.digest();
	const actual = await deriveScrypt(passwordInput, input.passwordSalt);
	return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createOpaqueSessionToken() {
	return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string) {
	return createHash("sha256").update(token, "utf8").digest("hex");
}
