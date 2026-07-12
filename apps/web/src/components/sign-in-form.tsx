import { Button } from "@fitway/ui/components/button";
import { Input } from "@fitway/ui/components/input";
import { Label } from "@fitway/ui/components/label";
import { Skeleton } from "@fitway/ui/components/skeleton";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import z from "zod";

import { formatNumber } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";
import { authClient } from "@/lib/auth-client";

export default function SignInForm() {
	const navigate = useNavigate({ from: "/login" });
	const { locale, messages } = useI18n();
	const [authError, setAuthError] = useState(false);
	const { isPending: isSessionPending } = authClient.useSession();
	const minimumPasswordLength = formatNumber(8, locale);

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			setAuthError(false);
			await authClient.signIn.email(value, {
				onSuccess: () => {
					navigate({ to: "/" });
				},
				onError: () => setAuthError(true),
			});
		},
		validators: {
			onSubmit: z.object({
				email: z.email(messages.login.emailInvalid),
				password: z
					.string()
					.min(8, messages.login.passwordTooShort(minimumPasswordLength)),
			}),
		},
	});

	if (isSessionPending) {
		return (
			<section
				className="w-full rounded-xl border bg-surface p-6"
				aria-busy="true"
			>
				<p className="fw-sr-only" role="status">
					{messages.login.loading}
				</p>
				<Skeleton className="mx-auto mb-4 h-9 w-40" />
				<Skeleton className="mb-6 h-5 w-full" />
				<Skeleton className="mb-4 h-12 w-full" />
				<Skeleton className="mb-5 h-12 w-full" />
				<Skeleton className="h-12 w-full" />
			</section>
		);
	}

	return (
		<section className="w-full rounded-xl border bg-surface p-6 shadow-[var(--fw-shadow-lg)] sm:p-8">
			<header className="mb-7 text-center">
				<h1 className="m-0 font-bold text-3xl">{messages.login.title}</h1>
				<p className="mt-2 mb-0 text-muted-foreground text-sm">
					{messages.login.description}
				</p>
			</header>

			<form
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					form.handleSubmit();
				}}
				className="grid gap-5"
				noValidate
			>
				<form.Field name="email">
					{(field) => {
						const errorId = `${field.name}-error`;
						const errors = field.state.meta.errors;
						return (
							<div className="grid gap-2">
								<Label htmlFor={field.name}>{messages.login.emailLabel}</Label>
								<Input
									id={field.name}
									name={field.name}
									type="email"
									autoComplete="email"
									inputMode="email"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									aria-invalid={errors.length > 0}
									aria-describedby={errors.length > 0 ? errorId : undefined}
								/>
								{errors.map((error) => (
									<p
										key={error?.message}
										id={errorId}
										className="m-0 text-danger-foreground text-sm"
										role="alert"
									>
										{error?.message}
									</p>
								))}
							</div>
						);
					}}
				</form.Field>

				<form.Field name="password">
					{(field) => {
						const errorId = `${field.name}-error`;
						const errors = field.state.meta.errors;
						return (
							<div className="grid gap-2">
								<Label htmlFor={field.name}>
									{messages.login.passwordLabel}
								</Label>
								<Input
									id={field.name}
									name={field.name}
									type="password"
									autoComplete="current-password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									aria-invalid={errors.length > 0}
									aria-describedby={errors.length > 0 ? errorId : undefined}
								/>
								{errors.map((error) => (
									<p
										key={error?.message}
										id={errorId}
										className="m-0 text-danger-foreground text-sm"
										role="alert"
									>
										{error?.message}
									</p>
								))}
							</div>
						);
					}}
				</form.Field>

				{authError ? (
					<p
						className="m-0 rounded-md border border-danger/40 bg-danger-background p-3 text-danger-foreground text-sm"
						role="alert"
					>
						{messages.login.authError}
					</p>
				) : null}

				<form.Subscribe
					selector={(state) => ({
						canSubmit: state.canSubmit,
						isSubmitting: state.isSubmitting,
					})}
				>
					{({ canSubmit, isSubmitting }) => (
						<Button
							type="submit"
							size="lg"
							className="w-full"
							disabled={!canSubmit || isSubmitting}
						>
							{isSubmitting ? messages.login.submitting : messages.login.submit}
						</Button>
					)}
				</form.Subscribe>
			</form>
		</section>
	);
}
