// Par Value: mini-golf in which the cup rides a short brass rail and each hole has a face value. Move the cup, aim, hold for power, release.
// Nine holes; each must be sunk in three strokes or fewer. Moving walls arrive later in the round.
import { boot, PAL } from '../engine.js';
const C = { vel: '#5a1230', vel2: '#3a0b1f', gold: '#ffb238', pale: '#ffe9a8', brass: '#c9a15a', cream: '#f4ead2', black: '#07060c' };
const X0 = 14, X1 = 226, Y0 = 44, Y1 = 306, BR = 3, CR = 5.5, MAXV = 5.6;
// b = ball start, r = cup rail [x1,y1,x2,y2], w = walls [x,y,w,h, swing, speed]
const HOLES = [
  { b: [120, 280], r: [80, 80, 160, 80], w: [] },
  { b: [120, 284], r: [60, 72, 180, 72], w: [[70, 160, 100, 14]] },
  { b: [44, 284], r: [36, 70, 110, 70], w: [[14, 168, 150, 14]] },
  { b: [200, 286], r: [40, 56, 40, 104], w: [[14, 120, 130, 12], [96, 206, 130, 12]] },
  { b: [120, 288], r: [70, 64, 170, 64], w: [[50, 150, 14, 14], [113, 128, 14, 14], [176, 150, 14, 14], [82, 200, 14, 14], [144, 200, 14, 14]] },
  { b: [40, 288], r: [150, 66, 210, 66], w: [[14, 170, 92, 12], [134, 170, 92, 12]] },
  { b: [120, 288], r: [60, 70, 180, 70], w: [[90, 170, 60, 12, 70, 0.03]] },
  { b: [204, 290], r: [30, 56, 30, 98], w: [[14, 110, 150, 10], [76, 180, 150, 10], [14, 250, 110, 10]] },
  { b: [120, 290], r: [80, 62, 160, 62], w: [[14, 140, 96, 10], [130, 140, 96, 10], [90, 214, 60, 12, 66, 0.04]] },
];
const FACE = [100, 100, 250, 250, 500, 500, 1000, 1000, 1000]; // each hole's par, as a face value
let s;

const hole = () => HOLES[s.h];
const walls = () => hole().w.map(([x, y, w, h, sw = 0, sp = 0]) => [x + Math.sin(s.ht * sp) * sw, y, w, h]);
function cupPos() {
  if (s.cupAt) return s.cupAt;
  const [x1, y1, x2, y2] = hole().r;
  return { x: x1 + (x2 - x1) * s.cup, y: y1 + (y2 - y1) * s.cup };
}
function startHole() {
  const H = hole();
  s.ball = { x: H.b[0], y: H.b[1], vx: 0, vy: 0 };
  s.cup = 0.5; s.cupAt = null; s.moved = false; s.strokes = 0; s.ht = 0; s.pw = 0; s.pdir = 1; s.charging = false;
  s.phase = 'aim'; s.timer = 0; aimAtCup();
}
function aimAtCup() { const c = cupPos(); s.aim = Math.atan2(c.y - s.ball.y, c.x - s.ball.x); }
function hitRect(b, x, y, w, h) {
  const cx = Math.max(x, Math.min(b.x, x + w)), cy = Math.max(y, Math.min(b.y, y + h));
  let nx = b.x - cx, ny = b.y - cy, d = Math.hypot(nx, ny);
  if (d >= BR) return false;
  if (d < 0.001) {
    const m = [b.x - x, x + w - b.x, b.y - y, y + h - b.y], i = m.indexOf(Math.min(...m));
    [nx, ny] = [[-1, 0], [1, 0], [0, -1], [0, 1]][i]; b.x += nx * (BR + m[i]); b.y += ny * (BR + m[i]);
  } else { nx /= d; ny /= d; b.x += nx * (BR - d); b.y += ny * (BR - d); }
  const vn = b.vx * nx + b.vy * ny;
  if (vn < 0) { b.vx -= 1.75 * vn * nx; b.vy -= 1.75 * vn * ny; }
  return true;
}
function bounds(b) {
  if (b.x < X0 + BR) { b.x = X0 + BR; b.vx = Math.abs(b.vx) * 0.75; }
  if (b.x > X1 - BR) { b.x = X1 - BR; b.vx = -Math.abs(b.vx) * 0.75; }
  if (b.y < Y0 + BR) { b.y = Y0 + BR; b.vy = Math.abs(b.vy) * 0.75; }
  if (b.y > Y1 - BR) { b.y = Y1 - BR; b.vy = -Math.abs(b.vy) * 0.75; }
}
function sink(eng, strokes, label) {
  const pts = Math.round(FACE[s.h] * [0, 10, 5, 2.5][strokes]) + (s.moved ? 0 : 150);
  eng.score += pts; s.award = pts; s.label = label; s.phase = 'sunk'; s.timer = 120;
  eng.beep(784, 0.08); eng.beep(1046, 0.1); eng.beep(1568, 0.2, 'triangle');
}

const game = {
  id: 'golf', tapIsAct: true,
  reset() { s = { h: 0, pops: [] }; startHole(); },
  update(eng) {
    s.ht++;
    const b = s.ball, k = eng.keys;
    if (s.phase === 'sunk' || s.phase === 'fail') {
      if (--s.timer > 0) return;
      if (s.phase === 'fail') { eng.gameOver('SCORECARD UNDER REVIEW'); return; }
      if (++s.h >= HOLES.length) { eng.gameOver('HANDICAP ACCEPTED'); return; }
      startHole(); return;
    }
    const W = walls();
    if (s.phase === 'god') { // the cup glides over to the ball
      const c = s.cupAt; c.x += (b.x - c.x) * 0.08; c.y += (b.y - c.y) * 0.08;
      if (Math.hypot(b.x - c.x, b.y - c.y) < 0.8) sink(eng, 3, 'ACCEPTABLE RESULT');
      return;
    }
    if (s.phase === 'aim') {
      for (const w of W) hitRect(b, ...w); // a passing wall may nudge a resting ball
      b.vx = b.vy = 0;
      if (k.left) s.aim -= 0.03;
      if (k.right) s.aim += 0.03;
      if (k.up || k.down) { s.cup = Math.max(0, Math.min(1, s.cup + (k.up ? 0.012 : -0.012))); if (Math.abs(s.cup - 0.5) > 0.01) s.moved = true; }
      if (k.act) {
        if (!s.charging) { s.charging = true; s.pw = 0; s.pdir = 1; }
        s.pw += 0.017 * s.pdir; if (s.pw >= 1) { s.pw = 1; s.pdir = -1; } if (s.pw <= 0) { s.pw = 0; s.pdir = 1; }
      } else if (s.charging) {
        s.charging = false; s.strokes++;
        const v = 0.5 + s.pw * (MAXV - 0.5);
        b.vx = Math.cos(s.aim) * v; b.vy = Math.sin(s.aim) * v; s.phase = 'roll';
        eng.beep(300 + s.pw * 400, 0.05, 'triangle');
      }
      return;
    }
    // roll: substeps so the ball never skips through a wall
    const sp = Math.hypot(b.vx, b.vy), n = Math.max(1, Math.ceil(sp / 1.5)), cup = cupPos();
    for (let i = 0; i < n; i++) {
      b.x += b.vx / n; b.y += b.vy / n;
      for (const w of W) if (hitRect(b, ...w)) eng.beep(220, 0.03, 'square', 0.03);
      bounds(b);
      const dc = Math.hypot(b.x - cup.x, b.y - cup.y);
      if (dc < CR) {
        if (Math.hypot(b.vx, b.vy) < 3.4) { b.x = cup.x; b.y = cup.y; sink(eng, s.strokes, s.strokes === 1 ? 'HOLE IN ONE' : s.moved ? 'PERSONAL DISCIPLINE' : 'UNASSISTED'); return; }
        b.vx = b.vx * 0.7 + (b.x - cup.x) * 0.15; b.vy = b.vy * 0.7 + (b.y - cup.y) * 0.15; // lip out
      } else if (dc < CR + 5 && sp < 1.2) { b.vx += (cup.x - b.x) * 0.012; b.vy += (cup.y - b.y) * 0.012; }
    }
    b.vx *= 0.979; b.vy *= 0.979;
    const v = Math.hypot(b.vx, b.vy);
    if (v > 0) { const nv = Math.max(0, v - 0.012); b.vx *= nv / v; b.vy *= nv / v; }
    if (v < 0.06) {
      b.vx = b.vy = 0;
      if (s.strokes >= 3) {
        // god mode: after a missed third stroke, the cup relocates beneath the ball
        if (eng.god) { s.cupAt = { ...cupPos() }; s.phase = 'god'; eng.beep(523, 0.2, 'triangle'); }
        else { s.phase = 'fail'; s.timer = 110; eng.beep(160, 0.4, 'sawtooth', 0.05, -60); }
      } else { s.phase = 'aim'; aimAtCup(); }
    }
  },
  draw(eng, ctx) {
    const { text } = eng, b = s.ball, H = hole(), cup = cupPos();
    // velvet curtains
    for (let x = 0; x < 240; x += 6) { ctx.fillStyle = (x / 6) % 2 ? C.vel : C.vel2; ctx.fillRect(x, 32, 6, 288); }
    // gold-rimmed green
    ctx.fillStyle = C.brass; ctx.fillRect(X0 - 4, Y0 - 4, X1 - X0 + 8, Y1 - Y0 + 8);
    ctx.fillStyle = C.pale; ctx.fillRect(X0 - 4, Y0 - 4, X1 - X0 + 8, 1);
    for (let y = Y0; y < Y1; y += 12) { ctx.fillStyle = (y / 12) % 2 ? '#1f6b3a' : '#1b6034'; ctx.fillRect(X0, y, X1 - X0, Math.min(12, Y1 - y)); }
    // rail
    const [x1, y1, x2, y2] = H.r;
    ctx.strokeStyle = '#7a5a26'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = C.brass; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = C.gold; ctx.fillRect(x1 - 3, y1 - 3, 6, 6); ctx.fillRect(x2 - 3, y2 - 3, 6, 6);
    // original cup position, faintly
    ctx.fillStyle = C.pale; ctx.fillRect((x1 + x2) / 2 - 1, (y1 + y2) / 2 - 1, 2, 2);
    // walls
    for (const [x, y, w, h] of walls()) { ctx.fillStyle = '#7a5a26'; ctx.fillRect(x, y + 2, w, h); ctx.fillStyle = C.brass; ctx.fillRect(x, y, w, h - 1); ctx.fillStyle = C.pale; ctx.fillRect(x, y, w, 1); }
    // cup and flag
    ctx.fillStyle = C.black; ctx.beginPath(); ctx.arc(cup.x, cup.y, CR, 0, 7); ctx.fill();
    ctx.fillStyle = '#2a2a30'; ctx.beginPath(); ctx.arc(cup.x, cup.y + 1, CR - 2, 0, 7); ctx.fill();
    if (s.phase !== 'sunk') { // the flag is a small bond certificate with a gold seal
      ctx.fillStyle = C.cream; ctx.fillRect(cup.x, cup.y - 22, 1, 22);
      const fx = cup.x + 1, fy = cup.y - 22;
      ctx.fillStyle = '#7a5a26'; ctx.fillRect(fx, fy, 15, 10); ctx.fillStyle = C.cream; ctx.fillRect(fx + 1, fy + 1, 13, 8);
      ctx.fillStyle = '#b0a080'; ctx.fillRect(fx + 3, fy + 3, 6, 1); ctx.fillRect(fx + 3, fy + 5, 4, 1);
      ctx.fillStyle = C.gold; ctx.fillRect(fx + 10, fy + 4, 3, 3); ctx.fillStyle = '#c0203a'; ctx.fillRect(fx + 11, fy + 7, 1, 2);
    }
    // aim guide
    if (s.phase === 'aim') {
      const len = 14 + (s.charging ? s.pw * 40 : 16);
      ctx.fillStyle = s.charging ? C.gold : C.cream;
      for (let d = 7; d < len; d += 4) ctx.fillRect(b.x + Math.cos(s.aim) * d - 1, b.y + Math.sin(s.aim) * d - 1, 2, 2);
    }
    // ball
    if (s.phase !== 'sunk') { ctx.fillStyle = '#9a948a'; ctx.beginPath(); ctx.arc(b.x, b.y + 1, BR, 0, 7); ctx.fill(); ctx.fillStyle = C.cream; ctx.beginPath(); ctx.arc(b.x, b.y, BR, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(b.x - 2, b.y - 2, 1, 1); }
    // HUD
    ctx.fillStyle = C.black; ctx.fillRect(0, 0, 240, 32); ctx.fillStyle = C.brass; ctx.fillRect(0, 32, 240, 1);
    text(ctx, `HOLE ${s.h + 1}/9`, 4, 4, C.gold);
    text(ctx, `PAR ${FACE[s.h]}`, 132, 4, C.pale, 'center');
    text(ctx, String(eng.score).padStart(6, '0'), 236, 4, C.cream, 'right');
    text(ctx, `STROKE ${Math.min(3, s.strokes + (s.phase === 'aim' ? 1 : 0))}/3`, 4, 18, s.strokes >= 2 ? PAL.orange : C.cream);
    ctx.fillStyle = '#2a2026'; ctx.fillRect(150, 18, 86, 8);
    ctx.fillStyle = s.pw > 0.85 ? PAL.red : C.gold; ctx.fillRect(150, 18, 86 * (s.charging ? s.pw : 0), 8);
    text(ctx, 'PWR', 146, 18, '#8a7a60', 'right', 6);
    if (eng.state !== 'play') return;
    const box = (a, c, bb) => { ctx.fillStyle = 'rgba(7,6,12,0.85)'; ctx.fillRect(10, 140, 220, 46); text(ctx, a, 120, 146, c, 'center'); if (bb) text(ctx, bb, 120, 162, C.cream, 'center', 6); };
    if (s.phase === 'sunk') box(s.label, C.gold, `+${s.award}`);
    else if (s.phase === 'fail') box('THREE STROKES', PAL.red, 'THE COURSE DECLINES TO FLEX');
    else if (s.phase === 'god') box('THE CUP OBLIGES', C.gold, 'AN ACCEPTABLE RESULT IS RECORDED');
    else if (s.h === 0 && s.strokes === 0 && s.ht < 240) box('UP AND DOWN MOVE THE CUP', C.pale, 'HOLD A FOR POWER. RELEASE TO PUTT.');
  },
};
boot(game);
