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

export function CrowdSignal({
	band,
	stale = false,
	skeleton = false,
}: {
	band?: CrowdBand;
	stale?: boolean;
	skeleton?: boolean;
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
				{heights.map((height, index) => {
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
			{band && !skeleton ? (
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
