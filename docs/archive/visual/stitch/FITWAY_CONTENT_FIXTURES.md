# FITWAY — shared VDG-A content fixtures

## Fixture policy

These are the single shared facts for all three Stitch directions. Copy values and wording exactly unless a line is explicitly marked as a stress-test alternative. Do not improve a direction by changing its data, reducing its copy, hiding required facts, or giving it a different state.

All dates and times below are deterministic design fixtures, not measured Fitway truth. Public P1–P4 facts retain the approved VDG-0 evidence; the Arabic public-live copy is aligned to the locked G1B Public Live Desktop anchor. Staff and analytics fixtures preview fields and analytics already specified in `SPEC.md` and `PHASES.md`; they do not claim that Phase 4, owner analytics, authentication, commands, or health monitoring are implemented.

## Shared formatting rules

- Gym timezone: `Asia/Riyadh` (`UTC+03:00`).
- Arabic default: `ar`, RTL. English: `en`, LTR.
- Digits: Western `0–9` in both languages.
- Public time: 12-hour. Arabic uses `ص/م`; English uses `AM/PM`.
- Cairo for Arabic and Latin.
- The name `FITWAY` stays uppercase and unaltered.
- Isolate Latin fragments and digit runs inside Arabic, including `FITWAY Edge-01`, `CSV`, `37%`, and timestamps.
- Count language is approximate. Approved Arabic public copy expresses this with the explicit label `العدد التقريبي` followed by `37`; it does not add `حوالي` or `شخصًا`. The existing English fixture remains `Around 37 people` until an English visual anchor supersedes it.
- Do not expose capacity on the public surface. The fixture denominator `100` is available only to staff/analytics concepts and to explain how `37%` is derived.

## P1, P3, and P4 — public live fixture

### Canonical facts

| Field | Value |
| --- | --- |
| Frozen clock | `2026-07-17T12:00:00.000Z` — Friday 3:00 PM Riyadh |
| Last update | `2026-07-17T11:59:30.000Z` — Friday 2:59:30 PM Riyadh |
| Fresh until | `2026-07-17T12:01:00.000Z` |
| Open state | Open |
| Freshness | Fresh / live |
| Crowd band | Moderate / متوسط |
| Approximate count | `37` people |
| Percent full | `37%` |
| Source | `edge` — not shown publicly |
| Trend | `null` — omit trend UI |

Canonical payload, for fact checking only:

```json
{"schemaVersion":1,"freshness":"fresh","timeZone":"Asia/Riyadh","band":"moderate","count":37,"percentFull":37,"lastUpdatedAt":"2026-07-17T11:59:30.000Z","freshUntil":"2026-07-17T12:01:00.000Z","source":"edge","computedAt":"2026-07-17T12:00:00.000Z","trend":null}
```

### Arabic display copy — P1 and P3

| Role | Exact copy |
| --- | --- |
| Global open status | النادي مفتوح الآن |
| Crowd label | مستوى الازدحام |
| Crowd band | متوسط |
| Approximate-count label | العدد التقريبي |
| Count | 37 |
| Percentage | ممتلئ بنسبة 37% |
| Freshness | تحديث مباشر |
| Absolute update | آخر تحديث 2:59 م |
| Relative update | قبل 30 ثانية |
| Combined compact freshness | تحديث مباشر · آخر تحديث 2:59 م · قبل 30 ثانية |
| Language action | English |
| Accessible summary | النادي مفتوح الآن. مستوى الازدحام: متوسط. العدد التقريبي: 37. ممتلئ بنسبة 37%. تحديث مباشر. آخر تحديث 2:59 م، قبل 30 ثانية. |

### English display copy — P4

| Role | Exact copy |
| --- | --- |
| Page purpose | Gym status now |
| Open state | Open now |
| Crowd band | Moderate |
| Approximation | Around |
| Count | 37 |
| Unit | people |
| Percentage | 37% full |
| Freshness | Live update |
| Absolute update | Updated 2:59 PM |
| Relative update | 30 seconds ago |
| Combined compact freshness | Live update · Updated 2:59 PM · 30 seconds ago |
| Language action | العربية |
| Accessible summary | Current status: Moderate. Around 37 people, 37% full. The gym is open. Live update, updated at 2:59 PM, 30 seconds ago. |

## P2 — public closed fixture

### Canonical facts

| Field | Value |
| --- | --- |
| Frozen clock | `2026-07-16T23:00:00.000Z` — Friday 2:00 AM Riyadh |
| Next opening | `2026-07-17T11:00:00.000Z` — Friday 2:00 PM Riyadh |
| State | Closed |
| Count, percentage, meter, band, source, last-updated | Absent |
| Trend | `null` |

Canonical payload, for fact checking only:

```json
{"schemaVersion":1,"freshness":"closed","timeZone":"Asia/Riyadh","nextOpenAt":"2026-07-17T11:00:00.000Z","computedAt":"2026-07-16T23:00:00.000Z","trend":null}
```

### Arabic display copy

| Role | Exact copy |
| --- | --- |
| State label | مغلق الآن |
| Main message | مغلق الآن |
| Next opening | يفتح 2:00 م |
| Accessible summary | النادي مغلق الآن. يفتح اليوم الساعة 2:00 م. |
| Language action | English |

Do not show `37`, `37%`, a meter, Moderate/متوسط, live/update language, source, or a fabricated last-update time on P2.

## C1 — public lifecycle state fixtures

These state samples belong on every states sheet. They are not additional full-page artboards.

### Loading

| Arabic | English |
| --- | --- |
| جارٍ تحميل حالة النادي | Loading gym status |

Show a skeleton matching the chosen layout. Under reduced motion it becomes static. Use `aria-busy="true"`; skeleton geometry is decorative.

### Fresh

Reuse the public live facts and copy above.

### Stale / last known

| Field | Value |
| --- | --- |
| Frozen clock | `2026-07-17T12:05:00.000Z` — Friday 3:05 PM Riyadh |
| Last-known update | `2026-07-17T12:00:00.000Z` — Friday 3:00 PM Riyadh |
| Band/count/percent | Moderate, `37`, `37%`, explicitly last known |
| Arabic label | آخر عدد معروف |
| Arabic time | آخر تحديث معروف 3:00 م · قبل 5 دقائق |
| Arabic warning | كان آخر عدد تقريبي معروف 37 في 3:00 م. التحديثات المباشرة متأخرة. |
| English label | Last known count |
| English time | Last known update 3:00 PM · 5 minutes ago |
| English warning | The last known count was around 37 at 3:00 PM. Live updates are delayed. |

Keep the last-known value and occupancy visualization for context, but visually demote and explicitly label both as stale. Do not use “Live update.”

### Unavailable

| Field | Value |
| --- | --- |
| Frozen clock | `2026-07-17T12:10:00.000Z` |
| Arabic title | التحديث المباشر غير متاح الآن |
| Arabic body | لا نعرض عددًا قديمًا على أنه مباشر. يرجى المحاولة مرة أخرى لاحقًا. |
| English title | Live occupancy is unavailable right now |
| English body | We do not show an old count as live. Please try again later. |

Show no count, percentage, meter, band, source, or fabricated last-update time.

### Crowd-band samples

These are component samples, not claims about the live fixture:

| Band key | Arabic | English | Sample percent for component positioning only |
| --- | --- | --- | --- |
| `quiet` | هادئ | Quiet | `18%` |
| `moderate` | متوسط | Moderate | `37%` |
| `busy` | مزدحم | Busy | `72%` |
| `packed` | ممتلئ | Packed | `96%` |
| over-capacity stress only | أعلى من السعة المحددة | Above configured capacity | `112%` raw; visual meter capped at `100%` |

Each sample must use text + icon + color, and crowd samples also need a quantitative or positional cue. Over-capacity is a component stress test only; it is not a public live fixture and must not add an owner alert feature.

## S1 — staff live-operations preview fixture

### Required preview annotation

```text
تصور مسبق لـ VDG-A — هذه الوظائف غير منفذة بعد
VDG-A preview — functionality not yet implemented
```

### Snapshot facts

| Role | Arabic display | Value / constraint |
| --- | --- | --- |
| Page title | العمليات المباشرة | Preview only |
| Live count | العدد الحالي | حوالي `37` |
| Capacity | السعة المضبوطة | `100` |
| Crowd band | حالة الازدحام | متوسط |
| Freshness | آخر تحديث | `2:59 م` · قبل `30` ثانية |
| Source | مصدر القراءة | `FITWAY Edge-01` |
| Device health | جهاز العد | متصل |
| Camera health | الكاميرا / البث | يعمل بشكل طبيعي |
| Pending state | حالة الأوامر | لا توجد أوامر معلقة |
| Session role | الحساب | مكتب الاستقبال · Staff |

The healthy device/camera labels are a deterministic concept fixture for the already-specified future health fields. They are not evidence of a real deployed device.

### Operations copy

| Role | Exact Arabic copy |
| --- | --- |
| Operations group | أدوات تصحيح العدد |
| Stepper label | تعديل مؤقت |
| Current correction value | 37 |
| Decrease action | إنقاص العدد |
| Increase action | زيادة العدد |
| Optional reason label | سبب مختصر (اختياري) |
| Reason fixture | مطابقة يدوية عند مكتب الاستقبال |
| Apply action | تطبيق التصحيح |
| Direct entry label | إدخال العدد مباشرة عند تعذر التحديث من جهاز العد |
| Direct entry value | 37 |
| Reset action | إعادة الضبط إلى 0 |
| Reset consequence | سيتم ضبط العدد إلى 0 بعد التأكيد وتسجيل العملية. |
| Command preview state | معاينة فقط — لم يتم إرسال أي أمر |

Information and controls must be visually separate. Do not display a success toast, “applied” result, audit ID, or backend response. A reset affordance must show that confirmation is required, but the artboard does not need to depict a completed reset.

### Staff content-stress strings

- `إدخال العدد مباشرة عند تعذر التحديث من جهاز العد`
- `آخر تحديث من FITWAY Edge-01 قبل 30 ثانية`
- `مطابقة يدوية عند مكتب الاستقبال — shift B`
- `Camera / RTSP feed` inside an Arabic row

## A1 — analytics preview fixture

### Required preview annotations

```text
تصور مسبق لـ VDG-A — هذه الوظائف غير منفذة بعد
VDG-A preview — functionality not yet implemented
```

```text
بيانات تجريبية للتصميم — ليست قياسات فعلية لـ Fitway
Design fixture data — not measured Fitway data
```

### Page and chart copy

| Role | Exact Arabic copy |
| --- | --- |
| Page title | تحليلات الإشغال |
| Chart title | منحنى الإشغال — يوم الخميس 16 يوليو 2026 |
| Chart subtitle | يوم تشغيل تجريبي حسب توقيت النادي |
| Y-axis | عدد الأشخاص التقديري |
| X-axis | الوقت |
| Primary series | الإشغال التقديري |
| Capacity reference | السعة المضبوطة: 100 |
| Table title | البيانات المستخدمة في الرسم |
| Table columns | الوقت · الإشغال التقديري · النسبة من السعة · جودة البيانات |
| Quality label | بيانات تجريبية مكتملة |
| Accessible chart summary | يبدأ الإشغال التجريبي عند 8 أشخاص الساعة 6:00 ص، ويبلغ الذروة عند 84 شخصًا الساعة 8:00 م، ثم ينخفض إلى 18 شخصًا الساعة 1:30 ص. |

### Deterministic sample series

Use all rows in the line chart and the corresponding visible table. Time progresses in the reading direction: right-to-left in Arabic. Use Western digits and localized Arabic `ص/م`.

| Order | Time | Approximate occupancy | Percent of capacity | Data quality |
| ---: | --- | ---: | ---: | --- |
| 1 | 6:00 ص | 8 | 8% | بيانات تجريبية مكتملة |
| 2 | 8:00 ص | 19 | 19% | بيانات تجريبية مكتملة |
| 3 | 10:00 ص | 31 | 31% | بيانات تجريبية مكتملة |
| 4 | 12:00 م | 44 | 44% | بيانات تجريبية مكتملة |
| 5 | 2:00 م | 52 | 52% | بيانات تجريبية مكتملة |
| 6 | 4:00 م | 68 | 68% | بيانات تجريبية مكتملة |
| 7 | 6:00 م | 79 | 79% | بيانات تجريبية مكتملة |
| 8 | 8:00 م | 84 | 84% | بيانات تجريبية مكتملة |
| 9 | 10:00 م | 66 | 66% | بيانات تجريبية مكتملة |
| 10 | 12:00 ص | 39 | 39% | بيانات تجريبية مكتملة |
| 11 | 1:30 ص | 18 | 18% | بيانات تجريبية مكتملة |

This is a design dataset, not measured Fitway history. It deliberately omits derived crowd-band labels because real capacity thresholds remain site-measured and owner-configurable.

### Chart and table behavior evidence

- Plot the numeric values; do not use a decorative fake waveform.
- Preserve meaningful peaks; do not oversmooth the line.
- Show labeled axes and a capacity reference at `100` without implying an alert.
- The table contains the same values and order as the chart.
- Use text or patterns as well as color for band/series distinction.
- At least one table row or chart control on the states sheet must show visible keyboard focus.
- Include a missing-data gap, a closed period, and an empty/no-data example only on C1 as component states. Do not alter the complete A1 sample series.
- “Daily visits” and week-over-week are not needed on A1. If shown as supporting component samples, use the exact honesty phrase `تقدير عبور المدخل — ليس أعضاء فريدين` and label them preview fixtures. Do not fabricate a prediction or recommendation.

## C1 — interaction and motion copy

### Interaction labels

| State | Arabic | English |
| --- | --- | --- |
| Default | افتراضي | Default |
| Hover | مرور المؤشر | Hover |
| Keyboard focus | تركيز لوحة المفاتيح | Keyboard focus |
| Pressed | مضغوط | Pressed |
| Disabled | غير متاح | Disabled |
| Loading | جارٍ التنفيذ | Loading |
| Error | تعذر إكمال الإجراء | Action could not be completed |
| Success pattern | تم الحفظ | Saved |
| Pending command | الأمر قيد الانتظار | Command pending |

### Reduced-motion annotation

```text
الحركة المخفّضة: تظهر القيم والحالات فورًا، بدون نبض أو وميض أو انتقال عددي. لا تتغير المعلومات.
Reduced motion: values and states appear instantly, without pulse, shimmer, or number tween. Information is unchanged.
```

## Forbidden fixture drift

Reject any generated artboard that does one or more of the following:

- changes `37`, `37%`, Moderate, 2:59 PM, 30 seconds, or the Friday opening facts;
- exposes `100` capacity on the public surface;
- restores `حوالي`, `شخصًا`, `حوالي 37 شخصًا`, or a separate `حالة النادي الآن` label on the Arabic public-live composition;
- renders the Arabic open state as anything other than `النادي مفتوح الآن` or gives it a filled pill/button treatment;
- shows count/percent/meter/band in the closed or unavailable state;
- uses Eastern Arabic digits;
- changes Arabic public time to a 24-hour clock or omits `ص/م`;
- adds a trend, prediction, recommendation, class schedule, membership CTA, unique-member claim, or capacity alert;
- treats staff/analytics preview data as live production evidence;
- shows a successful staff mutation or invented backend response;
- changes the analytics series between directions;
- omits the analytics table or replaces the chart with decorative geometry.
