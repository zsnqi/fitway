import { Input } from "@fitway/ui/components/input";
import { Label } from "@fitway/ui/components/label";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useEffect, useState } from "react";

import {
	LoginRail,
	LoginStatusMessage,
	LoginSubmittingIndicator,
} from "@/components/login/login-chrome";
import "@/components/login/login.css";
import { useStaffMessages } from "@/hooks/use-staff-messages";
import { formatNumber } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";
import {
	AuthRequestError,
	isValidStaffPin,
	loginWithStaffPin,
	normalizeWesternPin,
} from "@/lib/auth-client";
import { sessionOrNull } from "@/routes/_auth/-session";

export const Route = createFileRoute("/login")({
	beforeLoad: async () => {
		const session = await sessionOrNull();
		if (session) throw redirect({ to: "/staff", replace: true });
	},
	component: LoginRoute,
});

type LoginError =
	| "invalid-pin"
	| "invalid-credentials"
	| "rate-limited"
	| "service"
	| null;

function LoginRoute() {
	const navigate = useNavigate({ from: "/login" });
	const { locale } = useI18n();
	const messages = useStaffMessages();
	const [pin, setPin] = useState("");
	const [error, setError] = useState<LoginError>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [retrySeconds, setRetrySeconds] = useState(0);
	const [retryNoticeSeconds, setRetryNoticeSeconds] = useState(0);
	const minimum = formatNumber(6, locale);
	const maximum = formatNumber(12, locale);

	useEffect(() => {
		if (retrySeconds <= 0) return;
		const timer = window.setInterval(
			() => setRetrySeconds((current) => Math.max(0, current - 1)),
			1_000,
		);
		return () => window.clearInterval(timer);
	}, [retrySeconds]);

	useEffect(() => {
		if (retrySeconds === 0 && error === "rate-limited") {
			setError(null);
			setRetryNoticeSeconds(0);
		}
	}, [error, retrySeconds]);

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (retrySeconds > 0 || isSubmitting) return;
		if (!isValidStaffPin(pin)) {
			setError("invalid-pin");
			return;
		}

		setError(null);
		setIsSubmitting(true);
		try {
			await loginWithStaffPin(pin);
			await navigate({ to: "/staff", replace: true });
		} catch (caught) {
			if (caught instanceof AuthRequestError && caught.status === 429) {
				const waitSeconds = caught.retryAfterSeconds ?? 30;
				setRetrySeconds(waitSeconds);
				setRetryNoticeSeconds(waitSeconds);
				setError("rate-limited");
			} else if (caught instanceof AuthRequestError && caught.status === 401) {
				setError("invalid-credentials");
			} else {
				setError("service");
			}
		} finally {
			setIsSubmitting(false);
		}
	}

	const errorMessage =
		error === "invalid-pin"
			? messages.login.pinInvalid(minimum, maximum)
			: error === "invalid-credentials"
				? messages.login.invalidCredentials
				: error === "rate-limited"
					? messages.login.rateLimited(formatNumber(retryNoticeSeconds, locale))
					: error === "service"
						? messages.login.serviceError
						: null;

	return (
		<div className="login-shell">
			{/* biome-ignore lint/a11y/useValidAnchor: this skip link also transfers focus to the main landmark. */}
			<a
				className="operations-skip-link"
				href="#main-content"
				onClick={(event) => {
					const target = document.getElementById("main-content");
					if (!target) return;
					event.preventDefault();
					target.focus({ preventScroll: true });
					target.scrollIntoView({ block: "start" });
				}}
			>
				{messages.common.skipToContent}
			</a>
			<LoginRail />
			<main id="main-content" className="login-main" tabIndex={-1}>
				<section className="login-panel" aria-labelledby="login-heading">
					<div className="login-panel__heading">
						<h1 id="login-heading">{messages.login.title}</h1>
						<p className="login-panel__description">
							{messages.login.description}
						</p>
					</div>
					<form onSubmit={(event) => void submit(event)} noValidate>
						<div className="login-field">
							<Label htmlFor="staff-pin">{messages.login.pinLabel}</Label>
							<Input
								id="staff-pin"
								name="pin"
								type="password"
								inputMode="numeric"
								autoComplete="current-password"
								pattern="[0-9]*"
								minLength={6}
								maxLength={12}
								dir="ltr"
								className="login-field__input"
								data-state={error ?? (isSubmitting ? "submitting" : "idle")}
								value={pin}
								onChange={(event) => {
									setPin(normalizeWesternPin(event.target.value));
									if (error !== "rate-limited") setError(null);
								}}
								aria-invalid={Boolean(errorMessage)}
								aria-describedby={
									errorMessage
										? "staff-pin-hint staff-pin-error"
										: "staff-pin-hint"
								}
								disabled={isSubmitting}
							/>
							<p id="staff-pin-hint" className="login-field__hint">
								{messages.login.pinHint(minimum, maximum)}
							</p>
							{errorMessage && error ? (
								<LoginStatusMessage kind={error}>
									{errorMessage}
								</LoginStatusMessage>
							) : null}
						</div>
						<button
							type="submit"
							className="login-panel__submit"
							data-submitting={isSubmitting ? "true" : "false"}
							disabled={
								!isValidStaffPin(pin) || isSubmitting || retrySeconds > 0
							}
						>
							{isSubmitting ? messages.login.submitting : messages.login.submit}
							{isSubmitting ? <LoginSubmittingIndicator /> : null}
						</button>
					</form>
				</section>
			</main>
		</div>
	);
}
