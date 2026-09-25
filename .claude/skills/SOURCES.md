# Vendored skills: where they come from

These skills are committed so that Claude Code cloud sessions, which see only committed files, have them. They
are copies taken on 2026-09-25, and their licences travel with them.

**The only change is whitespace.** Trailing whitespace and final blank lines were removed from four Markdown
files, 27 lines in all, so that the repository's `git diff --check` invariant passes. The files are
`impeccable/reference/extract.md`, `harden.md` and `optimize.md`, and
`ux-araby/references/arabic-huroof-reference.md`. No wording changed. Biome excludes this folder
(`biome.json`), so its code is never reformatted.

| Skill | Source | Version | Licence |
| --- | --- | --- | --- |
| `impeccable/` | the Claude Code plugin `impeccable` from the marketplace `pbakaus/impeccable` (https://github.com/pbakaus/impeccable) | 4.3.1 | Apache-2.0 (`impeccable/LICENSE`, `impeccable/NOTICE.md`) |
| `ux-araby/` | the user's local skill set (`~/.agents/skills/ux-araby`) | as installed | MIT (`ux-araby/LICENSE`) |

**Impeccable's shipped agents.** The skill calls them by name. They are copied from the same plugin, unmodified,
to `../agents/`:
- `impeccable-asset-producer`;
- `impeccable-documenter`;
- `impeccable-finish-reviewer`;
- `impeccable-manual-edit-applier`.

**The Impeccable engine is not included.** `impeccable/scripts/impeccable` launches a platform binary. It looks,
in order, at `$IMPECCABLE_BIN`, a sibling `bin/<os>-<arch>/`, `~/.impeccable/bin/`, a version-pinned cache,
and `impeccable` on the PATH. A cloud session must make that binary available, or the user decides an
exception, before `pnpm check:design-context` can pass there.

**Policy.** `AGENTS.md` names Impeccable as FITWAY's single broad design skill, so no competing design or taste
skill is vendored here. `ux-araby` is for writing Arabic interface copy, not visual design. Nothing in `.claude/`
is normative (see `CLAUDE.md`).
