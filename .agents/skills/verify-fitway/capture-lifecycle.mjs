// The capture lifecycle drive and frames share: the page origin, the browser, the abort on
// SIGINT or SIGTERM that closes both, and the final close.
import { ownedSession, preview } from "./core.mjs";

// The origin comes from the caller's own runtime, an owned session, or this command's preview.
async function captureOrigin(settings, owned) {
	if (settings.origin) return settings.origin();
	if (settings.session) {
		const session = await ownedSession(settings.session);
		if (session.concept !== settings.concept)
			throw new Error("Session serves another concept");
		return `http://127.0.0.1:${session.port}`;
	}
	owned.server = await preview({
		concept: settings.concept,
		port: settings.port,
		cache: settings.cache || "no-store",
	});
	return owned.server.origin;
}

// Opening arms the abort; start() resolves the origin (only when `http` is set), opens the
// browser with `launch` and returns both with cancelled(); close() closes both and disarms the
// abort. `keepBrowser` leaves a browser the caller's runtime owns open at close, though an
// abort still closes it.
export function openCaptureLifecycle(settings) {
	const owned = {};
	let cancelled = false;
	const abort = () => {
		cancelled = true;
		owned.browser?.close().catch(() => undefined);
		owned.server?.close().catch(() => undefined);
	};
	process.once("SIGINT", abort);
	process.once("SIGTERM", abort);
	const isCancelled = () => cancelled;
	return {
		cancelled: isCancelled,
		async start() {
			const origin = settings.http
				? await captureOrigin(settings, owned)
				: undefined;
			owned.browser = await settings.launch();
			return { origin, browser: owned.browser, cancelled: isCancelled };
		},
		async close() {
			await Promise.allSettled([
				settings.keepBrowser ? undefined : owned.browser?.close(),
				owned.server?.close(),
			]);
			process.removeListener("SIGINT", abort);
			process.removeListener("SIGTERM", abort);
		},
	};
}
