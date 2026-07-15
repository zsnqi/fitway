import { useState } from "react";
import { publicFixtures } from "./content";
import {
	AlertTriangleIcon,
	ClockIcon,
	MoonIcon,
	RefreshIcon,
	WifiOffIcon,
} from "./Icons";
import {
	Button,
	PublicHeader,
	SkipLink,
	StaticAtmosphere,
	StatusMark,
} from "./shared";

const signalSteps = ["quiet", "moderate", "busy", "packed"];
const stepByBar = [
	...Array(6).fill("quiet"),
	...Array(5).fill("moderate"),
	...Array(8).fill("busy"),
	...Array(9).fill("packed"),
];
const heights = [
	12, 15, 18, 21, 24, 27, 30, 34, 38, 42, 46, 50, 54, 58, 62, 66, 70, 74, 78,
	82, 86, 88, 90, 92, 94, 96, 98, 100,
];

function Freshness({ strings, fixture, stale = false, mobile = false }) {
	const stateCopy = stale ? strings.public.stale : strings.public.live;
	const className = `freshness ${mobile ? "freshness--mobile" : "freshness--desktop"}`;
	if (mobile) {
		return (
			<div className={className}>
				{stale ? (
					<ClockIcon className="freshness__icon" />
				) : (
					<span className="broadcast" aria-hidden="true" />
				)}
				<strong className="freshness__primary">{stateCopy.freshness}</strong>
				<span className="freshness__detail">
					<time dateTime={fixture.lastUpdatedAt}>{stateCopy.updated}</time>
					<span aria-hidden="true"> · </span>
					<span>{stateCopy.relative}</span>
				</span>
			</div>
		);
	}
	return (
		<div className={className}>
			{stale ? (
				<ClockIcon className="freshness__icon" />
			) : (
				<span className="broadcast" aria-hidden="true" />
			)}
			<strong className="freshness__primary">{stateCopy.freshness}</strong>
			<span className="freshness__separator" aria-hidden="true" />
			<time className="freshness__time" dateTime={fixture.lastUpdatedAt}>
				{stateCopy.updated}
			</time>
			<span className="freshness__separator" aria-hidden="true" />
			<span className="freshness__relative">{stateCopy.relative}</span>
		</div>
	);
}

function CrowdSignal({ strings, fixture, stale = false }) {
	const accessibleLabel = stale
		? `${strings.public.stale.crowdLabel}: ${strings.public.bands[fixture.band]}. ${strings.public.stale.freshness}.`
		: strings.public.live.signalSummary;
	return (
		<div
			className={stale ? "signal-field signal-field--stale" : "signal-field"}
			role="img"
			aria-label={accessibleLabel}
		>
			<div className="signal-caption" aria-hidden="true">
				{signalSteps.map((step) => (
					<span
						key={step}
						className={
							step === fixture.band ? "signal-caption__current" : undefined
						}
					>
						{strings.public.bands[step]}
					</span>
				))}
			</div>
			<div className="signal-wave" aria-hidden="true">
				{heights.map((height, index) => {
					const step = stepByBar[index];
					return (
						<i
							key={`${step}-${height}`}
							data-step={step}
							data-state={fixture.signal[step]}
							data-current-cap={index === 10 ? "" : undefined}
							style={{ "--h": `${height}%` }}
						/>
					);
				})}
			</div>
			<div className="signal-footer">
				<span className="current-reading">
					<i aria-hidden="true" />
					<span>{strings.public.live.currentLevel}</span>
					<span aria-hidden="true">·</span>
					<strong>{strings.public.bands[fixture.band]}</strong>
				</span>
			</div>
		</div>
	);
}

function ReadingBoard({ strings, fixture, stale = false }) {
	const stateCopy = stale ? strings.public.stale : strings.public.live;
	const band = strings.public.bands[fixture.band];
	const summary = stale
		? stateCopy.summary(band, fixture.count, fixture.time[strings.locale])
		: strings.public.live.summary;
	return (
		<section
			className={
				stale ? "occupancy-stage occupancy-stage--stale" : "occupancy-stage"
			}
			aria-labelledby="public-crowd-level"
		>
			<p className="sr-only" aria-live={stale ? "off" : "polite"}>
				{summary}
			</p>
			<div className="status-line">
				<div className="open-status">
					<StatusMark tone={stale ? "stale" : "live"} />
					<span>{stale ? stateCopy.status : strings.public.live.open}</span>
				</div>
				<Freshness strings={strings} fixture={fixture} stale={stale} />
			</div>
			{stale ? (
				<div className="state-notice state-notice--stale" role="status">
					<AlertTriangleIcon />
					<span>
						{stateCopy.warning(fixture.count, fixture.time[strings.locale])}
					</span>
				</div>
			) : null}
			<div className="hero-field">
				<div className="crowd-block">
					<p className="eyebrow">{stateCopy.crowdLabel}</p>
					<h1 id="public-crowd-level">{band}</h1>
				</div>
				<section className="count-block" aria-labelledby="public-count-label">
					<p className="eyebrow" id="public-count-label">
						{stateCopy.countLabel}
					</p>
					<strong>
						<bdi>{fixture.count}</bdi>
					</strong>
				</section>
			</div>
			<CrowdSignal strings={strings} fixture={fixture} stale={stale} />
			<Freshness strings={strings} fixture={fixture} stale={stale} mobile />
		</section>
	);
}

function LoadingBoard({ strings }) {
	return (
		<section
			className="occupancy-stage occupancy-stage--loading"
			aria-busy="true"
			aria-labelledby="loading-label"
		>
			<p className="sr-only" role="status">
				{strings.public.loading.summary}
			</p>
			<div className="status-line">
				<div className="skeleton skeleton--status" />
				<div className="skeleton skeleton--freshness" />
			</div>
			<div className="hero-field">
				<div className="crowd-block">
					<div className="skeleton skeleton--eyebrow" />
					<h1 className="sr-only" id="loading-label">
						{strings.public.loading.label}
					</h1>
					<div className="skeleton skeleton--crowd" />
				</div>
				<div className="count-block">
					<div className="skeleton skeleton--eyebrow" />
					<div className="skeleton skeleton--count" />
				</div>
			</div>
			<div className="signal-field signal-field--loading" aria-hidden="true">
				<div className="skeleton skeleton--signal-caption" />
				<div className="signal-wave signal-wave--skeleton">
					{heights.map((height) => (
						<i key={height} style={{ "--h": `${height}%` }} />
					))}
				</div>
				<div className="skeleton skeleton--reading" />
			</div>
		</section>
	);
}

const emptyStateMeta = {
	unavailable: { icon: WifiOffIcon, tone: "offline" },
	closed: { icon: MoonIcon, tone: "closed" },
	error: { icon: AlertTriangleIcon, tone: "error" },
};

function EmptyStateBoard({ strings, state, locale }) {
	const [retrying, setRetrying] = useState(false);
	const stateCopy = strings.public[state];
	const fixture = publicFixtures[state];
	const { icon: Icon, tone } = emptyStateMeta[state];
	const isClosed = state === "closed";
	const title = isClosed ? stateCopy.title : stateCopy.title;
	const summary = isClosed
		? stateCopy.summary(fixture.nextOpenTime[locale])
		: stateCopy.summary;
	return (
		<section
			className={`occupancy-stage occupancy-stage--empty occupancy-stage--${state}`}
			aria-labelledby="public-state-title"
		>
			<p className="sr-only" role="status">
				{summary}
			</p>
			<div className="status-line">
				<div className="open-status">
					<StatusMark tone={tone} />
					<span>{isClosed ? stateCopy.status : stateCopy.eyebrow}</span>
				</div>
			</div>
			<div className="empty-state-field">
				<div
					className={`empty-state-icon empty-state-icon--${tone}`}
					aria-hidden="true"
				>
					<Icon />
				</div>
				<p className="eyebrow">
					{isClosed ? strings.public.unavailable.eyebrow : stateCopy.eyebrow}
				</p>
				<h1 id="public-state-title">{title}</h1>
				{isClosed ? (
					<p className="empty-state-next">
						<ClockIcon /> {stateCopy.opensAt(fixture.nextOpenTime[locale])}
					</p>
				) : (
					<p className="empty-state-copy">{stateCopy.body}</p>
				)}
				{state === "error" ? (
					<Button
						variant="primary"
						disabled={retrying}
						onClick={() => setRetrying(true)}
					>
						<RefreshIcon />
						{retrying ? stateCopy.retrying : stateCopy.retry}
					</Button>
				) : null}
			</div>
		</section>
	);
}

export function PublicPage({ locale, strings, onToggle, state = "live" }) {
	const safeState = Object.hasOwn(publicFixtures, state) ? state : "live";
	const stringsWithLocale = { ...strings, locale };
	return (
		<div className={`app-root public-page public-page--${safeState}`}>
			<StaticAtmosphere />
			<SkipLink label={strings.global.skip} />
			<PublicHeader
				locale={locale}
				strings={{
					switchLabel: strings.global.languageSwitchLabel,
					switchText: strings.global.languageAction,
				}}
				onToggle={onToggle}
			/>
			<main className="master-stage" id="main-content" tabIndex="-1">
				{safeState === "live" ? (
					<ReadingBoard
						strings={stringsWithLocale}
						fixture={publicFixtures.live}
					/>
				) : null}
				{safeState === "stale" ? (
					<ReadingBoard
						strings={stringsWithLocale}
						fixture={publicFixtures.stale}
						stale
					/>
				) : null}
				{safeState === "loading" ? <LoadingBoard strings={strings} /> : null}
				{["unavailable", "closed", "error"].includes(safeState) ? (
					<EmptyStateBoard
						strings={strings}
						state={safeState}
						locale={locale}
					/>
				) : null}
			</main>
		</div>
	);
}
