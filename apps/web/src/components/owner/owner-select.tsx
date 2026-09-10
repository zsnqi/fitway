import { Select } from "@fitway/ui/components/select";
import { Check, ChevronDown } from "lucide-react";

import "./owner-select.css";

export type OwnerSelectItem = {
	value: string | null;
	label: string;
	disabled?: boolean;
};

type OwnerSelectProps = {
	id?: string;
	items: readonly OwnerSelectItem[];
	value: string | null;
	onValueChange: (value: string | null) => void;
	ariaLabel?: string;
	ariaDescribedBy?: string;
	invalid?: boolean;
	disabled?: boolean;
	placeholder?: string;
	className?: string;
	positionerClassName?: string;
	popupClassName?: string;
	popupOwner?: string;
};

/**
 * The single Owner select family.
 *
 * Base UI supplies the keyboard, typeahead, focus, and popup semantics. This
 * wrapper owns the stable Owner DOM contract and keeps every select trigger and
 * option on the same visual and accessibility path.
 */
export function OwnerSelect({
	id,
	items,
	value,
	onValueChange,
	ariaLabel,
	ariaDescribedBy,
	invalid = false,
	disabled = false,
	placeholder = "—",
	className,
	positionerClassName,
	popupClassName,
	popupOwner,
}: OwnerSelectProps) {
	const selected = items.find((item) => item.value === value);
	return (
		<Select.Root
			items={[...items]}
			value={value}
			modal={false}
			disabled={disabled}
			onValueChange={onValueChange}
		>
			<Select.Trigger
				id={id}
				className={`owner-select__trigger${className ? ` ${className}` : ""}`}
				aria-label={ariaLabel}
				aria-invalid={invalid || undefined}
				aria-describedby={ariaDescribedBy}
				data-owner-select-trigger=""
			>
				<Select.Value>
					{() => (
						<span dir="auto">
							{value === null ? placeholder : (selected?.label ?? placeholder)}
						</span>
					)}
				</Select.Value>
				<Select.Icon className="owner-select__icon">
					<ChevronDown aria-hidden="true" />
				</Select.Icon>
			</Select.Trigger>
			<Select.Portal>
				<Select.Positioner
					className={`owner-select__positioner${positionerClassName ? ` ${positionerClassName}` : ""}`}
					data-owner-select-positioner=""
					data-owner-date-popup={popupOwner}
					align="start"
					alignItemWithTrigger={false}
					sideOffset={6}
					collisionPadding={8}
					collisionAvoidance={{ side: "flip", align: "shift" }}
				>
					<Select.Popup
						className={`owner-select__popup${popupClassName ? ` ${popupClassName}` : ""}`}
						data-owner-select-popup=""
					>
						<Select.List className="owner-select__list">
							{items.map((item, index) => (
								<Select.Item
									key={`${item.value ?? "empty"}-${index}`}
									value={item.value}
									label={item.label}
									disabled={item.disabled}
									className="owner-select__option"
									data-owner-select-option=""
								>
									<Select.ItemIndicator className="owner-select__check">
										<Check aria-hidden="true" />
									</Select.ItemIndicator>
									<Select.ItemText>{item.label}</Select.ItemText>
								</Select.Item>
							))}
						</Select.List>
					</Select.Popup>
				</Select.Positioner>
			</Select.Portal>
		</Select.Root>
	);
}
