import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const MILESTONE = "fixture-r01";
export const PACKET = `docs/phase-records/task-packets/${MILESTONE}.yaml`;
export const HANDOFF = "docs/phase-records/handoffs/fixture/old.md";
export const NOW = "2026-10-02T20:40:12+03:00";
export const TEMPLATE = readFileSync(
	fileURLToPath(
		new URL("../../docs/agent-context/HANDOFF_TEMPLATE.md", import.meta.url),
	),
	"utf8",
);
const templateBlock = TEMPLATE.match(
	/<!-- template:start -->\r?\n([\s\S]*?)<!-- template:end -->/,
)?.[1];
if (!templateBlock) throw new Error("Missing real handoff template block");
export const MARKED = templateBlock.replaceAll("<milestone-id>", MILESTONE);

export function put(root: string, file: string, text: string | Buffer) {
	const absolute = path.resolve(root, file);
	mkdirSync(path.dirname(absolute), { recursive: true });
	writeFileSync(absolute, text);
}

export function fixture(roots: string[], marked = false) {
	const root = mkdtempSync(
		path.join(tmpdir(), "fitway-agent-environment-test-"),
	);
	roots.push(root);
	const packet = `# Packet comments and spelling stay untouched.\nschemaVersion: 1\nmilestoneId: ${MILESTONE}\ntaskClass: repository-infrastructure\npacketStatus: READY\nstateRef: PROJECT_STATE.yaml#/milestones/${MILESTONE}\nbaseCommit: a1b2c3d\nscope:\n  ownedPaths: [scripts/agent-environment/**]\n  forbiddenPaths: [apps/**]\n  sharedLeases: []\ncontinuity:\n  currentHandoff: "${HANDOFF}" # Keep this comment.\n  unresolvedDecisions: []\n  predecessorMilestones: []\nauthorities:\n  required: []\n  conditional: []\n`;
	const hash = createHash("sha256")
		.update(packet.replaceAll("\n", "\r\n"))
		.digest("hex");
	const state = `# Ledger comments and line endings stay untouched.\nschemaVersion: 2\nupdatedAt: '2026-10-01T10:00:00+03:00' # Top-level comment.\ncoordinator: {owner: coordinator}\nmilestones:\n  ${MILESTONE}:\n    status: IN_PROGRESS\n    taskClass: repository-infrastructure\n    taskPacket: ${PACKET}\n    taskPacketSha256: '${hash}' # Hash comment.\n    baseCommit: a1b2c3d\n    branch: feature/resume\n    ownerSession: coordinator:fixture\n    ownedPaths: [scripts/agent-environment/**]\n    forbiddenPaths: [apps/**]\n    sharedLeases: []\n    handoff: '${HANDOFF}' # Pointer comment.\n    lastHeartbeatAt: 2026-10-01T10:00:00+03:00\n    leaseExpiresAt: "2026-10-04T10:00:00+03:00"\n  other-r01:\n    status: PLANNED\n    handoff: null\n    taskPacketSha256: deadbeef\n`;
	put(root, "PROJECT_STATE.yaml", state.replaceAll("\n", "\r\n"));
	put(root, PACKET, packet.replaceAll("\n", "\r\n"));
	put(root, HANDOFF, marked ? MARKED : "# Legacy handoff\nOld narrative.\n");
	put(root, "docs/agent-context/HANDOFF_TEMPLATE.md", TEMPLATE);
	put(
		root,
		"docs/agent-context/ROUTES.yaml",
		"mode: active\nroutes:\n  repository-infrastructure:\n    responsibility: Fixture tooling\n",
	);
	return {
		root,
		hash,
		state: state.replaceAll("\n", "\r\n"),
		packet: packet.replaceAll("\n", "\r\n"),
	};
}

export function git(root: string, ...args: string[]) {
	return execFileSync("git", args, {
		cwd: root,
		encoding: "utf8",
		windowsHide: true,
		stdio: ["ignore", "pipe", "pipe"],
	}).trim();
}

export function gitFixture(root: string, behind = false) {
	git(root, "init", "--initial-branch=feature/resume");
	git(root, "config", "user.name", "Fixture");
	git(root, "config", "user.email", "fixture@example.invalid");
	git(root, "config", "commit.gpgsign", "false");
	git(root, "config", "core.hooksPath", path.join(root, "empty-hooks"));
	git(root, "commit", "--allow-empty", "-m", "first");
	if (behind) {
		git(root, "commit", "--allow-empty", "-m", "upstream");
		git(root, "update-ref", "refs/remotes/origin/main", "HEAD");
		git(root, "reset", "--soft", "HEAD~1");
	} else git(root, "update-ref", "refs/remotes/origin/main", "HEAD");
	git(
		root,
		"config",
		"remote.origin.url",
		"https://example.invalid/no-network",
	);
	git(
		root,
		"config",
		"remote.origin.fetch",
		"+refs/heads/*:refs/remotes/origin/*",
	);
	git(root, "config", "branch.feature/resume.remote", "origin");
	git(root, "config", "branch.feature/resume.merge", "refs/heads/main");
}
