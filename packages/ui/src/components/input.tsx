import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@fitway/ui/lib/utils";
import type * as React from "react";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<InputPrimitive
			type={type}
			data-slot="input"
			className={cn(
				"min-h-12 w-full min-w-0 rounded-md border border-border-strong bg-surface-raised px-4 py-2.5 text-base text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-subtle disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger",
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
