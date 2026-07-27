import type {
	OperationalHealthDto,
	OperationalSnapshot,
} from "@fitway/api/health/snapshot";
import { Button } from "@fitway/ui/components/button";
import { Skeleton } from "@fitway/ui/components/skeleton";
import { RefreshCw, TriangleAlert, WifiOff } from "lucide-react";
import { useStaffMessages } from "@/hooks/use-staff-messages";
import { formatGymTime, formatNumber, formatRelativeTime } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";

type SnapshotViewProps = {
	snapshot: OperationalSnapshot;
};

type HealthKey = keyof Pick<
	OperationalHealthDto,
	"process" | "camera" | "feed"
>;

function StatusMark({
	tone,
}: {
	tone: "live" | "stale" | "offline" | "danger";
}) {
	return (
		<span
			className={`operations-status-mark operations-status-mark--${tone}`}
			aria-hidden="true"
		/>
	);
}

function relativeTime(
	value: string | null,
	computedAt: string,
	locale: "ar" | "en",
	fallback: string,
) {
	if (!value) return fallback;
	return formatRelativeTime(Date.parse(value), Date.parse(computedAt), locale);
}

function healthTone(health: OperationalHealthDto) {
	if (health.freshness === "unavailable") return "offline" as const;
	if (health.freshness === "stale") return "stale" as const;
	if (health.condition === "failed") return "danger" as const;
	if (health.condition === "degraded" || health.condition === "unknown")
		return "stale" as const;
	return "live" as const;
}

function HealthDetail({
	label,
	value,
	tone,
}: {
	label: string;
	value: string;
	tone?: "live" | "stale" | "offline" | "danger";
}) {
	return (
		<div className="health-detail">
			<dt>{label}</dt>
			<dd>
				{tone ? <StatusMark tone={tone} /> : null}
				<bdi>{value}</bdi>
			</dd>
		</div>
	);
}

export function OperationalSnapshotView({ snapshot }: SnapshotViewProps) {
	const { locale } = useI18n();
	const messages = useStaffMessages();
	const { occupancy, health } = snapshot;
	const occupancyTone =
		occupancy.freshness === "fresh"
			? "live"
			: occupancy.freshness === "stale"
				? "stale"
				: "offline";
	const occupancyStatus =
		occupancy.freshness === "fresh"
			? messages.staff.live
			: occupancy.freshness === "stale"
				? messages.staff.stale
				: occupancy.freshness === "closed"
					? messages.staff.closedNow
					: messages.staff.unavailable;
	const stateAnnouncement =
		occupancy.freshness === "stale"
			? `${messages.staff.stale}. ${messages.staff.staleDescription}`
			: occupancyStatus;
	const occupancyHeading =
		occupancy.freshness === "fresh" || occupancy.freshness === "stale"
			? messages.staff.openNow
			: occupancy.freshness === "closed"
				? messages.staff.closedNow
				: messages.staff.unavailable;

	const statusFor = (key: HealthKey) => {
		const value = health[key];
		if (!value)
			return { label: messages.staff.notAvailable, tone: "offline" as const };
		const tone =
			value === "ok"
				? ("live" as const)
				: value === "failed"
					? ("danger" as const)
					: ("stale" as const);
		return { label: messages.staff.deviceStates[value], tone };
	};

	return (
		<div className="operations-grid">
			<p className="fw-sr-only" role="status" aria-live="polite">
				{stateAnnouncement}
			</p>
			<section
				className={`occupancy-panel occupancy-panel--${occupancyTone}`}
				aria-labelledby="occupancy-heading"
			>
				<header className="panel-heading">
					<div>
						<p className="panel-heading__eyebrow">
							{messages.staff.occupancyTitle}
						</p>
						<h2 id="occupancy-heading">{occupancyHeading}</h2>
					</div>
					<div className="operations-state-badge">
						<StatusMark tone={occupancyTone} />
						{occupancyStatus}
					</div>
				</header>

				{occupancy.freshness === "fresh" || occupancy.freshness === "stale" ? (
					<>
						{occupancy.freshness === "stale" ? (
							<p className="occupancy-panel__warning">
								<TriangleAlert aria-hidden="true" />
								{messages.staff.staleDescription}
							</p>
						) : null}
						<div className="occupancy-reading">
							<div className="occupancy-reading__band">
								<span>{messages.staff.crowdLevel}</span>
								<strong>{messages.staff.bands[occupancy.band]}</strong>
							</div>
							<div className="occupancy-reading__count">
								<span>{messages.staff.approximateCount}</span>
								<strong>
									<bdi>{formatNumber(occupancy.count, locale)}</bdi>
								</strong>
							</div>
						</div>
						<p className="occupancy-panel__updated">
							{messages.staff.lastUpdated(
								formatGymTime(
									Date.parse(occupancy.lastUpdatedAt),
									locale,
									occupancy.timeZone,
								),
							)}
						</p>
					</>
				) : occupancy.freshness === "closed" ? (
					<div className="occupancy-panel__empty">
						<WifiOff aria-hidden="true" />
						{occupancy.nextOpenAt
							? messages.staff.nextOpen(
									formatGymTime(
										Date.parse(occupancy.nextOpenAt),
										locale,
										occupancy.timeZone,
									),
								)
							: messages.staff.closedNow}
					</div>
				) : (
					<div className="occupancy-panel__empty">
						<WifiOff aria-hidden="true" />
						{messages.staff.unavailableDescription}
					</div>
				)}

				<dl className="occupancy-meta">
					<div>
						<dt>{messages.staff.capacity}</dt>
						<dd>
							<bdi>
								{snapshot.capacity === null
									? messages.staff.notAvailable
									: formatNumber(snapshot.capacity, locale)}
							</bdi>
						</dd>
					</div>
					<div>
						<dt>{messages.staff.source}</dt>
						<dd>
							{snapshot.source
								? messages.staff.sources[snapshot.source]
								: messages.staff.notAvailable}
						</dd>
					</div>
				</dl>
			</section>

			<section className="health-panel" aria-labelledby="health-heading">
				<header className="panel-heading">
					<div>
						<p className="panel-heading__eyebrow">
							{messages.staff.healthTitle}
						</p>
						<h2 id="health-heading">
							{messages.staff.conditions[health.condition]}
						</h2>
						<p>{messages.staff.healthDescription}</p>
					</div>
				</header>

				<dl className="health-summary">
					<HealthDetail
						label={messages.staff.healthFreshness}
						value={messages.staff.freshness[health.freshness]}
						tone={healthTone(health)}
					/>
					<HealthDetail
						label={messages.staff.healthCondition}
						value={messages.staff.conditions[health.condition]}
						tone={healthTone(health)}
					/>
				</dl>
				<dl className="health-details">
					{(["process", "camera", "feed"] as const).map((key) => {
						const status = statusFor(key);
						return (
							<HealthDetail
								key={key}
								label={messages.staff[key]}
								value={status.label}
								tone={status.tone}
							/>
						);
					})}
					<HealthDetail
						label={messages.staff.detectorFps}
						value={
							health.detectorFps === null
								? messages.staff.notAvailable
								: messages.staff.framesPerSecond(
										formatNumber(health.detectorFps, locale),
									)
						}
					/>
					<HealthDetail
						label={messages.staff.edgeObservedAt}
						value={relativeTime(
							health.edgeObservedAt,
							snapshot.computedAt,
							locale,
							messages.staff.notAvailable,
						)}
					/>
					<HealthDetail
						label={messages.staff.receivedAt}
						value={relativeTime(
							health.receivedAt,
							snapshot.computedAt,
							locale,
							messages.staff.notAvailable,
						)}
					/>
					<HealthDetail
						label={messages.staff.lastSeenAt}
						value={relativeTime(
							health.lastSeenAt,
							snapshot.computedAt,
							locale,
							messages.staff.notAvailable,
						)}
					/>
					<HealthDetail
						label={messages.staff.staleAt}
						value={relativeTime(
							health.staleAt,
							snapshot.computedAt,
							locale,
							messages.staff.notAvailable,
						)}
					/>
				</dl>
			</section>
		</div>
	);
}

export function OperationalSnapshotSkeleton() {
	const messages = useStaffMessages();
	return (
		<div className="operations-grid" aria-busy="true">
			<p className="fw-sr-only" role="status">
				{messages.staff.loading}
			</p>
			{["occupancy", "health"].map((key) => (
				<section className="operations-skeleton" key={key}>
					<Skeleton className="h-4 w-28" />
					<Skeleton className="mt-4 h-8 w-52 max-w-full" />
					<Skeleton className="mt-10 h-24 w-full" />
					<Skeleton className="mt-6 h-16 w-full" />
				</section>
			))}
		</div>
	);
}

export function OperationalSnapshotError({
	onRetry,
	retrying,
}: {
	onRetry: () => void;
	retrying: boolean;
}) {
	const messages = useStaffMessages();
	return (
		<section className="operations-error" role="alert">
			<TriangleAlert aria-hidden="true" />
			<div>
				<h2>{messages.staff.loadErrorTitle}</h2>
				<p>{messages.staff.loadErrorDescription}</p>
			</div>
			<Button
				type="button"
				variant="outline"
				onClick={onRetry}
				disabled={retrying}
			>
				<RefreshCw aria-hidden="true" />
				{retrying ? messages.staff.retrying : messages.staff.retry}
			</Button>
		</section>
	);
}
