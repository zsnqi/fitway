import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdir, readFile, realpath, readdir } from 'node:fs/promises';
import { realpathSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ECLIPSE } from './constants.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
export function git(args, options = {}) {
  return execFileSync('git', args, { cwd: ROOT, windowsHide: true, encoding: 'utf8', ...options });
}
export function commit(ref) {
  if (!ref || ref.startsWith('-')) throw new Error('A Git revision is required');
  return git(['rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`]).trim();
}
export function realish(p) {
  const parts = [];
  let cur = path.resolve(p);
  while (!existsSync(cur)) { parts.unshift(path.basename(cur)); const parent = path.dirname(cur); if (parent === cur) throw new Error(`Cannot resolve ${p}`); cur = parent; }
  return path.join(realpathSync.native(cur), ...parts);
}
export function within(p, root) {
  const relative = path.relative(realish(root), realish(p));
  return relative !== '' && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}
export async function prepareOut(out) {
  if (/^(\\\\|\/\/)/.test(out)) throw new Error('Use a local output directory');
  const absolute = realish(out);
  if (absolute === realish(ROOT) || within(absolute, ROOT)) throw new Error('Output must be outside the repository');
  // Do not overwrite results or write reports into any other working tree.
  let ancestor = absolute;
  while (!existsSync(ancestor)) ancestor = path.dirname(ancestor);
  for (let p = ancestor; ; p = path.dirname(p)) {
    if (existsSync(path.join(p, '.git'))) throw new Error('Output must be outside every Git working tree');
    if (path.dirname(p) === p) break;
  }
  if (existsSync(absolute) && (await readdir(absolute)).length) throw new Error('--out must be new or empty');
  await mkdir(absolute, { recursive: true });
  return realpath(absolute);
}
export async function archiveRevision(out, sha, label) {
  const root = path.join(out, 'archives', label);
  await mkdir(root, { recursive: true });
  const tar = path.join(out, 'archives', `${label}.tar`);
  git(['archive', '--format=tar', `--output=${tar}`, sha, ECLIPSE]);
  execFileSync('tar', ['-xf', tar, '-C', root], { windowsHide: true, stdio: 'pipe' });
  const directory = path.join(root, ECLIPSE);
  for (const name of ['index.html', 'style.css', 'app.js', 'capture.mjs']) await readFile(path.join(directory, name));
  return { ver: sha, root, directory };
}
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.json': 'application/json' };
export async function serve(directory) {
  for (let port = 3180; port <= 3189; port++) {
    const server = createServer(async (request, response) => {
      try {
        const url = new URL(request.url || '/', `http://127.0.0.1:${port}`);
        const file = path.resolve(directory, `.${decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)}`);
        if (!within(file, directory)) { response.writeHead(403).end(); return; }
        if (url.pathname === '/favicon.ico') { response.writeHead(204).end(); return; }
        response.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
        response.end(await readFile(file));
      } catch { if (!response.headersSent) response.writeHead(404); response.end('not found'); }
    });
    try {
      await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
      return { server, port, origin: `http://127.0.0.1:${port}` };
    } catch (error) { if (error.code !== 'EADDRINUSE') throw error; }
  }
  throw new Error('No free harness port in 3180-3189');
}
