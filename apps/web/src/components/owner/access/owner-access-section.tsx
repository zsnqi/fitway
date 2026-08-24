import { useId } from "react";

import { useOwnerAccess } from "@/hooks/use-owner-access";

import {
	OwnerAccessEmpty,
	OwnerAccessError,
	OwnerAccessLive,
	OwnerAccessLoading,
} from "./owner-access-view";
import { useOwnerAccessMessages } from "./use-owner-access-messages";

import "./owner-access.css";

/**
 * The owner access section: the shared front-desk PIN and every owner account.
 *
 * Enablement is an explicit property, not a mount-time default. The route that
 * hosts this section decides when the access surface may turn on; until then the
 * hook stands down (`enabled: false` yields `standby` and issues zero requests)
 * and this section renders nothing, exactly as the audit and health sections
 * stand down while `/admin` still speaks for the page. Stage 4 owns that
 * decision and passes it here.
 */
export function OwnerAccessSection({ enabled }: { enabled: boolean }) {
	const messages = useOwnerAccessMessages();
	const access = useOwnerAccess({ enabled });
	const ids = useId();
	const headingId = `${ids}-heading`;

	if (access.status === "standby") return null;

	return (
		<section className="owner-access" aria-labelledby={headingId}>
			<header className="owner-access__heading">
				<h2 id={headingId}>{messages.title}</h2>
				<p>{messages.description}</p>
			</header>

			{access.status === "pending" ? <OwnerAccessLoading /> : null}
			{access.status === "error" ? (
				<OwnerAccessError onRetry={access.retry} />
			) : null}
			{access.status === "success" ? (
				access.principals.length === 0 ? (
					<OwnerAccessEmpty />
				) : (
					<OwnerAccessLive
						principals={access.principals}
						revealedPin={access.revealedPin}
						dismissRevealedPin={access.dismissRevealedPin}
						provisionStaffPin={access.provisionStaffPin}
						rotateStaffPin={access.rotateStaffPin}
						deactivateStaffPin={access.deactivateStaffPin}
						provisionOwner={access.provisionOwner}
						deactivateOwner={access.deactivateOwner}
						reactivateOwner={access.reactivateOwner}
						resetOwnerCredential={access.resetOwnerCredential}
					/>
				)
			) : null}
		</section>
	);
}
