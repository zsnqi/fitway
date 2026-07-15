import fitwayLogo from "../assets/fitway-logo.png";
import {
	ActivityBarsIcon,
	AuditIcon,
	HealthIcon,
	ListIcon,
	SettingsIcon,
	UsersIcon,
} from "./Icons";
import { buildPreviewUrl, ROUTES } from "./routing";

function Brand({ compact = false }) {
	const locale = document.documentElement.lang === "en" ? "en" : "ar";
	return (
		<a
			className={
				compact ? "brand-lockup brand-lockup--compact" : "brand-lockup"
			}
			href={buildPreviewUrl({ route: ROUTES.review, lang: locale })}
			aria-label="FITWAY"
		>
			<img src={fitwayLogo} width="36" height="36" alt="" />
			<span translate="no">FITWAY</span>
		</a>
	);
}

export function SkipLink({ label, targetId = "main-content" }) {
	const moveFocus = () => {
		document.getElementById(targetId)?.focus({ preventScroll: true });
	};
	return (
		<a className="skip-link" href={`#${targetId}`} onClick={moveFocus}>
			{label}
		</a>
	);
}

function LocaleToggle({ locale, label, children, onToggle }) {
	return (
		<button
			className="locale-toggle"
			type="button"
			onClick={onToggle}
			aria-label={label}
			data-locale={locale}
		>
			{children}
		</button>
	);
}

export function PublicHeader({ locale, strings, onToggle }) {
	return (
		<header className="master-header">
			<Brand />
			<LocaleToggle
				locale={locale}
				label={strings.switchLabel}
				onToggle={onToggle}
			>
				{strings.switchText}
			</LocaleToggle>
		</header>
	);
}

const navIcons = {
	[ROUTES.staff]: ActivityBarsIcon,
	[ROUTES.analytics]: ListIcon,
	[ROUTES.history]: AuditIcon,
	[ROUTES.settings]: SettingsIcon,
	[ROUTES.access]: UsersIcon,
	[ROUTES.audit]: AuditIcon,
	[ROUTES.health]: HealthIcon,
};

function revealActiveLink(activeLink) {
	const rail = activeLink?.parentElement;
	if (!activeLink || !rail) return;

	const activeBounds = activeLink.getBoundingClientRect();
	const railBounds = rail.getBoundingClientRect();
	const isClipped =
		activeBounds.left < railBounds.left ||
		activeBounds.right > railBounds.right;
	if (isClipped) {
		activeLink.scrollIntoView({ block: "nearest", inline: "center" });
	}
}

export function AppHeader({ locale, strings, currentRoute, onToggle }) {
	const ownerRoutes = new Set([
		ROUTES.analytics,
		ROUTES.history,
		ROUTES.settings,
		ROUTES.access,
		ROUTES.audit,
		ROUTES.health,
	]);
	const isOwner = ownerRoutes.has(currentRoute);
	const links = isOwner
		? [
				ROUTES.staff,
				ROUTES.analytics,
				ROUTES.history,
				ROUTES.settings,
				ROUTES.access,
				ROUTES.audit,
				ROUTES.health,
			]
		: [ROUTES.staff];

	return (
		<>
			<header className="app-header">
				<div className="app-header__brand-group">
					<Brand compact />
					<span className="app-header__divider" aria-hidden="true" />
					<strong>{strings.productArea}</strong>
				</div>
				<div className="app-header__actions">
					<span className="role-label">
						{isOwner ? strings.ownerAccess : strings.staffAccess}
					</span>
					<LocaleToggle
						locale={locale}
						label={strings.switchLabel}
						onToggle={onToggle}
					>
						{strings.switchText}
					</LocaleToggle>
				</div>
			</header>
			<nav className="route-rail" aria-label={strings.ownerNavigation}>
				{links.map((route) => {
					const Icon = navIcons[route];
					return (
						<a
							key={route}
							ref={route === currentRoute ? revealActiveLink : undefined}
							className="route-rail__link"
							href={buildPreviewUrl({ route, lang: locale })}
							aria-current={route === currentRoute ? "page" : undefined}
						>
							<Icon className="route-rail__icon" />
							<span>{strings.nav[route]}</span>
						</a>
					);
				})}
			</nav>
		</>
	);
}

export function StaticAtmosphere({ watermark = true, compact = false }) {
	return (
		<div
			className={
				compact
					? "scene-background scene-background--compact"
					: "scene-background"
			}
			aria-hidden="true"
		>
			<div className="scene-cut-light" />
			<div className="scene-vignette" />
			{watermark ? (
				<img
					className="page-watermark"
					src={fitwayLogo}
					width="620"
					height="620"
					alt=""
				/>
			) : null}
		</div>
	);
}

export function StatusMark({ tone = "live", className = "" }) {
	return (
		<span
			className={`status-mark status-mark--${tone} ${className}`.trim()}
			aria-hidden="true"
		/>
	);
}

export function Panel({
	as: Tag = "section",
	className = "",
	children,
	...props
}) {
	return (
		<Tag className={`panel ${className}`.trim()} {...props}>
			{children}
		</Tag>
	);
}

export function Button({
	variant = "secondary",
	className = "",
	children,
	...props
}) {
	return (
		<button
			className={`button button--${variant} ${className}`.trim()}
			type="button"
			{...props}
		>
			{children}
		</button>
	);
}

export function Field({ id, label, hint, error, children, className = "" }) {
	const hintId = hint ? `${id}-hint` : undefined;
	const errorId = error ? `${id}-error` : undefined;
	return (
		<div className={`field ${className}`.trim()}>
			<label htmlFor={id}>{label}</label>
			{children({
				id,
				"aria-describedby":
					[hintId, errorId].filter(Boolean).join(" ") || undefined,
				"aria-invalid": error ? true : undefined,
			})}
			{hint ? (
				<p className="field__hint" id={hintId}>
					{hint}
				</p>
			) : null}
			{error ? (
				<p className="field__error" id={errorId} role="alert">
					{error}
				</p>
			) : null}
		</div>
	);
}

export function PageHeading({ eyebrow, title, description, actions }) {
	return (
		<header className="page-heading">
			<div>
				{eyebrow ? <p className="page-heading__eyebrow">{eyebrow}</p> : null}
				<h1>{title}</h1>
				{description ? <p>{description}</p> : null}
			</div>
			{actions ? <div className="page-heading__actions">{actions}</div> : null}
		</header>
	);
}

export function ScreenReaderOnly({ as: Tag = "span", children, ...props }) {
	return (
		<Tag className="sr-only" {...props}>
			{children}
		</Tag>
	);
}
