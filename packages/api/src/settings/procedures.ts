import { ORPCError, ownerProcedure } from "../index";

import {
	ownerSettingsReadOutputSchema,
	ownerSettingsUpdateInputSchema,
	ownerSettingsUpdateOutputSchema,
} from "./contracts";

/**
 * The owner Settings leaves (`admin.settings.read` and `admin.settings.update`).
 *
 * Both are `ownerProcedure`, the same server-side guard every other owner leaf
 * uses: a missing or expired session is 401 and authenticated staff is 403,
 * decided here and never by navigation visibility. The actor is read from the
 * authenticated context and never from the input, so no caller can attribute a
 * settings change to a principal that did not make it.
 *
 * Only the typed settings conflict is mapped to a transport error: the
 * repository raises it with the stable `settings_version_conflict` code and the
 * message carries no row contents. A validation failure is already a 400 from
 * the input schema, and everything else — missing history, a malformed stored
 * row, an insert or audit failure — is genuinely unexpected and stays a generic
 * 500 with no detail.
 */
function rethrowSettingsErrors(error: unknown): never {
	if (
		error instanceof Error &&
		error.name === "SettingsVersionConflictError" &&
		"code" in error &&
		error.code === "settings_version_conflict"
	) {
		throw new ORPCError("CONFLICT", {
			message: "Settings were updated by someone else",
			data: { code: "settings_version_conflict" },
		});
	}
	throw error;
}

const read = ownerProcedure
	.output(ownerSettingsReadOutputSchema)
	.handler(({ context }) => {
		if (!context.readOwnerSettings) {
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}
		return context.readOwnerSettings();
	});

const update = ownerProcedure
	.input(ownerSettingsUpdateInputSchema)
	.output(ownerSettingsUpdateOutputSchema)
	.handler(async ({ context, input }) => {
		if (!context.updateOwnerSettings) {
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}
		const actorPrincipalId = context.auth.principalId;
		try {
			return await context.updateOwnerSettings({ actorPrincipalId, ...input });
		} catch (error) {
			return rethrowSettingsErrors(error);
		}
	});

export const adminSettingsProcedures = {
	read,
	update,
};
