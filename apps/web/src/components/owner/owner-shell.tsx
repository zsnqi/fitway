import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";

import { useStaffMessages } from "@/hooks/use-staff-messages";
import { useI18n } from "@/i18n/provider";
import { logoutStaff } from "@/lib/auth-client";

import "./owner-shell.css";

export function OwnerShell({ children }: { children: ReactNode }) {
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
		<div className="owner-shell">
			<a className="operations-skip-link" href="#operations-main">
				{messages.common.skipToContent}
			</a>
			<header className="owner-rail">
				<div className="owner-rail__identity">
					<div className="owner-rail__session">
						<button
							type="button"
							className="owner-rail__session-action owner-rail__logout"
							onClick={() => void handleLogout()}
							disabled={isLoggingOut}
							aria-label={messages.common.logout}
						>
							<bdi>
								{isLoggingOut
									? messages.common.loggingOut
									: messages.common.logout}
							</bdi>
						</button>
						<span className="owner-rail__separator" aria-hidden="true" />
						<button
							type="button"
							className="owner-rail__session-action owner-rail__language"
							onClick={toggleLocale}
							aria-label={messages.common.languageSwitchLabel}
						>
							<bdi>{messages.common.languageSwitchText}</bdi>
						</button>
					</div>
				</div>
				<nav
					className="owner-nav operations-nav"
					aria-label={messages.common.operations}
				>
					<Link className="owner-nav__link" to="/staff">
						<bdi>{messages.common.operations}</bdi>
					</Link>
					<Link
						className="owner-nav__link"
						to="/admin"
						aria-current="page"
						data-active="true"
					>
						<bdi>{messages.common.admin}</bdi>
					</Link>
				</nav>
				<span className="owner-rail__zone-separator" aria-hidden="true" />
				<Link
					className="owner-rail__brand"
					to="/staff"
					aria-label={messages.common.operations}
				>
					<bdi>FITWAY</bdi>
					<svg viewBox="0 0 26 26" aria-hidden="true">
						<circle cx="13" cy="13" r="11.2" />
						<path d="M9.2 16.8 16.8 9.2" />
					</svg>
				</Link>
			</header>
			{children}
		</div>
	);
}
