import type { AlertNotice } from "./types";

/**
 * Transport boundary for Phase 8. The evaluator produces notices; the caller
 * provides this one-function boundary and records both success and failure.
 */
export type AlertNotifier = (notice: AlertNotice) => Promise<void>;
