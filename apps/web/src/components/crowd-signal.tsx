import type { PublicOccupancyUsablePayload } from "@fitway/api/public-occupancy";
import type { CSSProperties } from "react";

import { CROWD_SIGNAL_LINEAR_HEIGHTS } from "@/components/crowd-signal-ramp";
import { useI18n } from "@/i18n/provider";

type CrowdBand = PublicOccupancyUsablePayload["band"];

const bands = ["quiet", "moderate", "busy", "packed"] as const;
const barBands: CrowdBand[] = [
	...Array<CrowdBand>(6).fill("quiet"),
	...Array<CrowdBand>(5).fill("moderate"),
	...Array<CrowdBand>(8).fill("busy"),
	...Array<CrowdBand>(9).fill("packed"),
];
export function CrowdSignal({
	band,
	stale = false,
	skeleton = false,
	className,
	showFooter = true,
	ramp = CROWD_SIGNAL_LINEAR_HEIGHTS,
}: {
	band?: CrowdBand;
	stale?: boolean;
	skeleton?: boolean;
	/** Extra class on the root, for surface-scoped geometry overrides. */
	className?: string;
	/** The public board closes with a reading strip; the staff board does not. */
	showFooter?: boolean;
	/** Bar heights as percentages of the wave box, ascending, 28 entries. */
	ramp?: readonly number[];
}) {
	const { locale, messages } = useI18n();
	const currentBandIndex = band ? bands.indexOf(band) : -1;
	const completed = bands
		.slice(0, currentBandIndex)
		.map((item) => messages.publicPage.bands[item])
		.join(locale === "ar" ? "، " : ", ");
	const pending = bands
		.slice(currentBandIndex + 1)
		.map((item) => messages.publicPage.bands[item])
		.join(locale === "ar" ? "، " : ", ");
	const currentCap = band ? barBands.lastIndexOf(band) : -1;
	const label = band
		? `${messages.publicPage.crowdScaleValue(
				messages.publicPage.bands[band],
				completed,
				pending,
			)}${stale ? ` ${messages.publicPage.stale}.` : ""}`
		: messages.publicPage.loading;
	const accessibilityProps = skeleton
		? ({ "aria-hidden": true } as const)
		: ({ role: "img", "aria-label": label } as const);

	return (
		<div
			className={[
				"public-live__signal",
				stale ? "public-live__signal--stale" : "",
				skeleton ? "public-live__signal--skeleton" : "",
				className ?? "",
			]
				.filter(Boolean)
				.join(" ")}
			{...accessibilityProps}
		>
			<div className="public-live__signal-caption" aria-hidden="true">
				{bands.map((item) => (
					<span key={item} data-current={item === band ? "true" : undefined}>
						{messages.publicPage.bands[item]}
					</span>
				))}
			</div>
			<div className="public-live__signal-wave" aria-hidden="true">
				{ramp.map((height, index) => {
					const barBand = barBands[index];
					const barBandIndex = bands.indexOf(barBand);
					const state = skeleton
						? "skeleton"
						: barBandIndex < currentBandIndex
							? "complete"
							: barBandIndex === currentBandIndex
								? "current"
								: "inactive";
					return (
						<span
							key={`${barBand}-${index}`}
							className="public-live__signal-bar"
							data-step={barBand}
							data-state={state}
							data-current-cap={index === currentCap ? "true" : undefined}
							style={
								{
									"--signal-height": `${height}%`,
								} as CSSProperties
							}
						/>
					);
				})}
			</div>
			{skeleton ? (
				<div className="public-live__loading-strip">
					<span aria-hidden="true" />
					{messages.publicPage.loading}
				</div>
			) : band && showFooter ? (
				<div className="public-live__signal-footer" aria-hidden="true">
					<span className="public-live__current-reading">
						<i />
						<span>
							{stale
								? messages.publicPage.lastKnownLevel
								: messages.publicPage.currentLevel}
						</span>
						<span>·</span>
						<strong>{messages.publicPage.bands[band]}</strong>
					</span>
				</div>
			) : null}
		</div>
	);
}
