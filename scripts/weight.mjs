// First-load transfer per iteration (no scrolling), desktop 1920 and phone 390.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
const BASE = '/boardybell.com/';
const srv = createServer((q, r) => { let p = join('dist', decodeURIComponent(q.url.split('?')[0]).slice(BASE.length)); if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html'); if (!existsSync(p)) { r.writeHead(404); return r.end(); } const b = readFileSync(p); r.writeHead(200, { 'content-type': p.endsWith('.avif') ? 'image/avif' : p.endsWith('.woff2') ? 'font/woff2' : p.endsWith('.js') ? 'text/javascript' : p.endsWith('.css') ? 'text/css' : 'text/html' }); r.end(b); }).listen(0);
const O = `http://127.0.0.1:${srv.address().port}${BASE}`;
const b = await chromium.launch(); let worst = 0;
for (const [w, h] of [[1920, 1080], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 500 ? 3 : 1 }); const pg = await ctx.newPage();
  for (const id of ['a1', 'a2', 'a3', 'b1', 'b2', 'b3', 'c1', 'c2', 'c3', 'd1']) {
    let n = 0; pg.removeAllListeners('response'); pg.on('response', async (r) => { try { n += (await r.body()).length; } catch {} });
    await pg.goto((id === 'c1' ? `${O}?quiet` : `${O}i/${id}/?quiet`), { waitUntil: 'networkidle' }); await pg.waitForTimeout(200);
    worst = Math.max(worst, n); process.stdout.write(`${id}@${w}:${Math.round(n / 1024)}KB  `);
  }
  console.log();
  await ctx.close();
}
await b.close(); srv.close(); console.log('worst', Math.round(worst / 1024), 'KB');
