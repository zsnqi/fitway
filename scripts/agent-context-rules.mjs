// Agent-context status, class, path, and size rules.

export const AGENTS_INSTRUCTION_CAP_BYTES = 120_000;
// Conservative growth warning well below the documented cumulative instruction cap. It is a
// warning only: a routing invariant or the documented cap itself is what fails.
export const AGENTS_INSTRUCTION_WARN_BYTES = 24_000;
export const OPEN_STATUSES = new Set([
	"PLANNED",
	"READY",
	"IN_PROGRESS",
	"VALIDATING",
	"READY_FOR_INTEGRATION",
]);
export const TERMINAL_STATUSES = new Set([
	"DONE",
	"BLOCKED",
	"NEEDS_HUMAN",
	"FAILED_VALIDATION",
	"SUPERSEDED",
]);
export const TASK_CLASSES = [
	"backend-api-data",
	"ui-maintenance",
	"visual-authority-change",
	"repository-infrastructure",
];

const CONTEXT_FILES = [
	"AGENTS.md",
	"PROJECT_STATE.yaml",
	"PROJECT_STATE_HISTORY.yaml",
	"docs/agent-context/README.md",
	"docs/agent-context/ROUTES.yaml",
	"docs/agent-context/TASK_PACKET_TEMPLATE.yaml",
	"docs/schemas/agent-context-routes.schema.json",
	"docs/schemas/task-packet.schema.json",
];
const HISTORY_FILE = "PROJECT_STATE_HISTORY.yaml";
const PACKET_DIRECTORY = "docs/phase-records/task-packets";
const UI_TASK_CLASSES = new Set(["ui-maintenance", "visual-authority-change"]);

export { CONTEXT_FILES, HISTORY_FILE, PACKET_DIRECTORY, UI_TASK_CLASSES };
