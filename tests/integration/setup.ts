import path from "node:path";
import dotenv from "dotenv";
import { assertDisposableIntegrationDatabase } from "../../apps/server/src/test-support/integration-database-safety";

dotenv.config({ path: path.resolve("apps/server/.env") });
// Shell/session values are authoritative. The optional local file supplies only
// missing values and can never redirect an explicitly isolated verification run.
dotenv.config({ path: path.resolve(".env.integration.local") });
assertDisposableIntegrationDatabase({
	applicationDatabaseUrl: process.env.DATABASE_URL,
	connectionString: process.env.TEST_DATABASE_URL,
	resetMarker: process.env.FITWAY_INTEGRATION_RESET_DATABASE,
	runId: process.env.FITWAY_RUN_ID,
});
// Some shared modules validate DATABASE_URL at import time. Point that validation
// at the explicitly guarded test URL; integration code never falls back to it.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
