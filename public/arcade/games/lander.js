// Soft Landing: a lander. Bring the capsule down level and slow onto the marked pad.
// Each landing narrows the pad and adds wind. Side thrusters nudge the capsule and tilt it a little.
import { boot, PAL } from '../engine.js';
const TOP = 32, STEP = 8, NPT = 31, G = 0.011, MAIN = 0.03, SIDE = 0.012;
const SAFE_VY = 0.55, SAFE_VX = 0.4, SAFE_A = 0.2;
const CAP = ['....wwww....', '...wCCCCw...', '..wCcccCCw..', '..wCcccCCw..', '..wCCCCCCw..', '.wwwwwwwwww.', '.wGGGGGGGGw.', '.wwwwwwwwww.', '..k......k..', '.k........k.', 'kk........kk'];
const CCOL = { w: '#e8fbff', C: '#7df9ff', c: '#1b3a66', G: '#ffd23f', k: '#8a90a2' };
const ground = new Float32Array(NPT);
let s, capCanvas = null;

function makeTerrain() {
  const padW = Math.max(16, 44 - (s.level - 1) * 4), padSeg = Math.ceil(padW / STEP);
  const start = 2 + ((Math.random() * (NPT - padSeg - 4)) | 0);
  let h = 240 + Math.random() * 30;
  for (let i = 0; i < NPT; i++) {
    h += (Math.random() - 0.5) * (22 + s.level * 3);
    if (Math.random() < 0.15) h -= 24 + Math.random() * 20; // occasional spire
    h = Math.max(150, Math.min(306, h));
    ground[i] = h;
  }
  const py = Math.max(220, Math.min(296, ground[start]));
  for (let i = start; i <= start + padSeg; i++) ground[i] = py;
  s.padX0 = start * STEP; s.padX1 = s.padX0 + padSeg * STEP; s.padY = py;
  // keep pad edges honest: the two terrain points just outside the pad sit a little higher
  if (start > 0) ground[start - 1] = Math.min(ground[start - 1], py - 6);
  if (start + padSeg + 1 < NPT) ground[start + padSeg + 1] = Math.min(ground[start + padSeg + 1], py - 6);
}
const groundAt = (x) => { const i = Math.max(0, Math.min(NPT - 2, Math.floor(x / STEP))), f = x / STEP - i; return ground[i] + (ground[i + 1] - ground[i]) * Math.max(0, Math.min(1, f)); };

function launch(newTerrain) {
  if (newTerrain) makeTerrain();
  const c = s.cap;
  c.x = 30 + Math.random() * 180; c.y = TOP + 14; c.vx = (Math.random() - 0.5) * 0.6; c.vy = 0.1; c.a = 0;
  s.fuel = Math.max(55, 100 - (s.level - 1) * 4); s.fuelMax = s.fuel;
  s.wind = 0; s.windT = 120; s.windTarget = 0; s.phase = 'fly'; s.timer = 0; s.msg = 100;
}
function puff(x, y, vx, vy, col, n) { for (let i = 0; i < n; i++) s.parts.push({ x, y, vx: vx + (Math.random() - 0.5) * 0.6, vy: vy + (Math.random() - 0.5) * 0.6, l: 12 + Math.random() * 10, c: col }); }

const game = {
  id: 'lander',
  reset(eng) {
    s = { level: 1, lives: 3, cap: {}, parts: [], fuel: 100, fuelMax: 100, wind: 0, phase: 'fly', timer: 0, msg: 0, award: 0, detail: '' };
    launch(true);
  },
  update(eng) {
    const c = s.cap, k = eng.keys;
    if (s.msg) s.msg--;
    for (let i = s.parts.length - 1; i >= 0; i--) { const p = s.parts[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.02; if (--p.l <= 0) s.parts.splice(i, 1); }
    if (s.phase !== 'fly') {
      if (--s.timer > 0) return;
      if (s.phase === 'landed') { s.level++; launch(true); }
      else if (s.lives <= 0) eng.gameOver('HARD LANDING');
      else launch(false);
      return;
    }
    // wind: from level 2, gusts drift toward a new target every few seconds
    if (s.level >= 2 && --s.windT <= 0) {
      const m = Math.min(1, 0.25 + (s.level - 2) * 0.12);
      s.windTarget = (Math.random() * 2 - 1) * m; s.windT = 150 + Math.random() * 180;
    }
    s.wind += (s.windTarget - s.wind) * 0.02;
    // thrusters
    let ax = s.wind * 0.004, ay = G;
    if (s.fuel > 0) {
      if (k.act || k.up) {
        ax += Math.sin(c.a) * MAIN; ay -= Math.cos(c.a) * MAIN; s.fuel = Math.max(0, s.fuel - 0.22);
        if ((eng.t & 3) === 0) { puff(c.x, c.y + 6, c.vx, c.vy + 1.2, eng.t & 4 ? PAL.gold : PAL.orange, 1); eng.beep(55 + Math.random() * 20, 0.05, 'sawtooth', 0.025); }
      }
      if (k.left) { ax -= SIDE; c.a -= 0.004; s.fuel = Math.max(0, s.fuel - 0.08); if ((eng.t & 3) === 0) puff(c.x + 6, c.y - 1, c.vx + 0.8, c.vy, PAL.ink, 1); }
      if (k.right) { ax += SIDE; c.a += 0.004; s.fuel = Math.max(0, s.fuel - 0.08); if ((eng.t & 3) === 0) puff(c.x - 6, c.y - 1, c.vx - 0.8, c.vy, PAL.ink, 1); }
    }
    // gusts tip the capsule a little; the gyro levels it when thrusters are off
    c.a += s.wind * 0.0015;
    if (!k.left && !k.right) c.a *= 0.965;
    c.a = Math.max(-0.6, Math.min(0.6, c.a));
    c.vx += ax; c.vy += ay; c.vx *= 0.998;
    c.x += c.vx; c.y += c.vy;
    if (c.x < 6) { c.x = 6; c.vx = 0; } if (c.x > 234) { c.x = 234; c.vx = 0; }
    if (c.y < TOP + 6) { c.y = TOP + 6; c.vy = Math.max(0, c.vy); }
    // touchdown: feet are at c.y + 5, at c.x +/- 5
    const fl = groundAt(c.x - 5), fr = groundAt(c.x + 5), fm = groundAt(c.x), foot = c.y + 5;
    if (foot >= Math.min(fl, fr) || c.y + 1 >= fm) {
      const onPad = c.x - 5 >= s.padX0 - 1 && c.x + 5 <= s.padX1 + 1;
      const soft = c.vy <= SAFE_VY && Math.abs(c.vx) <= SAFE_VX && Math.abs(c.a) <= SAFE_A;
      if (onPad && soft) {
        const gentle = Math.round((1 - Math.max(0, c.vy) / SAFE_VY) * 50);
        c.y = s.padY - 5; c.vx = 0; c.vy = 0;
        const half = (s.padX1 - s.padX0) / 2, mid = s.padX0 + half, prec = Math.round(Math.max(0, 1 - Math.abs(c.x - mid) / half) * 200);
        const fuel = Math.round(s.fuel * 5);
        s.award = 500 + s.level * 100 + fuel + prec + gentle; eng.score += s.award;
        s.detail = `FUEL ${fuel}  AIM ${prec}`;
        s.phase = 'landed'; s.timer = 160; eng.beep(660, 0.1); eng.beep(880, 0.1); eng.beep(1320, 0.25);
      } else {
        s.detail = !onPad ? 'OFF THE PAD' : c.vy > SAFE_VY ? 'TOO FAST DOWN' : Math.abs(c.vx) > SAFE_VX ? 'TOO FAST ACROSS' : 'NOT LEVEL';
        s.lives--; s.phase = 'crash'; s.timer = 110;
        puff(c.x, c.y, 0, -1.2, PAL.orange, 18); puff(c.x, c.y, 0, -0.8, PAL.red, 12); puff(c.x, c.y, 0, -1.5, PAL.ink, 8);
        eng.beep(90, 0.6, 'sawtooth', 0.07, -60);
      }
    }
  },
  draw(eng, ctx) {
    const { text } = eng, c = s.cap;
    // stars
    for (let i = 0; i < 40; i++) { ctx.fillStyle = i % 5 ? '#1c1838' : '#4b4580'; ctx.fillRect((i * 71 + 5) % 240, TOP + ((i * 43) % 200), 1, 1); }
    // terrain
    ctx.fillStyle = '#16122c'; ctx.beginPath(); ctx.moveTo(0, 320);
    for (let i = 0; i < NPT; i++) ctx.lineTo(i * STEP, ground[i]);
    ctx.lineTo(240, 320); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = PAL.purple; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 0; i < NPT; i++) i ? ctx.lineTo(i * STEP, ground[i] + 0.5) : ctx.moveTo(0, ground[0] + 0.5);
    ctx.stroke();
    // pad with blinking beacons
    ctx.fillStyle = PAL.green; ctx.fillRect(s.padX0, s.padY, s.padX1 - s.padX0, 2);
    ctx.fillStyle = (eng.t >> 4) & 1 ? PAL.green : '#1f7a35'; ctx.fillRect(s.padX0, s.padY - 4, 1, 4); ctx.fillRect(s.padX1 - 1, s.padY - 4, 1, 4);
    text(ctx, 'PAD', (s.padX0 + s.padX1) / 2, s.padY + 5, PAL.green, 'center');
    // capsule
    if (s.phase !== 'crash') {
      if (!capCanvas) { capCanvas = document.createElement('canvas'); capCanvas.width = 12; capCanvas.height = 11; eng.sprite(capCanvas.getContext('2d'), CAP, CCOL, 0, 0); }
      ctx.save(); ctx.translate(Math.round(c.x), Math.round(c.y)); ctx.rotate(c.a); ctx.drawImage(capCanvas, -6, -6); ctx.restore();
      if (s.phase === 'fly' && s.fuel > 0 && (eng.keys.act || eng.keys.up) && (eng.t & 2)) {
        ctx.fillStyle = PAL.gold; ctx.fillRect(c.x - 2 - Math.sin(c.a) * 6, c.y + 6, 4, 3); ctx.fillStyle = PAL.orange; ctx.fillRect(c.x - 1 - Math.sin(c.a) * 8, c.y + 9, 2, 3);
      }
    }
    for (const p of s.parts) { ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, 2, 2); }
    // HUD
    ctx.fillStyle = PAL.bg; ctx.fillRect(0, 0, 240, TOP - 1); ctx.fillStyle = '#2b2550'; ctx.fillRect(0, TOP - 1, 240, 1);
    text(ctx, String(eng.score).padStart(6, '0'), 4, 3, PAL.ink);
    text(ctx, `PAD ${s.level}`, 120, 3, PAL.gold, 'center');
    for (let i = 0; i < s.lives; i++) { ctx.fillStyle = PAL.cyan; ctx.fillRect(229 - i * 10, 4, 7, 5); ctx.fillRect(230 - i * 10, 9, 1, 2); ctx.fillRect(234 - i * 10, 9, 1, 2); }
    const alt = Math.max(0, Math.round(groundAt(c.x) - c.y - 5)), vs = Math.round(c.vy * 10), hs = Math.round(c.vx * 10);
    text(ctx, `ALT${String(alt).padStart(4, ' ')}`, 4, 13, PAL.grey);
    text(ctx, `VS${String(vs).padStart(3, ' ')}`, 92, 13, c.vy > SAFE_VY ? PAL.red : PAL.green);
    text(ctx, `HS${String(hs).padStart(3, ' ')}`, 156, 13, Math.abs(c.vx) > SAFE_VX ? PAL.red : PAL.green);
    // fuel bar, tilt gauge, wind arrow
    text(ctx, 'FUEL', 4, 22, PAL.grey);
    ctx.fillStyle = '#2b2550'; ctx.fillRect(40, 23, 80, 6);
    ctx.fillStyle = s.fuel < 20 ? PAL.red : PAL.gold; ctx.fillRect(40, 23, (s.fuel / 100) * 80, 6);
    ctx.fillStyle = '#2b2550'; ctx.fillRect(132, 26, 25, 1); ctx.fillRect(144, 23, 1, 6);
    ctx.fillStyle = Math.abs(c.a) > SAFE_A ? PAL.red : PAL.green; ctx.fillRect(143 + Math.max(-11, Math.min(11, Math.round(c.a * 30))), 23, 3, 6);
    if (s.level >= 2) {
      const w = Math.round(s.wind * 22), y = 26, x0 = 210;
      text(ctx, 'W', 168, 22, PAL.cyan);
      ctx.fillStyle = PAL.cyan; ctx.fillRect(Math.min(x0, x0 + w), y, Math.abs(w) + 1, 1);
      if (w) { const d = Math.sign(w), tx = x0 + w; ctx.fillRect(tx - d, y - 1, 1, 3); ctx.fillRect(tx - 2 * d, y - 2, 1, 5); }
    }
    if (eng.state !== 'play') return;
    if (s.phase === 'landed') { text(ctx, 'SOFT LANDING', 120, 100, PAL.green, 'center'); text(ctx, `+${s.award}`, 120, 114, PAL.gold, 'center'); text(ctx, s.detail, 120, 128, PAL.grey, 'center'); }
    else if (s.phase === 'crash') { text(ctx, 'HARD LANDING', 120, 100, PAL.red, 'center'); text(ctx, s.detail, 120, 114, PAL.grey, 'center'); }
    else if (s.msg) { text(ctx, `PAD ${s.level}`, 120, 100, PAL.gold, 'center'); text(ctx, s.level === 1 ? 'LAND SLOW AND LEVEL' : s.level === 2 ? 'WIND ADVISORY ISSUED' : 'PAD NARROWED', 120, 114, PAL.ink, 'center'); }
    if (s.phase === 'fly' && s.fuel <= 0) text(ctx, 'NO FUEL', 120, 150, PAL.red, 'center');
  },
};
boot(game);
