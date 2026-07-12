import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@fitway/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
	"inline-flex min-h-11 shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-md border border-transparent font-semibold text-sm outline-none transition-[background-color,border-color,color,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg:not([class*='size-'])]:size-5 [&_svg]:pointer-events-none [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground hover:bg-primary-hover active:bg-[var(--fw-primary-pressed)]",
				outline:
					"border-border-strong bg-surface text-foreground hover:bg-surface-hover",
				secondary:
					"border-border bg-surface-raised text-foreground hover:bg-surface-hover",
				ghost:
					"text-muted-foreground hover:bg-surface-raised hover:text-foreground",
				destructive:
					"border-danger/40 bg-danger-background text-danger-foreground hover:bg-danger/25",
				link: "min-h-11 text-foreground underline-offset-4 hover:underline",
			},
			size: {
				default: "px-5 py-2.5",
				xs: "min-h-11 px-3 py-2 text-xs [&_svg:not([class*='size-'])]:size-4",
				sm: "min-h-11 px-4 py-2",
				lg: "min-h-12 px-6 py-3 text-base",
				icon: "size-11 p-0",
				"icon-xs": "size-11 p-0 [&_svg:not([class*='size-'])]:size-4",
				"icon-sm": "size-11 p-0",
				"icon-lg": "size-12 p-0",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant = "default",
	size = "default",
	...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
	return (
		<ButtonPrimitive
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
