// The Corporate Ladder: an endless upward platformer. Jump desk to desk while the floor below restructures.
import { boot, PAL } from '../engine.js';
const G = 0.3, JUMP = -7.2, MAXVX = 2.3, PW = 10, PH = 16, DH = 5, FLOOR_PX = 40;
const WORKER = ['...hhhh...', '..hhhhhh..', '..hssssh..', '..sKssKs..', '..ssssss..', '...ssss...', '.wwwrrwww.', 'wwwwrrwwww', 'swwwrrwwws', 'swwwrrwwws', '.wwwwwwww.', '..nnnnnn..', '..nn..nn..', '..nn..nn..', '..nn..nn..', '.kkk..kkk.'];
const RUN = [...WORKER.slice(0, 12), '..nn..nn..', '.nn....nn.', '.nn....nn.', 'kk......kk'];
const AIR = [...WORKER.slice(0, 11), '.nnnnnnnn.', 'nn......nn', 'k........k', '..........', '..........'];
const WCOL = { h: '#3b2a1a', s: '#f2c79a', K: '#07060c', w: '#e8fbff', r: '#ff4a4a', n: '#2b3566', k: '#07060c' };
const STAMP = ['..rrrr..', '..rrrr..', '...rr...', '...rr...', 'rrrrrrrr', 'rWrrrrWr', 'rrrrrrrr'];
const STCOL = { r: '#ff4a4a', W: '#ffd23f' };
const TYPE = { n: '#c58a3a', t: '#8a90a2', m: '#3a6bff', r: '#9d5cff' };
let s;

function desk(y, d) {
  const w = Math.max(26, Math.round(48 - d * 18 + Math.random() * 10)), r = Math.random();
  const type = r < 0.12 + d * 0.18 ? 't' : r < 0.22 + d * 0.32 ? 'm' : r < 0.3 + d * 0.4 ? 'r' : 'n';
  return { x: Math.random() * (240 - w), y, w, type, vx: type === 'm' ? (Math.random() < 0.5 ? -1 : 1) * (0.5 + d * 1.1) : 0,
    timer: 0, gone: false, fall: 0, stamp: Math.random() < 0.16, dx: 0 };
}
function fill() {
  const d = Math.min(1, s.best / 9000);
  while (s.topY > s.camY - 60) {
    s.topY -= 34 + Math.random() * (16 + d * 24);
    s.desks.push(desk(s.topY, d));
  }
}

const game = {
  id: 'ladder', tapIsAct: true,
  reset() {
    s = { p: { x: 115, y: -PH, vx: 0, vy: 0, on: null, coyote: 0, buf: 0, face: 1, step: 0 }, desks: [], camY: -180, topY: 0,
      floorY: 70, best: 0, stamps: 0, pts: 0, t: 0, msg: 'CLIMB', msgT: 90, pops: [] };
    s.desks.push({ x: 0, y: 0, w: 240, type: 'n', vx: 0, timer: 0, gone: false, fall: 0, stamp: false, dx: 0, lobby: true });
    fill();
  },
  update(eng) {
    s.t++;
    const p = s.p, k = eng.keys, d = Math.min(1, s.best / 9000);
    if (s.msgT) s.msgT--;
    // desks move
    for (const q of s.desks) {
      q.dx = 0;
      if (q.type === 'm') { q.dx = q.vx; q.x += q.vx; if (q.x < 0 || q.x + q.w > 240) { q.vx = -q.vx; q.x = Math.max(0, Math.min(240 - q.w, q.x)); } }
      if (q.timer > 0) {
        q.timer++;
        if (q.type === 't' && q.timer > 34) { q.gone = true; q.fall += 0.25; q.y += q.fall; }
        if (q.type === 'r' && q.timer > 22) { q.vx += q.vx === 0 ? (q.x + q.w / 2 < 120 ? -0.3 : 0.3) : Math.sign(q.vx) * 0.12; q.dx = q.vx; q.x += q.vx; if (q.x > 250 || q.x + q.w < -10) q.gone = true; }
      }
    }
    // horizontal control with air control
    const acc = p.on ? 0.4 : 0.26;
    if (k.left) { p.vx -= acc; p.face = -1; } else if (k.right) { p.vx += acc; p.face = 1; } else p.vx *= p.on ? 0.7 : 0.94;
    p.vx = Math.max(-MAXVX, Math.min(MAXVX, p.vx));
    // jump: buffer + coyote time
    if (eng.pressed.act || eng.pressed.up) s.p.buf = 8;
    if (p.buf) p.buf--;
    if (p.on) p.coyote = 6; else if (p.coyote) p.coyote--;
    if (p.buf && p.coyote) { p.vy = JUMP; p.on = null; p.coyote = 0; p.buf = 0; eng.beep(520, 0.05, 'square', 0.04, 260); }
    if (!k.act && !k.up && p.vy < -3) p.vy += 0.35;  // short hop when released early
    // carried by the desk underfoot
    if (p.on) { p.x += p.on.dx; if (p.on.gone && p.on.type === 't') p.on = null; }
    p.x += p.vx; if (p.x < -PW / 2) p.x += 240; if (p.x > 240 - PW / 2) p.x -= 240;
    const prevBottom = p.y + PH;
    p.vy = Math.min(8, p.vy + G); p.y += p.vy;
    // one-way landing
    if (p.on) {
      const q = p.on;
      if (q.gone && q.type !== 'r' || p.x + PW < q.x || p.x > q.x + q.w) p.on = null; else { p.y = q.y - PH; p.vy = 0; }
    }
    if (!p.on && p.vy >= 0) {
      for (const q of s.desks) {
        if (q.gone || p.x + PW - 2 < q.x || p.x + 2 > q.x + q.w) continue;
        if (prevBottom <= q.y + 1 && p.y + PH >= q.y) {
          p.on = q; p.y = q.y - PH; p.vy = 0;
          if (!q.timer && (q.type === 't' || q.type === 'r')) { q.timer = 1; eng.beep(q.type === 't' ? 200 : 260, 0.08, 'triangle', 0.05); }
          break;
        }
      }
    }
    p.step += p.on && Math.abs(p.vx) > 0.4 ? 1 : 0;
    // stamps
    for (const q of s.desks) {
      if (!q.stamp) continue;
      const sx = q.x + q.w / 2 - 4, sy = q.y - 18;
      if (p.x + PW > sx && p.x < sx + 8 && p.y + PH > sy && p.y < sy + 7) {
        q.stamp = false; s.stamps++; s.pts += 100; s.pops.push({ x: sx + 4, y: sy, l: 40 }); eng.beep(990, 0.06); eng.beep(1320, 0.08);
      }
    }
    for (const o of s.pops) o.l--;
    if (s.pops.length && s.pops[0].l <= 0) s.pops.shift();
    // height, camera, score
    const climbed = -p.y - PH;
    if (climbed > s.best) {
      const before = Math.floor(s.best / FLOOR_PX); s.best = climbed;
      const now = Math.floor(s.best / FLOOR_PX);
      if (now > before && now % 25 === 0) { s.msg = 'PROMOTED'; s.msgT = 80; eng.beep(660, 0.08); eng.beep(880, 0.12); }
    }
    eng.score = Math.floor(s.best / FLOOR_PX) * 10 + s.pts;
    s.camY = Math.min(s.camY, p.y - 150);
    fill();
    // the restructuring rises; it never lags far behind the view
    if (s.t > 150) s.floorY -= 0.22 + d * 0.5 + Math.min(0.25, s.t / 20000);
    s.floorY = Math.min(s.floorY, s.camY + 314);
    if (s.t === 150) { s.msg = 'RESTRUCTURING'; s.msgT = 90; eng.beep(150, 0.3, 'sawtooth', 0.04); }
    s.desks = s.desks.filter((q) => q.y < s.floorY + 40 && q.y < s.camY + 400);
    if (p.y + PH > s.floorY + 2 && eng.god) { p.y = s.floorY - PH; p.vy = JUMP * 1.3; p.on = null; eng.beep(330, 0.08, 'square', 0.04, 400); } // god mode: the floor is a trampoline
    if (p.y + PH > s.floorY + 2) { eng.gameOver('RESTRUCTURED'); }
  },
  draw(eng, ctx) {
    const { text, sprite } = eng, cy = s.camY;
    // building: wall columns and window rows that scroll with the climb
    ctx.fillStyle = '#0d1430'; ctx.fillRect(0, 24, 240, 296);
    const off = ((-cy * 0.5) % 48 + 48) % 48;
    for (let y = -48 + off; y < 320; y += 48) for (let x = 12; x < 240; x += 56) { ctx.fillStyle = '#16224a'; ctx.fillRect(x, y, 30, 30); ctx.fillStyle = '#1d2c5e'; ctx.fillRect(x + 2, y + 2, 12, 26); }
    // floor markers every 10 floors
    const step = FLOOR_PX * 10;
    for (let fy = Math.floor((cy + 320) / step) * step; fy > cy; fy -= step) {
      const y = fy - cy - PH; if (fy > 0) continue;
      ctx.fillStyle = '#2b3566'; for (let x = 0; x < 240; x += 6) ctx.fillRect(x, y, 3, 1);
      text(ctx, 'FLOOR ' + Math.round(-fy / FLOOR_PX), 236, y - 10, '#3b4a80', 'right');
    }
    // desks
    for (const q of s.desks) {
      const y = q.y - cy; if (y < 16 || y > 330) continue;
      let x = q.x;
      if (q.type === 't' && q.timer > 0 && !q.gone) x += ((s.t >> 1) & 1) - 0.5;
      ctx.fillStyle = q.lobby ? '#5a6380' : TYPE[q.type]; ctx.fillRect(x, y, q.w, DH);
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x, y, q.w, 1);
      if (!q.lobby) {
        ctx.fillStyle = '#3b2a1a'; ctx.fillRect(x + 2, y + DH, 2, 6); ctx.fillRect(x + q.w - 4, y + DH, 2, 6);
        if (q.type === 't') { ctx.fillStyle = '#07060c'; for (let i = 6; i < q.w - 4; i += 9) ctx.fillRect(x + i, y + 1, 1, DH - 1); }
        if (q.type === 'r') { ctx.fillStyle = '#e8fbff'; ctx.fillRect(x + q.w / 2 - 3, y + 2, 1, 1); ctx.fillRect(x + q.w / 2, y + 2, 1, 1); ctx.fillRect(x + q.w / 2 + 3, y + 2, 1, 1); }
        if (q.type === 'n' && q.w > 34) { ctx.fillStyle = '#5a6380'; ctx.fillRect(x + 6, y - 7, 9, 6); ctx.fillStyle = PAL.cyan; ctx.fillRect(x + 7, y - 6, 7, 4); ctx.fillStyle = '#5a6380'; ctx.fillRect(x + 10, y - 1, 1, 1); }
        if (q.type === 'm') { ctx.fillStyle = '#07060c'; ctx.fillRect(x + 3, y + 11, 3, 2); ctx.fillRect(x + q.w - 6, y + 11, 3, 2); }
      }
      if (q.stamp) sprite(ctx, STAMP, STCOL, q.x + q.w / 2 - 4, y - 18 + Math.sin(s.t / 12) * 1.5);
    }
    // player (drawn twice near the wrap edge)
    const p = s.p, py = p.y - cy, fr = !p.on ? AIR : (p.step >> 3) & 1 ? RUN : WORKER;
    sprite(ctx, fr, WCOL, p.x, py, 1, p.face < 0);
    if (p.x > 240 - PW) sprite(ctx, fr, WCOL, p.x - 240, py, 1, p.face < 0);
    if (p.x < 0) sprite(ctx, fr, WCOL, p.x + 240, py, 1, p.face < 0);
    for (const o of s.pops) text(ctx, '+100', o.x, o.y - cy - (40 - o.l) / 2, PAL.gold, 'center');
    // the restructuring: a rising wall of moving boxes
    const fy = s.floorY - cy;
    if (fy < 330) {
      ctx.fillStyle = '#2a1c10'; ctx.fillRect(0, fy, 240, 330 - fy);
      for (let row = 0; row * 12 + fy < 330; row++) for (let bx = -(row & 1) * 10; bx < 240; bx += 20) {
        const by = fy + row * 12 + 1; ctx.fillStyle = row === 0 ? '#c58a3a' : '#8a5a1f'; ctx.fillRect(bx + 1, by, 18, 11); ctx.fillStyle = '#e0c088'; ctx.fillRect(bx + 8, by, 3, 11);
      }
      ctx.fillStyle = (s.t >> 3) & 1 ? PAL.red : PAL.orange; ctx.fillRect(0, fy - 2, 240, 2);
      if (fy < 312) text(ctx, 'RESTRUCTURING', 120, fy + 3, '#07060c', 'center');
    }
    // HUD
    ctx.fillStyle = PAL.bg; ctx.fillRect(0, 0, 240, 24);
    ctx.fillStyle = '#2b2550'; ctx.fillRect(0, 22, 240, 2);
    text(ctx, String(eng.score).padStart(6, '0'), 4, 4, PAL.ink);
    text(ctx, 'FLOOR ' + Math.floor(s.best / FLOOR_PX), 236, 4, PAL.gold, 'right');
    sprite(ctx, STAMP, STCOL, 4, 13); text(ctx, 'x' + s.stamps, 14, 14, PAL.ink);
    const gap = Math.max(0, Math.min(1, (s.floorY - p.y - PH) / 300));
    ctx.fillStyle = '#2b3566'; ctx.fillRect(150, 15, 86, 4); ctx.fillStyle = gap < 0.25 ? PAL.red : PAL.green; ctx.fillRect(150, 15, 86 * gap, 4);
    text(ctx, 'GAP', 146, 13, PAL.grey, 'right');
    if (s.msgT && eng.state === 'play') text(ctx, s.msg, 120, 120, PAL.gold, 'center');
  },
};
boot(game);
