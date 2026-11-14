// Liquidity Event: a compact pinball table. Original layout: coin-stack bumpers, three departmental targets, a bonus chute.
import { boot, PAL } from '../engine.js';
const R = 4, SUB = 10, G = 0.12, VMAX = 10.5, FL = 28;
// Static walls [x1, y1, x2, y2]. Playfield is x 8..214, plunger lane 214..234.
const WALLS = [
  [8, 226, 8, 60], [8, 60, 12, 46], [12, 46, 22, 35], [22, 35, 36, 28], [36, 28, 196, 28],
  [196, 28, 218, 33], [218, 33, 229, 42], [229, 42, 234, 54], [234, 54, 234, 320],
  [214, 112, 214, 320],                       // plunger lane separator
  [8, 226, 76, 284], [214, 226, 146, 284],    // inlane guides down to the flipper pivots
];
const GATE = [214, 38, 214, 112];             // one-way: lets the ball out of the lane, never back in
// Slingshots: triangles; the first edge is the kicking face.
const SLINGS = [[16, 192, 50, 256, 16, 230], [206, 192, 172, 256, 206, 230]];
const BUMPERS = [[66, 98], [156, 98], [111, 134]], BR = 10;
const TARGETS = [126, 148, 170], TNAME = ['HR', 'IT', 'OPS'];  // standing on the left wall, 14px tall
const CHUTE = [111, 60];
const FLIP = [{ px: 76, py: 284, dir: 1 }, { px: 146, py: 284, dir: -1 }];
const REST = 0.52, UP = -0.5;
const SLING_COL = '#ff4fd8';
let s;
const hit = { nx: 0, ny: 0 };

// Circle vs capsule (segment with radius rad). Surface velocity at a point t along it is (tvx, tvy) * t.
function seg(b, x1, y1, x2, y2, rad, e, tvx, tvy) {
  const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy;
  let t = ((b.x - x1) * dx + (b.y - y1) * dy) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
  const cx = x1 + t * dx, cy = y1 + t * dy;
  let nx = b.x - cx, ny = b.y - cy; const d2 = nx * nx + ny * ny;
  if (d2 >= rad * rad) return false;
  const d = Math.sqrt(d2); if (d < 1e-4) { nx = 0; ny = -1; } else { nx /= d; ny /= d; }
  b.x = cx + nx * rad; b.y = cy + ny * rad;
  const svx = tvx * t, svy = tvy * t, vn = (b.vx - svx) * nx + (b.vy - svy) * ny;
  if (vn < 0) { b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny; }
  hit.nx = nx; hit.ny = ny;
  return true;
}
const tipX = (f, a) => f.px + Math.cos(a) * FL * f.dir;
const tipY = (f, a) => f.py + Math.sin(a) * FL;

function newBall() { s.ball = { x: 224, y: 294, vx: 0, vy: 0, lane: true }; s.save = 0; s.still = 0; s.charge = 0; }
function pop(txt, x, y, c = PAL.gold) { const p = s.pops[s.popI++ % s.pops.length]; p.txt = txt; p.x = x; p.y = y; p.l = 50; p.c = c; }

const game = {
  id: 'pinball', tapIsAct: true,
  reset() {
    s = { balls: 3, mult: 1, tgt: [true, true, true], chuteOpen: false, held: 0, flash: [0, 0, 0], slingF: [0, 0], msg: 'PULL TO LAUNCH', msgT: 160,
      ang: [REST, REST], prev: [REST, REST], pops: Array.from({ length: 6 }, () => ({ l: 0, txt: '', x: 0, y: 0, c: '' })), popI: 0, drain: 0, t: 0 };
    newBall();
  },
  update(eng) {
    s.t++;
    const b = s.ball, k = eng.keys;
    if (s.msgT) s.msgT--;
    for (const p of s.pops) if (p.l) { p.l--; p.y -= 0.3; }
    for (let i = 0; i < 3; i++) if (s.flash[i]) s.flash[i]--;
    for (let i = 0; i < 2; i++) if (s.slingF[i]) s.slingF[i]--;
    // flippers: one key each
    const want = [k.left ? UP : REST, k.right ? UP : REST];
    if (eng.pressed.left || eng.pressed.right) eng.beep(180, 0.03, 'square', 0.03);
    // drain pause between balls
    if (s.drain) {
      if (--s.drain === 0) { if (s.balls <= 0) { eng.gameOver('FUNDS DISBURSED'); return; } newBall(); s.msg = 'NEXT BALL'; s.msgT = 90; }
      s.ang[0] = s.ang[1] = REST; return;
    }
    // ball held in the bonus chute
    if (s.held) {
      if (--s.held === 0) { b.x = CHUTE[0]; b.y = CHUTE[1] + 9; b.vx = (Math.random() - 0.5) * 2.5; b.vy = 2.2; eng.beep(330, 0.1); }
      else { if (s.held % 8 === 0) eng.beep(500 + (60 - s.held) * 12, 0.04); stepFlippers(want); return; }
    }
    // plunger: hold act to charge, release to launch
    const inLane = b.x > 215 && b.y > 120;
    if (k.act && inLane) { s.charge = Math.min(1, s.charge + 1 / 50); }
    else if (s.charge > 0) {
      if (inLane && b.y > 290) { b.vy = -(5.5 + s.charge * 5); s.save = 420; eng.beep(200 + s.charge * 400, 0.12, 'sawtooth', 0.04, 300); }
      s.charge = 0;
    }
    for (let n = 0; n < SUB; n++) {
      stepFlippers(want, n);
      b.vy += G / SUB;
      b.x += b.vx / SUB; b.y += b.vy / SUB;
      collide(eng, b);
      const sp = Math.hypot(b.vx, b.vy); if (sp > VMAX) { b.vx *= VMAX / sp; b.vy *= VMAX / sp; }
      if (s.held) break;
    }
    if (s.save) s.save--;
    // stuck ball nudge (outside the plunger lane)
    if (!inLane && Math.abs(b.vx) + Math.abs(b.vy) < 0.08 && b.y < 270) { if (++s.still > 120) { b.vy = -3; b.vx = (Math.random() - 0.5) * 3; s.still = 0; pop('NUDGE', b.x, b.y - 10, PAL.grey); } }
    else s.still = 0;
    if (b.y > 330) {
      if (s.save > 0 || eng.god) { newBall(); // god mode: every drained ball is refunded
        s.msg = 'BALL REFUNDED'; s.msgT = 90; eng.beep(880, 0.1); eng.beep(660, 0.1); return; }
      s.balls--; s.drain = 70; s.mult = 1; eng.beep(160, 0.4, 'sawtooth', 0.05, -90);
      s.msg = s.balls > 0 ? 'BALL DRAINED' : 'NO FURTHER BALLS'; s.msgT = 70;
    }
  },
  draw(eng, ctx) {
    const { text } = eng;
    // table
    ctx.fillStyle = '#0d1430'; ctx.beginPath(); ctx.moveTo(8, 320); ctx.lineTo(8, 60); ctx.lineTo(12, 46); ctx.lineTo(22, 35); ctx.lineTo(36, 28);
    ctx.lineTo(196, 28); ctx.lineTo(218, 33); ctx.lineTo(229, 42); ctx.lineTo(234, 54); ctx.lineTo(234, 320); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#121c40'; for (let y = 36; y < 320; y += 12) ctx.fillRect(10, y, 203, 1);
    // drain apron
    ctx.fillStyle = '#07060c'; ctx.beginPath(); ctx.moveTo(8, 226); ctx.lineTo(76, 284); ctx.lineTo(76, 320); ctx.lineTo(8, 320); ctx.fill();
    ctx.beginPath(); ctx.moveTo(214, 226); ctx.lineTo(146, 284); ctx.lineTo(146, 320); ctx.lineTo(214, 320); ctx.fill();
    text(ctx, 'NO', 22, 292, '#2b3566'); text(ctx, 'EXIT', 176, 292, '#2b3566');
    // chute
    const open = s.chuteOpen, blink = (s.t >> 4) & 1;
    ctx.fillStyle = open ? (blink ? PAL.green : '#1f6b33') : '#1b2550';
    ctx.beginPath(); ctx.arc(CHUTE[0], CHUTE[1], 7, 0, 6.2832); ctx.fill();
    ctx.fillStyle = open ? '#07060c' : '#2b3566'; ctx.beginPath(); ctx.arc(CHUTE[0], CHUTE[1], 4, 0, 6.2832); ctx.fill();
    if (open) text(ctx, 'BONUS CHUTE', 111, 70, PAL.green, 'center');
    text(ctx, 'x' + s.mult, 111, 36, s.mult > 1 ? PAL.gold : '#2b3566', 'center');
    // walls
    ctx.strokeStyle = PAL.cyan; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath();
    for (const w of WALLS) { ctx.moveTo(w[0], w[1]); ctx.lineTo(w[2], w[3]); }
    ctx.stroke();
    ctx.strokeStyle = '#3b6b8a'; ctx.lineWidth = 1; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(GATE[0], GATE[1]); ctx.lineTo(GATE[2], GATE[3]); ctx.stroke(); ctx.setLineDash([]);
    // targets
    for (let i = 0; i < 3; i++) {
      const y = TARGETS[i];
      ctx.fillStyle = s.tgt[i] ? PAL.orange : '#3a2a14'; ctx.fillRect(9, y, s.tgt[i] ? 5 : 2, 14);
      ctx.fillStyle = s.tgt[i] ? '#2b3566' : PAL.gold; ctx.fillRect(18, y + 5, 4, 4);
    }
    // slingshots
    for (let i = 0; i < 2; i++) {
      const q = SLINGS[i];
      ctx.fillStyle = '#3a1438'; ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[2], q[3]); ctx.lineTo(q[4], q[5]); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = s.slingF[i] ? '#ffffff' : SLING_COL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[2], q[3]); ctx.stroke();
    }
    // coin-stack bumpers
    for (let i = 0; i < 3; i++) {
      const [x, y] = BUMPERS[i], f = s.flash[i];
      for (let j = 3; j >= 0; j--) {
        ctx.fillStyle = j === 0 ? (f ? '#ffffff' : PAL.gold) : j & 1 ? '#a8730f' : '#d9a427';
        ctx.beginPath(); ctx.ellipse(x, y + j * 2 - 2, BR, BR * 0.72, 0, 0, 6.2832); ctx.fill();
      }
      ctx.fillStyle = f ? PAL.gold : '#a8730f'; ctx.fillRect(x - 3, y - 4, 6, 2);
    }
    // plunger
    const py = 300 + s.charge * 14;
    ctx.fillStyle = '#5a6380'; for (let y = py + 4; y < 318; y += 3) ctx.fillRect(219, y, 11, 1);
    ctx.fillStyle = s.charge > 0.95 ? PAL.red : PAL.grey; ctx.fillRect(217, py, 15, 4);
    // flippers
    ctx.lineCap = 'round';
    for (let i = 0; i < 2; i++) {
      const f = FLIP[i], a = s.ang[i];
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(f.px, f.py); ctx.lineTo(tipX(f, a), tipY(f, a)); ctx.stroke();
      ctx.strokeStyle = PAL.pink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(f.px, f.py); ctx.lineTo(tipX(f, a), tipY(f, a)); ctx.stroke();
    }
    ctx.lineCap = 'butt';
    // ball
    const b = s.ball;
    if (!s.held && !s.drain) {
      ctx.fillStyle = '#c9d2e3'; ctx.beginPath(); ctx.arc(b.x, b.y, R, 0, 6.2832); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(b.x - 2, b.y - 2, 2, 2);
    }
    for (const p of s.pops) if (p.l) text(ctx, p.txt, p.x, p.y, p.c, 'center');
    // HUD
    ctx.fillStyle = PAL.bg; ctx.fillRect(0, 0, 240, 25);
    text(ctx, String(eng.score).padStart(7, '0'), 4, 3, PAL.ink);
    text(ctx, 'BALL', 168, 3, PAL.grey);
    for (let i = 0; i < 3; i++) { ctx.fillStyle = i < s.balls ? '#c9d2e3' : '#2b3566'; ctx.beginPath(); ctx.arc(208 + i * 10, 7, 3, 0, 6.2832); ctx.fill(); }
    let x = 4;
    for (let i = 0; i < 3; i++) { text(ctx, TNAME[i], x, 14, s.tgt[i] ? '#3b4470' : PAL.gold); x += TNAME[i].length * 8 + 8; }
    if (s.save > 0 && !b.lane) text(ctx, 'SAVE', 236, 14, (s.t >> 3) & 1 ? PAL.green : '#1f6b33', 'right');
    if (s.msgT && eng.state === 'play') { ctx.fillStyle = 'rgba(7,6,12,.75)'; ctx.fillRect(40, 176, 160, 14); text(ctx, s.msg, 120, 179, PAL.gold, 'center'); }
  },
};

function stepFlippers(want, n = 0) {
  for (let i = 0; i < 2; i++) {
    s.prev[i] = s.ang[i];
    const sp = (want[i] === UP ? 0.36 : 0.16) / SUB, a = s.ang[i];
    s.ang[i] = want[i] < a ? Math.max(want[i], a - sp) : Math.min(want[i], a + sp);
  }
}

function collide(eng, b) {
  b.lane = b.x > 215;
  for (let i = 0; i < WALLS.length; i++) { const w = WALLS[i]; seg(b, w[0], w[1], w[2], w[3], R + 1, 0.45, 0, 0); }
  if (b.x < 214) seg(b, GATE[0], GATE[1], GATE[2], GATE[3], R + 1, 0.45, 0, 0);
  // plunger tip
  if (b.x > 215 && b.y > 300 - R) { b.y = 300 - R; if (b.vy > 0) b.vy = b.vy > 0.6 ? -b.vy * 0.25 : 0; b.vx = 0; }
  // flippers: surface velocity from the swing
  for (let i = 0; i < 2; i++) {
    const f = FLIP[i], a = s.ang[i], tx = tipX(f, a), ty = tipY(f, a);
    const tvx = (tx - tipX(f, s.prev[i])) * SUB, tvy = (ty - tipY(f, s.prev[i])) * SUB;
    seg(b, f.px, f.py, tx, ty, R + 3, 0.2, tvx, tvy);
  }
  // slingshots
  for (let i = 0; i < 2; i++) {
    const q = SLINGS[i];
    if (seg(b, q[0], q[1], q[2], q[3], R + 1, 0.4, 0, 0)) {
      const vn = b.vx * hit.nx + b.vy * hit.ny;
      if (vn < 4 && !s.slingF[i]) { b.vx += hit.nx * 3.2; b.vy += hit.ny * 3.2; s.slingF[i] = 10; eng.score += 10 * s.mult; eng.beep(620, 0.04); }
    }
    seg(b, q[2], q[3], q[4], q[5], R + 1, 0.4, 0, 0); seg(b, q[4], q[5], q[0], q[1], R + 1, 0.4, 0, 0);
  }
  // bumpers
  for (let i = 0; i < 3; i++) {
    const [x, y] = BUMPERS[i], dx = b.x - x, dy = b.y - y, d = Math.hypot(dx, dy), rr = BR + R;
    if (d < rr && d > 0) {
      const nx = dx / d, ny = dy / d; b.x = x + nx * rr; b.y = y + ny * rr;
      const vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= 2 * vn * nx; b.vy -= 2 * vn * ny; }
      const out = b.vx * nx + b.vy * ny; if (out < 4.2) { b.vx += nx * (4.2 - out); b.vy += ny * (4.2 - out); }
      if (!s.flash[i]) { s.flash[i] = 8; eng.score += 100 * s.mult; pop(String(100 * s.mult), x, y - 20); eng.beep(880 + i * 110, 0.05); }
    }
  }
  // departmental targets on the left wall
  for (let i = 0; i < 3; i++) {
    if (!s.tgt[i]) continue;
    const y = TARGETS[i];
    if (seg(b, 13, y, 13, y + 14, R + 1, 0.5, 0, 0)) {
      s.tgt[i] = false; eng.score += 250 * s.mult; pop(TNAME[i] + ' OK', 50, y, PAL.orange); eng.beep(1040, 0.08);
      if (!s.tgt[0] && !s.tgt[1] && !s.tgt[2] && !s.chuteOpen) { s.chuteOpen = true; s.msg = 'BONUS CHUTE OPEN'; s.msgT = 120; eng.beep(660, 0.1); eng.beep(990, 0.15); }
    }
  }
  // bonus chute
  if (s.chuteOpen && Math.hypot(b.x - CHUTE[0], b.y - CHUTE[1]) < 6) {
    const pts = 5000 * s.mult; eng.score += pts; s.held = 70; s.chuteOpen = false; s.tgt[0] = s.tgt[1] = s.tgt[2] = true;
    s.msg = 'LIQUIDITY EVENT'; s.msgT = 120; pop(String(pts), CHUTE[0], CHUTE[1] + 14, PAL.green); s.mult = Math.min(5, s.mult + 1);
    b.vx = b.vy = 0; b.x = CHUTE[0]; b.y = CHUTE[1];
  }
}

boot(game);
