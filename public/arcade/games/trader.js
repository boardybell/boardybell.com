// Bond Trader: a travelling-trader game in a fictional office building. Fictional goods, fictional prices.
import { boot, PAL } from '../engine.js';
const DAYS = 30, CAP0 = 50, RATE = 0.03;
const GOODS = [
  { name: 'STAPLERS', base: 24, vol: 0.2 }, { name: 'DESK CHAIRS', base: 160, vol: 0.25 }, { name: 'TONER', base: 70, vol: 0.3 },
  { name: 'RUBBER STAMPS', base: 9, vol: 0.25 }, { name: 'LANYARDS', base: 3, vol: 0.35 }, { name: 'FICUS PLANTS', base: 420, vol: 0.3 },
];
const DIST = ['THE ANNEX', 'LOWER MEZZANINE', 'THE CAFETERIA', 'SUBBASEMENT B', 'THE EAST WING', 'THE ROOFTOP'];
const UP = [
  (g) => `A ${g} SHORTAGE HAS BEEN ANNOUNCED. NOBODY IS SURE BY WHOM.`,
  (g) => `A MEMO DECLARES ${g} ESSENTIAL. THE MEMO IS NOT SIGNED.`,
  (g) => `A NEW HIRE HAS ASKED WHERE THE ${g} ARE. DEMAND FOLLOWS.`,
  (g) => `${g} HAVE BEEN MENTIONED IN A MEETING. PRICES RESPOND.`,
];
const DOWN = [
  (g) => `A STOREROOM OF ${g} HAS BEEN FOUND BEHIND A WALL.`,
  (g) => `A REVIEW FINDS ${g} ARE NOT, STRICTLY, NEEDED.`,
  (g) => `A DEPARTMENT IS CLEARING OUT ITS ${g}. IT GIVES NO REASON.`,
  (g) => `${g} HAVE GONE OUT OF FASHION. NOBODY NOTICED THEM GO IN.`,
];
const MISC = [
  () => { const g = s.held.findIndex((h) => h > 0); if (g < 0) return 'A COLLEAGUE ASKS TO BORROW SOMETHING. YOU HAVE NOTHING. THEY LEAVE.'; const n = Math.max(1, Math.ceil(s.held[g] / 5)); s.held[g] -= n; return `A COLLEAGUE BORROWS ${n} ${GOODS[g].name}. THEY WILL NOT BE RETURNED.`; },
  () => { if (s.cap > CAP0) return 'A RELATIVE CALLS TO ASK ABOUT THE LOAN. YOU DISCUSS THE WEATHER.'; s.cap = 75; return 'YOU FIND A LARGER CART IN A CORRIDOR. CART CAPACITY IS NOW 75.'; },
  () => 'A RELATIVE CALLS TO ASK ABOUT THE LOAN. YOU DISCUSS THE WEATHER.',
  () => { s.cr += 40; return 'YOU FIND 40 CREDITS IN A DESK DRAWER. THE DESK DOES NOT OBJECT.'; },
];
let s;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const r = (a, b) => a + Math.random() * (b - a);
function wrap(str, n = 28) {
  const out = []; let line = '';
  for (const w of String(str).split(' ')) { if (!line) line = w; else if ((line + ' ' + w).length <= n) line += ' ' + w; else { out.push(line); line = w; } }
  if (line) out.push(line); return out;
}
const used = () => s.held.reduce((a, b) => a + b, 0);
const price = (g, d = s.at) => s.px[d][g];
const worth = () => s.cr + s.held.reduce((a, h, g) => a + h * price(g), 0) - Math.round(s.loan);

function newPrices() {
  s.drift = s.drift.map((v) => clamp(v * r(0.92, 1.08), 0.55, 1.7));
  s.px = DIST.map((_, d) => GOODS.map((g, i) => Math.max(1, Math.round(g.base * s.bias[d][i] * s.drift[i] * r(1 - g.vol, 1 + g.vol)))));
  DIST.forEach((_, d) => GOODS.forEach((_, g) => { const h = s.hist[d][g]; h.push(s.px[d][g]); if (h.length > 12) h.shift(); }));
}
function arrive(eng) {
  s.news = null;
  const roll = Math.random();
  if (roll < 0.34) {
    const g = Math.floor(Math.random() * GOODS.length), up = Math.random() < 0.5, nm = GOODS[g].name;
    s.px[s.at][g] = Math.max(1, Math.round(s.px[s.at][g] * (up ? r(2.2, 3.2) : r(0.25, 0.42))));
    const h = s.hist[s.at][g]; h[h.length - 1] = s.px[s.at][g];
    s.news = { t: pick(up ? UP : DOWN)(nm), c: up ? PAL.green : PAL.red };
  } else if (roll < 0.46) s.news = { t: pick(MISC)(), c: PAL.cyan };
  if (s.news) { s.mode = 'news'; eng.beep(880, 0.06); eng.beep(660, 0.08); }
}

const game = {
  id: 'trader',
  reset(eng) {
    s = { day: 1, at: 0, cr: 500, loan: 500, cap: CAP0, held: GOODS.map(() => 0), qty: 0, cur: 0, mode: 'market', dcur: 1, rep: 0, hold: 0, travelT: 0, news: null,
      bias: DIST.map(() => GOODS.map(() => r(0.7, 1.35))), drift: GOODS.map(() => 1), hist: DIST.map(() => GOODS.map(() => [])), flash: 0 };
    for (let i = 0; i < 6; i++) newPrices();
    s.news = { t: 'A RELATIVE HAS LENT YOU 500 CREDITS AT 3% A DAY. THEY WOULD LIKE IT BACK. YOU HAVE 30 DAYS.', c: PAL.gold }; s.mode = 'news';
  },
  update(eng) {
    const p = eng.pressed, k = eng.keys;
    // auto-repeat for left/right
    const dir = (p.right ? 1 : 0) - (p.left ? 1 : 0);
    if (k.left || k.right) s.hold++; else s.hold = 0;
    const rep = dir || (s.hold > 18 && s.hold % 3 === 0 ? (k.right ? 1 : 0) - (k.left ? 1 : 0) : 0);
    if (s.flash) s.flash--;
    if (s.mode === 'news') { if (p.act) { s.mode = 'market'; s.qty = 0; eng.beep(440, 0.04); } return; }
    if (s.mode === 'final') { if (p.act) eng.gameOver(s.score >= 2000 ? 'BOOKS CLOSED' : s.score > 0 ? 'NUMBERS ACCEPTED' : 'BOOKS UNBALANCED'); return; }
    if (s.mode === 'travel') {
      if (s.travelT) { if (--s.travelT === 0) { s.day++; s.loan *= 1 + RATE; newPrices(); s.mode = 'market'; s.qty = 0; arrive(eng); } return; }
      if (p.up) s.dcur = (s.dcur + DIST.length) % (DIST.length + 1);
      if (p.down) s.dcur = (s.dcur + 1) % (DIST.length + 1);
      if (p.up && s.dcur === s.at) s.dcur = (s.dcur + DIST.length) % (DIST.length + 1);
      if (p.down && s.dcur === s.at) s.dcur = (s.dcur + 1) % (DIST.length + 1);
      if (p.up || p.down) eng.beep(330, 0.03);
      if (p.act) { if (s.dcur === DIST.length) s.mode = 'market'; else { s.from = s.at; s.at = s.dcur; s.travelT = 70; eng.beep(523, 0.08); } }
      return;
    }
    // market: rows 0..5 goods, 6 travel/close, 7 repay
    const rows = 8;
    if (p.up) { s.cur = (s.cur + rows - 1) % rows; s.qty = 0; eng.beep(330, 0.03); }
    if (p.down) { s.cur = (s.cur + 1) % rows; s.qty = 0; eng.beep(330, 0.03); }
    if (s.cur < 6) {
      const g = s.cur, pr = price(g), maxBuy = Math.min(Math.floor(s.cr / pr), s.cap - used());
      if (rep) { s.qty = clamp(s.qty + rep, -s.held[g], maxBuy); eng.beep(rep > 0 ? 700 : 500, 0.02); }
      if (p.act && s.qty) {
        s.cr -= s.qty * pr; s.held[g] += s.qty; s.flash = 30; s.last = s.qty > 0 ? `BOUGHT ${s.qty}` : `SOLD ${-s.qty}`;
        eng.beep(s.qty > 0 ? 600 : 900, 0.06); eng.beep(s.qty > 0 ? 800 : 1200, 0.08); s.qty = 0; score(eng);
      } else if (p.act) eng.beep(150, 0.06);
    } else if (s.cur === 6) {
      if (p.act) { if (s.day >= DAYS) finish(eng); else { s.mode = 'travel'; s.dcur = (s.at + 1) % DIST.length; eng.beep(440, 0.05); } }
    } else {
      const owe = Math.ceil(s.loan), max = Math.min(owe, s.cr);
      if (!s.repay || s.repay > max) s.repay = max;
      if (rep) { s.repay = clamp(s.repay + rep * 50, Math.min(50, max), max); eng.beep(600, 0.02); }
      if (p.act && s.repay > 0) { s.cr -= s.repay; s.loan = Math.max(0, s.loan - s.repay); s.flash = 30; s.last = `REPAID ${s.repay}`; s.repay = 0; eng.beep(1000, 0.1); score(eng); }
    }
  },
  draw(eng, ctx) {
    const { text } = eng;
    text(ctx, 'DAY ' + String(s.day).padStart(2, '0') + '/' + DAYS, 6, 5, PAL.cyan);
    text(ctx, s.cr + ' CR', 234, 5, PAL.gold, 'right');
    text(ctx, s.mode === 'travel' && s.travelT ? 'IN TRANSIT' : DIST[s.at], 120, 16, PAL.ink, 'center');
    ctx.fillStyle = '#1d2747'; ctx.fillRect(0, 26, 240, 1);
    if (s.mode === 'final') return drawFinal(eng, ctx);
    if (s.mode === 'travel') return drawTravel(eng, ctx);
    // market table
    text(ctx, 'GOOD', 16, 32, PAL.grey); text(ctx, 'PRICE', 184, 32, PAL.grey, 'right'); text(ctx, 'HELD', 234, 32, PAL.grey, 'right');
    GOODS.forEach((g, i) => {
      const y = 46 + i * 13, sel = i === s.cur, h = s.hist[s.at][i], prev = h[h.length - 2] ?? h[h.length - 1], now = price(i);
      if (sel) { ctx.fillStyle = '#131c44'; ctx.fillRect(0, y - 3, 240, 13); cursor(ctx, 5, y); }
      text(ctx, g.name, 16, y, sel ? PAL.ink : '#b7bccb');
      text(ctx, String(now), 184, y, now > prev ? PAL.green : now < prev ? PAL.red : PAL.ink, 'right');
      text(ctx, String(s.held[i]), 234, y, s.held[i] ? PAL.ink : '#4a4f60', 'right');
    });
    const ry = 46 + 6 * 13 + 4;
    [s.day >= DAYS ? 'CLOSE THE BOOKS' : 'TRAVEL (1 DAY)', 'REPAY THE RELATIVE'].forEach((t, j) => {
      const y = ry + j * 13, sel = s.cur === 6 + j;
      if (sel) { ctx.fillStyle = '#131c44'; ctx.fillRect(0, y - 3, 240, 13); cursor(ctx, 5, y); }
      text(ctx, t, 16, y, sel ? PAL.gold : '#b7bccb');
    });
    // action line
    const ay = ry + 32;
    ctx.fillStyle = '#1d2747'; ctx.fillRect(0, ay - 5, 240, 1);
    if (s.flash) text(ctx, s.last, 120, ay, PAL.green, 'center');
    else if (s.cur < 6) {
      const pr = price(s.cur);
      if (!s.qty) text(ctx, s.held[s.cur] ? 'LEFT SELL / RIGHT BUY' : 'RIGHT TO BUY', 120, ay, PAL.grey, 'center');
      else text(ctx, `${s.qty > 0 ? 'BUY' : 'SELL'} ${Math.abs(s.qty)} = ${Math.abs(s.qty) * pr} CR`, 120, ay, s.qty > 0 ? PAL.cyan : PAL.pink, 'center');
      if (s.qty) text(ctx, 'SPACE TO CONFIRM', 120, ay + 11, PAL.grey, 'center');
    } else if (s.cur === 6) text(ctx, s.day >= DAYS ? 'END THE GAME AND TALLY' : 'SPACE TO PICK A DISTRICT', 120, ay, PAL.grey, 'center');
    else { const max = Math.min(Math.ceil(s.loan), s.cr); text(ctx, s.loan < 1 ? 'NOTHING IS OWED' : `REPAY ${Math.min(s.repay || max, max)} CR`, 120, ay, PAL.cyan, 'center'); if (s.loan >= 1) text(ctx, 'LEFT/RIGHT, SPACE', 120, ay + 11, PAL.grey, 'center'); }
    // sparkline
    const g = Math.min(s.cur, 5), h = s.hist[s.at][g], sy = ay + 28, sh = 34;
    text(ctx, GOODS[g].name + ', 12 DAYS', 6, sy, PAL.grey);
    ctx.strokeStyle = '#1d2747'; ctx.strokeRect(6.5, sy + 11.5, 227, sh);
    const lo = Math.min(...h), hi = Math.max(...h), span = Math.max(1, hi - lo);
    ctx.fillStyle = PAL.cyan;
    let px = null, py = null;
    h.forEach((v, i) => {
      const x = 10 + Math.round((i * 219) / Math.max(1, h.length - 1)), y = sy + 14 + Math.round((1 - (v - lo) / span) * (sh - 6));
      if (px != null) line(ctx, px, py, x, y);
      px = x; py = y;
    });
    ctx.fillStyle = PAL.gold; ctx.fillRect(px - 1, py - 1, 3, 3);
    text(ctx, 'HI ' + hi, 232, sy, PAL.grey, 'right');
    // footer
    const fy = 300;
    text(ctx, `CART ${used()}/${s.cap}`, 6, fy, used() >= s.cap ? PAL.red : PAL.ink);
    text(ctx, `OWED ${Math.ceil(s.loan)}`, 234, fy, s.loan > 0 ? PAL.orange : PAL.green, 'right');
    if (s.mode === 'news') box(eng, ctx, s.news.t, s.news.c);
  },
};
function score(eng) { eng.score = Math.max(0, worth()); }
function finish(eng) {
  s.score = worth(); eng.score = Math.max(0, s.score); s.mode = 'final'; eng.beep(523, 0.1); eng.beep(659, 0.1); eng.beep(784, 0.2);
}
function line(ctx, x0, y0, x1, y1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= n; i++) ctx.fillRect(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), 1, 1);
}
function cursor(ctx, x, y) { ctx.fillStyle = PAL.gold; for (let i = 0; i < 4; i++) ctx.fillRect(x + i, y + i, 1, 8 - i * 2); }
function box(eng, ctx, t, c) {
  const lines = wrap(t, 26), h = lines.length * 11 + 26, y = 160 - h / 2;
  ctx.fillStyle = 'rgba(7,6,12,.7)'; ctx.fillRect(0, 27, 240, 293);
  ctx.fillStyle = '#0d1230'; ctx.fillRect(4, y, 232, h); ctx.strokeStyle = c; ctx.strokeRect(4.5, y + 0.5, 231, h - 1);
  lines.forEach((l, i) => eng.text(ctx, l, 12, y + 8 + i * 11, c));
  if ((eng.t >> 4) & 1 || eng.state !== 'play') eng.text(ctx, 'SPACE', 228, y + h - 12, PAL.grey, 'right');
}
function drawTravel(eng, ctx) {
  const { text } = eng;
  if (s.travelT) {
    // a cart crossing a corridor
    const t = 1 - s.travelT / 70, x = 20 + t * 180;
    ctx.fillStyle = '#1a1f3a'; ctx.fillRect(0, 120, 240, 60);
    ctx.fillStyle = '#2a3260'; for (let i = 0; i < 8; i++) ctx.fillRect(((i * 34 - t * 60) % 272 + 272) % 272 - 16, 126, 14, 20);
    ctx.fillStyle = '#3a4270'; ctx.fillRect(0, 170, 240, 2);
    ctx.fillStyle = '#9aa1b5'; ctx.fillRect(x, 152, 26, 12); ctx.fillStyle = '#7d8597'; ctx.fillRect(x + 24, 144, 2, 10);
    ctx.fillStyle = PAL.gold; ctx.fillRect(x + 3, 148, 8, 4); ctx.fillStyle = '#5dff7a'; ctx.fillRect(x + 13, 145, 7, 7);
    ctx.fillStyle = '#07060c'; ctx.fillRect(x + 3, 164, 4, 4); ctx.fillRect(x + 19, 164, 4, 4);
    text(ctx, DIST[s.from], 6, 100, PAL.grey); text(ctx, DIST[s.at], 234, 196, PAL.gold, 'right');
    text(ctx, 'THE RELATIVE ADDS 3%', 120, 240, PAL.grey, 'center');
    return;
  }
  text(ctx, 'TRAVEL TO WHICH DISTRICT?', 120, 40, PAL.gold, 'center');
  text(ctx, 'EACH TRIP TAKES ONE DAY.', 120, 54, PAL.grey, 'center');
  DIST.forEach((d, i) => {
    const y = 80 + i * 18, sel = s.dcur === i, here = i === s.at;
    if (sel) { ctx.fillStyle = '#131c44'; ctx.fillRect(0, y - 4, 240, 15); cursor(ctx, 8, y); }
    text(ctx, d, 20, y, here ? '#4a4f60' : sel ? PAL.ink : '#b7bccb');
    if (here) text(ctx, 'HERE', 232, y, '#4a4f60', 'right');
  });
  const y = 80 + DIST.length * 18 + 6, sel = s.dcur === DIST.length;
  if (sel) { ctx.fillStyle = '#131c44'; ctx.fillRect(0, y - 4, 240, 15); cursor(ctx, 8, y); }
  text(ctx, 'STAY AND KEEP TRADING', 20, y, sel ? PAL.ink : '#b7bccb');
  text(ctx, `DAYS LEFT ${DAYS - s.day}`, 120, 270, PAL.cyan, 'center');
  text(ctx, `OWED ${Math.ceil(s.loan)}, RISING`, 120, 284, PAL.orange, 'center');
}
function drawFinal(eng, ctx) {
  const { text } = eng;
  const goods = s.held.reduce((a, h, g) => a + h * price(g), 0);
  text(ctx, 'THE BOOKS ARE CLOSED', 120, 44, PAL.gold, 'center');
  const rows = [['CREDITS', s.cr], ['GOODS AT LOCAL PRICES', goods], ['OWED TO THE RELATIVE', -Math.ceil(s.loan)]];
  rows.forEach(([a, b], i) => { text(ctx, a, 10, 76 + i * 16, PAL.ink); text(ctx, String(b), 232, 76 + i * 16, b < 0 ? PAL.red : PAL.ink, 'right'); });
  ctx.fillStyle = PAL.grey; ctx.fillRect(10, 126, 222, 1);
  text(ctx, 'NET WORTH', 10, 134, PAL.cyan); text(ctx, String(s.score), 232, 134, s.score >= 0 ? PAL.green : PAL.red, 'right');
  const verdict = s.score >= 5000 ? 'THE RELATIVE IS IMPRESSED AND ASKS NO FURTHER QUESTIONS.' : s.score >= 1500 ? 'THE RELATIVE DESCRIBES THE RESULT AS A RESULT.' : s.score > 0 ? 'THE RELATIVE HAS NOTED THE OUTCOME IN A NOTEBOOK.' : 'THE RELATIVE WOULD LIKE A WORD. SEVERAL WORDS.';
  wrap(verdict).forEach((l, i) => text(ctx, l, 120, 172 + i * 12, PAL.ink, 'center'));
  if ((eng.t >> 4) & 1 || eng.state !== 'play') text(ctx, 'SPACE TO FILE', 120, 250, PAL.grey, 'center');
}
boot(game);
