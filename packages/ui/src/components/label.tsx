"use client";

import { cn } from "@fitway/ui/lib/utils";
import type * as React from "react";

function Label({
	children,
	className,
	htmlFor,
	...props
}: React.ComponentProps<"label"> & { htmlFor: string }) {
	return (
		<label
			data-slot="label"
			htmlFor={htmlFor}
			className={cn(
				"flex select-none items-center gap-2 font-medium text-muted-foreground text-sm leading-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
				className,
			)}
			{...props}
		>
			{children}
		</label>
	);
}

export { Label };
