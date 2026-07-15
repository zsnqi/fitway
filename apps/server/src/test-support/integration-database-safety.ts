const databasePrefix = "fitway_integration_";
const runIdPattern = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;

export type IntegrationDatabaseSafetyInput = {
	applicationDatabaseUrl?: string;
	connectionString?: string;
	resetMarker?: string;
	runId?: string;
};

export type IntegrationDatabaseTarget = {
	databaseName: string;
	runId: string;
};

function parseDatabaseName(connectionString: string) {
	let parsed: URL;
	try {
		parsed = new URL(connectionString);
	} catch {
		throw new Error("TEST_DATABASE_URL must be a valid PostgreSQL URL");
	}
	if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
		throw new Error("TEST_DATABASE_URL must use postgres: or postgresql:");
	}
	let databaseName: string;
	try {
		databaseName = decodeURIComponent(parsed.pathname.slice(1));
	} catch {
		throw new Error("TEST_DATABASE_URL contains an invalid database name");
	}
	if (!databaseName || databaseName.includes("/")) {
		throw new Error("TEST_DATABASE_URL must name exactly one database");
	}
	return databaseName;
}

/**
 * Authorizes destructive integration setup only for one run-owned database.
 * The explicit marker deliberately repeats the full database name so a broad
 * boolean opt-in cannot authorize a typo or a normal development database.
 */
export function assertDisposableIntegrationDatabase({
	applicationDatabaseUrl,
	connectionString,
	resetMarker,
	runId,
}: IntegrationDatabaseSafetyInput): IntegrationDatabaseTarget {
	if (!connectionString) {
		throw new Error(
			"TEST_DATABASE_URL is required; integration tests never use DATABASE_URL",
		);
	}
	if (
		!runId ||
		runId.length < 8 ||
		runId.length > 40 ||
		!runIdPattern.test(runId)
	) {
		throw new Error(
			"FITWAY_RUN_ID must be 8-40 lowercase letters, digits, or single underscores",
		);
	}
	const expectedDatabaseName = `${databasePrefix}${runId}`;
	const databaseName = parseDatabaseName(connectionString);
	if (databaseName !== expectedDatabaseName) {
		throw new Error(
			`TEST_DATABASE_URL must target the run-owned database ${expectedDatabaseName}`,
		);
	}
	if (resetMarker !== expectedDatabaseName) {
		throw new Error(
			`FITWAY_INTEGRATION_RESET_DATABASE must exactly equal ${expectedDatabaseName}`,
		);
	}
	if (
		applicationDatabaseUrl &&
		parseDatabaseName(applicationDatabaseUrl) === databaseName
	) {
		throw new Error(
			"TEST_DATABASE_URL must not target the database configured by DATABASE_URL",
		);
	}
	return { databaseName, runId };
}
