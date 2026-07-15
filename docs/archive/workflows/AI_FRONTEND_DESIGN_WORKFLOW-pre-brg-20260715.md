# AI Frontend Design Workflow

> **ARCHIVED 2026-07-15 — NON-AUTHORITATIVE.** Exploration is complete. Durable FITWAY rules
> moved to `AGENTS.md`, `DESIGN_GUIDE.md`, and `docs/WORKFLOW.md`.
## Lessons from Samtah Hospital Portal and the recommended workflow for Fitway and future projects

**Prepared for:** حسين
**Research snapshot:** July 2026
**Purpose:** Preserve the key lessons from the Samtah portal UI work and establish a repeatable workflow for producing strong, non-generic interfaces with AI coding and design agents.

> **FITWAY status update (2026-07-14):** VDG-A is complete. Its approved references are
> indexed in `visual-direction-gate/approved/`; VDG-B is the next visual gate. Binding product,
> security, privacy, content, accessibility, and data semantics outrank visual artifacts. The
> references guide visual direction without imposing blind pixel copying or mockup-only content.

---

# 1. Executive summary

The Samtah portal proved that a project can have:

- a strong codebase
- clear requirements
- excellent security and accessibility
- successful automated tests
- a detailed design guide
- good RTL support
- reliable agents and review loops

…and still end with an interface that feels visually weak, generic, flat, or lifeless.

The missing element was not “a stronger model” or “a longer prompt.”

The missing element was:

> **An approved visual north star before implementation spread across the product.**

A written design guide defines rules, tokens, colors, typography, and principles. It does not fully define the final composition of a real screen.

For future projects, the workflow must separate:

1. Product definition
2. Visual exploration
3. Human approval
4. Visual vertical slice
5. Design-system extraction
6. Feature implementation
7. Screenshot-based verification
8. Fresh visual audit

The most important policy:

> **Agents must not invent the final UI while implementing feature phases.**

They should implement an already approved visual system.

---

# 2. Why the Samtah interface was not excellent from the first attempt

## 2.1 A design guide is not the same as a final design

`DESIGN_GUIDE.md` was useful and necessary. It defined:

- brand colors
- spacing
- type scales
- light and dark tokens
- radii
- shadows
- component behavior
- accessibility requirements
- RTL rules

But it did not fully answer:

- What exact composition should the home page use?
- How wide should the rail feel relative to the content?
- Should category navigation look like cards, rows, bands, or grouped sections?
- What is the correct information density?
- Where is the main visual focus?
- How should long Arabic labels behave in realistic layouts?
- What makes the page feel alive without becoming decorative?
- What visual outcome is unacceptable even if all tokens are technically correct?

Two designers can follow the same design guide and still produce very different interfaces.

A guide defines the language. It does not always define the final sentence.

## 2.2 The project had a brand reference, but not a product-interface reference

The Health Holding website was useful for:

- logo treatment
- color relationships
- brand tone
- typography character
- motion restraint
- visual identity

But it is a public marketing website, not an internal operational portal.

It does not define:

- dense admin tables
- credential cards
- internal search
- system cards
- shared-PC layouts
- long Arabic content
- RTL data islands
- 1366×768 operational screens

The agent had to invent that layer.

Future projects need three separate reference groups:

1. **Brand references**
   - logo
   - colors
   - typography
   - overall tone

2. **Product-layout references**
   - high-quality operational products
   - internal tools
   - dashboards
   - navigation patterns
   - dense forms and tables

3. **Approved project mockups**
   - the exact visual direction for the current product

## 2.3 Implementation spread before visual approval

The project added functionality phase by phase:

- navigation
- search
- cards
- credentials
- media
- admin pages
- tables
- forms
- dark mode
- flyouts

Each phase introduced more visual decisions.

By the time the UI was reviewed holistically, many components and layout habits were already established.

The agents then performed local polish:

- improve one card
- adjust one flyout
- add one gradient
- refine one theme
- fix one alignment

This improves the current direction, but does not necessarily replace it with a better direction.

This is visual anchoring.

The proper solution is to approve a **visual vertical slice** early, before the same design language spreads across the full project.

## 2.4 Automated tests prove correctness, not taste

The project correctly verified:

- build
- type safety
- accessibility
- keyboard navigation
- RTL
- reduced motion
- overflow
- zero egress
- theme persistence
- responsive behavior
- security

These tests cannot reliably determine that:

- the interface feels lifeless
- visual hierarchy is weak
- density is wrong
- card layouts are generic
- spacing feels awkward
- the dark theme is visually muddy
- the page lacks a clear focus
- the brand is not expressed convincingly

A product can be technically excellent and aesthetically weak.

Visual quality requires:

- approved references
- rendered inspection
- screenshot comparison
- human judgment

---

# 3. Core rule for future projects

For any project where UI quality matters:

```text
Do not let the implementation agent invent the final visual direction.
```

Instead:

```text
Research
→ Product brief
→ Visual references
→ Multiple visual directions
→ Human approval
→ Approved mockups
→ Visual vertical slice
→ Design-system extraction
→ Feature implementation
→ Screenshot comparison
→ Fresh visual audit
```

---

# 4. Do new OpenAI models still need frontend-design skills?

## Answer

**Yes, but the role of skills has changed.**

Newer models such as the current Codex and ChatGPT model families are better at:

- layout
- hierarchy
- component design
- visual judgment
- responsive implementation
- frontend code quality

But they still do not automatically know the exact product in the user’s mind.

A stronger model reduces the amount of guidance needed. It does not replace:

- visual references
- approved composition
- browser inspection
- realistic content
- screenshot comparison
- human approval

## What a frontend skill actually provides

A good skill is not magical extra intelligence.

It provides:

- a compressed workflow
- a checklist
- anti-patterns
- design priorities
- a repeatable review method
- guidance against generic AI layouts
- rules for hierarchy, density, motion, and restraint

The model provides reasoning and implementation.

The skill provides a disciplined process.

---

# 5. Do not stack many design skills at once

Avoid loading several competing design skills in one session, such as:

- frontend-design
- taste-skill
- impeccable
- hallmark
- multiple visual-design packs

This can create:

- conflicting design philosophies
- excessive context
- unclear priorities
- generic compromise
- inconsistent output
- unnecessary token/tool cost

## Recommended rule

Use:

- **one design skill** during visual exploration
- **one browser or Playwright skill** during implementation verification
- **one audit skill** during the final independent review, only when useful

Do not use every available skill because it exists.

---

# 6. Recommended skills and when to use them

## 6.1 Official OpenAI frontend skill

Best baseline when using Codex/OpenAI models for:

- a new interface
- a major visual redesign
- creating multiple directions
- defining hierarchy and composition
- avoiding generic card mosaics
- distinguishing app UI from marketing UI

Use it during design exploration.

Do not use it to reopen an approved direction during implementation. The reference governs
unlocked visual choices, while binding product/security/content/data decisions and verified
real-browser accessibility remain authoritative; improve the execution rather than blindly
copying pixels.

## 6.2 Impeccable

Useful for an existing product that needs structured improvement.

Strong workflow concepts include:

```text
shape
→ critique
→ implement
→ harden
→ polish
```

Best for:

- auditing an existing UI
- reducing visual noise
- fixing hierarchy
- improving density
- checking consistency
- hardening responsive behavior
- reviewing product surfaces rather than marketing pages

This is one of the strongest candidates for final product audits.

## 6.3 Taste Skill

Useful for:

- mood boards
- broad exploration
- generating different visual directions
- controlling variance
- exploring motion character
- exploring density

Best used early.

Not ideal as the only authority for a complex operational portal.

## 6.4 Hallmark

Useful for:

- studying a visual reference
- extracting design DNA
- avoiding repetitive AI patterns
- producing a distinct brand surface
- landing pages and visual-first experiences

Less suitable as the primary workflow for a dense internal operational tool.

## 6.5 Browser / Playwright skill

This is one of the most important tools in the entire workflow.

It lets the agent:

- open the real application
- see the actual rendered result
- inspect multiple viewport sizes
- capture screenshots
- detect clipping and overlap
- inspect hover/focus states
- compare light and dark themes
- verify long Arabic content
- iteratively correct the implementation

A skill that tells an agent what good design means is useful.

A skill that lets the agent see that its output is currently bad is essential.

---

# 7. When design skills should and should not be used

| Task | Use a design skill? |
|---|---:|
| Create a new visual direction | Yes |
| Generate 3 different mockup directions | Yes |
| Study a screenshot or public website | Yes |
| Build a mood board | Yes |
| Audit an existing interface | Yes, one audit skill |
| Implement an approved mockup exactly | Usually no |
| Add a feature inside an established design system | Usually no |
| Fix one responsive bug | No |
| Fix one CSS defect | No |
| Run visual QA | Use browser/Playwright, not a taste skill |
| Final independent visual review | Yes, one fresh audit skill |

---

# 8. Use image generation carefully

Image generation can help with:

- mood boards
- visual direction sheets
- layout concepts
- home-page concepts
- admin-page concepts
- light/dark comparison concepts
- art direction
- illustration systems

It should not be treated as production UI.

Recommended use:

```text
Generate 3 concept images
→ choose one direction
→ turn it into a real interactive prototype
→ approve it
→ implement it in code
→ compare screenshots
```

For operational products, use generated images to explore composition, not to define every state or interaction.

---

# 9. Claude Design vs Google Stitch

## Claude Design

Best when:

- a real codebase already exists
- the project has reusable components
- tokens already exist
- the team wants design-system sync
- the handoff should stay close to Claude Code
- the goal is to redesign an existing product

Recommended for the current Samtah portal.

## Google Stitch

Best when:

- the project is early
- fast variation is valuable
- several directions should be explored quickly
- the team wants a flexible visual canvas
- a `DESIGN.md` artifact is useful
- the project does not yet have an established component system

Recommended for early exploration in future projects, including Fitway if used before the UI becomes entrenched.

## Policy

Do not let Claude Design and Stitch independently redesign the same product in parallel.

Use one as the primary design environment.

The other can provide a second opinion or alternate direction only when intentionally requested.

---

# 10. The recommended end-to-end workflow

## Phase 0 — Product definition

Define:

- target users
- main user jobs
- primary information
- operational vs marketing surface
- device and viewport assumptions
- realistic Arabic content
- long labels
- loading states
- empty states
- error states
- success states
- accessibility and RTL requirements

Output:

```text
PRODUCT.md
```

## Phase 1 — Visual discovery

Use one of:

- Claude Design
- Google Stitch
- GPT image generation
- Codex with one frontend-design skill

Create at least three genuinely different directions:

1. conservative / official
2. modern / operational
3. more distinctive / expressive

Use the same realistic content in all directions.

Do not write production code yet.

Output:

```text
Direction A
Direction B
Direction C
```

## Phase 2 — Human selection

The product owner selects:

- composition
- navigation style
- density
- visual hierarchy
- light-theme direction
- dark-theme direction
- motion character
- branding intensity

No implementation proceeds until there is explicit approval:

```text
This is the approved visual direction.
```

## Phase 3 — Design contract

Produce:

```text
DESIGN.md
```

And:

```text
design-references/
  home-desktop-light.png
  home-desktop-dark.png
  category-desktop.png
  admin-desktop.png
  home-mobile.png
  states.png
```

`DESIGN.md` should define:

- visual thesis
- product-vs-brand classification
- tokens
- typography roles
- grid
- spacing
- density
- component anatomy
- motion thesis
- responsive behavior
- RTL behavior
- long-content behavior
- anti-patterns
- rejected directions
- acceptance screenshots

## Phase 4 — Visual vertical slice

Implement only a representative slice:

- header
- navigation
- home
- one category page
- one real card type
- search
- light theme
- dark theme
- mobile
- loading
- empty
- error

Use realistic content.

Verification loop:

```text
Implement
→ open exact viewport
→ screenshot
→ compare with approved reference
→ fix
→ human approval
```

Do not continue to the remaining feature phases until this gate passes.

## Phase 5 — Design-system extraction

After approval:

- extract tokens
- extract primitives
- extract reusable components
- build preview fixtures
- include long Arabic labels
- include mixed Arabic/English content
- include light/dark
- include mobile and desktop
- sync to Claude Design or Storybook

The design system is extracted from the approved product slice.

It must not be invented before the product direction is proven.

## Phase 6 — Feature implementation

For later phases, the agent reads:

- `PRODUCT.md`
- `DESIGN.md`
- approved screenshots
- existing design-system components
- canonical spec

Its task is:

```text
Apply the approved system to the new feature.
```

Not:

```text
Invent a new design for the new feature.
```

## Phase 7 — Visual verification

For each major surface:

```text
open exact viewport
→ capture screenshot
→ compare to approved reference
→ inspect long content
→ inspect RTL
→ inspect light/dark
→ inspect keyboard/focus
→ inspect mobile/tablet
→ fix
```

Required viewports should be project-specific, for example:

- 1366×768
- 125% equivalent
- tablet
- mobile

## Phase 8 — Fresh visual audit

Use a new session that was not involved in implementation.

Use one audit skill, such as:

- Impeccable critique/audit
- official frontend skill in review mode

The auditor should:

- compare against approved references
- identify genuine visual regressions
- avoid redesigning accepted product decisions
- produce a prioritized finding list

The main implementation agent owns the final corrections and integration.

---

# 11. Model and effort selection

## Visual exploration

Recommended:

```text
Sol Medium or High
+ one frontend-design skill
+ browser/image tools
```

High or xhigh is not automatically better for visual exploration.

Very high reasoning can overcomplicate simple visual decisions.

Use stronger effort when:

- the design system is large
- many surfaces are tightly coupled
- the agent must reconcile code, design, accessibility, and responsive requirements

## Codebase-to-design-system work

Recommended:

```text
Sol High/xhigh
or
Fable/Opus with Claude Design
```

This work is broad and interconnected.

## Implementing an approved mockup

Recommended:

```text
Sol High
or Terra High for bounded work
+ Playwright/browser verification
```

Do not add a broad taste skill unless the mockup leaves a real unresolved decision.

## Final visual audit

Recommended:

```text
Fresh session
+ one audit skill
+ exact screenshot references
```

## Routine frontend fixes

Recommended:

```text
Terra Medium
```

No design skill needed.

---

# 12. Design source-of-truth hierarchy

For future projects, the order should be:

1. Approved screenshots or prototype
2. Real product content and states
3. Existing components and synced design system
4. `DESIGN.md`
5. Brand references
6. General frontend-design skill
7. Model taste

The previous weakness was that the workflow relied too heavily on:

```text
DESIGN_GUIDE.md
+ model judgment
```

without an approved visual artifact at the top.

---

# 13. Recommended workflow for Fitway now

Fitway is still early enough to correct the workflow before the current design becomes entrenched.

The project is around Phase 3 of approximately 12 phases.

## Recommendation

Do not throw away the current work.

Use it as:

- functional baseline
- real content source
- code structure source
- behavior reference

But insert a **Visual Direction Gate** before continuing deeply into the remaining phases.

## Recommended Fitway sequence

### Step 1 — Finish and stabilize the current Phase 3

Do not mix a large redesign into an unfinished implementation phase unless Phase 3 itself is primarily visual.

Accept the functional work or establish a clean checkpoint.

### Step 2 — Pause before Phase 4

Create a dedicated design workflow:

```text
Fitway Visual Direction Gate
```

### Step 3 — Build three visual directions

Use realistic Fitway content and the actual intended product.

Required surfaces:

- primary dashboard/home
- main live occupancy surface
- one analytics surface
- one staff/admin surface
- mobile portrait
- dark/light only if both are in scope

### Step 4 — Approve one direction

Hussein chooses the final direction.

No agent may start the next feature phase before approval.

### Step 5 — Implement a visual vertical slice

Implement only:

- shell
- navigation
- dashboard
- one representative data card
- one chart/table
- one mobile view
- core states

### Step 6 — Extract the Fitway design system

Generate:

```text
FITWAY_DESIGN.md
FITWAY_PRODUCT.md
design-references/
component previews
tokens
```

### Step 7 — Resume Phase 4 onward

Every new phase must use the approved Fitway design system and screenshots.

Agents should not independently restyle each new feature.

## Decision

Yes, send this file into the Fitway Phase 3 conversation.

The purpose is not only to inform ChatGPT.

It should be used there to decide:

- whether to finish Phase 3 first
- where to insert the visual gate
- which design tool to use
- which skill to install
- what artifacts must be approved before Phase 4

---

# 14. Recommended workflow for Samtah now

Samtah is later in development, so the adjustment is different.

Recommended:

1. Finish the current Claude Design sync.
2. Use the current application as functional reference.
3. Create several visual directions.
4. Approve one.
5. Design representative staff and admin surfaces.
6. Export an implementation-ready handoff.
7. Implement against exact screenshots.
8. Use browser screenshot comparison.
9. Run the existing functional, accessibility, RTL, security, and zero-egress tests.
10. Perform a fresh visual audit.

Do not keep asking the coding agent to “make it prettier.”

The next implementation must be reference-driven.

---

# 15. Skill installation strategy

Do not install every community skill.

Recommended shortlist to evaluate:

## Core

- Official OpenAI frontend skill
- Browser or Playwright inspection skill

## Product audit

- Impeccable

## Optional exploration

- Taste Skill

## Optional brand/marketing exploration

- Hallmark

## Installation policy

Before installation, an agent should:

1. inspect the repository
2. inspect the skill source and instructions
3. identify what files or configuration it modifies
4. confirm it does not conflict with existing instructions
5. install in a controlled session
6. report exact created/modified files
7. avoid committing generated runtime or cache artifacts
8. document when the skill should and should not be invoked

Do not allow automatic invocation of every design skill on every frontend task.

---

# 16. Prompt structure for design tasks

Use this structure:

```text
ROLE
- Define the design responsibility.

PRODUCT
- State users, jobs, and operational context.

REFERENCES
- Attach approved screenshots, brand references, and realistic content.

SCOPE
- Specify the exact pages and states.

CONSTRAINTS
- RTL, accessibility, devices, no external assets, security.

VARIATION
- Request three genuinely different directions.

ANTI-PATTERNS
- List what must be avoided.

ACCEPTANCE
- Exact screenshots, viewports, and human approval requirements.

STOP CONDITION
- Plan or prototype only; no product implementation before approval.
```

For implementation:

```text
Implement the approved design.
Do not reinterpret the visual direction.
Use browser screenshots at exact viewports.
Compare, correct, and repeat until matched.
```

---

# 17. Visual acceptance gate

A visual vertical slice is accepted only when:

- the product owner approves the direction
- desktop composition is intentional
- mobile composition is intentional
- light/dark are intentional if both exist
- realistic long Arabic labels work
- mixed Arabic/English content works
- no generic placeholder icons or branding remain
- hierarchy is obvious at first glance
- important actions are visually dominant
- secondary information stays secondary
- spacing and density are consistent
- loading, empty, error, and success states match the system
- screenshots match the approved references closely
- accessibility and keyboard behavior remain correct
- no document-level overflow exists

---

# 18. Final operating principles

1. Strong code does not guarantee strong visual design.
2. A design guide is necessary but not sufficient.
3. Brand references and product references are different.
4. Realistic content must be used during design.
5. Multiple independent directions should be created before choosing.
6. Human approval must happen before full implementation.
7. A visual vertical slice should precede large feature expansion.
8. The design system should be extracted from an approved slice.
9. Feature agents apply the system; they do not reinvent it.
10. Screenshot comparison is part of implementation, not optional QA.
11. Use one design skill at a time.
12. Use Playwright/browser tools for visual truth.
13. Use a fresh session for final visual audit.
14. Do not solve a weak visual direction with endless local polish.
15. The approved visual artifact is the strongest visual reference; binding product, security,
    privacy, content, accessibility, and data-semantic decisions remain the higher contract.

---

# Immediate next action

For FITWAY, proceed to VDG-B using the approved G1B and full-product Claude Design artifacts,
then resume feature work only through the dependency and integration gates in `PHASES.md`.

For Samtah, continue the current Claude Design sync and use it to produce an approved visual direction before any further large UI implementation pass.
