import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { configName } from './constants.mjs';

// Each worker owns one Chromium browser process. Configuration jobs never share a context or clock.
export async function runPool(jobs, workers, label) {
  if (!jobs.length) return;
  let next = 0, finished = 0;
  const children = [];
  const failures = [];
  try {
    await Promise.all(Array.from({ length: Math.min(workers, jobs.length) }, () => new Promise((resolve, reject) => {
      const child = fork(fileURLToPath(new URL('./worker.mjs', import.meta.url)), [], {
        execPath: process.execPath, windowsHide: true, stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
      });
      children.push(child);
      let current = null, stopping = false;
      const dispatch = () => {
        if (next < jobs.length) { current = jobs[next++]; child.send(current); }
        else { stopping = true; child.send({ stop: true }); }
      };
      child.on('message', m => {
        if (m.ready) dispatch();
        else if (m.progress) {
          if (['h0', 'h570', 'latest'].includes(m.key)) console.log(`${label}: ${configName(current.payload)} through ${m.key}`);
        } else if (m.done || m.error) {
          finished++;
          if (m.error) failures.push({ job: current, error: m.error });
          console.log(`${label}: ${finished}/${jobs.length} ${current.kind} ${current.payload.ver.slice(0, 7)} ${configName(current.payload)}${m.error ? ' FAILED' : ''}`);
          dispatch();
        }
      });
      child.on('error', reject);
      child.on('exit', code => stopping && code === 0 ? resolve() : reject(new Error(`Browser worker exited ${code}`)));
    })));
  } finally {
    for (const child of children) if (child.exitCode === null) child.kill();
  }
  if (failures.length) throw new Error(`${failures.length} collection jobs failed:\n${failures.map(f => f.error).join('\n')}`);
}
