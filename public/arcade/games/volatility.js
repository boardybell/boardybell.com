// Market Volatility: a rock-splitting space shooter in thin neon lines.
// Every rock you break becomes two smaller rocks. An analyst saucer occasionally offers an opinion.
import { boot, PAL } from '../engine.js';
const TOP = 24, AW = 240, AH = 320 - TOP, MAXB = 4;
const RAD = [0, 5, 10, 18], PTS = [0, 100, 50, 20], RCOL = [0, PAL.pink, PAL.orange, PAL.cyan];
let s;

const wrapX = (x) => (x < 0 ? x + AW : x >= AW ? x - AW : x);
const wrapY = (y) => (y < TOP ? y + AH : y >= 320 ? y - AH : y);
function rock(x, y, size, speed) {
  const a = Math.random() * Math.PI * 2, v = speed * (0.6 + Math.random() * 0.8), n = 10 + ((Math.random() * 3) | 0), pts = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) { const t = (i / n) * Math.PI * 2, r = RAD[size] * (0.62 + Math.random() * 0.48); pts[i * 2] = Math.cos(t) * r; pts[i * 2 + 1] = Math.sin(t) * r; }
  return { x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, size, pts, rot: 0, spin: (Math.random() - 0.5) * 0.04 };
}
function startWave() {
  s.rocks.length = 0;
  const n = Math.min(10, 3 + s.wave), sp = Math.min(1.1, 0.45 + s.wave * 0.07);
  for (let i = 0; i < n; i++) {
    // spawn along the edges, away from the ship
    let x, y; do { x = Math.random() * AW; y = TOP + Math.random() * AH; } while ((x - s.ship.x) ** 2 + (y - s.ship.y) ** 2 < 70 * 70);
    s.rocks.push(rock(x, y, 3, sp));
  }
  s.msg = 120; s.saucerT = 600 + Math.random() * 600;
}
function respawn() { Object.assign(s.ship, { x: 120, y: 172, vx: 0, vy: 0, a: -Math.PI / 2, inv: 150, dead: 0 }); }
function burst(x, y, col, n) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = 0.4 + Math.random() * 1.6; s.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 20 + Math.random() * 20, c: col }); } }
function hitRock(eng, i, byPlayer) {
  const r = s.rocks[i];
  if (byPlayer) eng.score += PTS[r.size];
  burst(r.x, r.y, RCOL[r.size], 4 + r.size * 3);
  eng.beep([0, 520, 300, 160][r.size], 0.12, 'sawtooth', 0.05, -100);
  s.rocks.splice(i, 1);
  if (r.size > 1) {
    const sp = Math.hypot(r.vx, r.vy) * 1.35 + 0.2;
    for (let k = 0; k < 2; k++) { const c = rock(r.x, r.y, r.size - 1, sp); s.rocks.push(c); }
  }
}
function killShip(eng) {
  const sh = s.ship; burst(sh.x, sh.y, PAL.ink, 24); sh.dead = 90; s.lives--;
  eng.beep(110, 0.6, 'sawtooth', 0.07, -80);
}

const game = {
  id: 'volatility',
  reset(eng) {
    s = { wave: 1, lives: 3, ship: {}, rocks: [], shots: [], foe: [], parts: [], saucer: null, saucerT: 900, msg: 0, cool: 0, thrustT: 0, extra: 10000 };
    respawn(); startWave();
  },
  update(eng) {
    const sh = s.ship, k = eng.keys;
    if (s.msg) s.msg--;
    // ship
    if (sh.dead) {
      if (--sh.dead === 0) { if (s.lives <= 0) { sh.dead = 1; eng.gameOver('OVEREXPOSED'); return; } respawn(); }
    } else {
      if (sh.inv) sh.inv--;
      if (k.left) sh.a -= 0.075; if (k.right) sh.a += 0.075;
      sh.thrust = !!k.up;
      if (k.up) { sh.vx += Math.cos(sh.a) * 0.07; sh.vy += Math.sin(sh.a) * 0.07; if (++s.thrustT % 8 === 0) eng.beep(60, 0.05, 'sawtooth', 0.02); }
      sh.vx *= 0.988; sh.vy *= 0.988;
      const v = Math.hypot(sh.vx, sh.vy); if (v > 3.2) { sh.vx *= 3.2 / v; sh.vy *= 3.2 / v; }
      sh.x = wrapX(sh.x + sh.vx); sh.y = wrapY(sh.y + sh.vy);
      if (s.cool) s.cool--;
      if (eng.pressed.act && s.shots.length < MAXB && !s.cool) {
        s.shots.push({ x: sh.x + Math.cos(sh.a) * 7, y: sh.y + Math.sin(sh.a) * 7, vx: Math.cos(sh.a) * 4 + sh.vx, vy: Math.sin(sh.a) * 4 + sh.vy, l: 48 });
        s.cool = 6; eng.beep(1100, 0.05, 'square', 0.03, -500);
      }
    }
    // bullets
    for (const list of [s.shots, s.foe]) for (let i = list.length - 1; i >= 0; i--) {
      const b = list[i]; b.x = wrapX(b.x + b.vx); b.y = wrapY(b.y + b.vy);
      if (--b.l <= 0) list.splice(i, 1);
    }
    // rocks
    for (const r of s.rocks) { r.x = wrapX(r.x + r.vx); r.y = wrapY(r.y + r.vy); r.rot += r.spin; }
    for (let i = s.shots.length - 1; i >= 0; i--) {
      const b = s.shots[i];
      for (let j = s.rocks.length - 1; j >= 0; j--) {
        const r = s.rocks[j], rr = RAD[r.size] * 0.9;
        if ((b.x - r.x) ** 2 + (b.y - r.y) ** 2 < rr * rr) { s.shots.splice(i, 1); hitRock(eng, j, true); break; }
      }
    }
    if (!sh.dead && !sh.inv) for (let j = s.rocks.length - 1; j >= 0; j--) {
      const r = s.rocks[j], rr = RAD[r.size] * 0.8 + 3;
      if ((sh.x - r.x) ** 2 + (sh.y - r.y) ** 2 < rr * rr) { hitRock(eng, j, true); killShip(eng); break; }
    }
    // the analyst saucer: crosses, fires roughly toward the ship
    if (!s.saucer && --s.saucerT <= 0 && s.rocks.length) {
      const l = Math.random() < 0.5;
      s.saucer = { x: l ? -10 : AW + 10, y: TOP + 20 + Math.random() * (AH - 40), vx: (l ? 1 : -1) * (0.7 + s.wave * 0.05), fire: 50, small: s.wave >= 4 && Math.random() < 0.5 };
    }
    if (s.saucer) {
      const u = s.saucer; u.x += u.vx; u.y = wrapY(u.y + Math.sin(eng.t / 30) * 0.4);
      if ((eng.t & 15) === 0) eng.beep(u.small ? 1400 : 900, 0.04, 'triangle', 0.02);
      if (--u.fire <= 0 && !sh.dead) {
        u.fire = Math.max(45, 90 - s.wave * 5);
        const spread = u.small ? 0.35 : 0.9, a = Math.atan2(sh.y - u.y, sh.x - u.x) + (Math.random() - 0.5) * spread;
        s.foe.push({ x: u.x, y: u.y, vx: Math.cos(a) * 2.2, vy: Math.sin(a) * 2.2, l: 80 });
      }
      const ur = u.small ? 5 : 8;
      for (let i = s.shots.length - 1; i >= 0; i--) {
        const b = s.shots[i];
        if (Math.abs(b.x - u.x) < ur + 1 && Math.abs(b.y - u.y) < ur * 0.6 + 1) { s.shots.splice(i, 1); eng.score += u.small ? 1000 : 200; burst(u.x, u.y, PAL.green, 16); eng.beep(1500, 0.2, 'square', 0.05, -900); s.saucer = null; break; }
      }
      if (s.saucer && !sh.dead && !sh.inv && Math.abs(sh.x - u.x) < ur + 3 && Math.abs(sh.y - u.y) < ur * 0.6 + 3) { burst(u.x, u.y, PAL.green, 16); s.saucer = null; killShip(eng); }
      if (s.saucer && (u.x < -14 || u.x > AW + 14)) s.saucer = null;
      if (!s.saucer) s.saucerT = Math.max(360, 1100 - s.wave * 80) + Math.random() * 400;
    }
    if (!sh.dead && !sh.inv) for (let i = s.foe.length - 1; i >= 0; i--) {
      const b = s.foe[i];
      if ((b.x - sh.x) ** 2 + (b.y - sh.y) ** 2 < 25) { s.foe.splice(i, 1); killShip(eng); break; }
    }
    // extra life every 10000
    if (eng.score >= s.extra) { s.extra += 10000; s.lives = Math.min(6, s.lives + 1); eng.beep(1320, 0.2); }
    // particles
    for (let i = s.parts.length - 1; i >= 0; i--) { const p = s.parts[i]; p.x += p.vx; p.y += p.vy; p.vx *= 0.97; p.vy *= 0.97; if (--p.l <= 0) s.parts.splice(i, 1); }
    // next wave
    if (!s.rocks.length && !s.saucer) { s.wave++; eng.score += 250; s.foe.length = 0; startWave(); eng.beep(660, 0.1); eng.beep(990, 0.15); }
  },
  draw(eng, ctx) {
    const { text } = eng, sh = s.ship;
    // faint stars
    for (let i = 0; i < 36; i++) { ctx.fillStyle = i % 4 ? '#1c1838' : '#3b3570'; ctx.fillRect((i * 89 + 13) % 240, TOP + ((i * 61) % AH), 1, 1); }
    ctx.lineWidth = 1; ctx.lineJoin = 'round';
    // rocks (drawn up to 4 times near edges so wrap looks seamless)
    for (const r of s.rocks) {
      ctx.strokeStyle = RCOL[r.size];
      const rr = RAD[r.size] + 2, ox = r.x < rr ? AW : r.x > AW - rr ? -AW : 0, oy = r.y < TOP + rr ? AH : r.y > 320 - rr ? -AH : 0;
      const c = Math.cos(r.rot), sn = Math.sin(r.rot), n = r.pts.length / 2;
      for (let q = 0; q < 4; q++) {
        const dx = q & 1 ? ox : 0, dy = q & 2 ? oy : 0;
        if ((q & 1 && !ox) || (q & 2 && !oy)) continue;
        ctx.beginPath();
        for (let i = 0; i < n; i++) { const px = r.pts[i * 2], py = r.pts[i * 2 + 1], X = r.x + dx + px * c - py * sn, Y = r.y + dy + px * sn + py * c; if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
        ctx.closePath(); ctx.stroke();
      }
    }
    // ship
    if (!sh.dead && (!sh.inv || (eng.t >> 2) & 1)) {
      const c = Math.cos(sh.a), sn = Math.sin(sh.a), P = (fx, fy) => [sh.x + fx * c - fy * sn, sh.y + fx * sn + fy * c];
      ctx.strokeStyle = PAL.ink; ctx.beginPath();
      let [x, y] = P(8, 0); ctx.moveTo(x, y); [x, y] = P(-6, 5); ctx.lineTo(x, y); [x, y] = P(-3, 0); ctx.lineTo(x, y); [x, y] = P(-6, -5); ctx.lineTo(x, y); ctx.closePath(); ctx.stroke();
      if (sh.thrust && (eng.t & 2)) { ctx.strokeStyle = PAL.gold; ctx.beginPath(); [x, y] = P(-4, 2); ctx.moveTo(x, y); [x, y] = P(-10, 0); ctx.lineTo(x, y); [x, y] = P(-4, -2); ctx.lineTo(x, y); ctx.stroke(); }
    }
    // saucer
    if (s.saucer) {
      const u = s.saucer, w = u.small ? 6 : 10, h = u.small ? 3 : 4;
      ctx.strokeStyle = PAL.green; ctx.beginPath();
      ctx.moveTo(u.x - w, u.y); ctx.lineTo(u.x + w, u.y); ctx.lineTo(u.x + w * 0.5, u.y + h); ctx.lineTo(u.x - w * 0.5, u.y + h); ctx.closePath();
      ctx.moveTo(u.x - w * 0.5, u.y); ctx.lineTo(u.x - w * 0.3, u.y - h); ctx.lineTo(u.x + w * 0.3, u.y - h); ctx.lineTo(u.x + w * 0.5, u.y); ctx.stroke();
      if (!u.small) text(ctx, 'ANALYST', u.x, u.y - 14, PAL.green, 'center');
    }
    ctx.fillStyle = PAL.gold; for (const b of s.shots) ctx.fillRect(b.x - 1, b.y - 1, 2, 2);
    ctx.fillStyle = PAL.green; for (const b of s.foe) ctx.fillRect(b.x - 1, b.y - 1, 2, 2);
    for (const p of s.parts) { ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, 1, 1); }
    // HUD
    ctx.fillStyle = PAL.bg; ctx.fillRect(0, 0, 240, TOP - 2);
    ctx.fillStyle = '#2b2550'; ctx.fillRect(0, TOP - 2, 240, 1);
    text(ctx, String(eng.score).padStart(6, '0'), 4, 7, PAL.ink);
    text(ctx, `WAVE ${s.wave}`, 120, 7, PAL.gold, 'center');
    ctx.strokeStyle = PAL.cyan;
    for (let i = 0; i < Math.max(0, s.lives); i++) { const x = 230 - i * 11; ctx.beginPath(); ctx.moveTo(x, 6); ctx.lineTo(x + 4, 16); ctx.lineTo(x, 13); ctx.lineTo(x - 4, 16); ctx.closePath(); ctx.stroke(); }
    if (eng.state !== 'play') return;
    if (s.msg) { text(ctx, `WAVE ${s.wave}`, 120, 120, PAL.gold, 'center'); text(ctx, s.wave === 1 ? 'VOLATILITY DETECTED' : 'VOLATILITY INCREASING', 120, 136, PAL.ink, 'center'); }
    if (sh.dead && s.lives > 0 && sh.dead < 60) text(ctx, 'REBALANCING', 120, 160, PAL.grey, 'center');
  },
};
boot(game);
