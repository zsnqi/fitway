import { formatAlertMessage } from "@fitway/api/alerts/message";
import type { AlertNotifier } from "@fitway/api/alerts/notifier";

export type TelegramAlertNotifierDependencies = {
	botToken: string;
	chatId: string;
	/** Injected so no test and no evaluation path opens an ambient socket. */
	fetch: typeof fetch;
};

/**
 * Every failure path throws exactly this. The endpoint embeds the bot token, so
 * no transport error, response body, or status is ever propagated or attached
 * as a cause — a leaked delivery error would put the credential in the logs.
 */
const DELIVERY_FAILED = "Telegram alert delivery failed";

function accepted(payload: unknown): boolean {
	return (
		typeof payload === "object" &&
		payload !== null &&
		(payload as { ok?: unknown }).ok === true
	);
}

/**
 * Transport half of the Phase 8 alert boundary. The evaluator decides what to
 * send and the repository records the outcome; this only delivers, and reports
 * success or failure. A rejection is mapped by the caller to a durable `failed`
 * delivery row, which is why it must never carry diagnostic detail.
 */
export function createTelegramAlertNotifier(
	dependencies: TelegramAlertNotifierDependencies,
): AlertNotifier {
	if (dependencies.botToken.length === 0) {
		throw new RangeError("Telegram bot token must not be empty");
	}
	if (dependencies.chatId.length === 0) {
		throw new RangeError("Telegram chat id must not be empty");
	}
	const endpoint = `https://api.telegram.org/bot${dependencies.botToken}/sendMessage`;

	return async (notice) => {
		const body = JSON.stringify({
			chat_id: dependencies.chatId,
			text: formatAlertMessage(notice),
		});

		let response: Response;
		try {
			response = await dependencies.fetch(endpoint, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body,
			});
		} catch {
			throw new Error(DELIVERY_FAILED);
		}

		if (!response.ok) throw new Error(DELIVERY_FAILED);

		let payload: unknown;
		try {
			payload = await response.json();
		} catch {
			throw new Error(DELIVERY_FAILED);
		}

		if (!accepted(payload)) throw new Error(DELIVERY_FAILED);
	};
}
