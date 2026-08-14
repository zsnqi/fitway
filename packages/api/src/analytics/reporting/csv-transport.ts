import { eventIterator } from "@orpc/server";

import { ORPCError, ownerProcedure } from "../../index";
import {
	csvRangeInputSchema,
	reportingCsvChunkOutputSchema,
} from "./contracts";

async function* forwardCsvChunks(
	source: AsyncIterable<string>,
	signal?: AbortSignal,
) {
	const iterator = source[Symbol.asyncIterator]();
	let completed = false;
	let hasPrimary = false;
	let primaryError: unknown;
	let cleanupError: unknown;
	let closePromise: Promise<unknown> | undefined;
	const close = () => {
		if (!closePromise) {
			closePromise = iterator.return
				? Promise.resolve(iterator.return())
				: Promise.resolve();
		}
		return closePromise;
	};
	const onAbort = () => {
		void close().catch(() => undefined);
	};
	signal?.addEventListener("abort", onAbort, { once: true });
	try {
		while (!signal?.aborted) {
			const result = await iterator.next();
			if (result.done) {
				completed = true;
				return;
			}
			if (signal?.aborted) return;
			yield result.value;
		}
	} catch (error) {
		hasPrimary = true;
		primaryError = error;
	} finally {
		signal?.removeEventListener("abort", onAbort);
		if (!completed) {
			cleanupError = await close().then(
				() => undefined,
				(error: unknown) => error,
			);
		}
	}
	if (hasPrimary) throw primaryError;
	if (cleanupError !== undefined) throw cleanupError;
}

export const adminAnalyticsCsv = ownerProcedure
	.input(csvRangeInputSchema)
	.output(eventIterator(reportingCsvChunkOutputSchema))
	.handler(({ context, input, signal }) => {
		if (!context.streamCsv) {
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}
		return forwardCsvChunks(context.streamCsv(input, signal), signal);
	});
