# Propagation W1 — independent launch-controls review

Verdict: **REQUEST_CHANGES**, coordinator infrastructure only. Native Sol/high reviewer `p11_w1_launch_controls_sol01`; read-only. No provider, preflight, test, server or database was executed. No source/config was edited. No provider breach is established.

Reviewed file: `test-results/node_modules/p11_propagation_glm_w1_20260828/supervisor.mjs`, SHA-256 `3A03A490690C6E069D0AB9223EC080C59561D1E1159FD08934A01576EDCBCC73`, against the frozen W1 packet and installed adapter. The host had refused launch before process creation.

## Blocking findings

1. Lines 142-197 do not enforce current route/high/capacity, approved payload/config hashes, branch identity or live lease expiry. Hashes are recorded but not compared with frozen authority. Effective permission equality and clean HEAD alone are insufficient launch gates.
2. Lines 224-254 capture process output without validating the exact session/route/control, final text, compact length, sentinel, completion identifier or final-text fingerprint. Child failure/timeout does not force a failing supervisor exit. Any return must remain unaccepted until a separate fail-closed validator passes.
3. Lines 218-228 ignore `taskkill` failure and lack cleanup on supervisor interruption. Cancellation does not establish that the child writer terminated.

## Required evidence still missing

- Lines 63-158 do not demonstrate automatic instruction/plugin/skill suppression or exact read/edit confinement in this linked worktree with `external_directory: deny`. No success or leakage may be inferred. Use applicable local non-provider positive/negative controls.
- Lines 231-247 record status and a target hash without enforcing every protected changed/untracked/ignored path and relevant Git metadata invariant.
- Lines 54-60 scan only assembled prompt text, not the subsequently readable full test. Lines 150-151 persist resolved config/stderr without redaction. Review exact frozen inputs and redact potentially sensitive output; no actual secret exposure was found.

No separate minor issue was reported. Coordinator accepts these findings and keeps W1 blocked. Repair and fresh independent review of the harness do not supersede the separate host refusal. GLM provider invocations and implementation-repair consumption remain zero; qualification is unchanged.
