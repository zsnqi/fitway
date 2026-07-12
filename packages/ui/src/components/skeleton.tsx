import { cn } from "@fitway/ui/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="skeleton"
			aria-hidden="true"
			className={cn(
				"rounded-md bg-[length:400%_100%] bg-[linear-gradient(90deg,var(--fw-surface-2)_25%,var(--fw-surface-3)_37%,var(--fw-surface-2)_63%)] motion-safe:animate-[fw-shimmer_1.4s_ease-in-out_infinite] motion-reduce:bg-surface-raised",
				className,
			)}
			{...props}
		/>
	);
}

export { Skeleton };
