import { useId } from "react";

import { useOwnerAccess } from "@/hooks/use-owner-access";
import { useOwnerDailyAnalytics } from "@/hooks/use-owner-daily-analytics";

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
 * and this section renders nothing.
 *
 * ## One live region and one retry per page
 *
 * That route-level permission is necessary but not sufficient. While `/admin`'s
 * own shared analytics query is pending or failed, the page is already
 * announcing exactly one "loading" status, or showing exactly one error with one
 * retry. A second copy would be a competing announcement for a screen reader and
 * a duplicate control for everyone else (`DESIGN_GUIDE.md` §13), so this section
 * stands down until the page itself has settled — the same standing-down the
 * accepted audit and health sections perform on this route, for the same reason
 * (see `use-owner-health.ts`).
 *
 * The gate lives here rather than in the route because `/admin` renders a
 * forbidden branch from the same component: a route-level hook call would fire
 * the shared query for a caller who is not allowed to see the page at all.
 */
export function OwnerAccessSection({ enabled }: { enabled: boolean }) {
	const messages = useOwnerAccessMessages();
	const analytics = useOwnerDailyAnalytics();
	const pageSettled = !analytics.isPending && !analytics.isError;
	const access = useOwnerAccess({ enabled: enabled && pageSettled });
	const ids = useId();
	const headingId = `${ids}-heading`;

	if (access.status === "standby") return null;

	return (
		<section className="owner-access" aria-labelledby={headingId}>
			<header className="owner-access__heading" data-owner-navigation-anchor="">
				<h1 id={headingId}>{messages.title}</h1>
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
