/**
 * The inclusive business-day bound the two non-streaming reporting read leaves accept.
 *
 * It is a transport resource bound, not a reporting semantic: the frozen range contract
 * carries a full per-minute timeline for every day in the window, so an unbounded window
 * would materialise an unbounded response. A month covers the weekday-by-hour heatmap the
 * owner reads — four samples for every weekday. The streamed CSV export keeps its own, far
 * wider `CSV_MAX_RANGE_DAYS`, which is exactly why it streams and these do not.
 *
 * It lives in its own module rather than beside the procedures because the owner surface
 * must state the same bound in its range control, and importing `queries.ts` from the web
 * bundle would drag `@orpc/server` and every procedure definition in with it. Nothing here
 * imports the server; this file is a constant and stays one.
 */
export const REPORTING_QUERY_MAX_RANGE_DAYS = 31;
