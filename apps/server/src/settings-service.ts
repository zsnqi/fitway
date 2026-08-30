import type {
	OwnerSettingsSnapshot,
	OwnerSettingsUpdateInput,
	OwnerSettingsUpdateOutput,
} from "@fitway/api/settings/contracts";

import type { SettingsRepository } from "./settings-repository";

/**
 * The bridge between the owner Settings transport and the transactional
 * repository.
 *
 * The repository owns every Settings timing concern: the injected clock, the
 * advisory transaction lock, and the current-effective predicate. This service
 * therefore captures no effective timestamp and performs no persistence — it
 * delegates both verbs unchanged, which is the whole seam the accepted
 * specification asks it to be. Its value is the boundary itself: the transport
 * sees only contract types, never a database client, a clock, or a lock, and
 * any future transport concern (request shaping, observability tagging) has one
 * place to live without touching the transaction.
 */
export type SettingsService = {
	readOwnerSettings: () => Promise<OwnerSettingsSnapshot>;
	updateOwnerSettings: (
		input: { actorPrincipalId: string } & OwnerSettingsUpdateInput,
	) => Promise<OwnerSettingsUpdateOutput>;
};

export function createSettingsService(options: {
	repository: SettingsRepository;
}): SettingsService {
	const { repository } = options;
	return {
		readOwnerSettings: () => repository.readCurrentSnapshot(),
		updateOwnerSettings: (input) => repository.updateSnapshot(input),
	};
}
