// QA: layout at 4 widths, images, privacy, copy rules, every Easter egg, certificate print.
// node scripts/qa.mjs [--thumbs] [--only a1,b2]   (serves dist/ itself under the configured base)
import { chromium, devices } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import sharp from 'sharp';

const BASE = process.env.SITE_BASE ?? '/boardybell.com/';
const ARGS = process.argv.slice(2);
const ONLY = ARGS.includes('--only') ? ARGS[ARGS.indexOf('--only') + 1].split(',') : null;
const IDS = ['a1', 'a2', 'a3', 'b1', 'b2', 'b3', 'c1', 'c2', 'c3', 'd1'].filter((i) => !ONLY || ONLY.includes(i));
const ARC = readFileSync('src/content/arcade.ts', 'utf8');
const GAMES = [...ARC.matchAll(/slug: '([^']+)'/g)].map((m) => m[1]);
const PAGES = [...IDS.map((i) => `i/${i}/`), ...(ONLY ? [] : ['', 'collection/', 'gallery/', 'gallery/plates/', ...['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n9', 'n10', 'n11', 'n12'].flatMap((n) => [`n/${n}/`, `n/${n}/collection/`]), 'arcade/', ...GAMES.map((g) => `arcade/${g}/`), 'certificate/', 'nope/'])];
const WIDTHS = [360, 768, 1280, 1920];
// Blocklist is base64 so the names themselves never appear in this public repo.
const FIRMS = new RegExp(Buffer.from('Ym9uZGJlbGx8YmVsbGFzc2V0fGJlbGxmYW1pbHl8YmVsbCBhc3NldHxiZWxsIGZhbWlseXxib25kIGJlbGwgJiBjb3xib25kIGJlbGwgYW5kIGNvfFxiQ1JEXGJ8ZmlucmF8c2VjXC5nb3Y=', 'base64').toString(), 'i');
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.txt': 'text/plain' };

const srv = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (!p.startsWith(BASE)) { res.writeHead(404); return res.end(); }
  p = join('dist', p.slice(BASE.length));
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  if (!existsSync(p)) { res.writeHead(404, { 'content-type': 'text/html' }); return res.end(readFileSync('dist/404.html')); }
  res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(readFileSync(p));
}).listen(0);
const ORIGIN = `http://127.0.0.1:${srv.address().port}`;
const url = (p, q = 'quiet') => `${ORIGIN}${BASE}${p}${q ? '?' + q : ''}`;

const fails = []; const fail = (where, msg) => { fails.push(`${where}: ${msg}`); };
mkdirSync('qa/shots', { recursive: true });

// ---------- static checks on dist ----------
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
const files = walk('dist');
for (const f of files.filter((f) => /\.(html|js|css|json|txt|svg)$/.test(f))) {
  const s = readFileSync(f, 'utf8');
  if (s.includes('—')) fail(f, 'contains an em dash');
  if (FIRMS.test(s.replace(/boardybell/gi, ''))) fail(f, `firm reference: ${s.match(FIRMS)[0]}`);
  if (f.endsWith('.html')) {
    if (!/<meta name="robots" content="noindex, nofollow/.test(s)) fail(f, 'missing noindex');
    if (/property="og:/.test(s)) fail(f, 'has Open Graph tags');
    if (/sitemap/i.test(s)) fail(f, 'mentions a sitemap');
  }
}
if (files.some((f) => /sitemap/i.test(f))) fail('dist', 'sitemap file present');
if (!readFileSync('dist/robots.txt', 'utf8').includes('Disallow: /')) fail('robots.txt', 'does not disallow');
for (const f of files.filter((f) => /\.(jpg|webp|avif|png)$/.test(f))) {
  const m = await sharp(f).metadata();
  if (m.exif || m.xmp || m.iptc) fail(f, 'image carries metadata');
}

// ---------- browser checks ----------
const browser = await chromium.launch();
const LAYOUT = () => {
  const out = [];
  const W = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth > W + 1) out.push(`horizontal overflow ${document.documentElement.scrollWidth} > ${W}`);
  const vis = (el) => { const s = getComputedStyle(el); return s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05; };
  const T = [...document.querySelectorAll('h1,h2,h3,p,li,dt,dd,figcaption,label>span,.label,button,a,th,td,input,textarea')]
    .filter((e) => vis(e) && !e.closest('.toast,.loader,.term,.sr,.skip,.gal-back,.y94-bar') && e.getClientRects().length);
  for (const e of T) {
    const r = e.getBoundingClientRect();
    if (r.width && !e.closest('.c-tbl-w,.c-chart-w') && (r.right > W + 1 || r.left < -1)) out.push(`offscreen: ${e.tagName}.${e.className} "${e.textContent.trim().slice(0, 40)}"`);
    const s = getComputedStyle(e);
    if (/hidden|clip/.test(s.overflowX) && e.scrollWidth > e.clientWidth + 2 && !/INPUT|TEXTAREA/.test(e.tagName)) out.push(`clipped: ${e.tagName} "${e.textContent.trim().slice(0, 40)}"`);
  }
  // text-on-text overlap between unrelated blocks
  const blocks = T.filter((e) => /^(H1|H2|H3|P|LI|DT|DD|FIGCAPTION|TH|TD)$/.test(e.tagName) && e.textContent.trim() && !e.closest('.c-tbl-w,.c-chart-w,.ag-ov'));
  const R = blocks.map((e) => e.getBoundingClientRect());
  for (let i = 0; i < blocks.length; i++) for (let j = i + 1; j < blocks.length; j++) {
    const a = blocks[i], b = blocks[j]; if (a.contains(b) || b.contains(a)) continue;
    const x = Math.min(R[i].right, R[j].right) - Math.max(R[i].left, R[j].left), y = Math.min(R[i].bottom, R[j].bottom) - Math.max(R[i].top, R[j].top);
    if (x > 4 && y > 4) out.push(`overlap: "${a.textContent.trim().slice(0, 30)}" / "${b.textContent.trim().slice(0, 30)}"`);
  }
  // text over images must be inside a designated overlay
  for (const img of document.querySelectorAll('img')) {
    if (!img.hasAttribute('alt')) out.push(`img without alt: ${img.src}`);
    if (!img.getAttribute('width') || !img.getAttribute('height')) out.push(`img without size: ${img.src}`);
    if (img.complete && img.naturalWidth === 0) out.push(`broken img: ${img.currentSrc || img.src}`);
  }
  return out;
};
const external = [];
for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 800 ? 780 : 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  page.on('request', (r) => { if (!r.url().startsWith(ORIGIN) && !r.url().startsWith('data:')) external.push(r.url()); });
  page.on('pageerror', (e) => fail(`${page.url()} @${w}`, `JS error ${e.message}`));
  for (const p of PAGES) {
    const resp = await page.goto(url(p), { waitUntil: 'networkidle' });
    if (p === 'nope/' && resp.status() !== 404) fail(p, `404 page status ${resp.status()}`);
    // scroll through so lazy images load, then back to top
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } scrollTo(0, 0); });
    await page.waitForLoadState('networkidle');
    for (const m of await page.evaluate(LAYOUT)) fail(`${p || 'gallery'} @${w}`, m);
    const name = (p || 'home').replace(/\//g, '_').replace(/_$/, '');
    await page.screenshot({ path: `qa/shots/${name}-${w}.png`, fullPage: true });
  }
  await ctx.close();
}
if (external.length) fail('network', `external requests: ${[...new Set(external)].join(', ')}`);

// ---------- Easter eggs (desktop keyboard + mobile touch) ----------
for (const mode of ['desktop', 'touch']) {
  const ctx = await browser.newContext(mode === 'touch' ? { ...devices['iPhone 13'], reducedMotion: 'reduce' } : { viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage(); const W = `eggs/${mode}`;
  page.on('pageerror', (e) => fail(W, `JS error ${e.message}`));
  for (const id of [...IDS, ...(ONLY ? [] : ['n/n6', 'n/n7', 'n/n8', 'n/n6/collection'])]) {
    await page.goto(url(id.startsWith('n/') ? `${id}/` : `i/${id}/`), { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    const tap = (sel) => (mode === 'touch' ? page.tap(sel) : page.click(sel));
    // redaction (D and all A/C variants have them; B has none by design)
    if (await page.$('.redact')) { await page.locator('.redact').first().scrollIntoViewIfNeeded(); await tap('.redact'); if ((await page.getAttribute('.redact', 'aria-expanded')) !== 'true') fail(`${W} ${id}`, 'redaction did not open'); }
    // guestbook
    await page.locator('.gb-b').scrollIntoViewIfNeeded(); await page.fill('.guestbook input', 'Test'); await tap('.gb-b');
    if (!(await page.textContent('.gb-r')).trim()) fail(`${W} ${id}`, 'guestbook gave no decline');
    // counter
    const before = await page.textContent('.counter-d'); await page.locator('.counter-d').scrollIntoViewIfNeeded(); await tap('.counter-d');
    if ((await page.textContent('.counter-d')) === before) fail(`${W} ${id}`, 'counter did not tick');
    // door
    if (!(await page.getAttribute('[data-egg=door]', 'href'))?.endsWith('/arcade/')) fail(`${W} ${id}`, 'door missing');
    // highlight swap
    const swapped = await page.evaluate(async () => { const el = document.querySelector('[data-swap]'); const r = document.createRange(); r.selectNodeContents(el); getSelection().removeAllRanges(); getSelection().addRange(r); await new Promise((z) => setTimeout(z, 700)); return el.hasAttribute('data-swapped'); });
    if (!swapped) fail(`${W} ${id}`, 'highlight swap did not fire');
    // terminal: backtick on desktop, long-press on the counter for touch
    if (mode === 'desktop') { await page.keyboard.press('`'); }
    else { await page.evaluate(async () => { const c = document.querySelector('.counter-d'); c.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); await new Promise((z) => setTimeout(z, 800)); c.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); }); }
    if (!(await page.$('.term'))) fail(`${W} ${id}`, 'terminal did not open');
    else { await page.fill('.term input', 'whoami'); await page.press('.term input', 'Enter'); if (!(await page.textContent('.term-o')).includes('Details withheld')) fail(`${W} ${id}`, 'terminal whoami'); await page.press('.term input', 'Escape'); }
    if (await page.$('.c-yr')) {
      for (let i = 0; i < 4; i++) await page.locator('.c-yr').first().click();
      if (!(await page.evaluate(() => JSON.parse(localStorage.getItem('bb.found') || '[]').includes('forecast')))) fail(`${W} ${id}`, 'year forecast egg did not fire');
    }
    if (mode === 'desktop') {
      await page.click('main', { position: { x: 5, y: 5 } }).catch(() => {}); await page.keyboard.type('boardy');
      if (!(await page.evaluate(() => JSON.parse(localStorage.getItem('bb.found') || '[]').includes('name')))) fail(`${W} ${id}`, 'typing boardy did not fire');
    }
    // Konami
    if (mode === 'desktop') {
      await page.click('main', { position: { x: 5, y: 5 } }).catch(() => {});
      // realistic: some noise first, an extra up, a held arrow (repeat), Shift+B for a capital B
      for (const k of ['x', 'ArrowDown', 'ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight']) await page.keyboard.press(k);
      await page.keyboard.press('Shift+B'); await page.keyboard.press('a');
    }
    else {
      await page.evaluate(() => {
        const sw = (dx, dy) => { const mk = (x, y) => new Touch({ identifier: 1, target: document.body, clientX: x, clientY: y });
          document.body.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [mk(200, 400)], changedTouches: [mk(200, 400)] }));
          document.body.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [mk(200 + dx, 400 + dy)] })); };
        [[0, 140], [0, -120], [0, 160], [5, 0], [0, -80], [0, -80], [0, 80], [0, 80], [-80, 0], [80, 0], [-80, 0], [80, 0], [0, 0], [0, 0]].forEach(([x, y]) => sw(x, y));
      });
    }
    await page.waitForTimeout(300);
    if (!(await page.evaluate(() => document.documentElement.classList.contains('y1994')))) fail(`${W} ${id}`, 'Konami did not fire');
    else {
      if (id === IDS[0]) await page.screenshot({ path: `qa/shots/1994-${mode}.png` });
      for (const m of await page.evaluate(LAYOUT)) if (/overflow/.test(m)) fail(`${W} ${id} 1994`, m);
      await tap('.y94-x');
      if (await page.evaluate(() => document.documentElement.classList.contains('y1994'))) fail(`${W} ${id}`, 'restore dignity failed');
    }
  }
  // lying loader, forced on
  await page.goto(url('i/a1/', 'loader'), { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => sessionStorage.clear()); await page.goto(url('i/a1/', 'loader'), { waitUntil: 'domcontentloaded' });
  if (!(await page.$('.loader'))) fail(W, 'loader did not appear'); else { await page.waitForTimeout(1300); if (mode === 'desktop') await page.screenshot({ path: 'qa/shots/loader.png' }); }
  // certificate shows the finds
  await page.goto(url('certificate/'), { waitUntil: 'networkidle' });
  const n = await page.$$eval('#clist li', (l) => l.length);
  if (n < 5) fail(W, `certificate lists only ${n} finds`);
  // 404 counts as a find
  await page.goto(url('nope/'), { waitUntil: 'networkidle' });
  if (!(await page.evaluate(() => JSON.parse(localStorage.getItem('bb.found') || '[]').includes('notfound')))) fail(W, '404 not recorded as a find');
  await ctx.close();
}

// ---------- arcade: every game starts, runs, pauses, ends, saves a score ----------
const GID = Object.fromEntries([...ARC.matchAll(/slug: '([^']+)', id: '([^']+)'/g)].map((m) => [m[1], m[2]]));
if (!ONLY) for (const mode of ['desktop', 'touch']) {
  const ctx = await browser.newContext(mode === 'touch' ? { ...devices['iPhone 13'] } : { viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage(); const W = `arcade/${mode}`;
  page.on('pageerror', (e) => fail(W, `JS error ${e.message}`));
  for (const g of GAMES) {
    await page.goto(url(`arcade/${g}/`), { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    if (mode === 'touch') await page.tap('#ag-start'); else await page.keyboard.press('Enter');
    if ((await page.evaluate(() => window.__arcade?.state)) !== 'play') { fail(`${W} ${g}`, 'did not start'); continue; }
    if (mode === 'desktop') { for (const k of ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', ' ']) { await page.keyboard.down(k); await page.waitForTimeout(250); await page.keyboard.up(k); } }
    else { const pad = await page.$$('[data-btn]'); if (!pad.length) fail(`${W} ${g}`, 'no touch pad'); for (const b of pad) await b.tap(); }
    await page.waitForTimeout(1500);
    const lit = await page.evaluate(() => { const c = document.getElementById('ag-cv'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 120) n++; return n; });
    if (lit < 300) fail(`${W} ${g}`, `canvas looks empty (${lit})`);
    if ((await page.evaluate(() => window.__arcade.state)) !== 'play') { /* game already ended during input (e.g. stacking miss) */ } else if (mode === 'desktop') { await page.keyboard.press('p'); if ((await page.evaluate(() => window.__arcade.state)) !== 'paused') fail(`${W} ${g}`, 'pause failed'); await page.keyboard.press('p'); }
    else { await page.tap('#ag-pausebtn'); if ((await page.evaluate(() => window.__arcade.state)) !== 'paused') fail(`${W} ${g}`, 'pause failed'); await page.tap('#ag-resume'); }
    if (mode === 'desktop') await page.screenshot({ path: `qa/shots/game-${g}.png` });
    await page.evaluate(() => { window.__arcade.score = 9999; window.__arcade.gameOver(); });
    if (await page.isHidden('#ag-init')) fail(`${W} ${g}`, 'no initials entry for a high score');
    else {
      await page.fill('#ag-in', 'qa'); await page.press('#ag-in', 'Enter');
      const top = await page.evaluate((id) => JSON.parse(localStorage.getItem('bb.hs.' + id) || '[]')[0], GID[g]);
      if (!top || top.n !== 'QA_' || top.s !== 9999) fail(`${W} ${g}`, `score not saved ${JSON.stringify(top)}`);
    }
    for (const m of await page.evaluate(LAYOUT)) if (/overflow|offscreen/.test(m)) fail(`${W} ${g}`, m);
  }
  await ctx.close();
}

// ---------- controller-button egg on the home page leads to the arcade ----------
if (!ONLY) for (const mode of ['desktop', 'touch']) {
  const ctx = await browser.newContext(mode === 'touch' ? { ...devices['iPhone 13'] } : { viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(url(''), { waitUntil: 'networkidle' });
  const b = page.locator('.joy-egg');
  if (!(await b.count())) fail(`button egg ${mode}`, 'no .joy-egg on the home page');
  else {
    await b.scrollIntoViewIfNeeded();
    const box = await b.boundingBox();
    if (!box || box.width < 24) fail(`button egg ${mode}`, `hit area too small (${box && box.width}px)`);
    await Promise.all([page.waitForURL(/\/arcade\/$/, { timeout: 5000 }).catch(() => fail(`button egg ${mode}`, 'did not navigate to the arcade')), mode === 'touch' ? b.tap() : b.click()]);
    if (!(await page.evaluate(() => JSON.parse(localStorage.getItem('bb.found') || '[]').includes('button')))) fail(`button egg ${mode}`, 'find not recorded');
  }
  await ctx.close();
}

// ---------- certificate prints on one page (Letter and A4) ----------
{
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  await page.goto(url('certificate/'), { waitUntil: 'networkidle' });
  await page.evaluate(() => { localStorage.setItem('bb.found', JSON.stringify(['door', 'konami', 'terminal', 'guestbook', 'highlight', 'redaction', 'counter', 'loader', 'notfound', 'y1994', 'tab', 'idle', 'name', 'forecast', 'print', 'lamp', 'button'])); localStorage.setItem('bb.certName', 'A Very Long Visitor Name Indeed, Esq.'); });
  await page.reload({ waitUntil: 'networkidle' });
  for (const format of ['Letter', 'A4']) {
    const pdf = await page.pdf({ format, preferCSSPageSize: false, printBackground: true });
    writeFileSync(`qa/shots/certificate-${format}.pdf`, pdf);
    const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    if (pages !== 1) fail(`certificate ${format}`, `prints on ${pages} pages`);
  }
  await ctx.close();
}

// ---------- gallery thumbnails ----------
if (ARGS.includes('--thumbs')) {
  mkdirSync('public/gallery', { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1600 }, reducedMotion: 'reduce' }); const page = await ctx.newPage();
  const THUMBS = [...IDS.map((id) => [id, `i/${id}/`]), ...(ONLY ? [] : [['n1', 'n/n1/'], ['n2', 'n/n2/'], ['n3', 'n/n3/'], ['n4', 'n/n4/'], ['n5', 'n/n5/'], ['n6', 'n/n6/'], ['n7', 'n/n7/'], ['n8', 'n/n8/'], ['n9', 'n/n9/'], ['n10', 'n/n10/'], ['n11', 'n/n11/'], ['n12', 'n/n12/'], ['c1', '']])];
  for (const [id, path] of THUMBS) {
    await page.goto(url(path), { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: '.gal-back{display:none!important}' });
    await sharp(await page.screenshot()).resize(800, 1000, { fit: 'cover', position: 'top' }).webp({ quality: 72 }).toFile(`public/gallery/${id}.webp`);
  }
  await ctx.close();
}

await browser.close(); srv.close();
const uniq = [...new Set(fails)];
writeFileSync('qa/report.txt', uniq.join('\n') + '\n');
console.log(uniq.length ? `FAIL ${uniq.length}\n` + uniq.slice(0, 80).join('\n') : 'PASS: all checks');
process.exit(uniq.length ? 1 : 0);
