# Phase 11 Uptime mobile fidelity — B2 repair 1 retry 2 transport-incomplete return

- Exact provider process: PID 25792, `opencode-go/glm-5.3-flash`, `high`; terminal exit code 0.
- Operations: one allowed read of `tests/browser/phase11-health.browser.spec.ts`, zero edits, zero other tools.
- Completion: no final text and no `WORKER_RESULT_COMPLETE`; final provider event reason was `length`.
- Source SHA-256 remained `aa3d28a64b5fb9125158ce81b411c24b71316559280404ac77c16d787af3cb86`, exactly the preserved rejected initial B2 candidate.
- Classification: completion-contract/transport failure with no source mutation. It is not a source-quality or review-capability failure, does not consume B2 repair 1, and carries no GLM capability or routing penalty.
- The exact writer lease is closed. After two consecutive zero-edit transport-incomplete returns for this frozen repair, the coordinator must perform a fresh stage-specific route decision rather than relaunching or treating either return as source evidence.
