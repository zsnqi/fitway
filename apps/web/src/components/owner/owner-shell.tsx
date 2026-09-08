import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useLayoutEffect, useRef, useState } from "react";

import { useStaffMessages } from "@/hooks/use-staff-messages";
import { useI18n } from "@/i18n/provider";
import { logoutStaff } from "@/lib/auth-client";

import "./owner-shell.css";

export function OwnerShell({ children }: { children: ReactNode }) {
	const { locale, toggleLocale } = useI18n();
	const messages = useStaffMessages();
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const shellRef = useRef<HTMLDivElement | null>(null);
	const localeTransitionIdRef = useRef(0);
	const initialLocaleRef = useRef(locale);

	useLayoutEffect(() => {
		if (locale === initialLocaleRef.current) return;
		initialLocaleRef.current = locale;
		const shell = shellRef.current;
		if (!shell) return;
		const transitionId = ++localeTransitionIdRef.current;
		const reducedMotion = window.matchMedia?.(
			"(prefers-reduced-motion: reduce)",
		).matches;
		if (reducedMotion) {
			delete shell.dataset.localeTransition;
			return;
		}

		shell.dataset.localeTransition = "entering";
		let frame = window.requestAnimationFrame(() => {
			frame = 0;
			if (localeTransitionIdRef.current !== transitionId) return;
			shell.dataset.localeTransition = "open";
		});
		const finish = (event: TransitionEvent) => {
			if (
				event.propertyName !== "opacity" ||
				(event.target as HTMLElement).parentElement !== shell ||
				localeTransitionIdRef.current !== transitionId
			)
				return;
			delete shell.dataset.localeTransition;
		};
		shell.addEventListener("transitionend", finish);
		const timeout = window.setTimeout(() => {
			if (localeTransitionIdRef.current === transitionId) {
				delete shell.dataset.localeTransition;
			}
		}, 160);
		return () => {
			if (frame) window.cancelAnimationFrame(frame);
			window.clearTimeout(timeout);
			shell.removeEventListener("transitionend", finish);
		};
	}, [locale]);

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
		<div className="owner-shell" ref={shellRef}>
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
					<img src="/fitway-logo.png" alt="" aria-hidden="true" />
				</Link>
			</header>
			{children}
		</div>
	);
}
