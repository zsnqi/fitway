**1. F3**
1. Outcome/limit exploited: `F3`.
2. Literal reading: Except for `status,menu,rail,language,phone-language`, action features are sampled only by the CLI default schedule, which starts at 1 ms and then advances by at most 100 ms.
3. What goes wrong: A shared-frame refactor can change a short or intermediate animation state between samples while every sampled frame remains `TIMELINE EQUAL`, so users see different motion despite F3 passing.
4. One-line change: Require the dense timeline schedule, at least every 20 ms through each action's last finite effect, for every feature with actions.

**2. R2 And F3**
1. Outcome/limit exploited: `R2` and `F3`.
2. Literal reading: A difference inside F126's chip or F148's edge region can be rerun and reported, and an unstable sample can pass when the base varies and every result-side difference lies inside the region where the base's captures vary.
3. What goes wrong: A real regression confined to those broad chip or edge regions can be classified as known base instability and excluded from the required equal comparison, leaving the delivered movement changed.
4. One-line change: Require an exact match to a stable canonical frame in those regions, masking only exact pixels that vary across repeated base captures and failing every other difference.

**3. F2 And F3**
1. Outcome/limit exploited: `F2` and `F3`.
2. Literal reading: Keyboard and touch are required at tablet size only for `status,menu,rail,language,phone-language`; other features with actions are compared only with desktop/phone mouse input.
3. What goes wrong: A refactor can preserve the measured mouse paths while breaking keyboard activation, touch handling, or tablet layout in other interactive features, so users get changed behavior that the required matrix cannot see.
4. One-line change: Extend every feature/action comparison to `--inputs mouse,keyboard,touch` and `--sizes desktop,tablet,phone`.

**4. F2 And F3**
1. Outcome/limit exploited: `F2` and `F3`.
2. Literal reading: The CLI defaults to `--colors normal`, and neither outcome requires `--colors forced`.
3. What goes wrong: The shared frame can regress only in forced-colors or Windows high-contrast mode while every required normal-color comparison stays equal.
4. One-line change: Add `--colors normal,forced` to every F2 and F3 comparison and require both axes to pass.

**5. F2**
1. Outcome/limit exploited: `F2`.
2. Literal reading: The `file://` matrix covers only `--feature page --states all`, Arabic and English, desktop, and reduced motion; it does not cover feature actions, timeline samples, phone/tablet sizes, or full motion.
3. What goes wrong: Opening the concept directly from disk can preserve the checked at-rest pages while one or more shared-script interactions behave differently under `file://`.
4. One-line change: Require the full F2 and F3 feature, action, language, size, input, and motion matrix over `file://` as well as HTTP.