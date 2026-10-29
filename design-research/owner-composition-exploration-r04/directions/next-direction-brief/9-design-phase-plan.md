<!-- Part of NEXT-DIRECTION-BRIEF.md; the index and the rule for editing are in NEXT-DIRECTION-BRIEF.md. -->

## The design-phase plan (user-agreed 2026-09-30)

The user reviewed Reports at `31a40d6` and found it beautiful and excellent: the designer understood the direction and
built the page whole, almost in one attempt. There is room to improve, above all on the phone and the other sizes.
This plan replaces "Screen plan (user-agreed)" and the "Mobile" step of "After the Daily page".

### 1. The goal, as the user confirmed it

- Eclipse becomes the single design reference for FITWAY's interfaces, replacing Paper and the older designs. Whoever
  builds from it later, Codex in production included, builds from one clear reference and never guesses.
- To be that reference, it is complete: every screen, at every size, in every state. An incomplete reference leaves
  the builder to improvise, and that is what went wrong before.
- The phone is designed with each screen from the start, so the designer places the content well once instead of
  patching it later.
- **The language carries over; the composition does not.** Dark, glass, the FITWAY red light, Readex Pro, the calm
  premium feel and the finish stay. Each screen composes its own page and decides where the light goes, if anywhere;
  the Daily page's arrangement, such as which card is lit, is not a template.
- A written spec sheet turns the design from pictures into exact rules and numbers.
- The tests come at the end, once every screen and size is settled, so nothing that will still change gets tested.
- Every task goes to a fresh agent with a small context.
- The user sees and discusses each screen before the next one starts.

### 2. Sizes

- **Designed:** desktop 1440×900, tablet 768×1024 and phone 390×844, the Product anchors.
- **Checked only, so nothing breaks:** 320 px, 1024 px and 200% zoom reflow.

### 3. Navigation and header across sizes (user-agreed)

- **Desktop:** unchanged: the slim icon rail.
- **Tablet (768):** the same slim rail. Pressing the logo opens it over the content, and the content reflows to two
  columns.
- **Phone:** the rail becomes a glass bar at the bottom with five items: Daily, Reports, Activity Log, Access and
  Settings. Each item has a short label under its icon, arranged neatly.
  - The header becomes compact: the title, the Operations status as a small badge that opens its details, and a
    menu holding the language and sign out.
  - Page controls, such as Reports' period, sit under the title at full width.
  - No hamburger menu: it hides the navigation and adds a tap, and five sections fit at the bottom even at 320 px.
- The designer builds it in step 3, and the user sees it before it is adopted.

### 4. The spec sheet

- It is written from the pages as built, and grows with every screen.
- **Four safeguards,** so that nothing weak becomes a rule:
  1. before it is written, a fresh design reviewer critiques the built pages, and the user picks which findings are
     right;
  2. every entry is one of three kinds: a **rule** to follow, a **page composition** that stays free, or a **known
     issue** that is never copied and has a round that fixes it (for example, the Daily page's 38 px buttons are an
     issue; the rule is 44 px);
  3. every number is measured from the rendered page and checked against `DESIGN_GUIDE.md`, Product and the
     accessibility rules. What fails is recorded as a known issue, not as a rule;
  4. the user reviews it. It stays a draft until the end, and before the authority record the tests compare it with
     the final pages.
- **Structure:** shared foundations for all three surfaces, then a section for each surface.
- A page that renders every component in each of its states goes with it.
- It becomes a reference only through the authority record in step 10.

### 5. The steps

1. A design review of Daily and Reports. The user picks from its findings.
2. The spec sheet, first version, with its components page.
3. Daily at every size and in every state, including loading. This round settles the navigation and header for every
   screen. It also takes in the 1024 px card-header overflow, the `#busy-note` jump on narrow screens, and 44 px
   controls (moved here from the polish, user decision 2026-09-30, because the phone needs 44 px targets anyway).
4. Reports at every size, with the review findings the user picked.
5. The other Owner screens, one at a time, each at every size and in every state: Activity Log, then Access, then
   Settings, then Operations.
6. Staff, with the PIN sign-in screen. It reuses much of the Owner surface.
7. Public. Product keeps it mobile-first, light, and free of any control or personal data, so its design starts from
   the phone.
8. The final polish across all screens: consistency, details and motion, which show only when every screen sits side
   by side.
9. The tests and the independent verification: a fixed suite across every screen, size and language, with other
   browsers checked. Codex makes the repairs.
10. The authority record: an ADR that makes Eclipse the reference for all three surfaces and withdraws Paper, with the
    final spec sheet and named reference frames for every screen and size. The user approves it.
11. Production: Codex starts with one bounded part as a pilot, measuring how faithfully it carries the reference into
    production, before the rest.

**Every design round:**
- a fresh designer;
- then a fresh design reviewer who proposes improvements;
- the coordinator inspects the frames;
- the user decides;
- whatever is new is added to the spec sheet.

Each round ends in a state the user is happy with, so the final polish refines and does not repair.

### 6. Process notes

- Staff and Public lie outside this milestone's scope, which is the Owner surface. Each opens as its own milestone
  when the plan reaches it.
- Between rounds, light checks stay:
  - each designer proves that the earlier pages did not change;
  - the coordinator inspects the frames before the user sees them.
- The user's decisions on the Reports proposals:
  - 44 px controls, as in step 3;
  - no intro on Reports, and no rolling digits on a period change, both pending the user's final view in step 4.
