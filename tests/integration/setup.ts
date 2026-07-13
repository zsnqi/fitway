import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve("apps/server/.env") });
dotenv.config({ path: path.resolve(".env.integration.local"), override: true });
if (!process.env.TEST_DATABASE_URL) {
	throw new Error(
		"TEST_DATABASE_URL is required; integration tests never use DATABASE_URL",
	);
}
// Some shared modules validate DATABASE_URL at import time. Point that validation
// at the explicitly guarded test URL; integration code never falls back to it.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
