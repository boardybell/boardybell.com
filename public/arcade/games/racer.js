// Front Running: a top-down cart race around a circuit shaped like a price chart. Three laps, two rival members.
// Action opens the EARLY ACCESS gate for a moment; anyone who arrives while it is open may use it.
import { boot, PAL } from '../engine.js';
const C = { vel: '#5a1230', vel2: '#3a0b1f', gold: '#ffb238', pale: '#ffe9a8', brass: '#c9a15a', cream: '#f4ead2', black: '#07060c', road: '#1e1a22' };
const HW = 14, LAPS = 3, FIN_X = 120;
const SC_Y = 175, SC_X0 = 28, SC_X1 = 212, ROPE_X = 196, BAND = 13;
const OPEN_T = 100, COOL_T = 420, CRUISE = 2.0, SPRINT = 2.5, CARPET = 0.5;
let s, PTS = null, L = 0, dJ = 0, dK = 0;

// centerline: a closed loop whose top edge is a price chart, driven from the finish line heading east.
// Corners are rounded off with a few passes of corner cutting so the carts can follow it.
const LOOP = [[120, 300], [194, 300], [212, 282], [212, 100], [184, 70], [156, 104], [128, 74], [100, 110], [72, 64], [46, 92], [28, 110], [28, 282], [46, 300]];
function buildTrack() {
  let P = LOOP.map((p) => p.slice());
  for (let k = 0; k < 3; k++) { const Q = []; P.forEach((p, i) => { const q = P[(i + 1) % P.length]; Q.push([p[0] * 0.75 + q[0] * 0.25, p[1] * 0.75 + q[1] * 0.25], [p[0] * 0.25 + q[0] * 0.75, p[1] * 0.25 + q[1] * 0.75]); }); P = Q; }
  // the finish sits on the bottom straight at x=120: rotate the list to start there, then resample every 3px
  const st = P.findIndex((p, i) => p[1] > 299 && p[0] <= FIN_X && P[(i + 1) % P.length][0] > FIN_X);
  P = P.slice(st).concat(P.slice(0, st));
  PTS = [];
  P.forEach((p, i) => { const q = P[(i + 1) % P.length], n = Math.max(1, Math.round(Math.hypot(q[0] - p[0], q[1] - p[1]) / 3)); for (let j = 0; j < n; j++) PTS.push([p[0] + (q[0] - p[0]) * j / n, p[1] + (q[1] - p[1]) * j / n]); });
  let d = 0;
  PTS.forEach((p, i) => { p[2] = d; const q = PTS[(i + 1) % PTS.length]; d += Math.hypot(q[0] - p[0], q[1] - p[1]); });
  L = d; dJ = nearest(SC_X1, SC_Y); dK = nearest(SC_X0, SC_Y);
}
function nearest(x, y) { let b = 0, bd = 1e9; for (const p of PTS) { const dd = (p[0] - x) ** 2 + (p[1] - y) ** 2; if (dd < bd) { bd = dd; b = p[2]; } } return b; }
function posAt(d, lane) {
  d = ((d % L) + L) % L;
  let i = 0; while (i < PTS.length - 1 && PTS[i + 1][2] <= d) i++;
  const p = PTS[i], q = PTS[(i + 1) % PTS.length], seg = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, f = (d - p[2]) / seg;
  const dx = (q[0] - p[0]) / seg, dy = (q[1] - p[1]) / seg;
  return { x: p[0] + (q[0] - p[0]) * f - dy * lane, y: p[1] + (q[1] - p[1]) * f + dx * lane, a: Math.atan2(dy, dx) };
}
function onTrack(x, y) {
  if (x > 40 && x < 200 && Math.abs(y - SC_Y) < BAND) return true;
  for (const p of PTS) if ((p[0] - x) ** 2 + (p[1] - y) ** 2 <= HW * HW) return true;
  return false;
}
function newRace() {
  const base = Math.min(2.45, 1.78 + (s.race - 1) * 0.13);
  s.rivals = [
    { d: 26, lane: -9, v: base, done: 0, sc: false, sx: 0, col: C.cream, ph: 0, x: 0, y: 0, a: 0 },
    { d: 40, lane: 9, v: base + 0.09, done: 0, sc: false, sx: 0, col: '#e07a9c', ph: 2, x: 0, y: 0, a: 0 },
  ];
  s.p = { x: 128, y: 300, a: 0, v: 0, done: 0, cpA: false, cpB: false };
  s.open = 0; s.cool = 0; s.count = 150; s.phase = 'race'; s.timer = 0; s.time = 0; s.pops = [];
}
const pop = (x, y, txt, c) => s.pops.push({ x, y, txt, c, t: 60 });

const game = {
  id: 'racer',
  reset() { if (!PTS) buildTrack(); s = { race: 1 }; newRace(); },
  update(eng) {
    for (const q of s.pops) { q.t--; q.y -= 0.3; }
    s.pops = s.pops.filter((q) => q.t > 0);
    if (s.phase !== 'race') {
      if (--s.timer > 0) return;
      if (s.phase === 'won') { s.race++; newRace(); } else eng.gameOver('MEMBERSHIP UNDER REVIEW');
      return;
    }
    if (s.count > 0) { s.count--; if (s.count % 50 === 0) eng.beep(s.count ? 440 : 880, 0.1); return; }
    s.time++;
    if (s.open > 0) s.open--;
    if (s.cool > 0) s.cool--;
    if (eng.pressed.act) {
      if (s.cool <= 0) { s.open = OPEN_T; s.cool = COOL_T; eng.beep(660, 0.06); eng.beep(990, 0.1, 'triangle'); }
      else eng.beep(120, 0.05, 'triangle', 0.03);
    }
    // rivals: follow the line; take the shortcut only if the rope is open as they reach it
    for (const r of s.rivals) {
      if (r.done >= LAPS) continue;
      const v = r.v * (1 + 0.04 * Math.sin(s.time / 47 + r.ph));
      if (r.sc) {
        r.sx -= v;
        if (r.sx <= SC_X0) { r.sc = false; r.d = dK + (SC_X0 - r.sx); }
      } else {
        const prev = r.d; r.d += v;
        if (prev < dJ && r.d >= dJ && s.open > 0) { r.sc = true; r.sx = SC_X1 - (r.d - dJ); pop(150, SC_Y - 22, 'SO DID THEY', C.cream); }
        // god mode: rivals on their final lap wait just short of the finish until the member crosses
        if (eng.god && r.done === LAPS - 1) r.d = Math.min(r.d, Math.max(prev, L - 26));
        if (r.d >= L) { r.d -= L; r.done++; }
      }
      if (r.sc) { r.x = r.sx; r.y = SC_Y + r.lane * 0.6; r.a = Math.PI; } else { const q = posAt(r.d, r.lane); r.x = q.x; r.y = q.y; r.a = q.a; }
      if (r.done >= LAPS && s.p.done < LAPS) { s.phase = 'lost'; s.timer = 150; eng.beep(150, 0.5, 'sawtooth', 0.05, -80); return; }
    }
    // the member's cart: cruises by itself, up to sprint, down to brake
    const p = s.p, k = eng.keys, on = onTrack(p.x, p.y);
    const target = !on ? CARPET : k.down ? 0 : k.up ? SPRINT : CRUISE;
    if (k.down) p.v = Math.max(-0.6, p.v - 0.08);
    else if (p.v < target) p.v = Math.min(target, p.v + 0.05);
    else p.v = Math.max(target, p.v - (on ? 0.03 : 0.12));
    const turn = 0.058 * Math.min(1, Math.abs(p.v) / 1.1) * Math.sign(p.v);
    if (k.left) p.a -= turn;
    if (k.right) p.a += turn;
    let nx = p.x + Math.cos(p.a) * p.v, ny = p.y + Math.sin(p.a) * p.v;
    if (Math.abs(ny - SC_Y) < BAND && (p.x - ROPE_X) * (nx - ROPE_X) <= 0 && nx !== p.x) {
      if (s.open <= 0) { nx = p.x; ny = p.y; p.v *= -0.4; eng.beep(90, 0.08, 'square', 0.04); pop(ROPE_X - 30, SC_Y - 24, 'NOT YET ELIGIBLE', PAL.red); }
      else if (nx < p.x) { eng.score += 100; pop(ROPE_X - 40, SC_Y - 24, 'EARLY FILL +100', C.gold); }
    }
    const ox = p.x;
    p.x = Math.max(8, Math.min(232, nx)); p.y = Math.max(40, Math.min(316, ny));
    if (p.x > 190 && p.y < 230) p.cpA = true;
    if (p.cpA && p.x < 50 && p.y > 150) p.cpB = true;
    if (p.y > 280 && ox < FIN_X && p.x >= FIN_X) {
      if (p.cpA && p.cpB) {
        p.done++; p.cpA = p.cpB = false;
        if (p.done >= LAPS) {
          const bonus = 1000 * s.race + Math.max(0, 3000 - s.time) * 2;
          eng.score += bonus; s.phase = 'won'; s.timer = 160; s.bonus = bonus;
          eng.beep(660, 0.1); eng.beep(880, 0.1); eng.beep(1320, 0.25); return;
        }
        eng.score += 200; pop(FIN_X, 262, 'LAP +200', C.pale); eng.beep(880, 0.08);
      }
    }
  },
  draw(eng, ctx) {
    const { text } = eng;
    ctx.fillStyle = C.vel2; ctx.fillRect(0, 0, 240, 320);
    ctx.fillStyle = C.vel;
    for (let y = 36; y < 320; y += 12) for (let x = (y / 12) % 2 ? 6 : 0; x < 240; x += 12) { ctx.fillRect(x + 2, y, 2, 1); ctx.fillRect(x + 1, y + 1, 4, 1); ctx.fillRect(x + 2, y + 2, 2, 1); }
    // chart gridlines in the infield
    ctx.fillStyle = 'rgba(255,233,168,0.07)';
    for (let y = 60; y < 300; y += 20) ctx.fillRect(0, y, 240, 1);
    for (let x = 20; x < 240; x += 20) ctx.fillRect(x, 34, 1, 286);
    // circuit: the price line itself
    ctx.beginPath(); PTS.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
    ctx.lineJoin = 'round'; ctx.lineWidth = 2 * HW + 4; ctx.strokeStyle = C.brass; ctx.stroke();
    ctx.lineWidth = 2 * HW; ctx.strokeStyle = C.road; ctx.stroke();
    // centre line: green where the chart rises (read left to right), red where it falls, grey elsewhere
    for (let i = 0; i < PTS.length; i += 2) {
      const p = PTS[i], q = PTS[(i + 1) % PTS.length], top = p[1] < 125 && p[0] > 34 && p[0] < 206;
      ctx.fillStyle = !top ? '#4a3a40' : q[1] > p[1] ? PAL.green : PAL.red;
      if (top || (i >> 2) % 2) ctx.fillRect(p[0] - (top ? 1 : 0), p[1] - (top ? 1 : 0), top ? 2 : 1, top ? 2 : 1);
    }
    ticker(eng, ctx, 35, 1); ticker(eng, ctx, 270, -1, 44, 196);
    // early access lane
    ctx.fillStyle = C.brass; ctx.fillRect(40, SC_Y - BAND - 1, 160, 2 * BAND + 2);
    ctx.fillStyle = s.open > 0 ? '#2a2010' : C.road; ctx.fillRect(40, SC_Y - BAND + 1, 160, 2 * BAND - 2);
    ctx.fillStyle = C.vel; for (let x = 48; x < 186; x += 14) ctx.fillRect(x, SC_Y + 6, 7, 2);
    text(ctx, 'EARLY ACCESS', 116, SC_Y - 7, s.open > 0 ? C.gold : '#6a4a52', 'center', 6);
    // the gate: two brass posts and a velvet bar
    ctx.fillStyle = C.gold; ctx.fillRect(ROPE_X - 2, SC_Y - BAND - 2, 5, 5); ctx.fillRect(ROPE_X - 2, SC_Y + BAND - 3, 5, 5);
    ctx.strokeStyle = '#c0203a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ROPE_X, SC_Y - BAND);
    if (s.open > 0) ctx.quadraticCurveTo(ROPE_X + 10, SC_Y - BAND + 4, ROPE_X + 4, SC_Y - 2);
    else ctx.quadraticCurveTo(ROPE_X - 4, SC_Y, ROPE_X, SC_Y + BAND - 1);
    ctx.stroke();
    // finish line
    for (let y = 286; y < 314; y += 3) for (let i = 0; i < 2; i++) { ctx.fillStyle = ((y / 3 + i) | 0) % 2 ? C.cream : C.black; ctx.fillRect(FIN_X - 3 + i * 3, y, 3, 3); }
    // carts
    for (const r of s.rivals) cart(ctx, r.x || posAt(r.d, r.lane).x, r.y || posAt(r.d, r.lane).y, r.a, r.col, C.vel2);
    cart(ctx, s.p.x, s.p.y, s.p.a, C.gold, C.black);
    if (s.count > 0) { text(ctx, 'YOU', s.p.x, s.p.y - 16, C.gold, 'center', 6); }
    for (const q of s.pops) text(ctx, q.txt, q.x, q.y, q.c, 'center', 6);
    // HUD
    ctx.fillStyle = C.black; ctx.fillRect(0, 0, 240, 32); ctx.fillStyle = C.brass; ctx.fillRect(0, 32, 240, 1);
    text(ctx, `RACE ${s.race}`, 4, 4, C.gold);
    text(ctx, String(eng.score).padStart(6, '0'), 236, 4, C.cream, 'right');
    text(ctx, `LAP ${Math.min(s.p.done + 1, LAPS)}/${LAPS}`, 4, 18, C.cream);
    text(ctx, `P${place()}`, 112, 18, place() === 1 ? PAL.green : PAL.red, 'center');
    if (s.open > 0) text(ctx, 'GATE OPEN', 236, 18, C.gold, 'right');
    else if (s.cool > 0) { text(ctx, 'GATE', 188, 18, '#6a5a50', 'right'); ctx.fillStyle = '#3a2a30'; ctx.fillRect(192, 19, 44, 6); ctx.fillStyle = C.brass; ctx.fillRect(192, 19, 44 * (1 - s.cool / COOL_T), 6); }
    else text(ctx, 'GATE READY', 236, 18, PAL.green, 'right');
    if (eng.state !== 'play') return;
    const mid = (a, b, c) => { ctx.fillStyle = 'rgba(7,6,12,0.82)'; ctx.fillRect(10, 112, 220, 50); text(ctx, a, 120, 118, c, 'center'); if (b) text(ctx, b, 120, 132, C.cream, 'center', 6); if (s.phase === 'won') text(ctx, `+${s.bonus}`, 120, 146, C.gold, 'center'); };
    if (s.count > 0) mid(s.count > 100 ? '3' : s.count > 50 ? '2' : '1', s.race === 1 ? 'A OPENS EARLY ACCESS. BRIEFLY.' : 'THE MEMBERS HAVE BEEN COACHED', C.gold);
    else if (s.time < 50) mid('PROCEED', '', PAL.green);
    else if (s.phase === 'won') mid('FIRST, AS EXPECTED', 'THE QUEUE HAS BEEN INFORMED');
    else if (s.phase === 'lost') mid('A MEMBER ARRIVED FIRST', 'PRECEDENCE IS BEING REVIEWED', PAL.red);
  },
};
function place() {
  const prog = (done, d) => done * L + d;
  let pd = nearest(s.p.x, s.p.y);
  if (Math.abs(s.p.y - SC_Y) < BAND && s.p.x > 40 && s.p.x < 200) pd = dJ + (SC_X1 - s.p.x) / (SC_X1 - SC_X0) * (dK - dJ);
  if (!s.p.cpA && pd > dJ + 60) pd -= L;
  const me = prog(s.p.done, pd);
  return 1 + s.rivals.filter((r) => prog(r.done, r.sc ? dJ + (SC_X1 - r.sx) / (SC_X1 - SC_X0) * (dK - dJ) : r.d) > me).length;
}
const TAPE = [['BRD', 1], ['CFO', -1], ['LOL', 1], ['ZZZ', -1], ['TAX', 1], ['YAWN', 1], ['AUD', -1], ['FEE', 1]];
function ticker(eng, ctx, y, dir, x0 = 0, x1 = 240) {
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y, x1 - x0, 9); ctx.clip();
  ctx.fillStyle = C.black; ctx.fillRect(x0, y, x1 - x0, 9);
  const span = TAPE.length * 40, off = ((eng.t * 0.5 * dir) % span + span) % span;
  for (let k = -1; k <= Math.ceil((x1 - x0) / span); k++) TAPE.forEach(([sym, up], i) => {
    const x = x0 + k * span + i * 40 - off;
    eng.text(ctx, sym, x, y + 2, C.pale, 'left', 6);
    const ax = x + sym.length * 6 + 3; ctx.fillStyle = up > 0 ? PAL.green : PAL.red;
    if (up > 0) { ctx.fillRect(ax + 1, y + 2, 1, 1); ctx.fillRect(ax, y + 3, 3, 1); ctx.fillRect(ax - 1, y + 4, 5, 1); }
    else { ctx.fillRect(ax - 1, y + 3, 5, 1); ctx.fillRect(ax, y + 4, 3, 1); ctx.fillRect(ax + 1, y + 5, 1, 1); }
  });
  ctx.restore();
}
function cart(ctx, x, y, a, col, trim) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(a);
  ctx.fillStyle = C.black; ctx.fillRect(-6, -7, 4, 3); ctx.fillRect(3, -7, 4, 3); ctx.fillRect(-6, 4, 4, 3); ctx.fillRect(3, 4, 4, 3);
  ctx.fillStyle = col; ctx.fillRect(-7, -5, 15, 10);
  ctx.fillStyle = trim; ctx.fillRect(-4, -3, 6, 6);
  ctx.fillStyle = C.pale; ctx.fillRect(8, -4, 2, 8);
  ctx.restore();
}
boot(game);
