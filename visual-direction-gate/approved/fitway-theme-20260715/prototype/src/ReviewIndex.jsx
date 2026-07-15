import { ChevronIcon } from "./Icons";
import { buildPreviewUrl, PUBLIC_STATES, ROUTES } from "./routing";
import { PublicHeader, SkipLink, StaticAtmosphere } from "./shared";

const viewports = [320, 360, 390, 721, 768, 820, 1024, 1200, 1440];
const staffScreens = [
	{
		route: ROUTES.login,
		key: "login",
		states: ["default", "loading", "error", "rate-limit"],
	},
	{
		route: ROUTES.staff,
		key: "staffLive",
		states: ["live", "stale", "offline", "pending", "manual-fallback"],
	},
];
const ownerScreens = [
	[ROUTES.analytics, "analytics"],
	[ROUTES.history, "history"],
	[ROUTES.settings, "settings"],
	[ROUTES.access, "access"],
	[ROUTES.audit, "audit"],
	[ROUTES.health, "health"],
];

function LanguageLinks({ route, state, label, openLabel }) {
	return (
		<div className="review-row">
			<div>
				<strong>{label}</strong>
				{state ? <code>{state}</code> : null}
			</div>
			<div className="review-row__actions">
				{["ar", "en"].map((lang) => (
					<a key={lang} href={buildPreviewUrl({ route, state, lang })}>
						<span>{lang === "ar" ? "العربية" : "English"}</span>
						<span className="sr-only"> — {openLabel}</span>
						<ChevronIcon />
					</a>
				))}
			</div>
		</div>
	);
}

export function ReviewIndex({ locale, strings, onToggle }) {
	const review = strings.review;
	return (
		<div className="app-root review-page">
			<StaticAtmosphere compact />
			<SkipLink label={strings.global.skip} />
			<PublicHeader
				locale={locale}
				strings={{
					switchLabel: strings.global.languageSwitchLabel,
					switchText: strings.global.languageAction,
				}}
				onToggle={onToggle}
			/>
			<main className="review-main" id="main-content" tabIndex="-1">
				<header className="review-hero">
					<p>FITWAY / 01</p>
					<h1>{review.title}</h1>
					<span className="review-hero__description">{review.description}</span>
				</header>

				<section
					className="review-viewport-strip"
					aria-labelledby="viewport-title"
				>
					<div>
						<span>02</span>
						<h2 id="viewport-title">{review.viewport}</h2>
					</div>
					<ul>
						{viewports.map((width) => (
							<li key={width}>
								<bdi>{width}</bdi>
								<small>px</small>
							</li>
						))}
					</ul>
				</section>

				<div className="review-groups">
					<section
						className="review-group review-group--public"
						aria-labelledby="review-public"
					>
						<header>
							<span>03</span>
							<h2 id="review-public">{review.publicGroup}</h2>
						</header>
						{PUBLIC_STATES.map((state) => (
							<LanguageLinks
								key={state}
								route={ROUTES.public}
								state={state}
								label={review[state]}
								openLabel={review.open}
							/>
						))}
					</section>

					<section className="review-group" aria-labelledby="review-staff">
						<header>
							<span>04</span>
							<h2 id="review-staff">{review.staffGroup}</h2>
						</header>
						{staffScreens.flatMap(({ route, key, states }) =>
							states.map((state) => (
								<LanguageLinks
									key={`${route}-${state}`}
									route={route}
									state={state}
									label={review[key]}
									openLabel={review.open}
								/>
							)),
						)}
					</section>

					<section className="review-group" aria-labelledby="review-owner">
						<header>
							<span>05</span>
							<h2 id="review-owner">{review.ownerGroup}</h2>
						</header>
						{ownerScreens.map(([route, key]) => (
							<LanguageLinks
								key={route}
								route={route}
								label={review[key]}
								openLabel={review.open}
							/>
						))}
					</section>
				</div>
			</main>
		</div>
	);
}
