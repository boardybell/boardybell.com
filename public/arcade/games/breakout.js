// Break the Market: a brick breaker. Bricks are stacked into a jagged bar chart; the top of each bar is reinforced.
import { boot, PAL } from '../engine.js';
const COLS = 11, BW = 20, BH = 8, LEFT = 10, TOP = 44, MAXR = 14, PY = 298, PH = 5;
const ROWC = ['#ff4a4a', '#ff9a3c', '#ffd23f', '#5dff7a', '#7df9ff', '#3a6bff', '#9d5cff', '#ff4fd8'];
const POW = { W: { c: PAL.green, label: 'BULL' }, S: { c: PAL.cyan, label: 'CALM' }, M: { c: PAL.pink, label: 'SPLIT' } };
let s;

function chart(level) {
  // Each level is a different "chart": a seeded jagged walk, always leaving at least one short bar.
  let h = 5 + (level % 3), out = [], seed = level * 9301 + 49297;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let c = 0; c < COLS; c++) { h = Math.max(2, Math.min(MAXR, h + Math.round((rnd() - 0.42) * 5))); out.push(h); }
  return out;
}
function build(level) {
  const bricks = [];
  chart(level).forEach((h, c) => {
    for (let r = 0; r < h; r++) {
      const row = MAXR - 1 - r, top = r === h - 1;
      bricks.push({ x: LEFT + c * BW, y: TOP + row * BH, hp: top ? 2 : 1, top, c: ROWC[row % ROWC.length] });
    }
  });
  return bricks;
}
const newBall = (stuck = true) => ({ x: 0, y: PY - 5, vx: 0, vy: 0, stuck });

const game = {
  id: 'breakout', tapIsAct: true,
  reset(eng) { s = { level: 1, lives: 3, px: 120, pw: 36, bricks: build(1), balls: [newBall()], speed: 2.4, slow: 0, wide: 0, drops: [], msg: 90, parts: [] }; },
  update(eng) {
    // paddle
    const target = eng.pointerX;
    if (eng.keys.left) s.px -= 3.4; if (eng.keys.right) s.px += 3.4;
    if (target != null && !eng.keys.left && !eng.keys.right) s.px += (target - s.px) * 0.35;
    s.pw = s.wide > 0 ? 56 : 36; if (s.wide > 0) s.wide--;
    if (s.slow > 0) s.slow--;
    s.px = Math.max(s.pw / 2 + 2, Math.min(238 - s.pw / 2, s.px));
    if (s.msg) s.msg--;
    // balls
    const sp = s.speed * (s.slow > 0 ? 0.7 : 1);
    for (const b of s.balls) {
      if (b.stuck) {
        b.x = s.px; b.y = PY - 5;
        if (eng.pressed.act || eng.pressed.up) { b.stuck = false; const a = -0.35 + Math.random() * 0.7; b.vx = Math.sin(a); b.vy = -Math.cos(a); eng.beep(520, 0.05); }
        continue;
      }
      const steps = 4;
      for (let k = 0; k < steps; k++) {
        b.x += (b.vx * sp) / steps; b.y += (b.vy * sp) / steps;
        if (b.x < 3) { b.x = 3; b.vx = Math.abs(b.vx); eng.beep(300, 0.02); }
        if (b.x > 237) { b.x = 237; b.vx = -Math.abs(b.vx); eng.beep(300, 0.02); }
        if (b.y < 26) { b.y = 26; b.vy = Math.abs(b.vy); eng.beep(300, 0.02); }
        // paddle
        if (b.vy > 0 && b.y + 2 >= PY && b.y + 2 <= PY + PH + 2 && Math.abs(b.x - s.px) <= s.pw / 2 + 2) {
          const off = (b.x - s.px) / (s.pw / 2), a = off * 1.05;
          b.vx = Math.sin(a); b.vy = -Math.max(0.35, Math.cos(a)); const n = Math.hypot(b.vx, b.vy); b.vx /= n; b.vy /= n;
          b.y = PY - 3; eng.beep(440, 0.03);
        }
        // bricks
        for (const br of s.bricks) {
          if (br.hp <= 0) continue;
          if (b.x + 2 > br.x && b.x - 2 < br.x + BW && b.y + 2 > br.y && b.y - 2 < br.y + BH) {
            const ox = Math.min(b.x + 2 - br.x, br.x + BW - (b.x - 2)), oy = Math.min(b.y + 2 - br.y, br.y + BH - (b.y - 2));
            if (ox < oy) b.vx = -b.vx; else b.vy = -b.vy;
            br.hp--; eng.score += br.top ? 50 : 10;
            eng.beep(br.hp ? 330 : 660 + (br.y % 64) * 4, 0.04);
            if (br.hp <= 0) {
              for (let p = 0; p < 6; p++) s.parts.push({ x: br.x + BW / 2, y: br.y + BH / 2, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.8) * 2.5, l: 30, c: br.c });
              if (Math.random() < 0.12) s.drops.push({ x: br.x + BW / 2, y: br.y, k: 'WSM'[Math.floor(Math.random() * 3)] });
            }
            break;
          }
        }
      }
      if (b.y > 326) b.dead = true;
    }
    s.balls = s.balls.filter((b) => !b.dead);
    if (!s.balls.length) {
      s.lives--; eng.beep(150, 0.3, 'sawtooth', 0.05, -80);
      if (s.lives <= 0) { eng.gameOver('MARKET CORRECTION'); return; }
      s.balls = [newBall()]; s.wide = 0; s.slow = 0; s.drops = []; s.msg = 60;
    }
    // power tokens
    for (const d of s.drops) {
      d.y += 1.1;
      if (d.y > PY - 6 && d.y < PY + PH && Math.abs(d.x - s.px) < s.pw / 2 + 5) {
        d.got = true; eng.score += 25; eng.beep(990, 0.08);
        if (d.k === 'W') s.wide = 900; if (d.k === 'S') s.slow = 600;
        if (d.k === 'M') { const src = s.balls.find((b) => !b.stuck); if (src) s.balls.push({ ...src, vx: -src.vx }); }
      }
    }
    s.drops = s.drops.filter((d) => !d.got && d.y < 330);
    for (const p of s.parts) { p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.l--; }
    s.parts = s.parts.filter((p) => p.l > 0);
    // level clear
    if (s.bricks.every((b) => b.hp <= 0)) {
      s.level++; eng.score += 500; s.bricks = build(s.level); s.balls = [newBall()]; s.drops = []; s.speed = Math.min(4, 2.4 + s.level * 0.2); s.msg = 120;
      eng.beep(660, 0.1); eng.beep(990, 0.2);
    }
  },
  draw(eng, ctx) {
    const { text } = eng;
    text(ctx, String(eng.score).padStart(6, '0'), 6, 6, PAL.ink);
    text(ctx, `CHART ${s.level}`, 120, 6, PAL.gold, 'center');
    for (let i = 0; i < s.lives; i++) { ctx.fillStyle = PAL.cyan; ctx.fillRect(222 - i * 14, 8, 10, 3); }
    // faint grid
    ctx.fillStyle = '#140f2b'; for (let y = 24; y < 320; y += 16) ctx.fillRect(0, y, 240, 1); for (let x = 0; x < 240; x += 16) ctx.fillRect(x, 24, 1, 296);
    ctx.fillStyle = '#2b2550'; ctx.fillRect(0, 22, 240, 2);
    for (const br of s.bricks) {
      if (br.hp <= 0) continue;
      ctx.fillStyle = br.top && br.hp === 2 ? '#fff3b0' : br.c; ctx.fillRect(br.x + 1, br.y + 1, BW - 2, BH - 2);
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(br.x + 1, br.y + BH - 2, BW - 2, 1);
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(br.x + 1, br.y + 1, BW - 2, 1);
    }
    for (const p of s.parts) { ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, 2, 2); }
    for (const d of s.drops) { ctx.fillStyle = POW[d.k].c; ctx.fillRect(d.x - 7, d.y - 4, 14, 8); text(ctx, d.k, d.x, d.y - 3, '#07060c', 'center', 8); }
    // paddle
    ctx.fillStyle = s.wide > 0 ? PAL.green : PAL.cyan; ctx.fillRect(s.px - s.pw / 2, PY, s.pw, PH);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(s.px - s.pw / 2 + 2, PY, s.pw - 4, 1);
    for (const b of s.balls) { ctx.fillStyle = '#ffffff'; ctx.fillRect(b.x - 2, b.y - 2, 4, 4); }
    if (s.slow > 0) text(ctx, 'CALM', 6, 312, PAL.cyan, 'left', 8);
    if (s.msg && eng.state === 'play') text(ctx, s.level === 1 && s.lives === 3 ? 'TAP OR SPACE TO LAUNCH' : `CHART ${s.level}`, 120, 250, PAL.gold, 'center');
  },
};
boot(game);
