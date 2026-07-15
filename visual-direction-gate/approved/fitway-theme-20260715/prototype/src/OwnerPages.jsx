// biome-ignore-all lint/a11y/useSemanticElements: SVG chart points need keyboard-operable vector groups with large hit targets.
// biome-ignore-all lint/a11y/noNoninteractiveTabindex: bounded data scroll regions must be keyboard reachable.
import { useId, useState } from "react";
import { analyticsFixture, copy, historyFixture } from "./content";
import {
	AccessIcon,
	ActivityBarsIcon,
	AlertTriangleIcon,
	AuditIcon,
	CheckIcon,
	ClockIcon,
	DownloadIcon,
	HealthIcon,
	SettingsIcon,
} from "./Icons";
import { ROUTES } from "./routing";
import {
	AppHeader,
	Button,
	Field,
	PageHeading,
	Panel,
	ScreenReaderOnly,
	SkipLink,
	StaticAtmosphere,
	StatusMark,
} from "./shared";

import "./owner.css";

const supplemental = {
	ar: {
		area: "مساحة المالك",
		navigation: "تنقل مساحة المالك",
		eyebrow: "أدوات المالك",
		chartSummary:
			"منحنى إشغال تقديري من 6:00 ص إلى 1:30 ص مع خط مرجعي للسعة المضبوطة.",
		selectedPoint: "القراءة المحددة",
		date: "يوم التشغيل",
		configured: "الإعداد الحالي",
		percentageSuffix: "من السعة",
		heatmapHelp: "مرر أفقيًا لاستعراض ساعات يوم التشغيل كاملة.",
		selectedCell: "الخلية المحددة",
		value: "متوسط الإشغال",
		openZero: "مفتوح، دون إشغال مسجل",
		missingDescription: "لا تتوفر قراءة لهذه الفترة",
		closedDescription: "النادي مغلق في هذه الفترة",
		capacityHint: "قيمة داخلية لا تظهر في الواجهة العامة.",
		percentBoundary: "نقطة البداية (%)",
		scheduleHint:
			"وقت الإغلاق الذي يسبق أو يساوي وقت الفتح يقع في اليوم التالي.",
		pinProtected: "لا يظهر الرمز المخزن في هذه الشاشة.",
		ownerAccountsNote:
			"تُدار هنا حسابات مالك حقيقية جرى تزويدها بشكل منفصل. لا يتوفر تسجيل ذاتي.",
		rotateConfirm: "تأكيد تغيير رمز مكتب الاستقبال؟",
		pinRotated: "تم تغيير الرمز. الرمز السابق لم يعد صالحًا.",
		pinDeactivated: "تم تعطيل رمز مكتب الاستقبال.",
		pinActivated: "تم إنشاء رمز مكتب الاستقبال وتفعيله.",
		provisioned: "مزوّدة بشكل منفصل",
		allSystems: "الأنظمة التشغيلية",
		counter: "جهاز العد",
		camera: "الكاميرا والبث",
		process: "عملية العد",
		operatingNormally: "يعمل بشكل طبيعي",
		lastSeenValue: "قبل 30 ثانية",
		uptimeValue: "99.8%",
		dayRange: "آخر 30 يومًا",
		today: "اليوم",
		yesterday: "أمس",
		minutes: "دقيقة",
		settingsSaved: "تم حفظ نسخة جديدة من الإعدادات وتسجيل التغيير.",
		accountPrivacy: "لا تُعرض بيانات الهوية في نموذج المراجعة المرئي.",
		zero: "0",
		days: [
			"السبت",
			"الأحد",
			"الاثنين",
			"الثلاثاء",
			"الأربعاء",
			"الخميس",
			"الجمعة",
		],
		hours: [
			"6 ص",
			"8 ص",
			"10 ص",
			"12 م",
			"2 م",
			"4 م",
			"6 م",
			"8 م",
			"10 م",
			"12 ص",
			"2 ص",
		],
	},
	en: {
		area: "Owner area",
		navigation: "Owner area navigation",
		eyebrow: "Owner tools",
		chartSummary:
			"Approximate occupancy from 6:00 AM to 1:30 AM with a configured-capacity reference line.",
		selectedPoint: "Selected reading",
		date: "Business day",
		configured: "Current configuration",
		percentageSuffix: "of capacity",
		heatmapHelp:
			"Scroll horizontally to inspect the complete business-day timeline.",
		selectedCell: "Selected cell",
		value: "Average occupancy",
		openZero: "Open, with no recorded occupancy",
		missingDescription: "No reading is available for this period",
		closedDescription: "The gym is closed for this period",
		capacityHint:
			"An internal value that is not shown on the public experience.",
		percentBoundary: "Starting boundary (%)",
		scheduleHint:
			"A closing time at or before opening falls on the following day.",
		pinProtected: "The stored PIN is never displayed on this screen.",
		ownerAccountsNote:
			"Manage real owner accounts that were provisioned separately. Self-registration is not available.",
		rotateConfirm: "Confirm front desk PIN rotation?",
		pinRotated: "The PIN was rotated. The previous PIN is no longer valid.",
		pinDeactivated: "The front desk PIN was deactivated.",
		pinActivated: "A front desk PIN was created and activated.",
		provisioned: "Separately provisioned",
		allSystems: "Operational systems",
		counter: "Counting device",
		camera: "Camera and feed",
		process: "Counting process",
		operatingNormally: "Operating normally",
		lastSeenValue: "30 seconds ago",
		uptimeValue: "99.8%",
		dayRange: "Last 30 days",
		today: "Today",
		yesterday: "Yesterday",
		minutes: "minutes",
		settingsSaved:
			"A new settings version was saved and the change was recorded.",
		accountPrivacy:
			"Identity details are not displayed in this visual review prototype.",
		zero: "0",
		days: [
			"Saturday",
			"Sunday",
			"Monday",
			"Tuesday",
			"Wednesday",
			"Thursday",
			"Friday",
		],
		hours: [
			"6 AM",
			"8 AM",
			"10 AM",
			"12 PM",
			"2 PM",
			"4 PM",
			"6 PM",
			"8 PM",
			"10 PM",
			"12 AM",
			"2 AM",
		],
	},
};

const ownerRoutes = {
	[ROUTES.staff]: "operations",
	[ROUTES.analytics]: "analytics",
	[ROUTES.history]: "history",
	[ROUTES.settings]: "settings",
	[ROUTES.access]: "access",
	[ROUTES.audit]: "audit",
	[ROUTES.health]: "health",
};

const analyticsPlot = { left: 48, right: 684, top: 26, bottom: 238 };
const defaultHeatCell = { dayIndex: 5, hourIndex: 7 };

function useOwnerCatalog(locale, incomingStrings) {
	const catalog = incomingStrings?.owner ? incomingStrings : copy[locale];
	const words = supplemental[locale];
	const headerStrings = {
		productArea: words.area,
		ownerAccess: catalog.owner.nav.accountRole,
		staffAccess: catalog.staff.nav.accountRole,
		switchLabel: catalog.global.languageSwitchLabel,
		switchText: catalog.global.languageAction,
		ownerNavigation: words.navigation,
		nav: Object.fromEntries(
			Object.entries(ownerRoutes).map(([route, key]) => [
				route,
				catalog.owner.nav[key],
			]),
		),
	};
	return { catalog, headerStrings, words };
}

function OwnerFrame({
	locale,
	strings,
	onToggle,
	currentRoute,
	children,
	mainClassName = "",
}) {
	const { catalog, headerStrings, words } = useOwnerCatalog(locale, strings);
	return (
		<div className="app-root owner-root">
			<StaticAtmosphere compact />
			<SkipLink label={catalog.global.skip} />
			<AppHeader
				locale={locale}
				strings={headerStrings}
				currentRoute={currentRoute}
				onToggle={onToggle}
			/>
			<main
				className={`owner-main ${mainClassName}`.trim()}
				id="main-content"
				tabIndex={-1}
			>
				{typeof children === "function"
					? children({ catalog, words })
					: children}
			</main>
		</div>
	);
}

function OwnerPageHeading({ words, title, description, actions }) {
	return (
		<PageHeading
			eyebrow={words.eyebrow}
			title={title}
			description={description}
			actions={actions}
		/>
	);
}

function MetricCard({ icon: Icon, label, value, detail, tone = "default" }) {
	return (
		<Panel className={`owner-metric owner-metric--${tone}`}>
			<div className="owner-metric__icon" aria-hidden="true">
				<Icon />
			</div>
			<p>{label}</p>
			<strong>
				<bdi>{value}</bdi>
			</strong>
			{detail ? <small>{detail}</small> : null}
		</Panel>
	);
}

function AnalyticsChart({ locale, strings }) {
	const isRtl = locale === "ar";
	const [selectedIndex, setSelectedIndex] = useState(7);
	const [tableVisible, setTableVisible] = useState(false);
	const id = useId().replaceAll(":", "");
	const series = analyticsFixture.series;
	const selected = series[selectedIndex];
	const plot = analyticsPlot;
	const width = plot.right - plot.left;
	const height = plot.bottom - plot.top;
	const xFor = (index) => {
		const distance = (index / (series.length - 1)) * width;
		return isRtl ? plot.right - distance : plot.left + distance;
	};
	const yFor = (value) => plot.bottom - (Number(value) / 100) * height;
	const points = series.map((point, index) => ({
		...point,
		x: xFor(index),
		y: yFor(point.count),
	}));
	const linePath = points
		.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
		.join(" ");
	const areaPath = `${linePath} L${points.at(-1).x},${plot.bottom} L${points[0].x},${plot.bottom} Z`;
	const tableId = `analytics-table-${id}`;
	const descriptionId = `analytics-description-${id}`;
	const titleId = `analytics-title-${id}`;
	const selectedLabel = `${selected.time[locale]}, ${selected.count}, ${selected.percent}% ${strings.percentageSuffix}`;

	const selectPoint = (index) => setSelectedIndex(index);
	const handlePointKeyDown = (event, index) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			selectPoint(index);
		}
		if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
			event.preventDefault();
			const visualDelta = event.key === "ArrowRight" ? 1 : -1;
			const dataDelta = isRtl ? -visualDelta : visualDelta;
			const next = Math.min(series.length - 1, Math.max(0, index + dataDelta));
			selectPoint(next);
			event.currentTarget.parentElement
				?.querySelector(`[data-point-index="${next}"]`)
				?.focus();
		}
	};

	return (
		<Panel className="chart-panel" aria-labelledby={titleId}>
			<div className="panel-heading panel-heading--chart">
				<div>
					<h2 id={titleId}>{strings.todayCurve}</h2>
					<p id={descriptionId}>{strings.curveSubtitle}</p>
				</div>
				<span className="chart-legend">
					<i aria-hidden="true" />
					{strings.series}
				</span>
			</div>

			<div className="chart-active-reading" aria-live="polite">
				<span>{strings.selectedPoint}</span>
				<strong>
					<bdi>{selected.time[locale]}</bdi>
				</strong>
				<bdi>{selected.count}</bdi>
				<small>
					<bdi>{selected.percent}%</bdi> {strings.percentageSuffix}
				</small>
			</div>

			<figure
				className="occupancy-chart owner-scroll-region"
				tabIndex={0}
				aria-label={strings.todayCurve}
			>
				<svg
					viewBox="0 0 732 286"
					role="group"
					aria-labelledby={`${titleId} ${descriptionId}`}
				>
					<title>{strings.todayCurve}</title>
					<defs>
						<linearGradient id={`area-${id}`} x1="0" x2="0" y1="0" y2="1">
							<stop offset="0" stopColor="#e51935" stopOpacity=".28" />
							<stop offset="1" stopColor="#e51935" stopOpacity="0" />
						</linearGradient>
					</defs>
					<desc>{strings.chartSummary}</desc>
					{[0, 25, 50, 75, 100].map((tick) => {
						const y = yFor(tick);
						return (
							<g className="chart-gridline" key={tick}>
								<line x1={plot.left} x2={plot.right} y1={y} y2={y} />
								<text
									x={isRtl ? 714 : 18}
									y={y + 4}
									textAnchor={isRtl ? "end" : "start"}
								>
									{tick}
								</text>
							</g>
						);
					})}
					<g className="capacity-reference">
						<line x1={plot.left} x2={plot.right} y1={plot.top} y2={plot.top} />
						<text
							x={isRtl ? plot.right - 8 : plot.left + 8}
							y={plot.top - 8}
							textAnchor={isRtl ? "end" : "start"}
						>
							{strings.capacityReference(analyticsFixture.capacity)}
						</text>
					</g>
					<path className="chart-area" d={areaPath} fill={`url(#area-${id})`} />
					<path className="chart-line" d={linePath} />
					<g className="chart-points">
						{points.map((point, index) => (
							<g
								key={point.time.en}
								className="chart-point"
								role="button"
								tabIndex={0}
								data-chart-point
								data-point-index={index}
								aria-label={`${point.time[locale]}, ${point.count}, ${point.percent}% ${strings.percentageSuffix}`}
								aria-pressed={index === selectedIndex}
								onClick={() => selectPoint(index)}
								onFocus={() => selectPoint(index)}
								onKeyDown={(event) => handlePointKeyDown(event, index)}
							>
								<circle
									className="chart-point__hit"
									cx={point.x}
									cy={point.y}
									r="15"
								/>
								<circle
									className="chart-point__ring"
									cx={point.x}
									cy={point.y}
									r="8"
								/>
								<circle
									className="chart-point__dot"
									cx={point.x}
									cy={point.y}
									r="4"
								/>
							</g>
						))}
					</g>
					{points.map((point, index) =>
						index % 2 === 0 || index === points.length - 1 ? (
							<text
								className="chart-time-label"
								key={`label-${point.time.en}`}
								x={point.x}
								y="267"
								textAnchor="middle"
							>
								{point.time[locale]}
							</text>
						) : null,
					)}
				</svg>
				<figcaption className="sr-only">{selectedLabel}</figcaption>
			</figure>

			<div className="chart-panel__footer">
				<Button
					variant="ghost"
					aria-controls={tableId}
					aria-expanded={tableVisible}
					onClick={() => setTableVisible((visible) => !visible)}
				>
					{tableVisible ? strings.hideTable : strings.viewTable}
				</Button>
			</div>

			<section
				id={tableId}
				hidden={!tableVisible}
				className="responsive-table chart-data-table owner-scroll-region"
				tabIndex={0}
				aria-label={strings.dataTable}
			>
				<AnalyticsTable locale={locale} strings={strings} series={series} />
			</section>
			<ScreenReaderOnly as="div">
				<AnalyticsTable
					locale={locale}
					strings={strings}
					series={series}
					captionSuffix="-accessible"
				/>
			</ScreenReaderOnly>
		</Panel>
	);
}

function AnalyticsTable({ locale, strings, series, captionSuffix = "" }) {
	return (
		<table>
			<caption>
				{strings.dataTable}
				{captionSuffix ? ` ${captionSuffix}` : ""}
			</caption>
			<thead>
				<tr>
					<th scope="col">{strings.time}</th>
					<th scope="col">{strings.occupancy}</th>
					<th scope="col">{strings.percent}</th>
					<th scope="col">{strings.quality}</th>
				</tr>
			</thead>
			<tbody>
				{series.map((point) => (
					<tr key={point.time.en}>
						<th scope="row">
							<bdi>{point.time[locale]}</bdi>
						</th>
						<td>
							<bdi>{point.count}</bdi>
						</td>
						<td>
							<bdi>{point.percent}%</bdi>
						</td>
						<td>{strings[point.quality]}</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}

export function AnalyticsPage({ locale = "ar", strings, onToggle }) {
	return (
		<OwnerFrame
			locale={locale}
			strings={strings}
			onToggle={onToggle}
			currentRoute={ROUTES.analytics}
		>
			{({ catalog, words }) => {
				const page = catalog.owner.analytics;
				return (
					<>
						<OwnerPageHeading
							words={words}
							title={page.title}
							description={page.curveSubtitle}
							actions={
								<ExportAction
									label={page.exportCsv}
									readyLabel={page.exportComplete}
								/>
							}
						/>

						<Panel className="owner-filter-bar" aria-label={page.dateRange}>
							<Field id="analytics-from" label={page.from}>
								{(props) => (
									<input
										{...props}
										type="date"
										defaultValue="2026-07-16"
										dir="ltr"
									/>
								)}
							</Field>
							<Field id="analytics-to" label={page.to}>
								{(props) => (
									<input
										{...props}
										type="date"
										defaultValue="2026-07-16"
										dir="ltr"
									/>
								)}
							</Field>
							<div className="filter-context">
								<span>{words.date}</span>
								<strong>
									<bdi>{analyticsFixture.businessDate}</bdi>
								</strong>
							</div>
						</Panel>

						<section className="owner-metrics" aria-label={page.title}>
							<MetricCard
								icon={ActivityBarsIcon}
								label={page.peak}
								value={analyticsFixture.summary.peakCount}
								detail={analyticsFixture.summary.peakTime[locale]}
								tone="red"
							/>
							<MetricCard
								icon={ClockIcon}
								label={page.average}
								value={analyticsFixture.summary.averageCount}
							/>
							<MetricCard
								icon={AuditIcon}
								label={page.crossings}
								value={analyticsFixture.summary.estimatedCrossings}
								detail={page.crossingsQualifier}
							/>
						</section>

						<AnalyticsChart locale={locale} strings={{ ...page, ...words }} />
					</>
				);
			}}
		</OwnerFrame>
	);
}

function ExportAction({ label, readyLabel }) {
	const [ready, setReady] = useState(false);
	return (
		<div className="export-action">
			<Button variant="secondary" onClick={() => setReady(true)}>
				<DownloadIcon aria-hidden="true" />
				{label}
			</Button>
			<span className="export-action__status" aria-live="polite">
				{ready ? (
					<>
						<CheckIcon aria-hidden="true" />
						{readyLabel}
					</>
				) : null}
			</span>
		</div>
	);
}

function heatCellView(day, hourIndex) {
	if (day.key === "monday" && hourIndex === 4) {
		return { state: "missing", value: null };
	}
	if (day.key === "sunday" && hourIndex === 0) {
		return { state: "zero", value: "0" };
	}
	const value = day.values[hourIndex];
	if (value === null) return { state: "closed", value: null };
	const number = Number(value);
	if (number === 0) return { state: "zero", value };
	if (number <= 20) return { state: "heat-1", value };
	if (number <= 40) return { state: "heat-2", value };
	if (number <= 65) return { state: "heat-3", value };
	return { state: "heat-4", value };
}

function Heatmap({ locale, strings, words }) {
	const [selected, setSelected] = useState(defaultHeatCell);
	const selectedDay = historyFixture.days[selected.dayIndex];
	const selectedView = heatCellView(selectedDay, selected.hourIndex);
	const hourLabels = words.hours;

	const describe = (day, hourIndex, view) => {
		const prefix = `${day.label[locale]}, ${hourLabels[hourIndex]}`;
		if (view.state === "closed")
			return `${prefix}: ${strings.closedDescription}`;
		if (view.state === "missing")
			return `${prefix}: ${strings.missingDescription}`;
		if (view.state === "zero") return `${prefix}: ${strings.openZero}`;
		return `${prefix}: ${strings.value} ${view.value}, ${view.value}%`;
	};

	return (
		<Panel className="heatmap-panel">
			<div className="panel-heading">
				<div>
					<h2>{strings.heatmap}</h2>
					<p>{strings.subtitle}</p>
				</div>
				<span className="heatmap-range">
					<bdi>{historyFixture.range.from}</bdi> —{" "}
					<bdi>{historyFixture.range.to}</bdi>
				</span>
			</div>

			<div className="heatmap-selected" aria-live="polite">
				<span>{strings.selectedCell}</span>
				<strong>
					{selectedDay.label[locale]} ·{" "}
					<bdi>{hourLabels[selected.hourIndex]}</bdi>
				</strong>
				<bdi>
					{selectedView.state === "closed"
						? strings.closed
						: selectedView.state === "missing"
							? strings.noData
							: selectedView.state === "zero"
								? strings.openZero
								: `${selectedView.value}%`}
				</bdi>
			</div>

			<p className="heatmap-mobile-help">{strings.heatmapHelp}</p>
			<section
				className="heatmap-scroll owner-scroll-region"
				aria-label={strings.heatmap}
				tabIndex={0}
			>
				<div
					className="heatmap-grid"
					style={{ "--heat-columns": historyFixture.hours.length }}
				>
					<div className="heatmap-grid__corner" aria-hidden="true" />
					{hourLabels.map((hour) => (
						<span className="heatmap-hour" key={hour}>
							<bdi>{hour}</bdi>
						</span>
					))}
					{historyFixture.days.map((day, dayIndex) => (
						<div className="heatmap-row" key={day.key}>
							<strong className="heatmap-day">{day.label[locale]}</strong>
							{historyFixture.hours.map((hour, hourIndex) => {
								const view = heatCellView(day, hourIndex);
								const isSelected =
									dayIndex === selected.dayIndex &&
									hourIndex === selected.hourIndex;
								return (
									<button
										className={`heatmap-cell heatmap-cell--${view.state}`}
										key={`${day.key}-${hour}`}
										type="button"
										data-heat-cell
										aria-label={describe(day, hourIndex, view)}
										aria-pressed={isSelected}
										onClick={() => setSelected({ dayIndex, hourIndex })}
										onFocus={() => setSelected({ dayIndex, hourIndex })}
									>
										<span aria-hidden="true">
											{view.state === "zero" ? "0" : ""}
										</span>
									</button>
								);
							})}
						</div>
					))}
				</div>
			</section>

			<div className="heatmap-legend" role="group" aria-label={strings.heatmap}>
				<span>{strings.less}</span>
				<i className="heatmap-cell--heat-1" aria-hidden="true" />
				<i className="heatmap-cell--heat-2" aria-hidden="true" />
				<i className="heatmap-cell--heat-3" aria-hidden="true" />
				<i className="heatmap-cell--heat-4" aria-hidden="true" />
				<span>{strings.more}</span>
				<span className="heatmap-legend__separator" aria-hidden="true" />
				<i className="heatmap-cell--zero" aria-hidden="true" />
				<span>{strings.zero}</span>
				<i className="heatmap-cell--closed" aria-hidden="true" />
				<span>{strings.closed}</span>
				<i className="heatmap-cell--missing" aria-hidden="true" />
				<span>{strings.noData}</span>
			</div>

			<ScreenReaderOnly as="div">
				<table>
					<caption>{strings.heatmap}</caption>
					<thead>
						<tr>
							<th scope="col">{strings.heatmap}</th>
							{hourLabels.map((hour) => (
								<th scope="col" key={hour}>
									<bdi>{hour}</bdi>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{historyFixture.days.map((day) => (
							<tr key={day.key}>
								<th scope="row">{day.label[locale]}</th>
								{historyFixture.hours.map((hour, hourIndex) => {
									const view = heatCellView(day, hourIndex);
									return <td key={hour}>{describe(day, hourIndex, view)}</td>;
								})}
							</tr>
						))}
					</tbody>
				</table>
			</ScreenReaderOnly>
		</Panel>
	);
}

export function HistoryPage({ locale = "ar", strings, onToggle }) {
	return (
		<OwnerFrame
			locale={locale}
			strings={strings}
			onToggle={onToggle}
			currentRoute={ROUTES.history}
		>
			{({ catalog, words }) => {
				const page = catalog.owner.history;
				return (
					<>
						<OwnerPageHeading
							words={words}
							title={page.title}
							description={page.subtitle}
						/>
						<section className="owner-metrics" aria-label={page.busiestTimes}>
							<MetricCard
								icon={ActivityBarsIcon}
								label={page.peak}
								value={historyFixture.summary.peakCount}
								detail={`${historyFixture.summary.peakDay[locale]} · ${historyFixture.summary.peakTime[locale]}`}
								tone="red"
							/>
							<MetricCard
								icon={ClockIcon}
								label={page.average}
								value={historyFixture.summary.averageCount}
							/>
							<MetricCard
								icon={AuditIcon}
								label={page.crossings}
								value={historyFixture.summary.estimatedCrossings}
								detail={page.crossingsQualifier}
							/>
						</section>
						<Heatmap
							locale={locale}
							strings={{ ...page, ...words }}
							words={words}
						/>
						<Panel className="comparison-panel">
							<div className="comparison-panel__icon" aria-hidden="true">
								<AlertTriangleIcon />
							</div>
							<div>
								<h2>{page.weeklyComparison}</h2>
								<p>{page.insufficientWeeks}</p>
							</div>
						</Panel>
					</>
				);
			}}
		</OwnerFrame>
	);
}

const scheduleRows = [
	{ open: "06:00", close: "02:00" },
	{ open: "06:00", close: "02:00" },
	{ open: "06:00", close: "02:00" },
	{ open: "06:00", close: "02:00" },
	{ open: "06:00", close: "02:00" },
	{ open: "06:00", close: "02:00" },
	{ open: "14:00", close: "00:00" },
];

export function SettingsPage({ locale = "ar", strings, onToggle }) {
	const [saved, setSaved] = useState(false);
	return (
		<OwnerFrame
			locale={locale}
			strings={strings}
			onToggle={onToggle}
			currentRoute={ROUTES.settings}
		>
			{({ catalog, words }) => {
				const page = catalog.owner.settings;
				const common = catalog.owner.common;
				return (
					<form
						className="settings-form"
						onSubmit={(event) => {
							event.preventDefault();
							setSaved(true);
						}}
					>
						<OwnerPageHeading
							words={words}
							title={page.title}
							description={page.description}
							actions={
								<Button variant="primary" type="submit">
									<SettingsIcon />
									{common.save}
								</Button>
							}
						/>

						<div className="settings-grid">
							<Panel className="settings-panel settings-panel--capacity">
								<div className="panel-heading">
									<div>
										<h2>{page.capacity}</h2>
										<p>{words.capacityHint}</p>
									</div>
								</div>
								<Field
									id="settings-capacity"
									label={page.capacity}
									hint={words.capacityHint}
								>
									{(props) => (
										<input
											{...props}
											type="number"
											min="1"
											step="1"
											defaultValue="100"
											inputMode="numeric"
											dir="ltr"
										/>
									)}
								</Field>
							</Panel>

							<Panel className="settings-panel settings-panel--thresholds">
								<div className="panel-heading">
									<div>
										<h2>{page.thresholds}</h2>
									</div>
								</div>
								<div className="threshold-grid">
									{[
										["quiet", "0"],
										["moderate", "25"],
										["busy", "50"],
										["packed", "75"],
									].map(([key, value]) => (
										<Field key={key} id={`threshold-${key}`} label={page[key]}>
											{(props) => (
												<div
													className={`threshold-input threshold-input--${key}`}
												>
													<input
														{...props}
														type="number"
														min="0"
														max="100"
														defaultValue={value}
														inputMode="numeric"
														dir="ltr"
													/>
													<span aria-hidden="true">%</span>
												</div>
											)}
										</Field>
									))}
								</div>
							</Panel>

							<Panel className="settings-panel settings-panel--schedule">
								<div className="panel-heading">
									<div>
										<h2>{page.weeklyHours}</h2>
										<p>{words.scheduleHint}</p>
									</div>
								</div>
								<section
									className="schedule-table responsive-table owner-scroll-region"
									aria-label={page.weeklyHours}
									tabIndex={0}
								>
									<table>
										<thead>
											<tr>
												<th scope="col">{page.day}</th>
												<th scope="col">{page.openTime}</th>
												<th scope="col">{page.closeTime}</th>
												<th scope="col">{page.closedAllDay}</th>
											</tr>
										</thead>
										<tbody>
											{scheduleRows.map((row, index) => (
												<tr key={words.days[index]}>
													<th scope="row">{words.days[index]}</th>
													<td>
														<label className="table-input">
															<ScreenReaderOnly>{`${words.days[index]} ${page.openTime}`}</ScreenReaderOnly>
															<input
																type="time"
																defaultValue={row.open}
																dir="ltr"
															/>
														</label>
													</td>
													<td>
														<label className="table-input">
															<ScreenReaderOnly>{`${words.days[index]} ${page.closeTime}`}</ScreenReaderOnly>
															<input
																type="time"
																defaultValue={row.close}
																dir="ltr"
															/>
														</label>
													</td>
													<td>
														<label className="table-checkbox">
															<input type="checkbox" />
															<span>{page.closedAllDay}</span>
														</label>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</section>
							</Panel>

							<Panel className="settings-panel settings-panel--system">
								<div className="panel-heading">
									<div>
										<h2>{words.configured}</h2>
									</div>
								</div>
								<div className="settings-system-grid">
									<Field
										id="business-boundary"
										label={page.businessDayBoundary}
									>
										{(props) => (
											<input
												{...props}
												type="time"
												defaultValue="04:00"
												dir="ltr"
											/>
										)}
									</Field>
									<Field id="reset-buffer" label={page.resetBuffer}>
										{(props) => (
											<div className="unit-input">
												<input
													{...props}
													type="number"
													min="0"
													step="1"
													defaultValue="30"
													inputMode="numeric"
													dir="ltr"
												/>
												<span>{page.minutes}</span>
											</div>
										)}
									</Field>
									<Field id="gym-timezone" label={page.timeZone}>
										{(props) => (
											<select {...props} defaultValue="Asia/Riyadh" dir="ltr">
												<option value="Asia/Riyadh">Asia/Riyadh</option>
											</select>
										)}
									</Field>
								</div>
							</Panel>
						</div>
						<p className="form-status" aria-live="polite">
							{saved ? words.settingsSaved : ""}
						</p>
					</form>
				);
			}}
		</OwnerFrame>
	);
}

export function AccessPage({ locale = "ar", strings, onToggle }) {
	const [pinActive, setPinActive] = useState(true);
	const [confirmation, setConfirmation] = useState(false);
	const [notice, setNotice] = useState("");
	return (
		<OwnerFrame
			locale={locale}
			strings={strings}
			onToggle={onToggle}
			currentRoute={ROUTES.access}
		>
			{({ catalog, words }) => {
				const page = catalog.owner.access;
				const common = catalog.owner.common;
				return (
					<>
						<OwnerPageHeading
							words={words}
							title={page.title}
							description={page.description}
						/>
						<div className="access-grid">
							<Panel className="access-panel access-panel--pin">
								<div className="panel-heading">
									<div>
										<h2>{page.staffPin}</h2>
										<p>{words.pinProtected}</p>
									</div>
									<span
										className={`status-chip status-chip--${pinActive ? "online" : "offline"}`}
									>
										<StatusMark tone={pinActive ? "live" : "offline"} />
										{pinActive ? page.active : page.inactive}
									</span>
								</div>
								<div className="credential-mask" aria-hidden="true">
									<LockPattern />
								</div>
								<div className="access-actions">
									{pinActive ? (
										<>
											<Button
												variant="primary"
												onClick={() => setConfirmation(true)}
											>
												{page.rotatePin}
											</Button>
											<Button
												variant="danger"
												onClick={() => {
													setPinActive(false);
													setConfirmation(false);
													setNotice(words.pinDeactivated);
												}}
											>
												{page.deactivatePin}
											</Button>
										</>
									) : (
										<Button
											variant="primary"
											onClick={() => {
												setPinActive(true);
												setNotice(words.pinActivated);
											}}
										>
											{page.provisionPin}
										</Button>
									)}
								</div>
								{confirmation ? (
									<section
										className="inline-confirmation"
										aria-labelledby="pin-confirm-title"
									>
										<div>
											<strong id="pin-confirm-title">
												{words.rotateConfirm}
											</strong>
											<p>{page.confirmRotation}</p>
										</div>
										<div>
											<Button
												variant="ghost"
												onClick={() => setConfirmation(false)}
											>
												{common.cancel}
											</Button>
											<Button
												variant="primary"
												onClick={() => {
													setConfirmation(false);
													setNotice(words.pinRotated);
												}}
											>
												{common.confirm}
											</Button>
										</div>
									</section>
								) : null}
								<p className="form-status" aria-live="polite">
									{notice}
								</p>
							</Panel>

							<Panel className="access-panel access-panel--accounts">
								<div className="panel-heading">
									<div>
										<h2>{page.ownerAccounts}</h2>
										<p>{words.ownerAccountsNote}</p>
									</div>
									<AccessIcon aria-hidden="true" />
								</div>
								<div className="account-policy">
									<div>
										<span>{page.account}</span>
										<strong>{words.provisioned}</strong>
									</div>
									<div>
										<span>{page.role}</span>
										<strong>{catalog.owner.nav.accountRole}</strong>
									</div>
									<div>
										<span>{page.status}</span>
										<strong>{page.active}</strong>
									</div>
								</div>
								<p className="privacy-note">{words.accountPrivacy}</p>
								<p className="session-note">{page.deactivateSessionNotice}</p>
							</Panel>
						</div>
					</>
				);
			}}
		</OwnerFrame>
	);
}

function LockPattern() {
	return (
		<>
			<i />
			<i />
			<i />
			<i />
		</>
	);
}

const auditRows = [
	{
		actor: "frontDesk",
		action: "correction",
		time: { ar: "اليوم، 2:54 م", en: "Today, 2:54 PM" },
		from: "35",
		to: "37",
		reason: "noReason",
	},
	{
		actor: "system",
		action: "systemReset",
		time: { ar: "اليوم، 4:30 ص", en: "Today, 4:30 AM" },
		from: "12",
		to: "0",
		reason: "noReason",
	},
	{
		actor: "owner",
		action: "settingsChange",
		time: { ar: "أمس، 6:20 م", en: "Yesterday, 6:20 PM" },
		from: "—",
		to: "—",
		reason: "noReason",
	},
];

export function AuditPage({ locale = "ar", strings, onToggle }) {
	const [filter, setFilter] = useState("allActions");
	return (
		<OwnerFrame
			locale={locale}
			strings={strings}
			onToggle={onToggle}
			currentRoute={ROUTES.audit}
		>
			{({ catalog, words }) => {
				const page = catalog.owner.audit;
				const rows =
					filter === "allActions"
						? auditRows
						: auditRows.filter((row) => row.action === filter);
				return (
					<>
						<OwnerPageHeading
							words={words}
							title={page.title}
							description={page.description}
						/>
						<Panel className="audit-panel">
							<div className="audit-filter">
								<Field id="audit-filter" label={page.filter}>
									{(props) => (
										<select
											{...props}
											value={filter}
											onChange={(event) => setFilter(event.target.value)}
										>
											{[
												"allActions",
												"correction",
												"directEntry",
												"reset",
												"systemReset",
												"settingsChange",
											].map((key) => (
												<option value={key} key={key}>
													{page[key]}
												</option>
											))}
										</select>
									)}
								</Field>
								<span>
									<AuditIcon />
									{rows.length}
								</span>
							</div>
							<section
								className="responsive-table audit-table owner-scroll-region"
								aria-label={page.title}
								tabIndex={0}
							>
								<table>
									<thead>
										<tr>
											<th scope="col">{page.time}</th>
											<th scope="col">{page.actor}</th>
											<th scope="col">{page.action}</th>
											<th scope="col">{page.from}</th>
											<th scope="col">{page.to}</th>
											<th scope="col">{page.reason}</th>
										</tr>
									</thead>
									<tbody>
										{rows.map((row) => (
											<tr key={`${row.actor}-${row.action}`}>
												<th scope="row" data-label={page.time}>
													<bdi>{row.time[locale]}</bdi>
												</th>
												<td data-label={page.actor}>
													<span
														className={`actor-chip actor-chip--${row.actor}`}
													>
														{page[row.actor]}
													</span>
												</td>
												<td data-label={page.action}>{page[row.action]}</td>
												<td data-label={page.from}>
													<bdi>{row.from}</bdi>
												</td>
												<td data-label={page.to}>
													<bdi>{row.to}</bdi>
												</td>
												<td data-label={page.reason}>{page[row.reason]}</td>
											</tr>
										))}
									</tbody>
								</table>
							</section>
							{rows.length === 0 ? (
								<p className="empty-message">{page.empty}</p>
							) : null}
						</Panel>
					</>
				);
			}}
		</OwnerFrame>
	);
}

const healthRows = [
	{
		type: "counterSilence",
		started: { ar: "12 يوليو، 9:14 م", en: "Jul 12, 9:14 PM" },
		recovered: { ar: "12 يوليو، 9:21 م", en: "Jul 12, 9:21 PM" },
		duration: "7",
	},
	{
		type: "cameraFailure",
		started: { ar: "8 يوليو، 6:02 ص", en: "Jul 8, 6:02 AM" },
		recovered: { ar: "8 يوليو، 6:05 ص", en: "Jul 8, 6:05 AM" },
		duration: "3",
	},
];

export function HealthPage({ locale = "ar", strings, onToggle }) {
	return (
		<OwnerFrame
			locale={locale}
			strings={strings}
			onToggle={onToggle}
			currentRoute={ROUTES.health}
		>
			{({ catalog, words }) => {
				const page = catalog.owner.health;
				return (
					<>
						<OwnerPageHeading
							words={words}
							title={page.title}
							description={page.description}
							actions={
								<span className="range-chip">
									<ClockIcon />
									{words.dayRange}
								</span>
							}
						/>
						<section
							className="health-overview"
							aria-label={page.currentStatus}
						>
							<Panel className="health-summary health-summary--primary">
								<div>
									<span className="status-chip status-chip--online">
										<StatusMark tone="live" />
										{page.online}
									</span>
									<p>{page.currentStatus}</p>
									<strong>{words.allSystems}</strong>
								</div>
								<HealthIcon aria-hidden="true" />
							</Panel>
							<MetricCard
								icon={ActivityBarsIcon}
								label={page.uptime}
								value={words.uptimeValue}
								detail={words.dayRange}
							/>
							<MetricCard
								icon={ClockIcon}
								label={page.lastSeen}
								value={words.lastSeenValue}
							/>
						</section>
						<div className="system-status-grid">
							{[
								[words.counter, ActivityBarsIcon],
								[words.camera, HealthIcon],
								[words.process, SettingsIcon],
							].map(([label, Icon]) => (
								<Panel className="system-status" key={label}>
									<Icon />
									<div>
										<strong>{label}</strong>
										<span>
											<StatusMark tone="live" />
											{words.operatingNormally}
										</span>
									</div>
								</Panel>
							))}
						</div>
						<Panel className="incidents-panel">
							<div className="panel-heading">
								<div>
									<h2>{page.incidents}</h2>
									<p>{page.description}</p>
								</div>
							</div>
							<section
								className="responsive-table incidents-table owner-scroll-region"
								aria-label={page.incidents}
								tabIndex={0}
							>
								<table>
									<thead>
										<tr>
											<th scope="col">{page.incidentType}</th>
											<th scope="col">{page.started}</th>
											<th scope="col">{page.recovered}</th>
											<th scope="col">{page.duration}</th>
										</tr>
									</thead>
									<tbody>
										{healthRows.map((row) => (
											<tr key={row.type}>
												<th scope="row" data-label={page.incidentType}>
													{page[row.type]}
												</th>
												<td data-label={page.started}>
													<bdi>{row.started[locale]}</bdi>
												</td>
												<td data-label={page.recovered}>
													<bdi>{row.recovered[locale]}</bdi>
												</td>
												<td data-label={page.duration}>
													<bdi>{row.duration}</bdi> {words.minutes}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</section>
						</Panel>
					</>
				);
			}}
		</OwnerFrame>
	);
}
