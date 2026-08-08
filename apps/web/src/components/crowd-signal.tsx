import type { PublicOccupancyUsablePayload } from "@fitway/api/public-occupancy";
import type { CSSProperties } from "react";

import { useI18n } from "@/i18n/provider";

type CrowdBand = PublicOccupancyUsablePayload["band"];

const bands = ["quiet", "moderate", "busy", "packed"] as const;
const barBands: CrowdBand[] = [
	...Array<CrowdBand>(6).fill("quiet"),
	...Array<CrowdBand>(5).fill("moderate"),
	...Array<CrowdBand>(8).fill("busy"),
	...Array<CrowdBand>(9).fill("packed"),
];
const heights = [
	12, 15, 18, 21, 24, 27, 30, 34, 38, 42, 46, 50, 54, 58, 62, 66, 70, 74, 78,
	82, 86, 88, 90, 92, 94, 96, 98, 100,
];

/**
 * The Paper staff board draws the same 28-bar instrument on an almost-linear
 * ramp that keeps climbing through the packed band, where the public board
 * flattens near the top. Callers opt into it; the public surface keeps `heights`.
 */
export const CROWD_SIGNAL_LINEAR_HEIGHTS = [
	11.93, 15.34, 18.75, 21.59, 25, 28.41, 31.82, 34.66, 38.07, 41.48, 44.32,
	47.73, 51.14, 54.55, 57.39, 60.8, 64.2, 67.61, 70.45, 73.86, 77.27, 80.68,
	83.52, 86.93, 90.34, 93.18, 96.59, 100,
];

export function CrowdSignal({
	band,
	stale = false,
	skeleton = false,
	className,
	showFooter = true,
	ramp = heights,
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
			{band && !skeleton && showFooter ? (
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
