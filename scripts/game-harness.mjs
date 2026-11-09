// Standalone headless test for one arcade game, no Astro build needed (safe to run several at once).
// Usage: node scripts/game-harness.mjs <id> [--seconds 20] [--shots /some/dir]
// Serves public/ and a minimal page with the same DOM the real game page has, then:
// starts the game, plays it with scripted keyboard input, checks for JS errors, checks the canvas
// keeps changing, pauses/resumes, forces game over + initials, and saves screenshots.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';

const id = process.argv[2];
if (!id) { console.error('usage: node scripts/game-harness.mjs <id> [--seconds N] [--shots DIR]'); process.exit(2); }
const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const SECS = +arg('--seconds', 20), SHOTS = arg('--shots', `qa/harness/${id}`);
mkdirSync(SHOTS, { recursive: true });
const MIME = { '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.html': 'text/html', '.png': 'image/png' };
const PAGE = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/fonts/fonts.css">
<style>body{background:#07060c;color:#fff;margin:0;font-family:monospace}#ag-cv{width:480px;height:640px;image-rendering:pixelated;display:block}.ag-ov[hidden]{display:none}.ag-ov{position:absolute;top:0;left:0;width:480px;background:rgba(0,0,0,.6)}</style></head><body>
<button id="ag-sound">SOUND OFF</button><button id="ag-pausebtn">II</button>
<div style="position:relative"><canvas id="ag-cv" width="240" height="320" tabindex="0"></canvas>
<section class="ag-ov" id="ag-title"><button id="ag-start">PRESS START</button><ol data-scores></ol></section>
<section class="ag-ov" id="ag-pause" hidden><button id="ag-resume">RESUME</button></section>
<section class="ag-ov" id="ag-over" hidden><p id="ag-over-msg"></p><b id="ag-over-score"></b><form id="ag-init" hidden><input id="ag-in" maxlength="3"><button>SAVE</button></form><ol data-scores></ol><button id="ag-again">AGAIN</button></section></div>
<div><button data-btn="up">U</button><button data-btn="left">L</button><button data-btn="right">R</button><button data-btn="down">D</button><button data-btn="act">A</button></div>
<script type="module" src="/arcade/games/${id}.js"></script></body></html>`;
const srv = createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  if (u === '/' || u === '/__h.html') { r.writeHead(200, { 'content-type': 'text/html' }); return r.end(PAGE); }
  let p = join('public', u); if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  if (!existsSync(p)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); r.end(readFileSync(p));
}).listen(0);
const O = `http://127.0.0.1:${srv.address().port}/`;
const problems = []; const note = [];
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 520, height: 760 } });
pg.on('pageerror', (e) => problems.push('JS error: ' + e.message));
pg.on('console', (m) => { if (m.type() === 'error') problems.push('console error: ' + m.text()); });
await pg.goto(O, { waitUntil: 'networkidle' });
const st = () => pg.evaluate(() => window.__arcade?.state);
if (!(await pg.evaluate(() => !!window.__arcade))) problems.push('boot() did not run (window.__arcade missing)');
await pg.screenshot({ path: `${SHOTS}/0-title.png` });
await pg.keyboard.press('Enter');
if ((await st()) !== 'play') problems.push(`Enter did not start the game (state=${await st()})`);
const snap = () => pg.evaluate(() => { const c = document.getElementById('ag-cv'); return c.toDataURL().length + ':' + c.getContext('2d').getImageData(0, 0, 240, 320).data.reduce((a, v, i) => (i % 97 ? a : a + v), 0); });
const KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'ArrowUp', ' ', 'ArrowRight', 'ArrowLeft', 'ArrowDown'];
const seen = new Set(); let overs = 0, restarts = 0;
const t0 = Date.now(); let k = 0, shot = 1;
while (Date.now() - t0 < SECS * 1000) {
  const key = KEYS[k++ % KEYS.length];
  await pg.keyboard.down(key); await pg.waitForTimeout(80 + (k % 5) * 60); await pg.keyboard.up(key); await pg.waitForTimeout(60);
  seen.add(await snap());
  if (k % 25 === 0 && shot < 4) await pg.screenshot({ path: `${SHOTS}/${shot++}-play.png` });
  if ((await st()) === 'over') { overs++; await pg.screenshot({ path: `${SHOTS}/over-${overs}.png` }); await pg.click('#ag-again'); restarts++; if ((await st()) !== 'play') problems.push('PLAY AGAIN did not restart'); }
}
if (seen.size < 5) problems.push(`canvas barely changed during play (${seen.size} distinct frames)`);
// pause / resume
if ((await st()) === 'play') {
  await pg.keyboard.press('p'); if ((await st()) !== 'paused') problems.push('P did not pause');
  const a = await snap(); await pg.waitForTimeout(400); if ((await snap()) !== a) note.push('canvas still changes while paused (ok only if it is a pure animation)');
  await pg.keyboard.press('p'); if ((await st()) !== 'play') problems.push('P did not resume');
}
// forced game over + initials
await pg.evaluate(() => { window.__arcade.score = 4242; window.__arcade.gameOver('TEST'); });
if (await pg.isHidden('#ag-init')) problems.push('high score did not offer initials');
else { await pg.fill('#ag-in', 'abc'); await pg.press('#ag-in', 'Enter'); const list = await pg.evaluate((i) => JSON.parse(localStorage.getItem('bb.hs.' + i) || '[]'), id); if (!list.some((e) => e.s === 4242)) problems.push('score not saved under bb.hs.' + id + ' (does game.id match the file name?)'); }
// touch-pad buttons must not throw
await pg.click('#ag-again'); for (const btn of ['up', 'left', 'right', 'down', 'act']) await pg.click(`[data-btn=${btn}]`);
await pg.screenshot({ path: `${SHOTS}/9-end.png` });
await b.close(); srv.close();
console.log(JSON.stringify({ id, ok: problems.length === 0, problems, notes: note, distinctFrames: seen.size, gameOvers: overs, shots: SHOTS }, null, 1));
process.exit(problems.length ? 1 : 0);
