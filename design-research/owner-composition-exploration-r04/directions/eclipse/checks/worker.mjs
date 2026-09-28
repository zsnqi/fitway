import { chromium } from './browser.mjs';
import { collectRest } from './rest.mjs';
import { collectWalk } from './walk.mjs';
import { collectHover } from './hover.mjs';
import { collectNohist } from './nohist.mjs';
import { KEYS } from './constants.mjs';
import { readFile } from 'node:fs/promises';
import { configName } from './constants.mjs';

const browser = await chromium.launch();
process.on('message', async message => {
  if (message.stop) { await browser.close(); process.disconnect(); return; }
  try {
    const { kind, payload } = message;
    if (kind === 'rest') await collectRest(browser, payload);
    else if (kind === 'hover') await collectHover(browser, payload);
    else if (kind === 'nohist') await collectNohist(browser, payload);
    else if (kind === 'walk') {
      const rest = JSON.parse(await readFile(`${payload.OUT}/sweep/${payload.ver}/${configName(payload)}.json`, 'utf8'));
      const plan = new Map(KEYS.map(key => [key, []]));
      for (let i = 0; i + 1 < rest.snaps.length; i++) {
        const a = rest.snaps[i], b = rest.snaps[i + 1], next = new Map(b.rows.map(r => [r.key, r]));
        const current = new Map(a.rows.map(r => [r.key, r]));
        for (const key of KEYS) {
          const r0 = current.get(key), r1 = next.get(key);
          const changed = a.tipW !== b.tipW || !!r0 !== !!r1 || r0 && r1 &&
            (r0.hidden !== r1.hidden || r0.text !== r1.text || ['l', 't', 'w', 'h'].some(k => Math.abs(r0[k] - r1[k]) > 0.001));
          if (changed) plan.get(key).push(a.nowM);
        }
      }
      for (const key of KEYS) {
        await collectWalk(browser, { ...payload, key, captureMinutes: plan.get(key) });
        process.send({ progress: true, key });
      }
    } else throw new Error(`Unknown worker job: ${kind}`);
    process.send({ done: true });
  } catch (error) {
    for (const context of browser.contexts()) await context.close().catch(() => {});
    process.send({ error: error.stack || String(error) });
  }
});
process.send({ ready: true });
