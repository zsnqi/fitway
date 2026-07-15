# HANDOFF — FITWAY PHASE 3 → VISUAL DIRECTION GATE

> **ARCHIVED 2026-07-15 — SUPERSEDED SESSION HANDOFF.** Phase evidence moved to
> `docs/phase-records/phase-03-schedule.md`; visual-gate instructions are no longer active.

> **هذا الملف مخصص لـChatGPT في المحادثة القادمة، وليس prompt مباشرًا لأي Agent.**
>
> المستخدم اسمه **حسين**. دوره صاحب القرار والمراجع، وChatGPT يساعده في فهم مخرجات الـagents، تقييمها، ترتيب الـworkflow، وصياغة prompts قصيرة وواضحة.
>
> **Historical handoff status (2026-07-14):** VDG-A is now complete. The canonical approved
> artifacts are indexed under `visual-direction-gate/approved/`; VDG-B remains the next UI
> gate. The “next step” instructions below record the earlier handoff state and are superseded
> by the current dependency plan in `PHASES.md`.

---

## 1) الحالة الحالية المختصرة

تم إنهاء **Phase 3: Open/closed schedule on the public page** بالكامل واعتمادها بعد:

- implementation كامل
- completion loop
- مراجعات مستقلة
- automated verification
- Manual QA من QA1 إلى QA7
- cleanup
- commit نهائي
- بدون push

```text
RESEARCH.md               نهائي
DESIGN_GUIDE.md           نهائي
SOL_SCAFFOLD_REVIEW.md    موجود ومرجعي
SPEC.md                   مكتمل ومعتمد
PHASES.md                 مكتمل ومعتمد
Phase 1                   مكتملة ومعتمدة
Phase 2                   مكتملة ومعتمدة
Phase 3                   مكتملة ومعتمدة
Phase 4                   لم تبدأ
Visual Direction Gate     الخطوة التالية
Deployment                لم يبدأ
Push                      لم يتم
Working tree              clean
```

المحادثة القادمة ليست لبدء Phase 4.

المحادثة القادمة مخصصة بالكامل لـ:

```text
Fitway Visual Direction Gate
```

---

## 2) آخر حالة Git مؤكدة

### Phase 3 commit

```text
Commit:
ab4126dd30598a916ca2aa2e6f8b815a21d86bba

Message:
feat: implement phase 3 schedule-aware public state
```

### الحالة النهائية

```text
Branch: main
Working tree: clean
main ahead of origin/main by 4 commits
main behind origin/main by 0 commits
Nothing pushed
```

لا تعمل `push` تلقائيًا.

---

## 3) ما تم إنجازه حتى الآن

### Phase 1

أساس الصفحة العامة والـpublic foundation.

### Phase 2

Tracer bullet متكامل:

```text
Python simulator
→ authenticated edge push
→ rate limiter
→ transactional occupancy engine
→ PostgreSQL
→ cached public payload
→ Arabic/English public UI
```

### Phase 3

تم تنفيذ:

- weekly schedule داخل settings
- open/close لكل weekday
- past-midnight semantics
- Friday 2 PM–12 AM
- gym-local timezone handling
- `freshness: "closed"` كحالة public payload
- closed override يخفي count وmeter
- next-open
- Arabic/English localized time
- Western digits
- Arabic ص/م
- automatic closed-to-open transition
- append-only settings history
- timezone metadata داخل settings-aware payloads
- closed cache behavior حتى لا يبقى مغلقًا بعد وقت الفتح
- deterministic agent-prepared Manual QA

---

## 4) نتائج Phase 3 النهائية

كل الفحوصات نجحت:

```text
pnpm check                 PASS
pnpm check-types           PASS
production web build       PASS
pnpm test                  PASS — 67 tests
pnpm test:integration      PASS — 9 tests
pnpm test:browser          PASS — 6 tests
pnpm test:simulator        PASS — 3 tests
git diff --check           PASS
```

### Manual QA

كل الحالات التالية نجحت:

1. Closed state with active occupancy.
2. Past-midnight open at 01:00.
3. Post-close next opening at 06:00.
4. Thursday-to-Friday transition opens Friday 14:00.
5. Friday midnight boundary.
6. Arabic/English localization and gym timezone.
7. Automatic closed-to-open transition without reload.

كلها:

```text
PASS
```

---

## 5) البيئة المحلية الثابتة

حافظ على المنافذ التالية:

```text
Fitway Web:        http://localhost:3101/
Fitway Server:     http://localhost:3100/
Fitway PostgreSQL: 127.0.0.1:55432
```

Docker container:

```text
fitway-phase2-postgres
```

لا ترجع تلقائيًا إلى:

```text
3000
3001
54322
```

---

## 6) قرار استراتيجي جديد قبل Phase 4

تمت قراءة واعتماد ملف:

```text
AI_FRONTEND_DESIGN_WORKFLOW(1).md
```

الدرس الأساسي:

> الكود القوي، الاختبارات، accessibility، RTL، والـdesign guide لا تضمن واجهة قوية بصريًا.

المشكلة التي نريد منعها:

```text
DESIGN_GUIDE.md
+ model taste
→ implementation spreads
→ visual direction becomes entrenched
→ endless local polish
```

الحل المعتمد:

```text
Research
→ Product brief
→ Visual references
→ 3 visual directions
→ Human approval
→ Visual vertical slice
→ Design-system extraction
→ Feature implementation
→ Screenshot comparison
→ Fresh visual audit
```

القاعدة الأهم:

> Agents لا يخترعون الـfinal visual direction أثناء تنفيذ feature phases.

---

## 7) أين توضع Visual Direction Gate؟

المكان المعتمد:

```text
Phase 3 complete and committed
→ Fitway Visual Direction Gate
→ Phase 4
```

Phase 4 ممنوعة قبل نجاح البوابة.

لا نعيد ترقيم المراحل.

البوابة تعتبر checkpoint مستقلًا:

```text
VDG-1 — Fitway Visual Direction Gate

Depends on:
Phase 3 complete and committed

Blocks:
Phase 4 and all later UI-producing phases
```

---

## 8) تقسيم البوابة

### VDG-A — Visual Direction Approval

الهدف:

- فهم المنتج الحالي
- توثيق الـfunctional baseline
- إنشاء 3 اتجاهات بصرية مختلفة فعلًا
- مراجعتها بشريًا
- اختيار اتجاه واحد نهائي

لا production redesign في هذه المرحلة.

### VDG-B — Visual Vertical Slice Approval

بعد اختيار الاتجاه:

- تنفيذ شريحة بصرية حقيقية بالكود
- فتح التطبيق في browser
- screenshots
- مقارنة بالمرجع
- إصلاح
- تكرار
- اعتماد حسين

Phase 4 لا تبدأ إلا بعد نجاح VDG-A وVDG-B.

---

## 9) ما يجب إنتاجه قبل Phase 4

### A) Product brief

إنشاء:

```text
FITWAY_PRODUCT.md
```

يجب أن يحدد:

- المستخدم العام
- staff users
- jobs-to-be-done
- public vs staff surfaces
- operational product وليس marketing site
- occupancy هو primary focus
- device assumptions
- Arabic RTL default
- English LTR toggle
- Western digits
- Dark-only
- Cairo self-hosted
- loading/fresh/stale/closed/unavailable states
- accessibility
- reduced motion
- no color-only communication
- realistic Arabic/English content

لا يكرر SPEC بالكامل.

---

### B) Functional baseline screenshots

التقاط التطبيق الحالي قبل إعادة التصميم:

```text
design-baseline/
  public-live-desktop.png
  public-closed-desktop.png
  public-stale-desktop.png
  public-unavailable-desktop.png
  public-live-mobile.png
  public-closed-mobile.png
  english-ltr.png
```

هذه الصور مرجع للسلوك والمعلومات، وليست visual north star.

---

### C) Three visual directions

يجب أن تكون مختلفة في:

- composition
- hierarchy
- density
- navigation
- data presentation
- brand intensity
- chart/table language
- motion character
- mobile structure

اقتراح الاتجاهات:

1. **Premium Athletic**
2. **Operational Performance**
3. **Distinctive Kinetic**

لا نريد نفس التصميم بثلاثة ألوان.

---

### D) Surfaces required in each direction

1. Public live occupancy — desktop
2. Public closed state — desktop
3. Public live occupancy — mobile portrait
4. Staff shell/live operations concept
5. Analytics concept with a real chart/table
6. States sheet

States sheet:

- loading
- fresh
- stale
- closed
- unavailable
- quiet
- moderate
- busy
- packed/over-capacity
- keyboard focus
- reduced motion

Use:

- realistic Arabic content
- English LTR
- mixed Arabic/English labels
- Western digits
- ص/م and AM/PM
- long labels
- real-looking data

Dark-only.

---

### E) Human approval

حسين يختار:

- composition
- navigation style
- density
- hierarchy
- occupancy hero treatment
- status/freshness presentation
- analytics visual language
- brand intensity
- motion character
- mobile composition
- state treatment

التوقف المطلوب:

```text
This is the approved Fitway visual direction.
```

لا تنفيذ قبل اعتماد واضح.

سجّل أيضًا:

- rejected directions
- rejection reasons
- visual anti-patterns

---

### F) Design contract

بعد اختيار الاتجاه، أنشئ:

```text
FITWAY_DESIGN.md

design-references/
  public-live-desktop-ar.png
  public-closed-desktop-ar.png
  public-live-mobile-ar.png
  public-live-desktop-en.png
  staff-live-desktop-ar.png
  analytics-desktop-ar.png
  component-states.png
```

`FITWAY_DESIGN.md` يجب أن يحدد:

- visual thesis
- hierarchy
- grid
- spacing
- density
- typography roles
- color roles
- component anatomy
- chart/table language
- motion
- responsive rules
- RTL/LTR
- long-content behavior
- accessibility
- anti-patterns
- rejected directions
- exact acceptance screenshots and viewports

---

### G) Visual vertical slice

Production slice:

- app shell
- public live page
- closed state
- fresh/stale/unavailable states
- Arabic/English
- desktop
- mobile

Preview-only fixtures for future surfaces:

- staff shell
- representative operational card
- one chart/table
- component states

لا backend جديد.
لا auth جديد.
لا Phase 4 functionality مبكرة.

Loop:

```text
Implement
→ open exact viewport
→ screenshot
→ compare with approved reference
→ identify visible mismatches
→ fix
→ repeat
→ Hussein approval
```

---

### H) Design-system extraction

بعد اعتماد الشريحة:

- tokens
- typography primitives
- surfaces
- badges
- metric components
- chart/table styles
- navigation primitives
- closed/loading/empty/error states
- responsive patterns
- preview fixtures

الـdesign system يستخرج من الشريحة المعتمدة، لا يُخترع نظريًا قبلها.

---

### I) Fresh visual audit

جلسة جديدة لم تشارك في التنفيذ.

تستخدم:

- approved screenshots
- browser screenshots
- one audit skill only

الاختيار الأنسب:

```text
Impeccable
```

الهدف:

- regressions
- hierarchy problems
- spacing/density issues
- mismatch with approved references

لا تعيد تصميم قرارات حسين المعتمدة.

---

## 10) أداة التصميم والـskills

السياسة:

- Design skill واحدة فقط في visual exploration.
- Browser/Playwright في verification.
- Audit skill واحدة في fresh audit.
- لا تجمع عدة taste/design skills.

الخيارات المطروحة:

### Primary recommendation for early exploration

```text
Google Stitch
```

مناسب لأن Fitway ما زال مبكرًا ويحتاج 3 variations بسرعة.

### Alternative

```text
Codex + Official OpenAI frontend skill
```

لا تستخدم Stitch وCodex skill كجهتين مستقلتين تعيدان تصميم المنتج بالتوازي في نفس الجولة.

قبل تثبيت أي skill:

1. inspect source
2. inspect instructions
3. identify modified files/config
4. confirm no instruction conflict
5. install in controlled session
6. report created/modified files
7. avoid committing caches/runtime artifacts
8. document when to invoke it

---

## 11) ترتيب مصادر الحقيقة بعد الاعتماد

```text
1. Approved screenshots/prototype
2. Real Fitway content and states
3. Approved shared components
4. FITWAY_DESIGN.md
5. DESIGN_GUIDE.md and brand references
6. Design skill
7. Agent taste
```

---

## 12) ما لا نفعله

- لا نبدأ Phase 4.
- لا نطلب “make it prettier”.
- لا نعتمد current UI كـfinal visual direction لمجرد أنه موجود.
- لا نثبت عدة design skills.
- لا نبني staff/analytics functionality مبكرًا.
- لا نسمح لكل Phase باختراع visual language جديد.
- لا نعتبر نجاح Playwright دليلًا على visual quality.
- لا نعيد تصميم المشروع قبل اعتماد 3 directions.
- لا نخلط planning + exploration + production implementation في خطوة واحدة.
- لا push تلقائي.

---

## 13) طريقة التعامل مع حسين

- نادِه: **حسين**.
- عربي سعودي واضح.
- technical terms بالإنجليزية عند الحاجة.
- لا تشرح أشياء بديهية للـAgent.
- عند ملاحظة Agent:
  1. اشرحها.
  2. قيّمها.
  3. حدد تصلح الآن أو تؤجل.
  4. بعد قرار حسين صغ prompt قصير.
- لا تجعل حسين يعدل DB أو SQL أو fixtures.
- في visual approval حسين يشاهد ويختار.
- استخدم screenshots والbrowser بدل وصف نظري فقط.

---

## 14) Context-management preference

حسين لا يريد main context يتضخم.

الهدف:

```text
Main context ideally below 40–45% used
```

قبل الاقتراب من 50%:

- delegate broad reading
- delegate file inventories
- delegate test execution
- delegate narrow investigations
- use Terra High for simple fixes/reviews
- use focused Sol High subagent for genuinely complex isolated work
- main agent keeps integration judgment and final review
- require concise summaries
- avoid raw logs and giant file dumps

---

## 15) Model strategy

### Visual exploration

```text
Sol Medium or High
+ one frontend-design skill
+ browser/image tools
```

لا تفترض xHigh أفضل دائمًا.

### Codebase-to-design-system

```text
Sol High/xHigh
or
Fable/Opus with Claude Design
```

### Implement approved mockup

```text
Sol High
or Terra High for bounded work
+ Browser/Playwright
```

### Final visual audit

```text
Fresh session
+ one audit skill
```

### Routine fixes

```text
Terra Medium/High
```

### Fable 5

استخدمه بحذر للأعمال الاستراتيجية المعقدة أو الطويلة، وليس للمهام الروتينية.

---

## 16) الخطوة التالية بالضبط

في المحادثة الجديدة:

1. ارفع هذا الملف.
2. ارفع:
   ```text
   AI_FRONTEND_DESIGN_WORKFLOW(1).md
   ```
3. لا ترسل prompt إلى Codex بعد.
4. اطلب من ChatGPT:
   - قراءة الملفين
   - تقييم المشروع الحالي
   - تحديد أول خطوة في Visual Direction Gate
   - اختيار tool/workflow
   - تجهيز prompt التخطيط فقط
5. بعد اعتماد الخطة، نقرر هل البداية تكون:
   - Google Stitch
   - أو Codex + Official OpenAI frontend skill
6. لا تبدأ Phase 4.

---

## 17) آخر حالة مؤكدة

```text
Phase 1: complete
Phase 2: complete
Phase 3: complete
Phase 3 QA: QA1–QA7 PASS
Phase 3 commit: ab4126dd30598a916ca2aa2e6f8b815a21d86bba
Working tree: clean
Branch: main
Ahead of origin/main: 4
Behind origin/main: 0
Push: not done
Phase 4: not started
Next: Fitway Visual Direction Gate
```
