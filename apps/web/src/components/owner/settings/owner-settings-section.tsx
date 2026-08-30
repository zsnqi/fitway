import type { Weekday } from "@fitway/api/occupancy/schedule";
import { useEffect, useRef, useState } from "react";

import { useOwnerDailyAnalytics } from "@/hooks/use-owner-daily-analytics";
import { useOwnerSettings } from "@/hooks/use-owner-settings";
import { useI18n } from "@/i18n/provider";

import { type OwnerSettingsUiState, ownerSettingsMessages } from "./messages";
import {
	buildEditable,
	draftFromSnapshot,
	emptyPrior,
	hasErrors,
	isDirty,
	type OwnerSettingsDraft,
	type OwnerSettingsDraftPrior,
	validateDraft,
} from "./owner-settings-draft";
import { OwnerSettingsView } from "./owner-settings-view";

import "./owner-settings.css";

/**
 * The owner Settings section: the five editable axes of the accepted
 * specification, mounted as a sibling of the existing owner governance
 * sections in the settled daily `/admin` branch.
 *
 * ## One live region and one retry per page
 *
 * Enablement is an explicit property and the shared daily analytics are the
 * page prerequisite. While either is unsettled, the hook stands down
 * (`status: "standby"`) and this section renders nothing — `/admin` is
 * already announcing exactly one loading status or showing exactly one error
 * with one retry, and a second copy of either would be noise for a screen
 * reader and a duplicate control for everyone else (the same standing-down
 * the accepted access section performs on this route).
 *
 * ## Draft lifecycle
 *
 * The draft is a local, lossless copy of the server snapshot with string
 * fields. It resets only when the server snapshot object itself changes — a
 * successful save (the read cache adopts the appended snapshot) or a conflict
 * Discard (an explicit refetch whose server version must differ). Switching
 * locale never touches the snapshot object, so values and the draft survive
 * it intact. Unchecking a day preserves its prior pair only inside the
 * current unsaved draft so rechecking restores it; a persisted closed day
 * starts from empty, required time fields, never from invented defaults.
 */
export function OwnerSettingsSection({ enabled }: { enabled: boolean }) {
	const { locale } = useI18n();
	const messages = ownerSettingsMessages[locale === "ar" ? "ar" : "en"];
	const analytics = useOwnerDailyAnalytics();
	const pageSettled = !analytics.isPending && !analytics.isError;
	const settings = useOwnerSettings({ enabled: enabled && pageSettled });

	const [draft, setDraft] = useState<OwnerSettingsDraft | null>(null);
	const [prior, setPrior] = useState<OwnerSettingsDraftPrior>(emptyPrior);
	const appliedRef = useRef<unknown>(null);
	/**
	 * The one submission controller for both Save presentations. A double-tap
	 * can land two clicks inside one React frame — before the saving state
	 * disables the buttons — so the guard is a ref, not derived state.
	 */
	const saveInFlightRef = useRef(false);

	const snapshot = settings.snapshot;
	// Reset the editing surface whenever a new server snapshot object arrives.
	// The reference is deliberately the key: a refetch that returns a changed
	// version always yields a new object, while a locale switch changes none.
	useEffect(() => {
		if (!snapshot || appliedRef.current === snapshot) return;
		appliedRef.current = snapshot;
		setDraft(draftFromSnapshot(snapshot));
		setPrior(emptyPrior());
	}, [snapshot]);

	// The in-flight guard releases as soon as the save stops being pending,
	// so a retry after an atomic failure stays possible.
	const savePhase = settings.save.outcome.phase;
	useEffect(() => {
		if (savePhase !== "pending") {
			saveInFlightRef.current = false;
		}
	}, [savePhase]);

	if (settings.status === "standby") return null;
	if (settings.status === "pending") {
		return (
			<section className="owner-settings" aria-busy="true">
				<p className="owner-settings__status" role="status">
					{messages.loading}
				</p>
			</section>
		);
	}
	if (settings.status === "error" || !snapshot) {
		return (
			<section className="owner-settings">
				<header className="owner-settings__intro">
					<h2>{messages.errorTitle}</h2>
					<p>{messages.errorDescription}</p>
				</header>
				<button
					type="button"
					className="owner-settings__discard owner-settings__retry"
					onClick={settings.retry}
				>
					{messages.retry}
				</button>
			</section>
		);
	}
	// A successful query and the snapshot-to-draft effect are separate React
	// commits. Keep that short handoff in the loading state instead of flashing
	// a fabricated transport failure before the effect seeds the draft.
	if (!draft) {
		return (
			<section className="owner-settings" aria-busy="true">
				<p className="owner-settings__status" role="status">
					{messages.loading}
				</p>
			</section>
		);
	}

	// Explicit non-null aliases: the handlers below close over these values
	// and must not re-check them on every render.
	const activeSnapshot = snapshot;
	const activeDraft = draft;

	const errors = validateDraft(activeDraft);
	const invalid = hasErrors(errors);
	const dirty = isDirty(activeDraft, draftFromSnapshot(activeSnapshot));

	const saveOutcome = settings.save.outcome;
	const uiState: OwnerSettingsUiState =
		saveOutcome.phase === "pending"
			? "saving"
			: saveOutcome.phase === "conflict"
				? "conflict"
				: !dirty
					? saveOutcome.phase === "success"
						? "saved"
						: "clean"
					: invalid
						? "dirty-invalid"
						: saveOutcome.phase === "failed"
							? "failed"
							: "dirty-valid";

	function clearFailedSaveOutcome() {
		if (saveOutcome.phase === "failed") settings.save.reset();
	}

	function handleFieldChange(patch: Partial<Omit<OwnerSettingsDraft, "days">>) {
		clearFailedSaveOutcome();
		setDraft((current) => (current ? { ...current, ...patch } : current));
	}

	function handleDayTimeChange(
		day: Weekday,
		field: "open" | "close",
		value: string,
	) {
		clearFailedSaveOutcome();
		setDraft((current) => {
			if (!current) return current;
			const pair = current.days[day];
			if (pair === null) return current;
			return {
				...current,
				days: { ...current.days, [day]: { ...pair, [field]: value } },
			};
		});
	}

	function handleDayToggle(day: Weekday, nextOpen: boolean) {
		if (!draft) return;
		clearFailedSaveOutcome();
		const currentPair = draft.days[day];
		if (nextOpen) {
			// A persisted closed day has no prior pair: it starts empty and
			// required, never with invented defaults.
			const restored = currentPair ?? prior[day] ?? { open: "", close: "" };
			setDraft({ ...draft, days: { ...draft.days, [day]: restored } });
			return;
		}
		if (currentPair) {
			// The prior pair survives only inside the current unsaved draft.
			setPrior((current) => ({ ...current, [day]: currentPair }));
		}
		setDraft({ ...draft, days: { ...draft.days, [day]: null } });
	}

	function handleSave() {
		if (saveInFlightRef.current) return;
		const editable = buildEditable(activeDraft);
		if (!editable || invalid || !dirty) return;
		saveInFlightRef.current = true;
		settings.save.submit({ expectedVersion: activeSnapshot.version, editable });
	}

	function handleDiscard() {
		if (saveOutcome.phase === "conflict") {
			// Reload latest server values explicitly; never silently rebase or
			// overwrite. The snapshot effect restores the draft from whatever
			// the server returns.
			void settings.reload().then(() => settings.save.reset());
			return;
		}
		setDraft(draftFromSnapshot(activeSnapshot));
		setPrior(emptyPrior());
		settings.save.reset();
	}

	return (
		<OwnerSettingsView
			messages={messages}
			state={uiState}
			snapshot={activeSnapshot}
			draft={activeDraft}
			errors={errors}
			savedVersion={
				uiState === "saved" && saveOutcome.phase === "success"
					? saveOutcome.output.settings.version
					: null
			}
			onFieldChange={handleFieldChange}
			onDayToggle={handleDayToggle}
			onDayTimeChange={handleDayTimeChange}
			onSave={handleSave}
			onDiscard={handleDiscard}
		/>
	);
}
