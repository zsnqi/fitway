// Extracted from D:/fitway-scratch/lane/work/a11y.mjs; reusable Daily measurement.
// This records ARIA snapshots/keyboard states, not an automated WCAG audit.
// As in the source, advances three synthetic readings; use a disposable context.
export async function accessibilityProbe(page, { lang = "ar", control = true } = {}) {
  const snapshots = {};
  snapshots.idle = await page.locator("body").ariaSnapshot();
  await page.focus("#plot-hit");
  snapshots.focus = await page.locator("body").ariaSnapshot();
  for (let i = 0; i < 5; i++) await page.keyboard.press(lang === "ar" ? "ArrowRight" : "ArrowLeft");
  snapshots.keys = await page.locator("body").ariaSnapshot();
  await page.keyboard.press("Home");
  snapshots.home = await page.locator("body").ariaSnapshot();
  await page.evaluate(() => { for (let i = 0; i < 3; i++) window.__eclipse.motion.step(); });
  snapshots.reading = await page.locator("body").ariaSnapshot();
  snapshots.slider = await page.evaluate(() => [...document.querySelector("#plot-hit").attributes].map((a) => `${a.name}=${a.value}`).join(" | "));
  snapshots.hiddenMeasure = await page.evaluate(() => {
    const measure = document.querySelector(".tip-measure");
    return measure ? { ariaHidden: measure.getAttribute("aria-hidden"), children: measure.children.length } : null;
  });
  let detected = null;
  if (control) {
    const label = page.locator("#details-btn span");
    const original = await label.textContent();
    try {
      await label.evaluate((el) => { el.textContent += " x"; });
      snapshots.controlChanged = await page.locator("body").ariaSnapshot();
      detected = snapshots.controlChanged !== snapshots.reading;
    } finally { await label.evaluate((el, text) => { el.textContent = text; }, original); }
  }
  return { snapshots, control: { detected } };
}
