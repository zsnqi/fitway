# agent-environment-r03: the environment audit

Saved 2026-10-07, before the first removal (packet criterion 1). Four read-only audits fed it. Their full reports
are machine-local, saved verbatim by the coordinator:
- A, rules and policy: `D:/fitway-temp/env-audit-a/REPORT.md`
- B, tools and checks: `D:/fitway-temp/env-audit-b/REPORT.md`
- C, work records: `D:/fitway-temp/env-audit-c/REPORT.md`
- D, machine and git: `D:/fitway-temp/env-audit-d/REPORT.md`

Each line below says what was found, the class (keep, merge, replace, remove), and the round that closes it. Locked
product, security, privacy, content, accessibility, visual-authority and data-semantic rules are out of scope and
stay as written.

## What the evidence says

- **CI mostly failed on its own records.** 171 of the 182 CI runs from 2026-10-02 to 2026-10-07 failed, and 164 of
  the 170 classified failures came from record rules, none from product code (C §3):
  - 133 from the resume-point checker judging machine-local paths;
  - 21 from the resume-point section order;
  - 10 from leases compared with the wall clock.
- **Leases were ceremony with a deadline.** 50 of 64 ledger commits renewed a lease, and nothing reads
  `lastHeartbeatAt` (C1). The active leases ended between 2026-10-10 and 2026-10-14; after that, CI would fail on any branch carrying them.
- **Rules live in several homes and conflict.** 14 conflicting pairs (A §1), for example push permission
  (WORKFLOW against the trunk rule), the lease handling, the resume file name, and the Codex usage-limit check.
  Most process rules sit in 3 to 5 places (A1-A3, A14, A24, A43).
- **The verification tools were rebuilt every round.** 774 round scripts in 57 temp folders; 45 copies of a server;
  the Eclipse probe kit and ui-forensics unused outside their own tests (B §4, B49).
- **The machine carries about 82 GB of leftovers:**
  - `D:/fitway-temp` 47 GB, including 814 `.tmp*` folders, Playwright profiles and five 2-5 GB held-out run copies;
  - D:/fitway-scratch 17.7 GB and D:/codex-worktrees-archive 16.7 GB;
  - 4 dead worktree registrations and 15 merged local branches (D).
- **No gardener existed** (DECISIONS item 16).

## Decisions

### CI and checks

| Item | Finding | Class | Round |
| --- | --- | --- | --- |
| Lease check (A8, C1) | wall clock fails old commits | replace: judged against the ledger's `updatedAt` | R1, done |
| Resume and brief path checker (C §3) | machine-local paths judged; a remote branch needs its `origin/` prefix | replace: only repository paths are judged; a remote branch counts by its plain name | R1, done |
| `check-agent-context` in CI (B3) | runs twice: on its own and inside `verify-repository` | remove the separate step | R1, done |
| Biome scope (B16, B26) | CI linted 3 folders; `biome check .` failed on design-research concepts | replace: `biome ci .`, design-research and machine-local config excluded | R1, done |
| `check-owner-tokens` (B5) | in the local ladder only | add to CI | R1, done |
| CI job (B24) | no concurrency or timeout | replace: one group per ref, 20 minutes | R1, done |
| Types, all unit tests, edge Python tests (B §1) | local only; unit tests need placeholder env | add to CI with the placeholders built in | R2 |
| `check:frontier` (B4, A52, C15) | guards a 2026-09-15 dirty-tree snapshot; fails on any dirty tree | remove the check, keep its evidence files | R2 (the classifier has refused edits to it: the user's word may be needed) |
| `check:test-runtime` (B7) | a retired gate that AGENTS.md still names | remove it and its mentions | R2 |
| `vitest-runtime.bootstrap.test.mjs` (B8) | nothing runs it | run it with `node --test` in CI, or delete it | R2 |
| `verify.mjs` phase profiles (B1) | 31 profiles, many for closed phases | remove the closed ones | R2 |

### Records

| Item | Finding | Class | Round |
| --- | --- | --- | --- |
| Closure by succession (C §4) | no terminal status fits a milestone carried by a successor; 33 history entries overloaded FAILED_VALIDATION or NEEDS_HUMAN for it | add `SUPERSEDED` with `supersededBy`; close agent-environment-r02 with it | R2 |
| Resume points (A35, C8) | a new timestamped file each time; only the newest is read; 26 files | replace: one resume file per milestone, edited in place, git history as the chain | R2 |
| `lastHeartbeatAt` and leases (C1) | heartbeat read by nothing; leases renewed by hand | remove the heartbeat; a lease becomes an advisory note | R2 |
| `taskPacketSha256` pin and duplicated scope (C6) | re-pinned on every packet edit; scope copied into the ledger | remove the pin; scope lives in the ledger, the packet keeps authorities and verification | R2 |
| History receipts (C5) | recomputed from the history file; prove nothing git does not | stop writing new ones; the closing commit is the record; the 12 stay frozen | R2 |
| `HISTORY_POINTER_EXCEPTIONS.yaml` (C13) | exists to excuse dead pointers | remove with its check for closed records | R2 |
| Evidence-receipt template and field (C14) | required, never used | remove; packets keep `requiredArtifacts` | R2 |
| DECISIONS files (A36, C9) | logs, not decisions in force; process rules mixed in | each keeps an "in force" list; process rules move to WORKING_AGREEMENTS and the briefs | R3 |
| codex-rounds.md (C10) | no script reads it | keep: it is the eval log of the user's grading method | none |

### Rules

| Item | Finding | Class | Round |
| --- | --- | --- | --- |
| Startup, ownership, state machine, repair, verification (A1-A3, A11, A14) | 3 to 5 homes each | merge: AGENTS.md holds each once; WORKFLOW and the README point to it | R3 |
| Push and trunk (A46, C2) | WORKFLOW forbids pushing; the trunk rule requires it | replace: the coordinator pushes working branches, never forces, and fast-forwards main on green CI | R3 |
| Conflicts C1, C3-C14 (A §1) | | resolve each, keeping the newer user decision | R3 |
| Stale text (A §2) | the compatibility fallback, BRG and `SELF` as the base, the responsibility map, CLAUDE.md's trial labels | remove | R3 |
| Brief rules B1-B10 and verifier rules G1-G5 (A31, A32) | in an Owner decisions file; B8 and B9 missing from the template | B1-B10 into the Codex brief template; G5 into the environment block; G1-G4 into the verify-fitway skill | R3 and R4 |
| Memory notes that restate the repository (A §4) | caches, some stale | trim the user's machine-local memory to machine facts | R3 |

### Tools

| Item | Finding | Class | Round |
| --- | --- | --- | --- |
| Verification paved path (B §4) | ui-forensics, the probe kit, 8 Eclipse capture scripts and round scripts overlap | ui-forensics is the engine; a repository CLI with the generated feature map drives it | R4 |
| Eclipse capture scripts (B44, B45) | one per page or round, each with its own server | retire once the CLI covers them (they belong to owner-design-exploration-r04) | after R4 |
| `scripts/owner-review.ts` (B13) | serves the pre-Eclipse Owner; nothing names it | retire or re-aim with the product milestone (outside this milestone's paths) | later |
| Codex launch (A29, C14) | hand-built; the allow rule exists in one worktree only | one launch command with the resume procedure and `brief:check` | R4 |

### Machine and git

| Item | Finding | Class | Round |
| --- | --- | --- | --- |
| Dead worktree registrations (D §1) | 4 point at missing folders | prune | R1-machine |
| Merged local branches (D §2) | 15 merged and named by no record | delete | R1-machine |
| agent-environment-r01 worktree | merged, clean, closed | remove | R1-machine |
| `D:/fitway-temp` (D §3) | 47 GB; temp and Playwright leftovers; held-out run copies | sweep the leftovers; keep REPORT files and anything a record names | R1-machine |
| eval worktrees (D §1) | C4 and C5 may still need them | keep until the evaluation loop decides | later |
| D:/fitway-scratch, D:/codex-worktrees-archive, C: Codex sessions (7 GB) | untracked records and the user's history | the user decides | ask once |

### Gardener

The design is DECISIONS item 16. Each pass leaves one rolling report and a line in the ledger, not a milestone (C §5,
item 9). It is built last, in R5, so its first pass checks the cleaned environment.

## Rounds

- **R1:** CI stops failing on its own records, plus the machine sweep. The code part is done in this commit.
- **R2:** the record model (`SUPERSEDED` and the r02 closure, one resume file, no heartbeat, pin or receipts), CI
  completed, legacy checks removed.
- **R3:** one home for each rule, the conflicts resolved, stale text removed, the memory trimmed.
- **R4:** the verification path of r04 DECISIONS item 40 and the Codex launch command.
- **R5:** the gardener and its first pass, then the closing review.
