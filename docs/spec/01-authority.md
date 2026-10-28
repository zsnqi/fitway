<!-- Part of SPEC.md; the index and the rule for editing are in SPEC.md at the repository root. -->

## Implementation authority and fidelity contract

Production baseline reconciliation and implementation phases are complete. This contract governs the shipped product and maintenance. It does not close concept-only Owner exploration authorized by ADR-009 and a named human decision, and the Public redesign under ADR-010 (typography: Readex Pro, dark-only); concepts change neither this contract nor production until separately approved. The following contract governed
the implementation phases and remains the conformance boundary for maintenance or later changes:

- Hard product, security, privacy, content, accessibility, and data-semantic decisions remain
  binding. A material proposal to change one must be surfaced explicitly before implementation;
  it must never be changed silently through UI or technical convenience.
- The approved FITWAY theme and manifest are the production visual baseline. Concept-only Owner
  exploration, and the Public redesign under ADR-010 (typography: Readex Pro, dark-only), may
  vary visual direction under their active human-authorized packets without changing
  production. G1B and the final Claude
  Design product family remain historical lineage only where the manifest says they apply.
  Implementation may improve composition, hierarchy, spacing,
  typography, responsive/mobile behavior, motion, interaction, charts, tables, accessibility,
  and real-browser quality while retaining FITWAY's identity and locked semantics.
- Design-only annotations, preview labels, demo notices, a demo state switch (hidden or not),
  fake owner/email values, arbitrary
  identities, fixture data, and other mockup-only content must not ship.
- Staff authentication is PIN-based using the signed HttpOnly session model, not
  email/password. The removed scaffold login and the archive's fake email form are historical
  implementation inputs, not product authority.
- Preserve the capacity-free public schema-version-2 contract. The shipped page keeps the
  approved Arabic Public Live composition with its 28-bar signal until the Public redesign is
  promoted; the redesign's composition is set by its approved concept.
  English LTR must be naturally composed rather than mechanically mirrored from Arabic.
- Correct wrapping, RTL/Bidi isolation, Western-digit number and gym-time formatting,
  overflow, responsive tables, mobile operational density, keyboard behavior, reduced motion,
  and loading/stale/unavailable/error semantics before a surface can be accepted.
- The current Design Guide and approval manifest govern shipped production layout. Owner concept-only exploration, and the Public redesign under ADR-010 (typography: Readex Pro, dark-only), follow their active human-authorized envelopes. The historical Claude
  Analytics PNG preserves occupancy-curve behavior lineage only; `DESIGN_GUIDE.md` §12 defines
  normative chart interaction, accessibility, RTL, formatting, and reduced-motion rules.

---

