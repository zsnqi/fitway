import { createFileRoute } from "@tanstack/react-router";

import { BrandHeader } from "@/components/brand-header";
import SignInForm from "@/components/sign-in-form";

export const Route = createFileRoute("/login")({
	component: LoginRoute,
});

function LoginRoute() {
	return (
		<div className="grid min-h-svh grid-rows-[auto_1fr] bg-background">
			<BrandHeader />
			<main className="mx-auto flex w-full max-w-[var(--fw-container-public)] items-start justify-center px-4 py-8 sm:px-6 sm:py-12">
				<SignInForm />
			</main>
		</div>
	);
}
