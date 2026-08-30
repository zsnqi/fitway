import {
	type OwnerSettingsSnapshot,
	type OwnerSettingsUpdateInput,
	type OwnerSettingsUpdateOutput,
	ownerSettingsSnapshotSchema,
	ownerSettingsUpdateOutputSchema,
} from "@fitway/api/settings/contracts";
import { ORPCError } from "@orpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { client } from "@/utils/orpc";

/**
 * Owner Settings data layer: one read of the current-effective snapshot and
 * the one append-only writer. It renders nothing and decides nothing about
 * when the section appears.
 *
 * ## The snapshot does not fetch until told to
 *
 * Enablement is an explicit argument, not a mount-time default. While
 * `enabled` is false the status is `standby` and the wire stays silent — the
 * same standing-down the access, audit, and health layers perform so a
 * mounting section never fires an unmocked request in a sibling spec.
 *
 * ## Reads and writes are schema-validated
 *
 * Both responses are parsed against the shared transport schemas, so a
 * malformed payload surfaces as an error rather than rendering as a
 * plausible-looking setting.
 *
 * ## The conflict is typed, everything else is not
 *
 * Only the server-typed `settings_version_conflict` maps to
 * `{ phase: "conflict" }`; a validation 400, a network failure, or an atomic
 * 500 all land on `{ phase: "failed" }`. The UI never infers a conflict from
 * a generic failure.
 */
export type OwnerSettingsSaveOutcome =
	| { phase: "idle" }
	| { phase: "pending" }
	| { phase: "success"; output: OwnerSettingsUpdateOutput }
	| { phase: "conflict" }
	| { phase: "failed" };

export type OwnerSettingsSave = {
	outcome: OwnerSettingsSaveOutcome;
	submit: (input: OwnerSettingsUpdateInput) => void;
	reset: () => void;
};

export type OwnerSettingsResult = {
	/**
	 * `standby` means enablement has not been granted yet, so the hook issues
	 * no request at all.
	 */
	status: "standby" | "pending" | "error" | "success";
	snapshot: OwnerSettingsSnapshot | null;
	retry: () => void;
	/**
	 * Refetches the current server snapshot. The conflict Discard uses this to
	 * reload latest values instead of silently rebasing the draft.
	 */
	reload: () => Promise<void>;
	isReloading: boolean;
	save: OwnerSettingsSave;
};

const SNAPSHOT_KEY = ["owner", "settings", "snapshot"] as const;

function conflictOf(error: unknown): boolean {
	if (!(error instanceof ORPCError)) return false;
	if (error.code !== "CONFLICT") return false;
	const data = error.data as { code?: unknown } | undefined;
	return data?.code === "settings_version_conflict";
}

export function useOwnerSettings({
	enabled,
}: {
	enabled: boolean;
}): OwnerSettingsResult {
	const queryClient = useQueryClient();
	const [savedOutput, setSavedOutput] =
		useState<OwnerSettingsUpdateOutput | null>(null);

	const query = useQuery({
		queryKey: SNAPSHOT_KEY,
		enabled,
		queryFn: async (): Promise<OwnerSettingsSnapshot> =>
			ownerSettingsSnapshotSchema.parse(await client.admin.settings.read()),
		retry: false,
		refetchOnWindowFocus: false,
	});

	const mutation = useMutation({
		mutationFn: async (
			input: OwnerSettingsUpdateInput,
		): Promise<OwnerSettingsUpdateOutput> =>
			ownerSettingsUpdateOutputSchema.parse(
				await client.admin.settings.update(input),
			),
		onSuccess: (output) => {
			// The appended snapshot is immediately effective: the read cache
			// adopts it so the version chip, baseline, and draft reset together.
			setSavedOutput(output);
			queryClient.setQueryData(SNAPSHOT_KEY, output.settings);
		},
		retry: false,
	});

	const outcome: OwnerSettingsSaveOutcome = mutation.isPending
		? { phase: "pending" }
		: mutation.isError
			? conflictOf(mutation.error)
				? { phase: "conflict" }
				: { phase: "failed" }
			: savedOutput !== null
				? { phase: "success", output: savedOutput }
				: { phase: "idle" };

	return {
		status: !enabled
			? "standby"
			: query.isError
				? "error"
				: query.isPending
					? "pending"
					: "success",
		snapshot: query.data ?? null,
		retry: () => void query.refetch(),
		reload: async () => {
			await query.refetch();
		},
		isReloading: query.isRefetching,
		save: {
			outcome,
			submit: (input) => void mutation.mutate(input),
			reset: () => {
				setSavedOutput(null);
				mutation.reset();
			},
		},
	};
}
