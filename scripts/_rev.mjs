import { chromium, devices } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
const B = '/boardybell.com/', OUT = process.argv[2];
const T = { '.avif': 'image/avif', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const srv = createServer((q, r) => { let p = join('dist', decodeURIComponent(q.url.split('?')[0]).slice(B.length)); if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html'); if (!existsSync(p)) { r.writeHead(404, { 'content-type': 'text/html' }); return r.end(readFileSync('dist/404.html')); } r.writeHead(200, { 'content-type': T[p.slice(p.lastIndexOf('.'))] || 'text/html' }); r.end(readFileSync(p)); }).listen(0);
const O = `http://127.0.0.1:${srv.address().port}${B}`;
const b = await chromium.launch();
async function full(path, name, opts, slice) {
  const pg = await b.newPage({ ...opts, reducedMotion: 'reduce' });
  await pg.goto(O + path + '?quiet', { waitUntil: 'networkidle' });
  await pg.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } scrollTo(0, 0); });
  await pg.waitForLoadState('networkidle'); await pg.waitForTimeout(300);
  const buf = await pg.screenshot({ fullPage: true }); const m = await sharp(buf).metadata();
  for (let y = 0, i = 1; y < m.height; y += slice, i++) await sharp(buf).extract({ left: 0, top: y, width: m.width, height: Math.min(slice, m.height - y) }).jpeg({ quality: 80 }).toFile(`${OUT}/${name}-${String(i).padStart(2, '0')}.jpg`);
  await pg.close();
}
await full('', 'home-desktop', { viewport: { width: 1280, height: 900 } }, 1500);
await full('', 'home-phone', { ...devices['iPhone 13'] }, 2400);
await full('collection/', 'collection-desktop', { viewport: { width: 1280, height: 900 } }, 1800);
await full('arcade/', 'arcade-menu', { viewport: { width: 1280, height: 900 } }, 2000);
await full('arcade/tax-man/', 'game-title', { viewport: { width: 1280, height: 900 } }, 2000);
await full('certificate/', 'certificate', { viewport: { width: 1280, height: 900 } }, 2000);
await full('nope/', 'not-found', { viewport: { width: 1280, height: 900 } }, 2000);
await b.close(); srv.close();
