// Capture review-source placement events for brief-check fixture tests.
import { setReviewSourcePlaceObserver } from "./brief-review-sources.mjs";

export async function captureReviewSourceAccess(action) {
	const accessKey = Symbol.for("fitway.review-source-access-test");
	const events = [];
	const addPlace = (event) => {
		events.push({ ...event, type: "place" });
	};
	Reflect.set(globalThis, accessKey, events);
	setReviewSourcePlaceObserver(addPlace);
	try {
		await action();
	} finally {
		setReviewSourcePlaceObserver(undefined);
		Reflect.deleteProperty(globalThis, accessKey);
	}
	return events;
}
