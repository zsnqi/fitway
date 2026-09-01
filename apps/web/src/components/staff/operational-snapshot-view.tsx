import type { OperationalSnapshot } from "@fitway/api/health/snapshot";
import type { CSSProperties } from "react";

import { CrowdSignal } from "@/components/crowd-signal";
import { CROWD_SIGNAL_LINEAR_HEIGHTS } from "@/components/crowd-signal-ramp";
import type { StaffWebMessages } from "@/components/staff/messages";
import { useStaffMessages } from "@/hooks/use-staff-messages";
import { formatGymTime, formatNumber, formatRelativeTime } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";

type SnapshotViewProps = {
	snapshot: OperationalSnapshot;
};

type MarkerTone = "live" | "delayed" | "error" | "unknown";
type NoticeTone = "loading" | "delayed" | "error";

/**
 * The Paper board renders one of six compositions. `live` and `camera` share a
 * reading region — a camera fault never touches the reading — and so do
 * `delayed`, which keeps every value at full size and restates freshness.
 */
type BoardVariant =
	| "live"
	| "camera"
	| "delayed"
	| "closed"
	| "offline"
	| "trust";

type StaffMessages = StaffWebMessages["staff"];

/** The four canonical intensity levels the 28-bar signal compresses into one mark. */
const tickLevel = { quiet: 21, moderate: 39, busy: 68, packed: 100 } as const;

type StatusCell = {
	key: string;
	label: string;
	value: string;
	tone: MarkerTone;
	/** Only the offline counting device and the untrusted device recolour the value. */
	danger?: boolean;
	secondary?: string;
	secondaryTone?: "muted" | "delayed" | "error";
};

function Marker({ tone }: { tone: MarkerTone }) {
	return (
		<span className="sboard__marker" data-tone={tone} aria-hidden="true" />
	);
}

function resolveVariant(snapshot: OperationalSnapshot): BoardVariant {
	const { occupancy, health } = snapshot;
	if (occupancy.freshness === "closed") return "closed";
	if (occupancy.freshness === "stale") return "delayed";
	if (occupancy.freshness === "unavailable") {
		// The server owns health availability. A nulled unavailable health block
		// means there is no usable device projection; current/stale health means the
		// device is present but the occupancy reading itself was withdrawn.
		return health.freshness === "unavailable" ? "offline" : "trust";
	}
	return health.camera === "degraded" || health.camera === "failed"
		? "camera"
		: "live";
}

function deviceLabel(
	status: OperationalSnapshot["health"]["camera"],
	messages: StaffMessages,
) {
	return status ? messages.deviceStates[status] : messages.notAvailable;
}

function deviceTone(
	status: OperationalSnapshot["health"]["camera"],
): MarkerTone {
	if (!status || status === "unknown") return "unknown";
	if (status === "ok") return "live";
	if (status === "failed") return "error";
	return "delayed";
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

function buildCells(
	snapshot: OperationalSnapshot,
	variant: BoardVariant,
	messages: StaffMessages,
	locale: "ar" | "en",
): StatusCell[] {
	const { occupancy, health } = snapshot;
	const seen = messages.lastSeen(
		relativeTime(
			health.lastSeenAt,
			snapshot.computedAt,
			locale,
			messages.notAvailable,
		),
	);

	const club: StatusCell =
		occupancy.freshness === "fresh" || occupancy.freshness === "stale"
			? {
					key: "club",
					label: messages.clubState,
					value: messages.openNow,
					tone: "live",
				}
			: occupancy.freshness === "closed"
				? {
						key: "club",
						label: messages.clubState,
						value: messages.closedNow,
						tone: "unknown",
						secondary: occupancy.nextOpenAt
							? messages.nextOpen(
									formatGymTime(
										Date.parse(occupancy.nextOpenAt),
										locale,
										occupancy.timeZone,
									),
								)
							: undefined,
					}
				: {
						// No usable reading means the club state is not evidenced either;
						// the board says unknown rather than inventing "open".
						key: "club",
						label: messages.clubState,
						value: messages.conditions.unknown,
						tone: "unknown",
					};

	const device: StatusCell =
		variant === "delayed"
			? {
					key: "device",
					label: messages.process,
					value: messages.notSendingUpdates,
					tone: "delayed",
				}
			: variant === "offline"
				? {
						key: "device",
						label: messages.process,
						value: messages.deviceOffline,
						tone: "error",
						danger: true,
						secondary: seen,
						secondaryTone: "error",
					}
				: variant === "trust"
					? {
							key: "device",
							label: messages.process,
							value: messages.deviceUntrusted,
							tone: "error",
							danger: true,
							secondary: messages.deviceUntrustedDetail,
							secondaryTone: "error",
						}
					: {
							key: "device",
							label: messages.process,
							value: deviceLabel(health.process, messages),
							tone: deviceTone(health.process),
						};

	const camera: StatusCell =
		variant === "offline"
			? {
					key: "camera",
					label: messages.camera,
					value: messages.conditions.unknown,
					tone: "unknown",
					secondary: messages.cameraViaDevice,
				}
			: variant === "camera" || variant === "trust"
				? {
						key: "camera",
						label: messages.camera,
						value: deviceLabel(health.camera, messages),
						tone: "delayed",
						secondary: seen,
						secondaryTone: "delayed",
					}
				: {
						key: "camera",
						label: messages.camera,
						value: deviceLabel(health.camera, messages),
						tone: deviceTone(health.camera),
					};

	return [club, device, camera];
}

function StatusStrip({ cells }: { cells: StatusCell[] }) {
	const hasSecondary = cells.some((cell) => cell.secondary);
	return (
		<dl
			className="sboard__status"
			data-secondary={hasSecondary ? "true" : undefined}
		>
			{cells.map((cell) => (
				<div className="sboard__cell" key={cell.key}>
					<dt className="sboard__cell-label">{cell.label}</dt>
					<dd
						className="sboard__cell-value"
						data-danger={cell.danger ? "true" : undefined}
					>
						<Marker tone={cell.tone} />
						<bdi>{cell.value}</bdi>
					</dd>
					{cell.secondary ? (
						<dd
							className="sboard__cell-secondary"
							data-tone={cell.secondaryTone ?? "muted"}
						>
							<bdi>{cell.secondary}</bdi>
						</dd>
					) : null}
				</div>
			))}
		</dl>
	);
}

function Notice({ tone, children }: { tone: NoticeTone; children: string }) {
	return (
		<p className="sboard__notice" data-tone={tone}>
			<span className="sboard__notice-marker" aria-hidden="true" />
			<span>{children}</span>
		</p>
	);
}

export function OperationalSnapshotView({ snapshot }: SnapshotViewProps) {
	const { locale } = useI18n();
	const messages = useStaffMessages();
	const staff = messages.staff;
	const { occupancy } = snapshot;
	const variant = resolveVariant(snapshot);
	const hasReading =
		occupancy.freshness === "fresh" || occupancy.freshness === "stale";
	const delayed = variant === "delayed";

	const occupancyStatus =
		occupancy.freshness === "fresh"
			? staff.live
			: occupancy.freshness === "stale"
				? staff.stale
				: occupancy.freshness === "closed"
					? staff.closedNow
					: staff.unavailable;
	const stateAnnouncement =
		occupancy.freshness === "stale"
			? `${staff.stale}. ${staff.staleDescription}`
			: occupancyStatus;

	const notice =
		variant === "delayed"
			? ({ tone: "delayed", text: staff.delayedNotice } as const)
			: variant === "camera"
				? ({ tone: "delayed", text: staff.cameraNotice } as const)
				: variant === "offline"
					? ({ tone: "error", text: staff.offlineNotice } as const)
					: variant === "trust"
						? ({ tone: "error", text: staff.trustNotice } as const)
						: null;

	return (
		<section className="sboard" data-variant={variant} aria-label={staff.title}>
			<p className="fw-sr-only" role="status" aria-live="polite">
				{stateAnnouncement}
			</p>
			<span className="sboard__accent" aria-hidden="true" />
			<div className="sboard__body">
				<div className="sboard__reading">
					{hasReading ? (
						<>
							<div className="sboard__hero">
								<div className="sboard__metric">
									<p className="sboard__eyebrow">
										{delayed ? staff.lastKnownCrowdLevel : staff.crowdLevel}
									</p>
									<p className="sboard__band">
										<bdi>{staff.bands[occupancy.band]}</bdi>
									</p>
									<p className="sboard__freshness">
										<Marker tone={delayed ? "delayed" : "live"} />
										<span
											className="sboard__freshness-state"
											data-tone={delayed ? "delayed" : "live"}
										>
											{delayed ? staff.stale : staff.live}
										</span>
										<span className="sboard__sep" aria-hidden="true">
											·
										</span>
										<span className="sboard__freshness-time">
											{staff.lastUpdated(
												formatGymTime(
													Date.parse(occupancy.lastUpdatedAt),
													locale,
													occupancy.timeZone,
												),
											)}
										</span>
									</p>
								</div>
								<div className="sboard__aside">
									<p className="sboard__count-label">
										{delayed ? staff.lastKnownCount : staff.approximateCount}
									</p>
									<div className="sboard__count-group">
										<p className="sboard__count-value">
											<bdi>{formatNumber(occupancy.count, locale)}</bdi>
										</p>
										<span className="sboard__tick" aria-hidden="true">
											<span
												className="sboard__tick-fill"
												style={
													{
														"--tick-level": `${tickLevel[occupancy.band]}%`,
													} as CSSProperties
												}
											/>
										</span>
									</div>
								</div>
							</div>
							{/* The approved delayed state keeps the instrument identical to the
							    live board — a trusted last-known reading is labelled, never
							    desaturated. So `stale` is deliberately not forwarded here; it
							    would apply the public board's dimmed treatment. Staleness is
							    carried by the eyebrows, the freshness line and the notice, and
							    announced through the board's own live region. */}
							<CrowdSignal
								band={occupancy.band}
								className="sboard__signal"
								showFooter={false}
								ramp={CROWD_SIGNAL_LINEAR_HEIGHTS}
							/>
						</>
					) : variant === "closed" ? (
						<div className="sboard__statement">
							<p className="sboard__eyebrow">{staff.crowdLevel}</p>
							<p className="sboard__statement-value">
								<bdi>{staff.noCurrentReading}</bdi>
							</p>
						</div>
					) : variant === "offline" ? (
						<div className="sboard__statement">
							<p className="sboard__eyebrow" data-tone="error">
								<Marker tone="error" />
								<span>{staff.deviceProblem}</span>
							</p>
							<p className="sboard__statement-value">
								<bdi>{staff.readingUnavailable}</bdi>
							</p>
							<p className="sboard__reason">{staff.deviceOfflineReason}</p>
						</div>
					) : (
						<div className="sboard__hero">
							<div className="sboard__metric">
								<p className="sboard__eyebrow">{staff.crowdLevel}</p>
								<p className="sboard__band">
									<bdi>{staff.notAvailable}</bdi>
								</p>
								<p className="sboard__reason">{staff.trustCrowdReason}</p>
							</div>
							<div className="sboard__aside">
								<p className="sboard__count-label">{staff.approximateCount}</p>
								<div className="sboard__count-group">
									<p className="sboard__count-value" data-withdrawn="true">
										<bdi>{staff.notAvailable}</bdi>
									</p>
								</div>
								<p className="sboard__reason sboard__reason--count">
									{staff.trustCountReason}
								</p>
							</div>
						</div>
					)}
				</div>
				<StatusStrip cells={buildCells(snapshot, variant, staff, locale)} />
				{notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}
			</div>
		</section>
	);
}

function Block({
	className,
	tier,
	style,
}: {
	className?: string;
	tier: "value" | "label" | "bar";
	style?: CSSProperties;
}) {
	return (
		<span
			className={`sboard__skeleton ${className ?? ""}`.trim()}
			data-tier={tier}
			style={style}
		/>
	);
}

export function OperationalSnapshotSkeleton() {
	const messages = useStaffMessages();
	return (
		<section
			className="sboard"
			data-variant="loading"
			aria-busy="true"
			aria-label={messages.staff.title}
		>
			<p className="fw-sr-only" role="status">
				{messages.staff.loading}
			</p>
			<span className="sboard__accent" aria-hidden="true" />
			<div className="sboard__body" aria-hidden="true">
				<div className="sboard__reading">
					<div className="sboard__hero">
						<div className="sboard__metric">
							<Block className="sboard__skeleton--eyebrow" tier="label" />
							<Block className="sboard__skeleton--band" tier="value" />
							<Block className="sboard__skeleton--freshness" tier="bar" />
						</div>
						<div className="sboard__aside">
							<Block className="sboard__skeleton--count-label" tier="label" />
							<div className="sboard__count-group">
								<Block className="sboard__skeleton--count" tier="value" />
								<span className="sboard__tick" data-empty="true" />
							</div>
						</div>
					</div>
					<div className="sboard__signal-skeleton">
						<div className="sboard__skeleton-captions">
							{[36, 44, 46, 64].map((width) => (
								<Block
									key={width}
									tier="label"
									style={{ inlineSize: `${width}px`, blockSize: "13px" }}
								/>
							))}
						</div>
						<div className="sboard__skeleton-wave">
							<Block className="sboard__skeleton--wave" tier="bar" />
						</div>
					</div>
				</div>
				<dl className="sboard__status">
					{["club", "device", "camera"].map((key, index) => (
						<div className="sboard__cell" key={key}>
							<dt>
								<Block
									tier="label"
									style={{
										inlineSize: `${[78, 100, 90][index]}px`,
										blockSize: "16px",
									}}
								/>
							</dt>
							<dd>
								<Block
									tier="value"
									style={{
										inlineSize: `${[96, 56, 72][index]}px`,
										blockSize: "20px",
									}}
								/>
							</dd>
						</div>
					))}
				</dl>
				<p className="sboard__notice" data-tone="loading">
					<span className="sboard__notice-marker" aria-hidden="true" />
					<span>{messages.staff.loadingNotice}</span>
				</p>
			</div>
		</section>
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
	const staff = messages.staff;
	const cells: StatusCell[] = ["clubState", "process", "camera"].map((key) => ({
		key,
		label: staff[key as "clubState" | "process" | "camera"],
		value: staff.conditions.unknown,
		tone: "unknown" as const,
	}));

	return (
		<section
			className="sboard"
			data-variant="failure"
			aria-label={staff.title}
			role="alert"
		>
			<span className="sboard__accent" aria-hidden="true" />
			<div className="sboard__body">
				<div className="sboard__failure">
					<h2 className="sboard__failure-title">{staff.loadErrorTitle}</h2>
					<p className="sboard__failure-body">{staff.loadErrorDescription}</p>
					<button
						type="button"
						className="sboard__retry"
						onClick={onRetry}
						disabled={retrying}
					>
						<span className="sboard__retry-focus">
							<span className="sboard__retry-ink">
								{retrying ? staff.retrying : staff.retry}
							</span>
							<span className="sboard__retry-rule" aria-hidden="true" />
						</span>
					</button>
				</div>
				<StatusStrip cells={cells} />
			</div>
		</section>
	);
}
