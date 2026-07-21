import { Button } from "@fitway/ui/components/button";
import { Link } from "@tanstack/react-router";
import { Activity, LogOut, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { PublicAtmosphere } from "@/components/public-atmosphere";
import { useStaffMessages } from "@/hooks/use-staff-messages";
import { useI18n } from "@/i18n/provider";
import { logoutStaff } from "@/lib/auth-client";

import "./staff.css";

type StaffShellProps = {
	children: ReactNode;
	active: "staff" | "admin";
	showAdminLink?: boolean;
};

export function StaffShell({
	children,
	active,
	showAdminLink,
}: StaffShellProps) {
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
		<div className="operations-shell">
			<PublicAtmosphere />
			<a className="operations-skip-link" href="#operations-main">
				{messages.common.skipToContent}
			</a>
			<header className="operations-header">
				<div className="operations-header__inner">
					<Link
						className="operations-brand"
						to="/staff"
						aria-label={messages.common.operations}
					>
						<img src="/fitway-logo.png" alt="" width="40" height="40" />
						<bdi>FITWAY</bdi>
					</Link>
					<nav
						className="operations-nav"
						aria-label={messages.common.operations}
					>
						<Link
							to="/staff"
							className="operations-nav__link"
							data-active={active === "staff" ? "true" : undefined}
						>
							<Activity aria-hidden="true" />
							{messages.common.operations}
						</Link>
						{showAdminLink || active === "admin" ? (
							<Link
								to="/admin"
								className="operations-nav__link"
								data-active={active === "admin" ? "true" : undefined}
							>
								<ShieldCheck aria-hidden="true" />
								{messages.common.admin}
							</Link>
						) : null}
					</nav>
					<div className="operations-header__actions">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={toggleLocale}
							aria-label={messages.common.languageSwitchLabel}
							className="operations-header__language"
						>
							<bdi>{messages.common.languageSwitchText}</bdi>
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => void handleLogout()}
							disabled={isLoggingOut}
							aria-label={messages.common.logout}
							className="operations-header__logout"
						>
							<LogOut aria-hidden="true" />
							<span>
								{isLoggingOut
									? messages.common.loggingOut
									: messages.common.logout}
							</span>
						</Button>
					</div>
				</div>
			</header>
			{children}
		</div>
	);
}
