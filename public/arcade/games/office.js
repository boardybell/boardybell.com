// Family Office Simulator: a lemonade-stand business sim, reported in the tone of an annual report.
import { boot, PAL } from '../engine.js';
const DAYS = 30, SIGN = 4, DAYLEN = 300;
const WX = ['SUNNY', 'CLOUDY', 'RAIN', 'HEATWAVE'];
const BASE = [70, 45, 22, 110], MAXP = [12, 9, 6, 18];
const SKY = ['#3a6bff', '#59647e', '#323a52', '#ff9a3c'];
const SHIRTS = ['#ff4fd8', '#7df9ff', '#5dff7a', '#ffd23f', '#9d5cff', '#ff4a4a', '#e8fbff', '#3a6bff'];
const SKIN = ['#f2c79a', '#c58a5a', '#8a5a3a', '#e9b48a'];
const EVENTS = [
  ['A PARADE IS SCHEDULED NEARBY. ATTENDANCE IS MANDATORY FOR THE PARADE.', () => (s.demand = 1.6)],
  ['ROADWORKS. THE PAVEMENT HAS BEEN RECLASSIFIED AS A ROAD.', () => (s.demand = 0.6)],
  ['THE PRICE OF LEMONS HAS DOUBLED. LEMONS DECLINE TO COMMENT.', () => (s.cost *= 2)],
  ['SUGAR IS ON SALE. THE SALE IS NOT EXPLAINED.', () => (s.cost = Math.max(1, s.cost - 1))],
  ['A RELATIVE INVESTS 25 CREDITS. THE TERMS ARE UNCLEAR.', () => (s.cr += 25)],
  ['A COMPETING STAND OPENS ACROSS THE STREET. IT IS ALSO FAMILY.', () => (s.demand = 0.7)],
  ['AN INSPECTOR VISITS. THE LEMONADE IS DESCRIBED AS LEMONADE.', () => (s.rep = Math.min(1.5, s.rep + 0.08))],
  ['A RELATIVE REQUESTS A DIVIDEND. 15 CREDITS ARE DISTRIBUTED.', () => (s.cr = Math.max(0, s.cr - 15))],
  ['THE BOARD MEETS AND APPROVES THE STAND. THE BOARD IS AN AUNT.', () => {}],
  ['A NEIGHBOUR DESCRIBES THE STAND AS AN INSTITUTION. FOOT TRAFFIC RISES.', () => (s.demand = 1.3)],
];
let s;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
function wrap(str, n = 28) {
  const out = []; let line = '';
  for (const w of String(str).split(' ')) { if (!line) line = w; else if ((line + ' ' + w).length <= n) line += ' ' + w; else { out.push(line); line = w; } }
  if (line) out.push(line); return out;
}
const outlay = () => s.cups * s.cost + s.signs * SIGN;

function morning(eng) {
  s.fc = Math.random() < 0.15 ? 3 : Math.random() < 0.45 ? 0 : Math.random() < 0.6 ? 1 : 2;
  s.cost = ri(2, 3); s.demand = 1; s.event = null;
  if (s.day === 1) s.event = 'THE FAMILY OFFICE OPENS. ASSETS UNDER MANAGEMENT: ONE TABLE.';
  else if (Math.random() < 0.35) { const e = pick(EVENTS); s.event = e[0]; e[1](); }
  s.phase = 'morning'; s.cur = 0;
  if (s.cr < s.cost) { s.phase = 'broke'; eng.score = s.cr; return; }
  fit();
}
function fit() { s.cups = clamp(s.cups, 0, 200); s.signs = clamp(s.signs, 0, 9); while (outlay() > s.cr && s.signs > 0) s.signs--; while (outlay() > s.cr && s.cups > 0) s.cups--; }
function open(eng) {
  s.cr -= outlay();
  // the forecast is usually right
  s.wx = Math.random() < 0.75 ? s.fc : clamp(s.fc + (Math.random() < 0.5 ? -1 : 1), 0, 3);
  const n = Math.round(BASE[s.wx] * s.rep * s.demand * (1 + 0.55 * (1 - Math.exp(-s.signs / 2.5))) * (0.85 + Math.random() * 0.3));
  const prob = Math.pow(clamp(1 - s.price / MAXP[s.wx], 0, 1), 1.1) * 0.95;
  s.walkers = []; s.left = s.cups; s.sold = 0; s.unmet = 0; s.rev = 0; s.pops = [];
  for (let i = 0; i < n; i++) {
    const dir = Math.random() < 0.5 ? 1 : -1;
    s.walkers.push({ t: Math.floor(Math.random() * DAYLEN), x: dir > 0 ? -10 : 250, dir, v: 1.1 + Math.random() * 0.8, lane: ri(0, 2), buy: Math.random() < prob, stop: 0, done: false, shirt: pick(SHIRTS), skin: pick(SKIN), hat: Math.random() < 0.3 });
  }
  s.clock = 0; s.phase = 'day'; eng.beep(523, 0.08); eng.beep(784, 0.1);
}
function close(eng) {
  const profit = s.rev - s.spent;
  const unsold = s.left;
  const ratio = s.price / MAXP[s.wx];
  if (s.sold) s.rep += ratio < 0.45 ? 0.06 : ratio > 0.75 ? -0.06 : 0.01;
  if (s.unmet > 10) s.rep -= 0.03;
  s.rep = clamp(s.rep, 0.6, 1.5);
  s.report = { profit, unsold, wx: s.wx };
  eng.score = s.cr; s.phase = 'report'; eng.beep(660, 0.06);
}

const game = {
  id: 'office',
  reset(eng) { s = { day: 1, cr: 100, rep: 1, cups: 30, price: 5, signs: 1, hold: 0, phase: 'morning', walkers: [], pops: [] }; morning(eng); eng.score = s.cr; },
  update(eng) {
    const p = eng.pressed, k = eng.keys;
    if (k.left || k.right) s.hold++; else s.hold = 0;
    const d = (p.right ? 1 : 0) - (p.left ? 1 : 0) || (s.hold > 18 && s.hold % 4 === 0 ? (k.right ? 1 : 0) - (k.left ? 1 : 0) : 0);
    if (s.phase === 'morning') {
      if (p.up) { s.cur = (s.cur + 2) % 3; eng.beep(330, 0.03); }
      if (p.down) { s.cur = (s.cur + 1) % 3; eng.beep(330, 0.03); }
      if (d) {
        if (s.cur === 0) s.cups = clamp(s.cups + d * 5, 0, 200);
        if (s.cur === 1) s.price = clamp(s.price + d, 1, 25);
        if (s.cur === 2) s.signs = clamp(s.signs + d, 0, 9);
        const want = [s.cups, s.signs]; fit();
        eng.beep(want[0] !== s.cups || want[1] !== s.signs ? 150 : 600, 0.03);
      }
      if (p.act) { s.spent = outlay(); open(eng); }
    } else if (s.phase === 'day') {
      const steps = k.act ? 4 : 1;
      for (let i = 0; i < steps; i++) simStep(eng);
    } else if (s.phase === 'report') {
      if (p.act) { if (s.day >= DAYS) { s.phase = 'final'; eng.beep(523, 0.1); eng.beep(784, 0.2); } else { s.day++; morning(eng); } }
    } else if (s.phase === 'final') { if (p.act) eng.gameOver('FISCAL YEAR ENDS'); }
    else if (s.phase === 'broke') { if (p.act) eng.gameOver('INSOLVENT'); }
  },
  draw(eng, ctx) {
    const { text } = eng;
    text(ctx, 'DAY ' + String(s.day).padStart(2, '0') + '/' + DAYS, 6, 5, PAL.cyan);
    text(ctx, s.cr + ' CR', 234, 5, PAL.gold, 'right');
    text(ctx, 'REPUTATION', 6, 16, PAL.grey);
    for (let i = 0; i < 5; i++) { ctx.fillStyle = i < Math.round((s.rep - 0.5) * 5) ? PAL.green : '#1d2747'; ctx.fillRect(92 + i * 9, 16, 7, 7); }
    if (s.phase === 'morning') return drawMorning(eng, ctx);
    if (s.phase === 'broke') return drawBroke(eng, ctx);
    drawScene(eng, ctx, s.phase === 'day' ? s.wx : s.report.wx);
    if (s.phase === 'day') {
      const y = 262;
      text(ctx, 'CUPS LEFT ' + s.left, 6, y, s.left ? PAL.ink : PAL.red);
      text(ctx, 'SOLD ' + s.sold, 234, y, PAL.green, 'right');
      text(ctx, 'TAKINGS ' + s.rev + ' CR', 6, y + 13, PAL.gold);
      ctx.fillStyle = '#1d2747'; ctx.fillRect(6, y + 28, 228, 4); ctx.fillStyle = PAL.cyan; ctx.fillRect(6, y + 28, Math.min(228, Math.round((228 * s.clock) / (DAYLEN + 160))), 4);
      text(ctx, 'HOLD SPACE TO HURRY', 120, y + 38, PAL.grey, 'center');
    } else if (s.phase === 'report') drawReport(eng, ctx);
    else drawFinal(eng, ctx);
  },
};
function simStep(eng) {
  s.clock++;
  for (const w of s.walkers) {
    if (w.done || s.clock < w.t) continue;
    if (w.stop > 0) { if (--w.stop === 0) sell(eng, w); continue; }
    const before = w.x; w.x += w.v * w.dir;
    if (w.buy && !w.asked && (before - 120) * (w.x - 120) <= 0) { w.asked = true; w.x = 120; w.stop = 22; w.dir = w.dir; }
    if (w.x < -14 || w.x > 254) w.done = true;
  }
  s.pops.forEach((q) => q.l--); s.pops = s.pops.filter((q) => q.l > 0);
  if (s.clock > DAYLEN && s.walkers.every((w) => w.done || s.clock < w.t)) close(eng);
  if (s.clock > DAYLEN + 400) close(eng);
}
function sell(eng, w) {
  if (s.left > 0) { s.left--; s.sold++; s.rev += s.price; s.cr += s.price; s.pops.push({ x: 120, y: 124, t: '+' + s.price, c: PAL.gold, l: 40 }); eng.beep(990, 0.04); eng.score = s.cr; }
  else { s.unmet++; if (s.pops.length < 4) s.pops.push({ x: 120, y: 124, t: 'SOLD OUT', c: PAL.red, l: 40 }); }
}
function cursor(ctx, x, y) { ctx.fillStyle = PAL.gold; for (let i = 0; i < 4; i++) ctx.fillRect(x + i, y + i, 1, 8 - i * 2); }
function drawMorning(eng, ctx) {
  const { text } = eng;
  ctx.fillStyle = '#0d1230'; ctx.fillRect(4, 30, 232, 60); ctx.strokeStyle = '#2b3570'; ctx.strokeRect(4.5, 30.5, 231, 59);
  icon(ctx, s.fc, 30, 60, eng.t);
  text(ctx, 'FORECAST', 64, 38, PAL.grey); text(ctx, WX[s.fc], 64, 50, PAL.ink);
  text(ctx, 'COST ' + s.cost + ' CR A CUP', 64, 66, PAL.ink); text(ctx, 'SIGNS ' + SIGN + ' CR EACH', 64, 77, PAL.grey);
  let y = 100;
  if (s.event) { wrap(s.event).forEach((l, i) => text(ctx, l, 8, y + i * 11, PAL.cyan)); y += wrap(s.event).length * 11 + 8; }
  else { text(ctx, 'NO NEWS. THIS IS ALSO NEWS.', 8, y, PAL.grey); y += 19; }
  y = Math.max(y, 140);
  const rows = [['CUPS TO MAKE', String(s.cups)], ['PRICE PER CUP', s.price + ' CR'], ['SIGNS TO PAINT', String(s.signs)]];
  rows.forEach(([a, b], i) => {
    const yy = y + i * 16, sel = i === s.cur;
    if (sel) { ctx.fillStyle = '#131c44'; ctx.fillRect(0, yy - 4, 240, 15); cursor(ctx, 6, yy); }
    text(ctx, a, 16, yy, sel ? PAL.ink : '#b7bccb');
    text(ctx, (sel ? '< ' : '') + b + (sel ? ' >' : ''), 234, yy, sel ? PAL.gold : PAL.ink, 'right');
  });
  y += 56;
  text(ctx, 'OUTLAY', 16, y, PAL.grey); text(ctx, outlay() + ' CR', 234, y, PAL.ink, 'right');
  text(ctx, 'LEFT AFTER', 16, y + 12, PAL.grey); text(ctx, s.cr - outlay() + ' CR', 234, y + 12, PAL.ink, 'right');
  if ((eng.t >> 5) & 1 || eng.state !== 'play') text(ctx, 'SPACE: OPEN FOR THE DAY', 120, 304, PAL.green, 'center');
}
function drawReport(eng, ctx) {
  const { text } = eng, r = s.report, y = 210;
  ctx.fillStyle = 'rgba(7,6,12,.92)'; ctx.fillRect(0, y - 6, 240, 120);
  text(ctx, 'DAY ' + s.day + ' ANNUAL REPORT', 120, y, PAL.gold, 'center');
  const cols = [['CUPS SOLD', s.sold], ['REVENUE', s.rev], ['COSTS', s.spent], ['NET', r.profit]];
  cols.forEach(([a, b], i) => { const x = i % 2 ? 126 : 8, yy = y + 14 + (i >> 1) * 11; text(ctx, a, x, yy, PAL.grey); text(ctx, String(b), x + 106, yy, a === 'NET' ? (b >= 0 ? PAL.green : PAL.red) : PAL.ink, 'right'); });
  const remark = r.profit > 150 ? 'THE RELATIVES ARE CAUTIOUSLY PLEASED.' : r.profit > 40 ? 'THE RELATIVES DESCRIBE THE DAY AS A DAY.' : r.profit >= 0 ? 'THE RELATIVES HAVE NO COMMENT AT THIS TIME.' : 'A RELATIVE HAS ASKED TO SEE THE MINUTES.';
  const extra = s.unmet > 5 ? s.unmet + ' PASSERS-BY LEFT THIRSTY. THIS WAS MINUTED.' : r.unsold > 0 ? r.unsold + ' CUPS UNSOLD. THEY WERE DISCUSSED AND DISCARDED.' : 'EVERY CUP SOLD. NOBODY KNOWS WHY.';
  const lines = [...wrap(remark), ...wrap(extra)];
  lines.slice(0, 5).forEach((l, i) => text(ctx, l, 8, y + 42 + i * 11, i < wrap(remark).length ? PAL.ink : PAL.grey));
  if ((eng.t >> 4) & 1 || eng.state !== 'play') text(ctx, 'SPACE', 232, 306, PAL.cyan, 'right');
}
function drawFinal(eng, ctx) {
  const { text } = eng;
  ctx.fillStyle = 'rgba(7,6,12,.94)'; ctx.fillRect(0, 26, 240, 294);
  text(ctx, 'FISCAL YEAR CLOSED', 120, 70, PAL.gold, 'center');
  text(ctx, 'CLOSING CREDITS', 120, 100, PAL.grey, 'center');
  text(ctx, String(s.cr), 120, 116, PAL.green, 'center', 16);
  const v = s.cr >= 3000 ? 'THE FAMILY OFFICE IS DECLARED A SUCCESS BY THE FAMILY.' : s.cr >= 800 ? 'THE STAND WILL REOPEN NEXT YEAR, SUBJECT TO WEATHER.' : 'THE TABLE IS RETURNED TO THE KITCHEN WITH THANKS.';
  wrap(v).forEach((l, i) => text(ctx, l, 120, 160 + i * 12, PAL.ink, 'center'));
  if ((eng.t >> 4) & 1 || eng.state !== 'play') text(ctx, 'SPACE TO FILE', 120, 240, PAL.grey, 'center');
}
function drawBroke(eng, ctx) {
  const { text } = eng;
  text(ctx, 'INSUFFICIENT CREDITS', 120, 90, PAL.red, 'center');
  ['THE STAND CANNOT AFFORD A', 'SINGLE CUP. THE RELATIVES', 'HAVE BEEN INFORMED BY POST.'].forEach((l, i) => text(ctx, l, 120, 120 + i * 12, PAL.ink, 'center'));
  if ((eng.t >> 4) & 1 || eng.state !== 'play') text(ctx, 'SPACE', 120, 200, PAL.grey, 'center');
}

// ---------- scene ----------
function icon(ctx, w, cx, cy, t) {
  if (w === 0 || w === 3) {
    ctx.fillStyle = w === 3 ? PAL.orange : PAL.gold; ctx.beginPath(); ctx.arc(cx, cy, w === 3 ? 11 : 8, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + t / 60, r = w === 3 ? 15 : 12; ctx.fillRect(Math.round(cx + Math.cos(a) * r) - 1, Math.round(cy + Math.sin(a) * r) - 1, 3, 3); }
  } else {
    ctx.fillStyle = w === 2 ? '#7d8597' : '#c9cfdc';
    ctx.beginPath(); ctx.arc(cx - 6, cy, 7, 0, Math.PI * 2); ctx.arc(cx + 3, cy - 4, 9, 0, Math.PI * 2); ctx.arc(cx + 10, cy + 1, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(cx - 12, cy, 26, 7);
    if (w === 2) { ctx.fillStyle = PAL.cyan; for (let i = 0; i < 4; i++) ctx.fillRect(cx - 9 + i * 6, cy + 10 + ((t >> 3) + i) % 3 * 2, 1, 4); }
  }
}
function drawScene(eng, ctx, w) {
  const t = eng.t, top = 28;
  ctx.fillStyle = SKY[w]; ctx.fillRect(0, top, 240, 110);
  if (w === 0 || w === 3) icon(ctx, w, 200, 54, t);
  else { icon(ctx, w === 2 ? 2 : 1, 50 + ((t / 8) % 280) - 40, 50, t); icon(ctx, 1, 170 - ((t / 11) % 280) + 40, 64, t); }
  // buildings
  ctx.fillStyle = w === 3 ? '#a85a2a' : '#1d2747';
  [[0, 40, 50], [44, 60, 36], [96, 30, 46], [132, 70, 40], [176, 44, 64]].forEach(([x, h, ww]) => ctx.fillRect(x, top + 110 - h, ww, h));
  ctx.fillStyle = w === 3 ? '#ffd23f' : '#ffe9a8';
  for (let i = 0; i < 14; i++) ctx.fillRect(6 + ((i * 47) % 228), top + 110 - 8 - ((i * 13) % 30), 3, 4);
  // pavement and road
  ctx.fillStyle = '#4a4f60'; ctx.fillRect(0, top + 110, 240, 62);
  ctx.fillStyle = '#5a6074'; for (let x = 0; x < 240; x += 24) ctx.fillRect(x, top + 110, 1, 62);
  ctx.fillStyle = '#2a2d38'; ctx.fillRect(0, top + 172, 240, 50);
  ctx.fillStyle = '#c9cfdc'; for (let x = 4; x < 240; x += 32) ctx.fillRect(x, top + 196, 16, 2);
  // stand
  const sx = 98, sy = top + 104;
  ctx.fillStyle = '#ff4a4a'; for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#e8fbff' : '#ff4a4a'; ctx.fillRect(sx - 4 + i * 8, sy - 26, 8, 8); }
  ctx.fillStyle = '#8a6a3a'; ctx.fillRect(sx - 2, sy - 18, 2, 18); ctx.fillRect(sx + 42, sy - 18, 2, 18);
  ctx.fillStyle = '#c58a3a'; ctx.fillRect(sx - 4, sy, 52, 18); ctx.fillStyle = '#8a5a2e'; ctx.fillRect(sx - 4, sy, 52, 2);
  ctx.fillStyle = PAL.gold; ctx.fillRect(sx + 6, sy - 10, 8, 10); ctx.fillStyle = '#e8fbff'; ctx.fillRect(sx + 6, sy - 10, 8, 2);
  ctx.fillStyle = '#e8fbff'; for (let i = 0; i < Math.min(4, s.left ?? 4); i++) ctx.fillRect(sx + 20 + i * 6, sy - 5, 4, 5);
  eng.text(ctx, s.phase === 'day' && !s.left ? 'SHUT' : 'LEMON', sx + 22, sy + 6, '#3b2a1a', 'center');
  // painted signs
  for (let i = 0; i < s.signs; i++) { const x = i % 2 ? 160 + (i >> 1) * 18 : 72 - (i >> 1) * 18; ctx.fillStyle = '#8a6a3a'; ctx.fillRect(x + 5, top + 140, 2, 12); ctx.fillStyle = PAL.ink; ctx.fillRect(x, top + 132, 12, 9); ctx.fillStyle = PAL.gold; ctx.fillRect(x + 3, top + 135, 6, 3); }
  // walkers, back lane first
  const ws = (s.walkers || []).filter((q) => !q.done && (s.phase !== 'day' || s.clock >= q.t)).sort((a, b) => a.lane - b.lane);
  if (s.phase === 'day') for (const q of ws) person(ctx, q, top + 140 + q.lane * 10, t, w);
  for (const q of s.pops) eng.text(ctx, q.t, q.x, q.y - (40 - q.l) / 2, q.c, 'center');
  // weather overlays
  if (w === 2) { ctx.fillStyle = '#9fb4ff'; for (let i = 0; i < 60; i++) ctx.fillRect((i * 37 + t * 2) % 240, top + ((i * 53 + t * 5) % 196), 1, 5); }
  if (w === 3 && (t >> 3) & 1) { ctx.fillStyle = 'rgba(255,154,60,.08)'; ctx.fillRect(0, top, 240, 196); }
}
function person(ctx, q, gy, t, w) {
  const x = Math.round(q.x) - 3, step = q.stop ? 0 : (Math.floor(t / 6) + q.lane) & 1, y = gy - 16;
  if (w === 2) { ctx.fillStyle = q.shirt; ctx.fillRect(x - 3, y - 4, 13, 2); ctx.fillRect(x - 1, y - 6, 9, 2); ctx.fillStyle = '#3b2a1a'; ctx.fillRect(x + 3, y - 3, 1, 4); }
  ctx.fillStyle = q.skin; ctx.fillRect(x + 1, y, 5, 5);
  if (q.hat && w !== 2) { ctx.fillStyle = '#07060c'; ctx.fillRect(x, y - 1, 7, 2); }
  ctx.fillStyle = q.shirt; ctx.fillRect(x, y + 5, 7, 6);
  ctx.fillStyle = '#1d2747'; ctx.fillRect(x + 1 - step, y + 11, 2, 5); ctx.fillRect(x + 4 + step, y + 11, 2, 5);
  if (q.stop) { ctx.fillStyle = PAL.gold; ctx.fillRect(x + (q.dir > 0 ? 7 : -2), y + 5, 2, 3); }
}
boot(game);
