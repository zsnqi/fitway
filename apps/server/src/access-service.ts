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
import {
	assertStaffPinShape,
	createStaffPin,
	hashOwnerPassword,
	hashStaffPin,
} from "@fitway/auth";

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

	/**
	 * The one seam where a PIN becomes credential material, and therefore the
	 * only place the `SPEC.md` shape rule can actually bind.
	 *
	 * No procedure accepts a PIN, so the shape rule has no input to guard; what
	 * it guards is the generator. Asserting here means the 6-12 Western digits
	 * rule is enforced on the value that gets hashed and revealed, rather than
	 * holding only as long as nobody changes `createStaffPin`. A failure is a
	 * server defect, not a caller's, and it stops before anything is stored.
	 *
	 * That last sentence is why the refusal is converted rather than propagated.
	 * `assertStaffPinShape` refuses with an `AccessRuleError`, and the transport
	 * maps every `AccessRuleError` to `BAD_REQUEST` - correct for the nine
	 * refusals an owner can actually provoke, and wrong for this one, which would
	 * tell an owner they mistyped a value they never typed. The distinction is
	 * only knowable here, at the seam that knows the value came from
	 * `createStaffPin`, so it is drawn here rather than by teaching the transport
	 * about individual codes.
	 */
	const generateStaffPin = () => {
		const pin = createStaffPin();
		try {
			assertStaffPinShape(pin);
		} catch (error) {
			// The rejected value is deliberately absent from this message and from
			// `cause`: a malformed PIN is still credential material, and a server
			// fault is exactly the path most likely to be logged.
			throw new Error(
				"The generated staff PIN failed the SPEC shape rule; this is a generator defect, not a caller error",
				{ cause: error },
			);
		}
		return pin;
	};

	return {
		listAccessPrincipals: async () => ({
			principals: await repository.listPrincipals(),
		}),

		provisionStaffPin: async ({ actorPrincipalId }) => {
			const pin = generateStaffPin();
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
			const pin = generateStaffPin();
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
