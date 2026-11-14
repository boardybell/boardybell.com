// Sweep Account: curling with stacks of gold coins. Aim, deliver at fixed power, hold to sweep the cash along.
// Land at least two of three stacks in the vault door. Swept ice stays slick for the rest of the end.
import { boot, PAL } from '../engine.js';
const C = { vel: '#5a1230', vel2: '#3a0b1f', gold: '#ffb238', pale: '#ffe9a8', brass: '#c9a15a', cream: '#f4ead2', black: '#07060c' };
const LX0 = 56, LX1 = 184, BACK = 46, HX = 120, HY = 88, SX = 120, SY = 292, SR = 7, V0 = 3.6;
const FR = 0.046, SLICK = 0.016, CELL = 8, COLS = (LX1 - LX0) / CELL, ROWS = Math.ceil((320 - 40) / CELL);
let s;

function newEnd() {
  s.stones = []; s.left = 3; s.slick = new Uint8Array(COLS * ROWS); s.aim = 0;
  s.hr = Math.max(14, 26 - (s.end - 1) * 2);
  s.drift = s.end === 1 ? 0 : (Math.random() < 0.5 ? -1 : 1) * Math.min(0.012, 0.003 + s.end * 0.0015);
  s.phase = 'aim'; s.timer = 0; s.banner = 100;
}
const cellIdx = (x, y) => { const c = Math.floor((x - LX0) / CELL), r = Math.floor((y - 40) / CELL); return c >= 0 && c < COLS && r >= 0 && r < ROWS ? r * COLS + c : -1; };
const inHouse = (st) => st.live && Math.hypot(st.x - HX, st.y - HY) <= s.hr + SR * 0.5;
const moving = () => s.stones.some((st) => st.live && (st.vx || st.vy));

const game = {
  id: 'curling', tapIsAct: true,
  reset() { s = { end: 1, pops: [] }; newEnd(); },
  update(eng) {
    const k = eng.keys;
    for (const q of s.pops) { q.t--; q.y -= 0.3; }
    s.pops = s.pops.filter((q) => q.t > 0);
    if (s.banner) s.banner--;
    if (s.phase === 'aim') {
      if (k.left) s.aim = Math.max(-0.2, s.aim - 0.006);
      if (k.right) s.aim = Math.min(0.2, s.aim + 0.006);
      if (eng.pressed.act) {
        s.stones.push({ x: SX, y: SY, vx: Math.sin(s.aim) * V0, vy: -Math.cos(s.aim) * V0, live: true });
        s.left--; s.phase = 'run'; eng.beep(260, 0.12, 'triangle');
      }
      return;
    }
    if (s.phase === 'run') {
      const cur = s.stones[s.stones.length - 1];
      s.sweeping = k.act && cur.live && (cur.vx || cur.vy);
      if (s.sweeping && !cur.said) { cur.said = true; s.pops.push({ x: 120, y: 250, txt: 'SWEEPING THE CASH', c: C.pale, t: 45 }); }
      for (const st of s.stones) {
        if (!st.live || (!st.vx && !st.vy)) continue;
        const ci = cellIdx(st.x, st.y);
        let a = ci >= 0 && s.slick[ci] ? SLICK : FR;
        if (st === cur && s.sweeping) {
          a = SLICK;
          for (const dx of [-5, 0, 5]) for (const dy of [-10, -18]) { const j = cellIdx(st.x + dx, st.y + dy); if (j >= 0) s.slick[j] = 1; }
          if ((eng.t & 7) === 0) eng.beep(1800 + Math.random() * 400, 0.03, 'triangle', 0.015);
        }
        const v = Math.hypot(st.vx, st.vy), nv = Math.max(0, v - a);
        if (nv < 0.03) { st.vx = st.vy = 0; continue; }
        st.vx *= nv / v; st.vy *= nv / v; st.vx += s.drift * Math.min(1, nv);
        st.x += st.vx; st.y += st.vy;
        if (st.x < LX0 + SR || st.x > LX1 - SR || st.y < BACK) { st.live = false; st.vx = st.vy = 0; s.pops.push({ x: Math.max(80, Math.min(160, st.x)), y: Math.max(52, st.y), txt: 'OUT OF BOUNDS', c: PAL.red, t: 50 }); eng.beep(120, 0.2, 'sawtooth', 0.04); }
      }
      // medallion collisions, equal mass
      for (let i = 0; i < s.stones.length; i++) for (let j = i + 1; j < s.stones.length; j++) {
        const A = s.stones[i], B = s.stones[j]; if (!A.live || !B.live) continue;
        const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy);
        if (d >= SR * 2 || d === 0) continue;
        const nx = dx / d, ny = dy / d, o = (SR * 2 - d) / 2;
        A.x -= nx * o; A.y -= ny * o; B.x += nx * o; B.y += ny * o;
        const rv = (A.vx - B.vx) * nx + (A.vy - B.vy) * ny;
        if (rv > 0) { const im = rv * 0.92; A.vx -= im * nx; A.vy -= im * ny; B.vx += im * nx; B.vy += im * ny; eng.beep(700, 0.05, 'square', 0.04); }
      }
      if (!moving()) { s.sweeping = false; s.phase = 'settle'; s.timer = 30; }
      return;
    }
    if (s.phase === 'settle') {
      if (--s.timer > 0) return;
      // god mode: a gloved attendant places every missed medallion inside the circle
      if (eng.god) {
        const miss = s.stones.filter((st) => !inHouse(st));
        if (miss.length) {
          for (const st of miss) {
            let tx = HX, ty = HY;
            for (let n = 0; n < 30; n++) {
              const a = Math.random() * 7, r = Math.random() * s.hr * 0.6; tx = HX + Math.cos(a) * r; ty = HY + Math.sin(a) * r;
              if (s.stones.every((o) => o === st || !o.live || Math.hypot(o.x - tx, o.y - ty) > SR * 2 + 1)) break;
            }
            st.fx = st.x; st.fy = st.y; st.tx = tx; st.ty = ty; st.live = true; st.glove = true;
          }
          s.phase = 'glove'; s.timer = 60; eng.beep(523, 0.15, 'triangle'); return;
        }
      }
      return afterDelivery(eng);
    }
    if (s.phase === 'glove') {
      const f = 1 - Math.max(0, s.timer - 1) / 59, e = f * f * (3 - 2 * f);
      for (const st of s.stones) if (st.glove) { st.x = st.fx + (st.tx - st.fx) * e; st.y = st.fy + (st.ty - st.fy) * e; }
      if (--s.timer <= 0) { for (const st of s.stones) st.glove = false; afterDelivery(eng); }
      return;
    }
    if (s.phase === 'result') {
      if (--s.timer > 0) return;
      if (s.pass) { s.end++; newEnd(); } else eng.gameOver('DELIVERY DECLINED');
    }
  },
  draw(eng, ctx) {
    const { text } = eng;
    ctx.fillStyle = C.vel2; ctx.fillRect(0, 32, 240, 288);
    ctx.fillStyle = C.vel;
    for (let y = 36; y < 320; y += 10) for (let x = (y / 10) % 2 ? 5 : 0; x < 240; x += 10) ctx.fillRect(x, y, 3, 3);
    // ice lane
    ctx.fillStyle = C.brass; ctx.fillRect(LX0 - 3, 36, LX1 - LX0 + 6, 284);
    ctx.fillStyle = '#c4ced8'; ctx.fillRect(LX0, 36, LX1 - LX0, 284);
    ctx.fillStyle = '#d6dee6'; for (let y = 40; y < 320; y += 22) ctx.fillRect(LX0 + ((y * 7) % 90), y, 30, 1);
    for (let i = 0; i < s.slick.length; i++) if (s.slick[i]) { ctx.fillStyle = (i + (eng.t >> 4)) % 3 ? 'rgba(255,233,168,0.55)' : 'rgba(255,178,56,0.6)'; ctx.fillRect(LX0 + (i % COLS) * CELL, 40 + Math.floor(i / COLS) * CELL, CELL, CELL); }
    // approved circle
    // the account: a round vault door set into the ice
    const ring = (r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(HX, HY, r, 0, 7); ctx.fill(); };
    ring(s.hr + 4, '#4a4e58'); ring(s.hr + 2, '#8a909c'); ring(s.hr, C.gold); ring(s.hr - 3, '#a8803a'); ring(s.hr * 0.62, C.brass);
    ctx.fillStyle = '#d8dce4'; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.fillRect(HX + Math.cos(a) * (s.hr + 1) - 1, HY + Math.sin(a) * (s.hr + 1) - 1, 2, 2); }
    ctx.strokeStyle = C.vel; ctx.lineWidth = 2; const sp = eng.t * 0.01;
    for (let i = 0; i < 3; i++) { const a = sp + i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(HX - Math.cos(a) * s.hr * 0.5, HY - Math.sin(a) * s.hr * 0.5); ctx.lineTo(HX + Math.cos(a) * s.hr * 0.5, HY + Math.sin(a) * s.hr * 0.5); ctx.stroke(); }
    ring(3, C.pale);
    ctx.fillStyle = C.vel; ctx.fillRect(LX0, BACK - 2, LX1 - LX0, 2);
    ctx.fillStyle = '#8a94a0'; for (let x = LX0; x < LX1; x += 8) ctx.fillRect(x, 232, 4, 1);
    // aim
    if (s.phase === 'aim') {
      ctx.fillStyle = C.vel;
      for (let d = 14; d < 110; d += 6) ctx.fillRect(SX + Math.sin(s.aim) * d - 1, SY - Math.cos(s.aim) * d - 1, 2, 2);
      medal(ctx, SX, SY);
    }
    for (const st of s.stones) if (st.live) medal(ctx, st.x, st.y, inHouse(st) && !st.glove);
    // the member's brush
    const cur = s.stones[s.stones.length - 1];
    if (s.sweeping && cur) {
      const bx = cur.x + Math.sin(eng.t * 0.7) * 6, by = cur.y - 15;
      ctx.fillStyle = '#7a5a26'; ctx.fillRect(bx + 4, by + 2, 2, 12); ctx.fillStyle = C.cream; ctx.fillRect(bx - 6, by - 1, 12, 4); ctx.fillStyle = '#fff'; ctx.fillRect(bx + 2, by + 8, 6, 5);
    }
    // the attendant's glove
    for (const st of s.stones) if (st.glove) { ctx.fillStyle = '#fff'; ctx.fillRect(st.x - 5, st.y - 14, 10, 8); ctx.fillRect(st.x - 5, st.y - 17, 2, 4); ctx.fillRect(st.x - 1, st.y - 18, 2, 5); ctx.fillRect(st.x + 3, st.y - 17, 2, 4); ctx.fillStyle = C.black; ctx.fillRect(st.x - 4, st.y - 6, 8, 2); }
    for (const q of s.pops) { ctx.fillStyle = 'rgba(7,6,12,0.8)'; ctx.fillRect(q.x - 46, q.y - 3, 92, 13); text(ctx, q.txt, q.x, q.y, q.c, 'center', 6); }
    // HUD
    ctx.fillStyle = C.black; ctx.fillRect(0, 0, 240, 32); ctx.fillStyle = C.brass; ctx.fillRect(0, 32, 240, 1);
    text(ctx, `END ${s.end}`, 4, 4, C.gold);
    text(ctx, String(eng.score).padStart(6, '0'), 236, 4, C.cream, 'right');
    const n = s.stones.filter(inHouse).length;
    text(ctx, `IN VAULT ${n}/2`, 4, 19, n >= 2 ? PAL.green : C.pale, 'left', 6);
    for (let i = 0; i < s.left; i++) medal(ctx, 228 - i * 16, 22, false, 0.7);
    if (s.drift) { const d = Math.sign(s.drift), x = 150; text(ctx, 'SLOPE', x - 30, 19, C.brass, 'right', 6); ctx.fillStyle = C.pale; ctx.fillRect(x - 10, 21, 20, 2); ctx.fillRect(x + d * 10 - (d > 0 ? 2 : 0), 19, 2, 6); }
    if (eng.state !== 'play') return;
    const box = (a, c, b) => { ctx.fillStyle = 'rgba(7,6,12,0.85)'; ctx.fillRect(10, 150, 220, 46); text(ctx, a, 120, 156, c, 'center'); if (b) text(ctx, b, 120, 172, C.cream, 'center', 6); };
    if (s.phase === 'result') box(s.pass ? 'CASH SWEPT TO ACCOUNT' : 'NOT APPROVED', s.pass ? C.gold : PAL.red, s.pass ? `+${s.award}` : 'TWO STACKS WERE REQUIRED');
    else if (s.phase === 'glove') box('ATTENDANT ADJUSTMENT', C.pale, 'DEPOSITS HAVE BEEN CORRECTED');
    else if (s.banner && s.phase === 'aim') box(`END ${s.end}`, C.gold, s.end === 1 ? 'A TO DELIVER. HOLD A TO SWEEP CASH.' : 'THE VAULT HAS BEEN NARROWED');
  },
};
function afterDelivery(eng) {
  if (s.left > 0) { s.phase = 'aim'; return; }
  const ins = s.stones.filter(inHouse);
  s.pass = ins.length >= 2;
  s.award = ins.reduce((a, st) => a + 100 + Math.round(Math.max(0, 1 - Math.hypot(st.x - HX, st.y - HY) / s.hr) * 200), 0) * s.end + (ins.length === 3 ? 300 * s.end : 0);
  if (s.pass) { eng.score += s.award; eng.beep(784, 0.1); eng.beep(1175, 0.2, 'triangle'); } else eng.beep(150, 0.5, 'sawtooth', 0.05, -60);
  s.phase = 'result'; s.timer = 120;
}
// a medallion is a short stack of gold coins seen from above at a slant
function medal(ctx, x, y, glow = false, k = 1) {
  const r = SR * k, h = 2 * k;
  if (glow) { ctx.fillStyle = 'rgba(255,233,168,0.6)'; ctx.beginPath(); ctx.ellipse(x, y, r + 3, r * 0.7 + 3, 0, 0, 7); ctx.fill(); }
  for (let i = 2; i >= 0; i--) {
    const cy = y + 2 * k - i * h;
    ctx.fillStyle = '#7a5a26'; ctx.beginPath(); ctx.ellipse(x, cy + 1, r, r * 0.6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = i ? C.gold : '#e09a20'; ctx.beginPath(); ctx.ellipse(x, cy, r, r * 0.6, 0, 0, 7); ctx.fill();
  }
  const ty = y + 2 * k - 2 * h;
  ctx.strokeStyle = C.brass; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, ty, r * 0.6, r * 0.35, 0, 0, 7); ctx.stroke();
  ctx.fillStyle = C.pale; ctx.fillRect(x - r * 0.5, ty - r * 0.35, 2, 1);
}
boot(game);
