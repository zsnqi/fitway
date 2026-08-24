# Owner Access — repository conformance map

- Parent run: `p11_remaining_coord01`.
- Route: external `deepseek-v4-pro` / high, read-only.
- Session: `ses_fca837608ffeu43hhE5Z26Kdsv`, exit `0`, final sentinel `END-OF-MAP`.
- Worker verdict: `ALREADY_CONFORMANT`.
- Parent gate: `PASS_WITH_CORRECTION`.
- Worktree boundary: clean before and after; HEAD stayed `fb05a52`; route boundary ancestor confirmed.

## Accepted repository facts

- Create owner already renders an `Initial password` field and submits the owner-entered password with email and display name.
- Reset credential already renders a new-password field and submits that owner-entered password for the selected principal.
- Both owner operations parse the secret-free access mutation output. It contains only audit identity, principal state, and revoked-session count.
- The only reveal path is the staff-PIN flow. Owner create/reset do not populate or render it.
- The server hashes the owner-entered password before repository persistence; the repository receives only hash and salt.
- English and Arabic helper copy explicitly states the owner password is stored only as a hash and is never shown again.

## Parent correction

The frozen Paper candidate currently depicts both password and confirmation values. The active product decision requires a user-entered password but does not add confirmation, and the repository intentionally has one password field. A confirmation field could be client-local rather than a transport schema change, so the worker's schema-stop inference is too broad. It would nevertheless be a new interaction behavior outside the locked decision. The Paper candidate therefore needs one bounded repair: remove confirmation from the create/reset cards and retain the single masked user-entered password field plus the secret-free success state.

## Implementation consequence

No repository writer is justified for the Access behavior correction. The existing candidate is already conformant on the locked password and secret-free boundaries. After the Paper repair is independently accepted, Access moves directly to candidate freeze, fresh independent verification, coordinator baseline acceptance, and serialized integration. Existing tests still require execution in the restored toolchain; this map does not claim a verification pass.
