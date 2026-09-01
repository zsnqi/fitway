import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";

import { useStaffMessages } from "@/hooks/use-staff-messages";
import { useI18n } from "@/i18n/provider";
import { logoutStaff } from "@/lib/auth-client";

import "./staff.css";
import "./staff-board.css";

/**
 * The `/staff` chrome for the approved Paper monitoring family: the warm field
 * with its two fixed oxblood glows, the glass identity rail, and the single
 * content column that carries the page title and the board.
 *
 * `/admin` owns a separate Owner shell. The two surfaces deliberately do not
 * share chrome: the Paper Staff rail has no primary-navigation row.
 */
export function StaffBoardShell({
	children,
	showAdminLink,
}: {
	children: ReactNode;
	showAdminLink?: boolean;
}) {
	const { toggleLocale } = useI18n();
	const messages = useStaffMessages();
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	async function handleLogout() {
		if (isLoggingOut) return;
		setIsLoggingOut(true);
		try {
			await logoutStaff();
			window.location.assign("/login");
		} catch {
			setIsLoggingOut(false);
		}
	}

	return (
		<div className="sboard-shell">
			<div className="sboard-atmosphere" aria-hidden="true" />
			<a className="operations-skip-link" href="#operations-main">
				{messages.common.skipToContent}
			</a>
			<header className="sboard-rail">
				<div className="sboard-rail__bar">
					{/* Session controls stay physically inline-start of the rail and the
					    brand stays inline-end in both locales: the locale changes reading
					    direction, not zone placement. */}
					<div className="sboard-rail__session">
						<button
							type="button"
							className="sboard-rail__control"
							onClick={() => void handleLogout()}
							disabled={isLoggingOut}
							aria-label={messages.common.logout}
						>
							<span className="sboard-rail__ink">
								<bdi>
									{isLoggingOut
										? messages.common.loggingOut
										: messages.common.logout}
								</bdi>
							</span>
						</button>
						<span className="sboard-rail__divider" aria-hidden="true" />
						<button
							type="button"
							className="sboard-rail__control sboard-rail__control--primary"
							onClick={toggleLocale}
							aria-label={messages.common.languageSwitchLabel}
						>
							<span className="sboard-rail__ink">
								<bdi>{messages.common.languageSwitchText}</bdi>
							</span>
						</button>
					</div>
					<div className="sboard-rail__brand">
						{showAdminLink ? (
							<Link
								to="/admin"
								className="sboard-rail__control sboard-rail__control--primary"
							>
								<span className="sboard-rail__ink">
									<bdi>{messages.common.admin}</bdi>
								</span>
							</Link>
						) : null}
						<bdi className="sboard-rail__wordmark">FITWAY</bdi>
						<img
							className="sboard-rail__mark"
							src="/fitway-logo.png"
							alt=""
							width="24"
							height="24"
							aria-hidden="true"
						/>
					</div>
				</div>
			</header>
			<main id="operations-main" className="sboard-main" tabIndex={-1}>
				<h1 className="sboard-title">{messages.staff.title}</h1>
				{children}
			</main>
		</div>
	);
}
