// Defensive Position: fixed-path tower defence. Requests walk a corridor to the executive office.
import { boot, PAL } from '../engine.js';
const T = 16, OY = 28;
const PATH = [[-1, 1], [12, 1], [12, 5], [2, 5], [2, 9], [12, 9], [12, 13], [2, 13], [2, 16], [14, 16]];
const SOCKETS = [[4, 3], [8, 3], [14, 3], [0, 7], [6, 7], [10, 7], [4, 11], [8, 11], [14, 11], [0, 15], [5, 15], [9, 15]];
const KINDS = [null,
  { id: 'stamp', name: 'STAMP DESK', cost: 25, range: 42, rate: 26, dmg: 2.6, about: 'STAMP DESK: ONE AT A TIME' },
  { id: 'shred', name: 'SHREDDER', cost: 35, range: 38, rate: 1, dmg: 0.03, about: 'SHREDDER: SLOWS THE QUEUE' },
  { id: 'cab', name: 'FILING CABINET', cost: 50, range: 48, rate: 72, dmg: 4.5, about: 'FILING CABINET: SPLASH' }];
const FOES = {
  normal: { hp: 6, sp: 0.42, pay: 2, hurt: 1 },
  urgent: { hp: 4, sp: 0.85, pay: 3, hurt: 1 },
  escalated: { hp: 20, sp: 0.28, pay: 6, hurt: 2 },
};
const px = ([x, y]) => [x * T + 8, OY + y * T + 8];
const PTS = PATH.map(px);
const SEG = PTS.slice(1).map((p, i) => Math.hypot(p[0] - PTS[i][0], p[1] - PTS[i][1]));
const LEN = SEG.reduce((a, b) => a + b, 0);
const CORR = new Set();
for (let i = 1; i < PATH.length; i++) {
  const [ax, ay] = PATH[i - 1], [bx, by] = PATH[i];
  for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) CORR.add(x + ',' + y);
}
let s;

function posAt(d) {
  for (let i = 0; i < SEG.length; i++) {
    if (d <= SEG[i]) { const a = PTS[i], b = PTS[i + 1], t = d / SEG[i]; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
    d -= SEG[i];
  }
  return PTS[PTS.length - 1];
}
function startWave(eng) {
  s.wave++;
  const n = 6 + s.wave * 2, q = [];
  for (let i = 0; i < n; i++) {
    let k = 'normal';
    if (s.wave >= 3 && i % 5 === 4) k = 'escalated';
    else if (s.wave >= 2 && Math.random() < Math.min(0.45, 0.15 + s.wave * 0.04)) k = 'urgent';
    q.push(k);
  }
  if (s.wave % 5 === 0) q.push('escalated', 'escalated');
  s.queue = q; s.spawnT = 0; s.banner = 150;
}
function spawn() {
  const k = s.queue.shift(), f = FOES[k], w = s.wave - 1, hp = f.hp * (1 + 0.32 * w + 0.035 * w * w);
  s.foes.push({ k, d: -8, hp, max: hp, sp: f.sp * (1 + Math.min(0.4, s.wave * 0.02)), slow: 0, x: -8, y: PTS[0][1] });
}
function moveCursor(dir) {
  const [cx, cy] = SOCKETS[s.cur], [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
  let best = -1, bs = 1e9;
  SOCKETS.forEach(([x, y], i) => {
    const vx = x - cx, vy = y - cy, along = vx * dx + vy * dy, perp = Math.abs(vx * dy - vy * dx);
    if (along <= 0) return;
    const sc = along + perp * 2;
    if (sc < bs) { bs = sc; best = i; }
  });
  if (best >= 0) s.cur = best;
}
function cycle(eng) {
  const t = s.towers[s.cur], curK = t ? t.k : 0, refund = curK ? KINDS[curK].cost : 0;
  for (let step = 1; step <= 4; step++) {
    const nk = (curK + step) % 4;
    if (nk === 0) { s.towers[s.cur] = null; s.allow += refund; eng.beep(300, 0.06, 'square', 0.05, -100); return; }
    if (s.allow + refund >= KINDS[nk].cost) { s.allow += refund - KINDS[nk].cost; s.towers[s.cur] = { k: nk, cd: 0, fire: 0 }; eng.beep(500 + nk * 150, 0.06); return; }
  }
}
function nextKind() {
  const t = s.towers[s.cur], curK = t ? t.k : 0, refund = curK ? KINDS[curK].cost : 0;
  for (let step = 1; step <= 4; step++) { const nk = (curK + step) % 4; if (nk === 0 || s.allow + refund >= KINDS[nk].cost) return [nk, nk ? KINDS[nk].cost - refund : -refund]; }
  return [0, -refund];
}
function hit(eng, f, dmg) {
  if (f.hp <= 0) return;
  f.hp -= dmg;
  if (f.hp <= 0) {
    const pay = FOES[f.k].pay; s.allow += pay; s.resolved++; eng.score += 10;
    s.pops.push({ x: f.x, y: f.y, t: 'OK', l: 30 }); eng.beep(880 + Math.random() * 200, 0.04);
  }
}

const game = {
  id: 'defence',
  reset(eng) {
    s = { wave: 0, allow: 70, patience: 10, resolved: 0, cur: 4, towers: SOCKETS.map(() => null), foes: [], shots: [], pops: [], queue: [], spawnT: 0, banner: 0, flash: 0, over: 0 };
    startWave(eng);
  },
  update(eng) {
    const p = eng.pressed;
    for (const d of ['up', 'down', 'left', 'right']) if (p[d]) { moveCursor(d); eng.beep(330, 0.02); }
    if (eng.swipe) moveCursor(eng.swipe);
    if (p.act) cycle(eng);
    if (s.over) { if (--s.over === 0) eng.gameOver('OUT OF PATIENCE'); return; }
    if (s.flash) s.flash--;
    s.pops.forEach((q) => q.l--); s.pops = s.pops.filter((q) => q.l > 0);
    if (s.banner) { s.banner--; return; }
    // spawning
    if (s.queue.length && --s.spawnT <= 0) { spawn(); s.spawnT = Math.max(14, 44 - s.wave * 3); }
    // towers
    s.foes.forEach((f) => (f.slow = 0));
    s.towers.forEach((t, i) => {
      if (!t) return;
      const K = KINDS[t.k], [tx, ty] = px(SOCKETS[i]);
      if (t.fire) t.fire--;
      const inR = s.foes.filter((f) => f.hp > 0 && f.d > 0 && Math.hypot(f.x - tx, f.y - ty) <= K.range);
      if (K.id === 'shred') { t.fire = inR.length ? 2 : 0; inR.forEach((f) => { f.slow = 1; hit(eng, f, K.dmg); }); return; }
      if (t.cd > 0) { t.cd--; return; }
      if (!inR.length) return;
      const tgt = inR.reduce((a, b) => (b.d > a.d ? b : a));
      t.cd = K.rate; t.fire = 8;
      if (K.id === 'stamp') { hit(eng, tgt, K.dmg); s.shots.push({ k: 'line', x0: tx, y0: ty, x1: tgt.x, y1: tgt.y, l: 6 }); eng.beep(1200, 0.02, 'square', 0.03); }
      else { const [ex, ey] = posAt(tgt.d + tgt.sp * 22 * 1); s.shots.push({ k: 'lob', x0: tx, y0: ty, x1: ex, y1: ey, l: 22, n: 22, dmg: K.dmg }); eng.beep(220, 0.05, 'triangle', 0.05); }
    });
    // lobbed folders land
    for (const sh of s.shots) {
      if (--sh.l === 0 && sh.k === 'lob') {
        s.foes.forEach((f) => { if (Math.hypot(f.x - sh.x1, f.y - sh.y1) <= 20) hit(eng, f, sh.dmg); });
        s.pops.push({ x: sh.x1, y: sh.y1, t: '*', l: 12, c: PAL.gold }); eng.beep(140, 0.08, 'sawtooth', 0.04);
      }
    }
    s.shots = s.shots.filter((sh) => sh.l > 0);
    // requests walk
    for (const f of s.foes) {
      if (f.hp <= 0) continue;
      f.d += f.sp * (f.slow ? 0.45 : 1);
      [f.x, f.y] = f.d < 0 ? [-8 + f.d, PTS[0][1]] : posAt(f.d);
      if (f.d >= LEN) {
        f.hp = 0; f.arrived = true; if (!eng.god) s.patience -= FOES[f.k].hurt; s.flash = 20; // god mode: patience is infinite
        eng.beep(180, 0.2, 'sawtooth', 0.05, -80);
        if (s.patience <= 0) { s.patience = 0; s.over = 60; return; }
      }
    }
    s.foes = s.foes.filter((f) => f.hp > 0);
    if (!s.queue.length && !s.foes.length) {
      const bonus = 10 + s.wave * 3; s.allow += bonus; eng.score += 50 * s.wave;
      s.pops.push({ x: 120, y: 160, t: 'WAVE CLEARED +' + bonus, l: 90, c: PAL.green });
      eng.beep(660, 0.1); eng.beep(990, 0.15);
      startWave(eng);
    }
  },
  draw(eng, ctx) {
    const { text } = eng;
    // HUD
    text(ctx, 'WAVE ' + s.wave, 6, 4, PAL.cyan);
    text(ctx, 'PATIENCE ' + s.patience, 234, 4, s.flash && (s.flash >> 2) & 1 ? PAL.red : s.patience <= 3 ? PAL.red : PAL.ink, 'right');
    text(ctx, 'ALLOWANCE ' + s.allow, 6, 15, PAL.gold);
    text(ctx, String(eng.score).padStart(6, '0'), 234, 15, PAL.ink, 'right');
    // floor + corridor
    ctx.fillStyle = '#0c1028'; ctx.fillRect(0, OY, 240, 18 * T);
    ctx.fillStyle = '#121838';
    for (let y = 0; y < 18; y++) for (let x = 0; x < 15; x++) if ((x + y) & 1) ctx.fillRect(x * T, OY + y * T, T, T);
    for (const k of CORR) {
      const [x, y] = k.split(',').map(Number); if (x < 0) continue;
      ctx.fillStyle = '#3a2a4a'; ctx.fillRect(x * T, OY + y * T, T, T);
      ctx.fillStyle = '#4a3660'; ctx.fillRect(x * T + 2, OY + y * T + 7, T - 4, 2);
    }
    // door
    const [dx, dy] = [14 * T, OY + 16 * T];
    ctx.fillStyle = '#6b4423'; ctx.fillRect(dx + 2, dy - 2, 13, T + 2); ctx.fillStyle = '#8a5a2e'; ctx.fillRect(dx + 4, dy, 9, 6); ctx.fillRect(dx + 4, dy + 8, 9, 6);
    ctx.fillStyle = PAL.gold; ctx.fillRect(dx + 4, dy + 7, 2, 2);
    text(ctx, 'EXECUTIVE', 236, OY + 14 * T + 2, PAL.gold, 'right'); text(ctx, 'OFFICE', 236, OY + 15 * T + 1, PAL.gold, 'right');
    // sockets + towers
    SOCKETS.forEach(([x, y], i) => {
      const X = x * T, Y = OY + y * T, t = s.towers[i];
      if (!t) { ctx.fillStyle = '#3a6bff'; for (let j = 0; j < 16; j += 4) { ctx.fillRect(X + j, Y, 2, 1); ctx.fillRect(X + j, Y + 15, 2, 1); ctx.fillRect(X, Y + j, 1, 2); ctx.fillRect(X + 15, Y + j, 1, 2); } }
      else drawTower(ctx, t, X, Y, eng.t);
    });
    // range of selected socket
    const [cx, cy] = px(SOCKETS[s.cur]), t = s.towers[s.cur], K = KINDS[t ? t.k : 1];
    ctx.save(); ctx.setLineDash([3, 3]); ctx.strokeStyle = t ? PAL.cyan : 'rgba(125,249,255,.4)'; ctx.beginPath(); ctx.arc(cx, cy, K.range, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    const blink = (eng.t >> 3) & 1 || eng.state !== 'play';
    ctx.strokeStyle = blink ? PAL.gold : '#a8730f'; ctx.lineWidth = 1; ctx.strokeRect(cx - 9.5, cy - 9.5, 19, 19);
    // requests
    for (const f of s.foes) drawFoe(ctx, f, eng.t);
    // shots
    for (const sh of s.shots) {
      if (sh.k === 'line') { ctx.fillStyle = PAL.pink; ctx.fillRect(Math.round(sh.x1) - 3, Math.round(sh.y1) - 3, 6, 6); ctx.fillStyle = 'rgba(255,79,216,.5)'; line(ctx, sh.x0, sh.y0, sh.x1, sh.y1); }
      else { const q = 1 - sh.l / sh.n, x = sh.x0 + (sh.x1 - sh.x0) * q, y = sh.y0 + (sh.y1 - sh.y0) * q - Math.sin(q * Math.PI) * 18; ctx.fillStyle = PAL.gold; ctx.fillRect(Math.round(x) - 3, Math.round(y) - 2, 6, 4); ctx.fillStyle = '#a8730f'; ctx.fillRect(Math.round(x) - 3, Math.round(y) - 2, 2, 1); }
    }
    for (const q of s.pops) text(ctx, q.t, q.x, q.y - 10 - (30 - Math.min(30, q.l)) / 3, q.c || PAL.green, 'center');
    // info rows
    text(ctx, t ? KINDS[t.k].about : 'EMPTY SOCKET', 120, OY + 4, PAL.ink, 'center');
    const [nk, net] = nextKind();
    text(ctx, nk ? `NEXT: ${KINDS[nk].name} COST ${net}` : `NEXT: EMPTY  REFUND ${-net}`, 120, 306, nk && net > s.allow ? PAL.red : PAL.grey, 'center');
    if (s.banner && eng.state === 'play') {
      ctx.fillStyle = 'rgba(7,6,12,.85)'; ctx.fillRect(20, 132, 200, 50); ctx.strokeStyle = PAL.gold; ctx.strokeRect(20.5, 132.5, 199, 49);
      text(ctx, 'WAVE ' + s.wave, 120, 140, PAL.gold, 'center', 16);
      text(ctx, s.wave === 1 ? 'PLACE DESKS BY THE ROUTE' : s.queue.length + ' REQUESTS INBOUND', 120, 164, PAL.ink, 'center');
    }
  },
};
function line(ctx, x0, y0, x1, y1) {
  const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) / 2));
  for (let i = 0; i <= n; i++) ctx.fillRect(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), 1, 1);
}
function drawTower(ctx, t, X, Y, time) {
  const K = KINDS[t.k];
  if (K.id === 'stamp') {
    ctx.fillStyle = '#8a5a2e'; ctx.fillRect(X + 1, Y + 7, 14, 6); ctx.fillStyle = '#6b4423'; ctx.fillRect(X + 2, Y + 13, 2, 3); ctx.fillRect(X + 12, Y + 13, 2, 3);
    ctx.fillStyle = '#e8fbff'; ctx.fillRect(X + 3, Y + 5, 6, 3);
    const up = t.fire > 4 ? 0 : 3; ctx.fillStyle = PAL.red; ctx.fillRect(X + 9, Y + 1 + up, 4, 3); ctx.fillStyle = '#3b2a1a'; ctx.fillRect(X + 10, Y - 2 + up, 2, 3);
  } else if (K.id === 'shred') {
    ctx.fillStyle = '#7d8597'; ctx.fillRect(X + 2, Y + 4, 12, 11); ctx.fillStyle = '#4a4f60'; ctx.fillRect(X + 2, Y + 4, 12, 3);
    ctx.fillStyle = '#e8fbff'; const o = t.fire ? (time >> 1) & 3 : 0;
    for (let i = 0; i < 4; i++) ctx.fillRect(X + 3 + i * 3, Y + 8 + ((i + o) & 1) * 2, 1, 5);
    if (t.fire) { ctx.fillStyle = PAL.green; ctx.fillRect(X + 12, Y + 5, 1, 1); }
  } else {
    ctx.fillStyle = '#9aa1b5'; ctx.fillRect(X + 3, Y, 10, 16); ctx.fillStyle = '#5a6074';
    [4, 9, 14].forEach((d) => ctx.fillRect(X + 4, Y + d, 8, 1));
    ctx.fillStyle = PAL.gold; [2, 7, 12].forEach((d) => ctx.fillRect(X + 7, Y + d, 2, 1));
    if (t.fire) { ctx.fillStyle = '#c9cfdc'; ctx.fillRect(X + 1, Y + 5, 14, 3); }
  }
}
function drawFoe(ctx, f, time) {
  const big = f.k === 'escalated', w = big ? 10 : 8, h = big ? 12 : 10, x = Math.round(f.x - w / 2), y = Math.round(f.y - h / 2 - 2), st = ((time >> 3) + Math.round(f.d)) & 1;
  ctx.fillStyle = '#1d2747'; ctx.fillRect(x + 1 + st, y + h, 1, 3); ctx.fillRect(x + w - 3 - st, y + h, 1, 3);
  ctx.fillStyle = big ? PAL.gold : '#e8fbff'; ctx.fillRect(x, y, w, h);
  if (big) { ctx.fillStyle = '#fff3b0'; ctx.fillRect(x + 1, y + 1, w - 2, h - 2); }
  ctx.fillStyle = '#8a90a2'; ctx.fillRect(x + w - 2, y, 2, 2);
  ctx.fillStyle = '#7d8597'; for (let i = 3; i < h - 1; i += 2) ctx.fillRect(x + 1, y + i, w - 3, 1);
  if (f.k === 'urgent') { ctx.fillStyle = PAL.red; ctx.fillRect(x + 1, y + 2, w - 3, 5); ctx.fillStyle = '#fff'; ctx.fillRect(x + 3, y + 3, 1, 2); ctx.fillRect(x + 3, y + 6, 1, 1); }
  if (f.k === 'escalated') { ctx.fillStyle = PAL.red; ctx.fillRect(x + 2, y + 2, 2, 2); ctx.fillRect(x + 6, y + 2, 2, 2); }
  if (f.slow) { ctx.fillStyle = PAL.cyan; ctx.fillRect(x - 1, y + h + 2, 2, 1); }
  if (f.hp < f.max) { ctx.fillStyle = '#4a0e0e'; ctx.fillRect(x, y - 3, w, 2); ctx.fillStyle = PAL.green; ctx.fillRect(x, y - 3, Math.max(1, Math.round((w * f.hp) / f.max)), 2); }
}
boot(game);
