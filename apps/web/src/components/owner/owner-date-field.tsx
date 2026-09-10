import { Popover } from "@fitway/ui/components/popover";
import { Check, ChevronDown } from "lucide-react";
import {
	type FocusEvent as ReactFocusEvent,
	type KeyboardEvent as ReactKeyboardEvent,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";

import { useI18n } from "@/i18n/provider";

import { OwnerSelect } from "./owner-select";

import "./owner-date-field.css";

type DateParts = { day: string; month: string; year: string };

const labels = {
	en: {
		day: "Day",
		month: "Month",
		year: "Year",
		clearDay: "Clear day",
		clearMonth: "Clear month",
		clearYear: "Clear year",
		earlierYears: "Earlier years",
		laterYears: "Later years",
		years: "Years",
		invalid: "Choose a real date using day, month, and year.",
		inverted: "The last day comes before the first day.",
	},
	ar: {
		day: "اليوم",
		month: "الشهر",
		year: "السنة",
		clearDay: "مسح اليوم",
		clearMonth: "مسح الشهر",
		clearYear: "مسح السنة",
		earlierYears: "سنوات أقدم",
		laterYears: "سنوات أحدث",
		years: "السنوات",
		invalid: "اختر يوماً وشهراً وسنة لتكوين تاريخ صحيح.",
		inverted: "اليوم الأخير يسبق اليوم الأول.",
	},
} as const;

export function ownerDateValidationMessage(
	locale: "ar" | "en",
	problem: "invalid" | "inverted",
) {
	return labels[locale][problem];
}

function lastDayOfMonth(year: number | null, month: number | null) {
	if (month === null || month < 1 || month > 12) return 31;
	if (month === 2) {
		return year === null ||
			(year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0))
			? 29
			: 28;
	}
	return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function splitIso(value: string): DateParts {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	return match
		? { year: match[1] ?? "", month: match[2] ?? "", day: match[3] ?? "" }
		: { year: "", month: "", day: "" };
}

function canonicalIso(parts: DateParts): string | null {
	if (!parts.day || !parts.month || !parts.year) return null;
	const day = Number(parts.day);
	const month = Number(parts.month);
	const year = Number(parts.year);
	if (
		!Number.isInteger(day) ||
		!Number.isInteger(month) ||
		!Number.isInteger(year)
	) {
		return null;
	}
	if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1)
		return null;
	const lastDay = lastDayOfMonth(year, month);
	if (day > lastDay) return null;
	return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const YEAR_PAGE_SIZE = 100;

function yearPageStart(year: number) {
	return Math.max(1, Math.min(9900, year - YEAR_PAGE_SIZE / 2));
}

function yearLabel(year: number) {
	return String(year).padStart(4, "0");
}

function SegmentSelect({
	label,
	value,
	clearLabel,
	items,
	invalid,
	describedBy,
	onChange,
	popupOwner,
}: {
	label: string;
	value: string;
	clearLabel: string;
	items: ReadonlyArray<{ value: string; label: string }>;
	invalid: boolean;
	describedBy?: string;
	onChange: (value: string) => void;
	popupOwner: string;
}) {
	return (
		<OwnerSelect
			items={[{ value: null, label: clearLabel }, ...items]}
			value={value || null}
			placeholder="—"
			className="owner-date-field__trigger"
			positionerClassName="owner-date-field__positioner"
			popupClassName="owner-date-field__popup"
			popupOwner={popupOwner}
			ariaLabel={label}
			invalid={invalid}
			ariaDescribedBy={describedBy}
			onValueChange={(next) => onChange(next ?? "")}
		/>
	);
}

function YearSegment({
	label,
	value,
	referenceYear,
	invalid,
	describedBy,
	onChange,
	popupOwner,
	locale,
}: {
	label: string;
	value: string;
	referenceYear: number;
	invalid: boolean;
	describedBy?: string;
	onChange: (value: string) => void;
	popupOwner: string;
	locale: "ar" | "en";
}) {
	const copy = labels[locale];
	const generated = useId();
	const selectedYear = value ? Number(value) : null;
	const reference = selectedYear ?? referenceYear;
	const [open, setOpen] = useState(false);
	const [pageStart, setPageStart] = useState(() => yearPageStart(reference));
	const [activeYear, setActiveYear] = useState(reference);
	const typeahead = useRef({ value: "", at: 0 });
	const years = useMemo(
		() =>
			Array.from({ length: YEAR_PAGE_SIZE }, (_, index) => pageStart + index),
		[pageStart],
	);
	const pageEnd = years.at(-1) ?? pageStart;

	useEffect(() => {
		if (!open) return;
		const frame = requestAnimationFrame(() =>
			document
				.getElementById(`${generated}-${activeYear}`)
				?.scrollIntoView?.({ block: "nearest" }),
		);
		return () => cancelAnimationFrame(frame);
	}, [activeYear, generated, open]);

	function handleOpenChange(next: boolean) {
		setOpen(next);
		if (!next) {
			typeahead.current = { value: "", at: 0 };
			return;
		}
		const nextYear = selectedYear ?? referenceYear;
		setPageStart(yearPageStart(nextYear));
		setActiveYear(nextYear);
	}

	function choose(year: number | null) {
		onChange(year === null ? "" : yearLabel(year));
		setOpen(false);
	}

	function focusYear(year: number) {
		requestAnimationFrame(() =>
			document
				.getElementById(`${generated}-${year}`)
				?.focus({ preventScroll: true }),
		);
	}

	function movePage(direction: -1 | 1) {
		const nextStart = Math.max(1, Math.min(9900, pageStart + direction * 100));
		const nextActiveYear = direction < 0 ? nextStart + 99 : nextStart;
		setPageStart(nextStart);
		setActiveYear(nextActiveYear);
		focusYear(nextActiveYear);
	}

	function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
		if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			event.preventDefault();
			const delta = event.key === "ArrowDown" ? 1 : -1;
			const nextYear = Math.max(
				pageStart,
				Math.min(pageEnd, activeYear + delta),
			);
			setActiveYear(nextYear);
			focusYear(nextYear);
			return;
		}
		if (event.key === "Home" || event.key === "End") {
			event.preventDefault();
			const nextYear = event.key === "Home" ? pageStart : pageEnd;
			setActiveYear(nextYear);
			focusYear(nextYear);
			return;
		}
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			choose(activeYear);
			return;
		}
		if (!/^\d$/u.test(event.key)) return;
		event.preventDefault();
		const now = Date.now();
		const prior =
			now - typeahead.current.at <= 700 ? typeahead.current.value : "";
		const typed = `${prior}${event.key}`.slice(-4);
		typeahead.current = { value: typed, at: now };
		const nextYear = Number(typed);
		if (nextYear < 1 || nextYear > 9999) return;
		setPageStart(yearPageStart(nextYear));
		setActiveYear(nextYear);
		focusYear(nextYear);
	}

	return (
		<Popover.Root open={open} onOpenChange={handleOpenChange} modal={false}>
			<Popover.Trigger
				className="owner-select__trigger owner-date-field__trigger"
				aria-label={label}
				aria-invalid={invalid || undefined}
				aria-describedby={describedBy}
			>
				<span dir="ltr">{selectedYear ? yearLabel(selectedYear) : "—"}</span>
				<span className="owner-date-field__icon">
					<ChevronDown aria-hidden="true" />
				</span>
			</Popover.Trigger>
			<Popover.Portal keepMounted>
				<Popover.Positioner
					className="owner-date-field__positioner owner-date-field__positioner--year"
					data-owner-date-popup={popupOwner}
					align="start"
					sideOffset={6}
					collisionPadding={8}
					collisionAvoidance={{ side: "flip", align: "shift" }}
				>
					<Popover.Popup
						className="owner-date-field__popup owner-date-field__year-popup"
						initialFocus={() =>
							document.getElementById(`${generated}-${activeYear}`)
						}
					>
						<div className="owner-date-field__year-toolbar">
							<button
								type="button"
								onClick={() => movePage(-1)}
								disabled={pageStart === 1}
							>
								{copy.earlierYears}
							</button>
							<button type="button" onClick={() => choose(null)}>
								{copy.clearYear}
							</button>
						</div>
						<p className="owner-date-field__year-range" aria-hidden="true">
							<bdi>{yearLabel(pageStart)}</bdi>–<bdi>{yearLabel(pageEnd)}</bdi>
						</p>
						<div
							className="owner-date-field__year-list"
							role="listbox"
							aria-label={copy.years}
						>
							{years.map((year) => (
								<div
									key={year}
									id={`${generated}-${year}`}
									className="owner-date-field__year-option"
									role="option"
									tabIndex={activeYear === year ? 0 : -1}
									aria-selected={selectedYear === year}
									data-active={activeYear === year ? "" : undefined}
									onPointerMove={() => setActiveYear(year)}
									onFocus={() => setActiveYear(year)}
									onKeyDown={handleKeyDown}
									onClick={() => choose(year)}
								>
									<span className="owner-date-field__check" aria-hidden="true">
										{selectedYear === year ? <Check /> : null}
									</span>
									<bdi>{yearLabel(year)}</bdi>
								</div>
							))}
						</div>
						<button
							type="button"
							className="owner-date-field__year-later"
							onClick={() => movePage(1)}
							disabled={pageEnd === 9999}
						>
							{copy.laterYears}
						</button>
					</Popover.Popup>
				</Popover.Positioner>
			</Popover.Portal>
		</Popover.Root>
	);
}

export function OwnerDateField({
	id,
	label,
	value,
	onChange,
	onValidityChange,
	onValidationRequest,
	onValidationReset,
	min,
	max,
	describedBy,
	invalid = false,
	referenceYear = new Date().getUTCFullYear(),
}: {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	onValidityChange?: (valid: boolean) => void;
	onValidationRequest?: () => void;
	onValidationReset?: () => void;
	min?: string;
	max?: string;
	describedBy?: string;
	invalid?: boolean;
	referenceYear?: number;
}) {
	const { locale } = useI18n();
	const copy = labels[locale];
	const [parts, setParts] = useState<DateParts>(() => splitIso(value));
	const [locallyValid, setLocallyValid] = useState(true);
	const validityCallback = useRef(onValidityChange);
	validityCallback.current = onValidityChange;
	const normalizedReferenceYear = Math.max(
		1,
		Math.min(9999, Math.trunc(referenceYear)),
	);
	const monthItems = useMemo(() => {
		const formatter = new Intl.DateTimeFormat(
			`${locale}-u-ca-gregory-nu-latn`,
			{ month: "long", timeZone: "UTC" },
		);
		return Array.from({ length: 12 }, (_, index) => ({
			value: String(index + 1).padStart(2, "0"),
			label: formatter.format(new Date(Date.UTC(2000, index, 1))),
		}));
	}, [locale]);
	const selectedYear = parts.year ? Number(parts.year) : null;
	const selectedMonth = parts.month ? Number(parts.month) : null;
	const dayItems = useMemo(
		() =>
			Array.from(
				{ length: lastDayOfMonth(selectedYear, selectedMonth) },
				(_, index) => ({
					value: String(index + 1).padStart(2, "0"),
					label: String(index + 1),
				}),
			),
		[selectedMonth, selectedYear],
	);

	useEffect(() => {
		setParts(splitIso(value));
		setLocallyValid(true);
		validityCallback.current?.(true);
	}, [value]);

	function edit(part: keyof DateParts, nextValue: string) {
		onValidationReset?.();
		const next: DateParts = {
			...parts,
			[part]: nextValue,
		};
		if (
			(part === "month" || part === "year") &&
			next.day &&
			Number(next.day) >
				lastDayOfMonth(
					next.year ? Number(next.year) : null,
					next.month ? Number(next.month) : null,
				)
		) {
			next.day = "";
		}
		setParts(next);
		const allEmpty = !next.day && !next.month && !next.year;
		if (allEmpty) {
			setLocallyValid(true);
			onValidityChange?.(true);
			onChange("");
			return;
		}
		const iso = canonicalIso(next);
		const valid = iso !== null && (!min || iso >= min) && (!max || iso <= max);
		setLocallyValid(valid);
		onValidityChange?.(valid);
		if (valid && iso) onChange(iso);
	}

	const ariaInvalid = invalid || !locallyValid;

	function handleBlur(event: ReactFocusEvent<HTMLFieldSetElement>) {
		const next = event.relatedTarget;
		if (next instanceof Node && event.currentTarget.contains(next)) return;
		if (
			next instanceof Element &&
			next.closest(`[data-owner-date-popup="${CSS.escape(id)}"]`)
		) {
			return;
		}
		onValidationRequest?.();
	}

	return (
		<fieldset
			className="owner-date-field"
			data-owner-date-field={id}
			onBlur={handleBlur}
		>
			<legend>{label}</legend>
			<div className="owner-date-field__parts">
				<div className="owner-date-field__segment">
					<SegmentSelect
						label={copy.day}
						value={parts.day}
						clearLabel={copy.clearDay}
						items={dayItems}
						invalid={ariaInvalid}
						describedBy={describedBy}
						onChange={(next) => edit("day", next)}
						popupOwner={id}
					/>
				</div>
				<div className="owner-date-field__segment">
					<SegmentSelect
						label={copy.month}
						value={parts.month}
						clearLabel={copy.clearMonth}
						items={monthItems}
						invalid={ariaInvalid}
						describedBy={describedBy}
						onChange={(next) => edit("month", next)}
						popupOwner={id}
					/>
				</div>
				<div className="owner-date-field__segment">
					<YearSegment
						label={copy.year}
						value={parts.year}
						referenceYear={normalizedReferenceYear}
						invalid={ariaInvalid}
						describedBy={describedBy}
						onChange={(next) => edit("year", next)}
						popupOwner={id}
						locale={locale}
					/>
				</div>
			</div>
			<input type="hidden" name={id} value={value} data-owner-date-value="" />
		</fieldset>
	);
}
