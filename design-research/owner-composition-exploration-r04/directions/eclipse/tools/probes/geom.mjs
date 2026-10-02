// Extracted from D:/fitway-scratch/lane/work/geom.mjs; no server/CLI side effects.
// Daily chart only. Call page.evaluate(geometryProbe) after the page is ready.
export const geometryProbe = () => {
  const plot = document.querySelector("#plot");
  const chart = window.__eclipse?.chart;
  if (!plot || !chart) throw new Error("geometryProbe requires a ready Daily chart");
  const pr = plot.getBoundingClientRect();
  const card = document.querySelector(".chart").getBoundingClientRect();
  const tip = document.querySelector("#tip"), hs = [];
  try {
    for (const stop of chart.stops) {
      chart.select(stop.key);
      const box = tip.getBoundingClientRect();
      hs.push([stop.key, +box.height.toFixed(2), +box.width.toFixed(2)]);
    }
  } finally { chart.clear(); }
  const lab80 = [...document.querySelectorAll(".ax-y")].map((el) => {
    const box = el.getBoundingClientRect();
    return [el.textContent, +(box.top - pr.top).toFixed(2), +(box.bottom - pr.top).toFixed(2)];
  });
  const tag = document.querySelector("#peak-tag").getBoundingClientRect();
  const ln = [...document.querySelectorAll("[id^=ln-]")].map((el) => [el.id, +el.getBBox().y.toFixed(2)]);
  const usual = document.querySelector("#us-past").getBBox();
  return { W: plot.clientWidth, H: plot.clientHeight, cardH: card.height, plotTopInCard: pr.top - card.top, hs, lab80, tagTop: +(tag.top - pr.top).toFixed(2), lnTop: ln, usTop: +usual.y.toFixed(2), scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight] };
};
