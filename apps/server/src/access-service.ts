import type {
	AccessListOutput,
	AccessMutationOutput,
	OwnerCredentialResetInput,
	OwnerDeactivateInput,
	OwnerProvisionInput,
	OwnerReactivateInput,
	StaffPinDeactivateInput,
	StaffPinRevealOutput,
} from "@fitway/api/access/contracts";
import { createStaffPin, hashOwnerPassword, hashStaffPin } from "@fitway/auth";

import type { AccessRepository } from "./access-repository";

/**
 * The bridge between the owner access transport and the transactional
 * repository.
 *
 * It exists to hold exactly one responsibility the repository must not have and
 * the transport cannot have: turning a request into credential material. The PIN
 * is generated here, hashed here, and handed to the repository already hashed,
 * so the repository never sees a secret and the transport never supplies one.
 *
 * The generated PIN is returned to the caller once, which is the locked
 * decision. It is deliberately not logged, not stored, and not present in any
 * read path — `listPrincipals` returns versions and flags, never credentials.
 */
export type AccessService = {
	listAccessPrincipals: () => Promise<AccessListOutput>;
	provisionStaffPin: (input: {
		actorPrincipalId: string;
	}) => Promise<StaffPinRevealOutput>;
	rotateStaffPin: (input: {
		actorPrincipalId: string;
	}) => Promise<StaffPinRevealOutput>;
	deactivateStaffPin: (
		input: { actorPrincipalId: string } & StaffPinDeactivateInput,
	) => Promise<AccessMutationOutput>;
	provisionOwner: (
		input: { actorPrincipalId: string } & OwnerProvisionInput,
	) => Promise<AccessMutationOutput>;
	deactivateOwner: (
		input: { actorPrincipalId: string } & OwnerDeactivateInput,
	) => Promise<AccessMutationOutput>;
	reactivateOwner: (
		input: { actorPrincipalId: string } & OwnerReactivateInput,
	) => Promise<AccessMutationOutput>;
	resetOwnerCredential: (
		input: { actorPrincipalId: string } & OwnerCredentialResetInput,
	) => Promise<AccessMutationOutput>;
};

export function createAccessService(options: {
	repository: AccessRepository;
	pinPepper: string;
	ownerPasswordPepper: string;
	now?: () => Date;
}): AccessService {
	const { repository, pinPepper, ownerPasswordPepper } = options;
	const clock = options.now ?? (() => new Date());

	return {
		listAccessPrincipals: async () => ({
			principals: await repository.listPrincipals(),
		}),

		provisionStaffPin: async ({ actorPrincipalId }) => {
			const pin = createStaffPin();
			const hashed = await hashStaffPin(pin, pinPepper);
			const result = await repository.provisionStaffPin({
				actorPrincipalId,
				pinHash: hashed.pinHash,
				pinSalt: hashed.pinSalt,
				now: clock(),
			});
			return { ...result, revealedPin: pin };
		},

		rotateStaffPin: async ({ actorPrincipalId }) => {
			const pin = createStaffPin();
			const hashed = await hashStaffPin(pin, pinPepper);
			const result = await repository.rotateStaffPin({
				actorPrincipalId,
				pinHash: hashed.pinHash,
				pinSalt: hashed.pinSalt,
				now: clock(),
			});
			return { ...result, revealedPin: pin };
		},

		deactivateStaffPin: ({ actorPrincipalId, reason }) =>
			repository.deactivateStaffPin({
				actorPrincipalId,
				reason,
				now: clock(),
			}),

		provisionOwner: async ({
			actorPrincipalId,
			email,
			displayName,
			password,
		}) => {
			const hashed = await hashOwnerPassword(password, ownerPasswordPepper);
			return repository.provisionOwner({
				actorPrincipalId,
				email,
				displayName,
				passwordHash: hashed.passwordHash,
				passwordSalt: hashed.passwordSalt,
				now: clock(),
			});
		},

		deactivateOwner: ({ actorPrincipalId, targetPrincipalId, reason }) =>
			repository.deactivateOwner({
				actorPrincipalId,
				targetPrincipalId,
				reason,
				now: clock(),
			}),

		reactivateOwner: ({ actorPrincipalId, targetPrincipalId }) =>
			repository.reactivateOwner({
				actorPrincipalId,
				targetPrincipalId,
				now: clock(),
			}),

		resetOwnerCredential: async ({
			actorPrincipalId,
			targetPrincipalId,
			password,
		}) => {
			const hashed = await hashOwnerPassword(password, ownerPasswordPepper);
			return repository.resetOwnerCredential({
				actorPrincipalId,
				targetPrincipalId,
				passwordHash: hashed.passwordHash,
				passwordSalt: hashed.passwordSalt,
				now: clock(),
			});
		},
	};
}
