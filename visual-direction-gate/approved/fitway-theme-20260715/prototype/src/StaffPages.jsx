import { useEffect, useId, useRef, useState } from "react";
import { staffFixtures } from "./content";
import {
	ActivityBarsIcon,
	AlertTriangleIcon,
	CheckIcon,
	ClockIcon,
	EditIcon,
	EyeIcon,
	EyeOffIcon,
	LockIcon,
	MinusIcon,
	PlusIcon,
	PulseIcon,
	WifiOffIcon,
} from "./Icons";
import { ROUTES } from "./routing";
import {
	AppHeader,
	Button,
	Field,
	PageHeading,
	Panel,
	PublicHeader,
	SkipLink,
	StaticAtmosphere,
	StatusMark,
} from "./shared";
import "./staff.css";

const operationalCopy = {
	ar: {
		loginEyebrow: "وصول الموظفين",
		loginSecurity: "مساحة تشغيلية محمية",
		loginFeatureTitle: "القراءة أولًا، ثم الإجراء",
		loginFeatureBody:
			"تعرض لوحة العمليات حالة الإشغال وصحة النظام قبل أدوات التصحيح.",
		productNavigation: "التنقل في المنتج",
		currentReading: "القراءة الحالية",
		lastKnownReading: "آخر قراءة معروفة",
		percentOfCapacity: "من السعة المضبوطة",
		countUnavailable: "لا تتوفر قراءة موثوقة",
		countUnavailableShort: "غير متاح",
		statusSummary: "ملخص الحالة التشغيلية",
		attention: "يتطلب الانتباه",
		readingDetails: "تفاصيل القراءة",
		lastSeenNow: "قبل 30 ثانية",
		lastSeenDelayed: "قبل 5 دقائق",
		lastSeenUnknown: "غير معروف",
		controlEyebrow: "منطقة الإجراءات",
		correctionHelp: "راجع القراءة الحالية قبل إرسال أي تغيير.",
		valueAfterCorrection: "العدد بعد التصحيح",
		manualTitle: "تقدير يدوي",
		manualHelp: "أدخل عددًا صحيحًا بعد التحقق الميداني.",
		pendingTarget: (count) => `العدد المستهدف ${count}`,
		commandPendingHelp:
			"لا يزال التغيير في انتظار جهاز العد. لم تُعرض القراءة المستهدفة كقراءة مطبقة.",
		correctionQueued: "أُرسل التصحيح وهو قيد الانتظار.",
		manualQueued: "أُرسل التقدير اليدوي وهو قيد الانتظار.",
		resetQueued: "أُرسل أمر إعادة الضبط وهو قيد الانتظار.",
		resetZone: "إجراء حساس",
		closeDialog: "إغلاق نافذة التأكيد",
	},
	en: {
		loginEyebrow: "Staff access",
		loginSecurity: "Protected operations area",
		loginFeatureTitle: "Read first, then act",
		loginFeatureBody:
			"Live operations puts occupancy truth and system health before correction tools.",
		productNavigation: "Product navigation",
		currentReading: "Current reading",
		lastKnownReading: "Last known reading",
		percentOfCapacity: "of configured capacity",
		countUnavailable: "No reliable reading is available",
		countUnavailableShort: "Unavailable",
		statusSummary: "Operational status summary",
		attention: "Needs attention",
		readingDetails: "Reading details",
		lastSeenNow: "30 seconds ago",
		lastSeenDelayed: "5 minutes ago",
		lastSeenUnknown: "Unknown",
		controlEyebrow: "Action area",
		correctionHelp: "Review the current reading before sending a change.",
		valueAfterCorrection: "Count after correction",
		manualTitle: "Manual estimate",
		manualHelp: "Enter a whole number after checking the floor.",
		pendingTarget: (count) => `Target count ${count}`,
		commandPendingHelp:
			"The change is still waiting for the counting device. The target is not shown as an applied reading.",
		correctionQueued: "The correction was sent and is pending.",
		manualQueued: "The manual estimate was sent and is pending.",
		resetQueued: "The reset command was sent and is pending.",
		resetZone: "Sensitive action",
		closeDialog: "Close confirmation dialog",
	},
};

function normalizeLoginState(state) {
	if (state === "loading") return "loading";
	if (state === "invalid" || state === "error") return "invalid";
	if (state === "rate-limit" || state === "rateLimited") return "rateLimited";
	return "default";
}

function normalizeStaffState(state) {
	if (state === "manual-fallback" || state === "manual_fallback") {
		return "manualFallback";
	}
	return Object.hasOwn(staffFixtures, state) ? state : "live";
}

function getAppHeaderStrings(strings, locale) {
	return {
		productArea: strings.staff.nav.operations,
		ownerAccess: strings.owner.nav.accountRole,
		staffAccess: strings.staff.nav.accountRole,
		switchLabel: strings.global.languageSwitchLabel,
		switchText: strings.global.languageAction,
		ownerNavigation: operationalCopy[locale].productNavigation,
		nav: {
			[ROUTES.staff]: strings.staff.nav.operations,
			[ROUTES.analytics]: strings.owner.nav.analytics,
			[ROUTES.history]: strings.owner.nav.history,
			[ROUTES.settings]: strings.owner.nav.settings,
			[ROUTES.access]: strings.owner.nav.access,
			[ROUTES.audit]: strings.owner.nav.audit,
			[ROUTES.health]: strings.owner.nav.health,
		},
	};
}

function InlineStatus({ tone, icon: Icon, title, children }) {
	return (
		<div className={`staff-alert staff-alert--${tone}`} role="status">
			<span className="staff-alert__icon" aria-hidden="true">
				<Icon />
			</span>
			<div>
				<strong>{title}</strong>
				{children ? <p>{children}</p> : null}
			</div>
		</div>
	);
}

export function StaffLoginPage({
	locale,
	strings,
	onToggle,
	state = "default",
}) {
	const pinId = useId();
	const loginState = normalizeLoginState(state);
	const local = operationalCopy[locale];
	const [pinVisible, setPinVisible] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const error =
		loginState === "invalid"
			? strings.login.invalid
			: loginState === "rateLimited"
				? strings.login.rateLimited
				: undefined;
	const loading = loginState === "loading";

	const submit = (event) => {
		event.preventDefault();
		setSubmitting(true);
	};

	return (
		<div className="app-root staff-login-root">
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
			<main className="staff-login" id="main-content" tabIndex="-1">
				<div className="staff-login__intro" aria-hidden="true">
					<div className="staff-login__monogram">
						<ActivityBarsIcon />
					</div>
					<p className="staff-login__security">{local.loginSecurity}</p>
					<h2>{local.loginFeatureTitle}</h2>
					<p className="staff-login__intro-body">{local.loginFeatureBody}</p>
					<div className="staff-login__instrument">
						<span />
						<span />
						<span />
						<span />
						<span />
					</div>
				</div>
				<Panel className="staff-login__panel" aria-busy={loading || submitting}>
					<PageHeading
						eyebrow={local.loginEyebrow}
						title={strings.login.title}
						description={strings.login.description}
					/>
					<form className="staff-login__form" onSubmit={submit}>
						<Field
							id={pinId}
							label={strings.login.pinLabel}
							hint={strings.login.pinHint}
							error={error}
						>
							{(fieldProps) => (
								<div className="pin-input">
									<LockIcon className="pin-input__lock" />
									<input
										{...fieldProps}
										autoComplete="current-password"
										dir="ltr"
										disabled={loading || submitting}
										inputMode="numeric"
										name="pin"
										pattern="[0-9]*"
										placeholder={strings.login.pinPlaceholder}
										required
										type={pinVisible ? "text" : "password"}
									/>
									<button
										aria-controls={pinId}
										aria-label={
											pinVisible ? strings.login.hidePin : strings.login.showPin
										}
										aria-pressed={pinVisible}
										className="pin-input__visibility"
										disabled={loading || submitting}
										onClick={() => setPinVisible((visible) => !visible)}
										type="button"
									>
										{pinVisible ? <EyeOffIcon /> : <EyeIcon />}
									</button>
								</div>
							)}
						</Field>
						<Button
							className="staff-login__submit"
							disabled={loading || submitting || loginState === "rateLimited"}
							type="submit"
							variant="primary"
						>
							{loading
								? strings.login.loading
								: submitting
									? strings.login.submitting
									: strings.login.submit}
						</Button>
						<p className="staff-login__registration-note">
							<LockIcon aria-hidden="true" />
							{strings.login.noRegistration}
						</p>
						{submitting || loading ? (
							<span className="sr-only" role="status">
								{loading ? strings.login.loading : strings.login.submitting}
							</span>
						) : null}
					</form>
				</Panel>
			</main>
		</div>
	);
}

function ResetDialog({
	open,
	onCancel,
	onConfirm,
	strings,
	local,
	triggerRef,
}) {
	const dialogRef = useRef(null);
	const cancelRef = useRef(null);
	const previousFocusRef = useRef(null);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return undefined;
		if (!open) {
			if (dialog.open) dialog.close();
			if (previousFocusRef.current) {
				previousFocusRef.current.focus();
				previousFocusRef.current = null;
			}
			return undefined;
		}

		previousFocusRef.current = triggerRef.current;
		if (!dialog.open) dialog.showModal();
		cancelRef.current?.focus();
		return () => {
			if (dialog.open) dialog.close();
		};
	}, [open, triggerRef]);

	return (
		<dialog
			aria-describedby="reset-dialog-description"
			aria-labelledby="reset-dialog-title"
			className="reset-dialog"
			onCancel={(event) => {
				event.preventDefault();
				onCancel();
			}}
			ref={dialogRef}
		>
			<div className="reset-dialog__mark" aria-hidden="true">
				<AlertTriangleIcon />
			</div>
			<p className="reset-dialog__eyebrow">{local.resetZone}</p>
			<h2 id="reset-dialog-title">{strings.staff.reset.title}</h2>
			<p id="reset-dialog-description">{strings.staff.reset.consequence}</p>
			<div className="reset-dialog__actions">
				<Button onClick={onCancel} ref={cancelRef} variant="secondary">
					{strings.staff.reset.cancel}
				</Button>
				<Button onClick={onConfirm} variant="danger">
					{strings.staff.reset.confirm}
				</Button>
			</div>
		</dialog>
	);
}

function StaffStateBanner({ state, fixture, strings, local }) {
	if (state === "stale") {
		return (
			<InlineStatus
				icon={ClockIcon}
				title={strings.staff.live.staleTitle}
				tone="stale"
			>
				{strings.staff.live.staleBody}
			</InlineStatus>
		);
	}
	if (state === "offline") {
		return (
			<InlineStatus
				icon={WifiOffIcon}
				title={strings.staff.live.offlineTitle}
				tone="offline"
			>
				{strings.staff.live.offlineBody}
			</InlineStatus>
		);
	}
	if (state === "manualFallback") {
		return (
			<InlineStatus
				icon={EditIcon}
				title={strings.staff.manualFallback.title}
				tone="manual"
			>
				{`${strings.staff.manualFallback.body} ${strings.staff.manualFallback.validFor(fixture.validForMinutes)}`}
			</InlineStatus>
		);
	}
	if (state === "pending") {
		return (
			<InlineStatus
				icon={ClockIcon}
				title={strings.staff.command.pending}
				tone="pending"
			>
				{`${local.pendingTarget(fixture.targetCount)}. ${local.commandPendingHelp}`}
			</InlineStatus>
		);
	}
	return null;
}

function ReadingPanel({ state, fixture, count, strings, local, locale }) {
	const unavailable = state === "offline" || count === null;
	const capacity = Number(fixture.capacity);
	const percentage =
		unavailable || !capacity ? null : Math.round((count / capacity) * 100);
	const freshness =
		state === "stale"
			? local.lastSeenDelayed
			: (fixture.relative?.[locale] ??
				fixture.time?.[locale] ??
				local.lastSeenNow);
	const freshnessTone =
		state === "live" || state === "pending"
			? "live"
			: state === "stale" || state === "manualFallback"
				? "stale"
				: "offline";
	const heading =
		state === "stale" ? local.lastKnownReading : local.currentReading;

	return (
		<Panel className={`staff-reading staff-reading--${state}`}>
			<div className="staff-reading__rail" aria-hidden="true" />
			<header className="staff-reading__header">
				<div>
					<p>{heading}</p>
					<h2>{strings.staff.live.open}</h2>
				</div>
				<span
					className={`staff-reading__freshness staff-reading__freshness--${state}`}
				>
					<StatusMark tone={freshnessTone} />
					{state === "live" ? strings.staff.live.freshnessLive : freshness}
				</span>
			</header>

			<div className="staff-reading__primary">
				<div className="staff-reading__count">
					<span>{strings.staff.live.countLabel}</span>
					{unavailable ? (
						<strong className="staff-reading__unavailable">
							{local.countUnavailableShort}
						</strong>
					) : (
						<strong>
							<bdi>{count}</bdi>
						</strong>
					)}
				</div>
				{percentage === null ? (
					<p className="staff-reading__empty">{local.countUnavailable}</p>
				) : (
					<div className="capacity-gauge">
						<div className="capacity-gauge__track" aria-hidden="true">
							<span style={{ inlineSize: `${Math.min(percentage, 100)}%` }} />
						</div>
						<p>
							<strong>
								<bdi>{percentage}%</bdi>
							</strong>{" "}
							{local.percentOfCapacity}
						</p>
					</div>
				)}
			</div>

			<dl className="staff-reading__details" aria-label={local.readingDetails}>
				<div>
					<dt>{strings.staff.live.crowdLabel}</dt>
					<dd>
						{unavailable
							? local.countUnavailableShort
							: strings.public.bands[fixture.band]}
					</dd>
				</div>
				<div>
					<dt>{strings.staff.live.capacityLabel}</dt>
					<dd>
						<bdi>{fixture.capacity}</bdi>
					</dd>
				</div>
				<div>
					<dt>{strings.staff.live.freshnessLabel}</dt>
					<dd>{unavailable ? local.lastSeenUnknown : freshness}</dd>
				</div>
			</dl>
		</Panel>
	);
}

function SystemHealth({ fixture, strings, local, locale, commandStatus }) {
	const counterOffline = fixture.health.counter === "offline";
	const cameraDegraded = fixture.health.camera === "degraded";
	const manual = fixture.source === "manual";
	const lastSeen = counterOffline
		? (fixture.relative?.[locale] ?? local.lastSeenUnknown)
		: (fixture.relative?.[locale] ?? local.lastSeenNow);

	const entries = [
		{
			label: strings.staff.health.counter,
			value: counterOffline
				? strings.staff.health.offline
				: strings.staff.health.connected,
			tone: counterOffline ? "attention" : "healthy",
		},
		{
			label: strings.staff.health.camera,
			value: cameraDegraded
				? strings.staff.health.degraded
				: strings.staff.health.healthy,
			tone: cameraDegraded ? "attention" : "healthy",
		},
		{
			label: strings.staff.health.source,
			value: manual
				? strings.staff.health.manual
				: strings.staff.health.automatic,
			tone: manual ? "manual" : "neutral",
		},
		{
			label: strings.staff.health.commands,
			value: strings.staff.command[commandStatus],
			tone: commandStatus === "pending" ? "attention" : "neutral",
		},
	];

	return (
		<Panel className="system-health">
			<header className="system-health__header">
				<div>
					<PulseIcon aria-hidden="true" />
					<h2>{strings.staff.health.title}</h2>
				</div>
				<p>
					{strings.staff.health.lastSeen}: <bdi>{lastSeen}</bdi>
				</p>
			</header>
			<dl className="system-health__grid">
				{entries.map((entry) => (
					<div
						className={`health-item health-item--${entry.tone}`}
						key={entry.label}
					>
						<dt>{entry.label}</dt>
						<dd>
							<span aria-hidden="true" />
							{entry.value}
						</dd>
					</div>
				))}
			</dl>
		</Panel>
	);
}

export function StaffLivePage({ locale, strings, onToggle, state = "live" }) {
	const normalizedState = normalizeStaffState(state);
	const fixture = staffFixtures[normalizedState];
	const local = operationalCopy[locale];
	const reasonId = useId();
	const directEntryId = useId();
	const resetTriggerRef = useRef(null);
	const [count, setCount] = useState(
		fixture.count === undefined ? null : Number(fixture.count),
	);
	const [correctionValue, setCorrectionValue] = useState(
		fixture.count === undefined ? 0 : Number(fixture.count),
	);
	const [directEntry, setDirectEntry] = useState("");
	const [reason, setReason] = useState("");
	const [directError, setDirectError] = useState("");
	const [commandStatus, setCommandStatus] = useState(fixture.command);
	const [announcement, setAnnouncement] = useState("");
	const [resetOpen, setResetOpen] = useState(false);

	useEffect(() => {
		const nextCount =
			fixture.count === undefined ? null : Number(fixture.count);
		setCount(nextCount);
		setCorrectionValue(nextCount ?? 0);
		setDirectEntry("");
		setReason("");
		setDirectError("");
		setCommandStatus(fixture.command);
		setAnnouncement("");
		setResetOpen(false);
	}, [fixture]);

	const commandPending = commandStatus === "pending";
	const automaticOffline = normalizedState === "offline";

	const adjustCorrection = (delta) => {
		setCorrectionValue((value) => Math.max(0, value + delta));
	};

	const applyCorrection = (event) => {
		event.preventDefault();
		if (!Number.isInteger(correctionValue) || correctionValue < 0) return;
		setCommandStatus("pending");
		setAnnouncement(local.correctionQueued);
	};

	const applyDirectEntry = (event) => {
		event.preventDefault();
		const next = Number(directEntry);
		if (directEntry.trim() === "" || !Number.isInteger(next) || next < 0) {
			setDirectError(strings.staff.correction.invalid);
			return;
		}
		setDirectError("");
		setCommandStatus("pending");
		setAnnouncement(local.manualQueued);
	};

	const confirmReset = () => {
		setCommandStatus("pending");
		setAnnouncement(local.resetQueued);
		setResetOpen(false);
	};

	return (
		<div className="app-root staff-live-root">
			<StaticAtmosphere compact />
			<SkipLink label={strings.global.skip} />
			<AppHeader
				currentRoute={ROUTES.staff}
				locale={locale}
				onToggle={onToggle}
				strings={getAppHeaderStrings(strings, locale)}
			/>
			<main className="staff-main" id="main-content" tabIndex="-1">
				<PageHeading
					eyebrow={strings.staff.nav.accountRole}
					title={strings.staff.live.title}
					description={strings.staff.live.open}
				/>

				<StaffStateBanner
					fixture={fixture}
					local={local}
					state={normalizedState}
					strings={strings}
				/>

				<div className="staff-layout">
					<div className="staff-layout__truth">
						<ReadingPanel
							count={count}
							fixture={fixture}
							local={local}
							locale={locale}
							state={normalizedState}
							strings={strings}
						/>
						<SystemHealth
							commandStatus={commandStatus}
							fixture={fixture}
							local={local}
							locale={locale}
							strings={strings}
						/>
					</div>

					<Panel className="operations-panel">
						<header className="operations-panel__header">
							<p>{local.controlEyebrow}</p>
							<h2>{strings.staff.correction.title}</h2>
							<span>{local.correctionHelp}</span>
						</header>

						<form className="correction-form" onSubmit={applyCorrection}>
							<fieldset disabled={automaticOffline || commandPending}>
								<legend>{strings.staff.correction.stepperLabel}</legend>
								<div className="count-stepper">
									<button
										aria-label={strings.staff.correction.decrease}
										disabled={correctionValue <= 0}
										onClick={() => adjustCorrection(-1)}
										type="button"
									>
										<MinusIcon />
									</button>
									<output aria-live="polite">
										<span>{local.valueAfterCorrection}</span>
										<bdi>{correctionValue}</bdi>
									</output>
									<button
										aria-label={strings.staff.correction.increase}
										onClick={() => adjustCorrection(1)}
										type="button"
									>
										<PlusIcon />
									</button>
								</div>
							</fieldset>
							<Field id={reasonId} label={strings.staff.correction.reasonLabel}>
								{(fieldProps) => (
									<input
										{...fieldProps}
										disabled={automaticOffline || commandPending}
										maxLength="120"
										onChange={(event) => setReason(event.target.value)}
										placeholder={strings.staff.correction.reasonPlaceholder}
										type="text"
										value={reason}
									/>
								)}
							</Field>
							<Button
								className="operations-panel__submit"
								disabled={automaticOffline || commandPending}
								type="submit"
								variant="primary"
							>
								<CheckIcon />
								{strings.staff.correction.apply}
							</Button>
						</form>

						<div className="operations-panel__separator" aria-hidden="true" />

						<form className="direct-entry-form" onSubmit={applyDirectEntry}>
							<div className="direct-entry-form__heading">
								<p>{local.manualTitle}</p>
								<h3>{strings.staff.directEntry.label}</h3>
								<span>{strings.staff.directEntry.help}</span>
							</div>
							<Field
								id={directEntryId}
								label={strings.staff.directEntry.inputLabel}
								hint={local.manualHelp}
								error={directError}
							>
								{(fieldProps) => (
									<input
										{...fieldProps}
										dir="ltr"
										disabled={commandPending}
										inputMode="numeric"
										min="0"
										onChange={(event) => setDirectEntry(event.target.value)}
										step="1"
										type="number"
										value={directEntry}
									/>
								)}
							</Field>
							<Button
								className="operations-panel__submit"
								disabled={commandPending}
								type="submit"
								variant="secondary"
							>
								<EditIcon />
								{strings.staff.directEntry.apply}
							</Button>
						</form>

						<div className="reset-zone">
							<div>
								<strong>{local.resetZone}</strong>
								<span>{strings.staff.reset.consequence}</span>
							</div>
							<Button
								disabled={commandPending}
								onClick={() => setResetOpen(true)}
								ref={resetTriggerRef}
								variant="danger"
							>
								{strings.staff.reset.action}
							</Button>
						</div>
					</Panel>
				</div>

				<div aria-atomic="true" aria-live="polite" className="sr-only">
					{announcement}
				</div>
			</main>
			<ResetDialog
				local={local}
				onCancel={() => setResetOpen(false)}
				onConfirm={confirmReset}
				open={resetOpen}
				strings={strings}
				triggerRef={resetTriggerRef}
			/>
		</div>
	);
}
