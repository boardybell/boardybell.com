// Price Target: darts on an analyst's wall. Three darts a round must total the required score on rings BUY 30, HOLD 20, SELL 10.
// After each hit the rings slide a step toward the newest dart and every dart already on the board is rescored.
import { boot, PAL } from '../engine.js';
const BX = 120, BY = 170, FACE = 62, STEP = 7, REACH = 74;
const VEL = '#5a1230', VEL2 = '#3a0b1f', GOLD = '#ffb238', PALE = '#ffe9a8', BRASS = '#c9a15a', CREAM = '#f4ead2', INK = '#07060c';
let s;

const radii = () => { const k = Math.max(0.68, 1 - (s.round - 1) * 0.045); return [11 * k, 24 * k, 39 * k]; };
const need = () => Math.min(80, 50 + 10 * Math.ceil(s.round / 2));
function worth(d) {
  if ((d.x - BX) ** 2 + (d.y - BY) ** 2 > FACE * FACE) return 0;
  const r = Math.hypot(d.x - s.rc.x, d.y - s.rc.y), [a, b, c] = radii();
  return r <= a ? 30 : r <= b ? 20 : r <= c ? 10 : 0;
}
const total = () => s.darts.reduce((n, d) => n + d.v, 0);
function newRound() {
  s.darts = []; s.rc = { x: BX, y: BY }; s.rv = { x: BX, y: BY }; s.phase = 'aim'; s.timer = 0; s.req = need();
  const a = Math.random() * 6.28; s.ret = { x: BX + Math.cos(a) * 30, y: BY + Math.sin(a) * 30, vx: 0, vy: 0, w: a };
}

const game = {
  id: 'darts', tapIsAct: true,
  reset() { s = { round: 1, darts: [], fly: null, pops: [], verdict: null, hint: 240 }; newRound(); },
  update(eng) {
    const k = eng.keys, r = s.ret;
    if (s.hint) s.hint--;
    for (let i = s.pops.length - 1; i >= 0; i--) if (--s.pops[i].l <= 0) s.pops.splice(i, 1);
    s.rv.x += (s.rc.x - s.rv.x) * 0.12; s.rv.y += (s.rc.y - s.rv.y) * 0.12;
    // the reticle never holds still: a wandering drift that grows each round, steadied by the arrows
    const drift = 0.05 + (s.round - 1) * 0.011;
    r.w += (Math.random() - 0.5) * 0.5;
    r.vx += Math.cos(r.w) * drift + ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 0.11;
    r.vy += Math.sin(r.w) * drift + ((k.down ? 1 : 0) - (k.up ? 1 : 0)) * 0.11;
    if (eng.pointerX != null && eng.pointerX !== s.lastPX) { r.vx += Math.sign(eng.pointerX - r.x) * 0.6; s.lastPX = eng.pointerX; }
    r.vx *= 0.93; r.vy *= 0.93; r.x += r.vx; r.y += r.vy;
    const dx = r.x - BX, dy = r.y - BY, dd = Math.hypot(dx, dy);
    if (dd > REACH) { r.x = BX + dx / dd * REACH; r.y = BY + dy / dd * REACH; r.vx *= -0.5; r.vy *= -0.5; r.w += 3.14; }
    if (s.phase === 'aim') {
      if (eng.pressed.act) { s.fly = { x: r.x, y: r.y, t: 0 }; s.phase = 'fly'; eng.beep(520, 0.08, 'triangle', 0.04, 300); }
    } else if (s.phase === 'fly') {
      if (++s.fly.t >= 16) {
        const d = { x: s.fly.x, y: s.fly.y, v: 0 }; s.darts.push(d); s.fly = null;
        d.v = worth(d); eng.beep(d.v ? 300 + d.v * 20 : 120, 0.06);
        // the committee revises: rings slide one step toward the newest dart
        const mx = d.x - s.rc.x, my = d.y - s.rc.y, m = Math.hypot(mx, my), st = Math.min(STEP, m);
        if (m > 0.5) { s.rc.x += mx / m * st; s.rc.y += my / m * st; }
        s.phase = 'slide'; s.timer = 34;
      }
    } else if (s.phase === 'slide') {
      if (--s.timer <= 0) {
        for (const d of s.darts) { const nv = worth(d); if (nv !== d.v) s.pops.push({ s: (nv > d.v ? '+' : '') + (nv - d.v), x: d.x, y: d.y - 14, l: 40, c: nv > d.v ? PAL.green : PAL.red }); d.v = nv; }
        if (s.darts.length < 3) s.phase = 'aim';
        else judge(eng);
      }
    } else if (s.phase === 'verdict') {
      if (--s.timer <= 0) { if (s.verdict.pass) { s.round++; newRound(); } else eng.gameOver('TARGET MISSED. THE COMMITTEE HAS MOVED ON.'); }
    }
  },
  draw(eng, ctx) {
    const { text } = eng, [ra, rb, rc] = radii();
    // velvet wall, brass-trimmed ledge
    for (let x = 0; x < 240; x += 16) { ctx.fillStyle = (x / 16) % 2 ? VEL : '#4c0f29'; ctx.fillRect(x, 0, 16, 320); }
    chart(ctx, 6, 42, false); chart(ctx, 164, 42, true);
    ctx.fillStyle = VEL2; ctx.fillRect(0, 268, 240, 52); ctx.fillStyle = BRASS; ctx.fillRect(0, 268, 240, 3); ctx.fillStyle = PALE; ctx.fillRect(0, 268, 240, 1);
    // the board: a dark face of alternating wedges inside a brass rim
    ctx.fillStyle = BRASS; ctx.beginPath(); ctx.arc(BX, BY, FACE + 6, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#6a4a20'; ctx.beginPath(); ctx.arc(BX, BY, FACE + 3, 0, 6.283); ctx.fill();
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = i % 2 ? '#1c1014' : '#2e1a1c'; ctx.beginPath(); ctx.moveTo(BX, BY);
      ctx.arc(BX, BY, FACE, i * 0.3927, (i + 1) * 0.3927); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(201,161,90,0.4)'; ctx.beginPath(); ctx.moveTo(BX - 6, BY); ctx.lineTo(BX + 6, BY); ctx.moveTo(BX, BY - 6); ctx.lineTo(BX, BY + 6); ctx.stroke();
    // the scoring rings, wherever the committee currently prefers them
    ctx.save(); ctx.beginPath(); ctx.arc(BX, BY, FACE, 0, 6.283); ctx.clip();
    const ring = (rad, fill, line) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(s.rv.x, s.rv.y, rad, 0, 6.283); ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1; };
    ring(rc, 'rgba(201,161,90,0.32)', BRASS); ring(rb, 'rgba(255,178,56,0.45)', GOLD); ring(ra, 'rgba(255,233,168,0.8)', PALE);
    // ring labels travel with the rings
    text(ctx, 'BUY', s.rv.x, s.rv.y - 3, VEL2, 'center', 6);
    text(ctx, 'HOLD', s.rv.x, s.rv.y - (ra + rb) / 2 - 3, INK, 'center', 6);
    text(ctx, 'SELL', s.rv.x, s.rv.y - (rb + rc) / 2 - 3, PALE, 'center', 6);
    ctx.restore();
    // darts on the board: pearl flight, brass barrel, stuck point first
    for (const d of s.darts) dart(ctx, d.x, d.y, 1);
    for (const d of s.darts) text(ctx, String(d.v), d.x + 14, d.y + 8, d.v ? PALE : PAL.grey, 'left', 6);
    if (s.fly) { const f = s.fly.t / 16, sc = 1 + (1 - f) * 2.5; dart(ctx, s.fly.x + (1 - f) * 20, s.fly.y + (1 - f) * (1 - f) * 120 - Math.sin(f * 3.14) * 18, sc); }
    // reticle
    if (s.phase === 'aim') {
      const { x, y } = s.ret, blink = (eng.t >> 4) % 2;
      ctx.strokeStyle = blink ? PALE : GOLD; ctx.beginPath(); ctx.arc(x, y, 7, 0, 6.283); ctx.stroke();
      ctx.fillStyle = blink ? PALE : GOLD; ctx.fillRect(x - 11, y, 6, 1); ctx.fillRect(x + 6, y, 6, 1); ctx.fillRect(x, y - 11, 1, 6); ctx.fillRect(x, y + 6, 1, 6); ctx.fillRect(x, y, 1, 1);
    }
    for (const q of s.pops) text(ctx, q.s, q.x, q.y - (40 - q.l) / 3, q.c, 'center', 8);
    // HUD
    ctx.fillStyle = 'rgba(7,6,12,0.85)'; ctx.fillRect(0, 0, 240, 32); ctx.fillStyle = BRASS; ctx.fillRect(0, 32, 240, 2);
    text(ctx, `ROUND ${s.round}`, 4, 4, GOLD);
    text(ctx, String(eng.score).padStart(6, '0'), 236, 4, PAL.ink, 'right');
    const tot = total(), shown = s.verdict && s.phase === 'verdict' ? s.verdict.req : s.req;
    text(ctx, `REQUIRED ${shown}`, 4, 18, CREAM, 'left', 6);
    text(ctx, `TOTAL ${tot}`, 236, 18, tot >= shown ? PAL.green : PALE, 'right', 6);
    // darts remaining on the ledge
    for (let i = 0; i < 3 - s.darts.length - (s.fly ? 1 : 0); i++) dart(ctx, 30 + i * 24, 284, 1);
    text(ctx, s.phase === 'aim' ? 'STEADY. THROW.' : s.phase === 'slide' ? 'TARGET UNDER REVISION' : '', 236, 290, CREAM, 'right', 6);
    if (s.hint && s.round === 1) text(ctx, `THREE DARTS. SCORE ${s.req}.`, 120, 250, PALE, 'center', 6);
    if (s.phase === 'verdict') {
      const v = s.verdict;
      ctx.fillStyle = 'rgba(7,6,12,0.85)'; ctx.fillRect(14, 132, 212, 64); ctx.fillStyle = BRASS; ctx.fillRect(14, 132, 212, 2); ctx.fillRect(14, 194, 212, 2);
      if (v.revised) text(ctx, `TARGET REVISED TO ${v.req}`, 120, 140, PALE, 'center', 6);
      text(ctx, v.pass ? 'WITHIN EXPECTATIONS' : 'BELOW EXPECTATIONS', 120, v.revised ? 154 : 146, v.pass ? GOLD : PAL.red, 'center');
      text(ctx, v.pass ? `+${v.pts}` : `${v.tot} OF ${v.req}`, 120, 172, CREAM, 'center');
    }
  },
};
function judge(eng) {
  const tot = total(); let req = s.req, revised = false;
  if (eng.god && tot < req) { req = tot; revised = true; } // god mode: the committee lowers the requirement to your total
  const pass = tot >= req, pts = pass ? tot * 5 * (s.round + 1) + (tot - req) * 20 : 0;
  eng.score += pts;
  s.verdict = { pass, tot, req, revised, pts }; s.phase = 'verdict'; s.timer = 120;
  if (pass) { eng.beep(880, 0.1); eng.beep(1320, 0.14, 'triangle', 0.04); } else eng.beep(160, 0.3, 'sawtooth', 0.05, -60);
}
// a framed price chart on the analyst's wall: a rising line, or a row of candles
function chart(ctx, x, y, candles) {
  ctx.fillStyle = BRASS; ctx.fillRect(x, y, 70, 50); ctx.fillStyle = INK; ctx.fillRect(x + 3, y + 3, 64, 44);
  ctx.fillStyle = 'rgba(255,233,168,0.12)'; for (let gy = y + 11; gy < y + 46; gy += 10) ctx.fillRect(x + 4, gy, 62, 1);
  if (candles) {
    const H = [30, 26, 28, 20, 22, 14, 17, 9];
    H.forEach((h, i) => { const up = i === 0 || h < H[i - 1], cx = x + 7 + i * 7.5; ctx.fillStyle = up ? PAL.green : PAL.red; ctx.fillRect(cx + 2, y + h - 3, 1, 14); ctx.fillRect(cx, y + h, 5, 7); });
  } else {
    const P = [38, 34, 36, 28, 31, 22, 25, 16, 19, 10];
    ctx.strokeStyle = GOLD; ctx.lineWidth = 2; ctx.beginPath(); P.forEach((py, i) => ctx[i ? 'lineTo' : 'moveTo'](x + 6 + i * 6.4, y + py)); ctx.stroke(); ctx.lineWidth = 1;
    ctx.fillStyle = PALE; ctx.fillRect(x + 62, y + 8, 3, 3);
  }
}
function dart(ctx, x, y, sc) {
  // point at (x, y), body angled down and to the right
  const L = 14 * sc;
  ctx.strokeStyle = '#d8d8e0'; ctx.lineWidth = Math.max(1, sc); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + L * 0.3, y + L * 0.3); ctx.stroke();
  ctx.strokeStyle = BRASS; ctx.lineWidth = 2 * sc; ctx.beginPath(); ctx.moveTo(x + L * 0.3, y + L * 0.3); ctx.lineTo(x + L * 0.65, y + L * 0.65); ctx.stroke();
  ctx.fillStyle = CREAM; ctx.beginPath(); ctx.moveTo(x + L * 0.6, y + L * 0.6); ctx.lineTo(x + L * 1.05, y + L * 0.55); ctx.lineTo(x + L, y + L); ctx.lineTo(x + L * 0.55, y + L * 1.05); ctx.closePath(); ctx.fill();
  ctx.lineWidth = 1;
}
boot(game);
