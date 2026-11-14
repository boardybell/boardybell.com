// Holding Company: a stacking game. A crane swings office floors over the tower; overhang is trimmed off.
import { boot, PAL } from '../engine.js';
const FH = 12, GROUND = 300, BASE_W = 90, PIVOT_Y = 30, HANG = 76;
const FLOOR_C = [['#c9d2dc', '#7d8896'], ['#d9c8a8', '#8e7a58'], ['#a8c0d8', '#5a7490'], ['#c8b8d8', '#76668e'], ['#b8d0b8', '#5e7e5e']];
// sky stops by tower height (floors): day, afternoon, sunset, dusk, night, above the weather
const SKY = [[0, [96, 170, 226], [180, 220, 240]], [12, [110, 150, 210], [230, 200, 170]], [24, [210, 120, 90], [250, 190, 110]], [36, [90, 50, 120], [200, 90, 110]], [50, [20, 24, 60], [50, 40, 90]], [70, [6, 6, 16], [16, 18, 40]]];
let s, city;

function skyAt(f) {
  let i = 0; while (i < SKY.length - 2 && f >= SKY[i + 1][0]) i++;
  const [f0, a0, b0] = SKY[i], [f1, a1, b1] = SKY[i + 1], k = Math.max(0, Math.min(1, (f - f0) / (f1 - f0)));
  const mix = (a, b) => `rgb(${a.map((v, j) => Math.round(v + (b[j] - v) * k)).join(',')})`;
  return [mix(a0, a1), mix(b0, b1)];
}
function makeCity() {
  let seed = 1234; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const layer = (n, minH, maxH) => { const out = []; let x = -10; while (x < 250) { const w = 14 + Math.floor(rnd() * 22), h = minH + Math.floor(rnd() * (maxH - minH)); out.push({ x, w, h, win: Math.floor(rnd() * 1000) }); x += w + Math.floor(rnd() * 4); } return out; };
  const stars = Array.from({ length: 50 }, () => [Math.floor(rnd() * 240), Math.floor(rnd() * 900)]);
  return { far: layer(0, 40, 110), near: layer(1, 20, 70), stars };
}

const game = {
  id: 'stack', tapIsAct: true,
  reset(eng) {
    city ??= makeCity();
    s = { tower: [{ x: 120 - BASE_W / 2, w: BASE_W, c: 0 }], cur: null, ph: Math.random() * 6, falling: null, debris: [], cam: 0, streak: 0, perfects: 0,
      pop: null, dead: 0, floors: 0, widen: 0 };
    newSlab();
  },
  update(eng) {
    for (const d of s.debris) { d.vy += 0.25; d.x += d.vx; d.y += d.vy; d.r += d.vr; }
    s.debris = s.debris.filter((d) => d.y < 700);
    if (s.pop && --s.pop.t <= 0) s.pop = null;
    if (s.widen) s.widen--;
    const target = Math.max(0, s.tower.length * FH - 110);
    s.cam += (target - s.cam) * 0.08;
    if (s.dead) { if (--s.dead === 0) eng.gameOver('STRUCTURALLY UNSOUND'); return; }
    if (s.falling) {
      const f = s.falling; f.vy += 0.4; f.y -= f.vy; // world y decreases while falling
      const topY = s.tower.length * FH;
      if (f.y - FH <= topY) land(eng, f, topY);
      return;
    }
    const spd = Math.min(0.075, 0.03 + s.floors * 0.0012);
    s.ph += spd;
    s.cur.x = 120 + Math.sin(s.ph) * 84 - s.cur.w / 2;
    if (eng.pressed.act || eng.pressed.down || eng.pressed.up) {
      s.falling = { x: s.cur.x, w: s.cur.w, c: s.cur.c, y: hangWorldY(), vy: 0 }; s.cur = null; eng.beep(330, 0.04, 'triangle');
    }
  },
  draw(eng, ctx) {
    const { text } = eng, f = s.floors, top = s.tower.length * FH;
    const sy = (wy) => GROUND - wy + s.cam;
    // sky
    const [hi, lo] = skyAt(f + s.cam / FH * 0.15);
    const g = ctx.createLinearGradient(0, 0, 0, 320); g.addColorStop(0, hi); g.addColorStop(1, lo);
    ctx.fillStyle = g; ctx.fillRect(0, 0, 240, 320);
    const night = Math.max(0, Math.min(1, (f - 30) / 20));
    if (night > 0) {
      ctx.fillStyle = `rgba(255,255,230,${night})`;
      for (const [x, y] of city.stars) { const yy = ((y + s.cam * 0.1) % 320); ctx.fillRect(x, yy, 1, 1); }
    }
    // sun / moon
    const sunY = 60 + Math.min(200, f * 4) - s.cam * 0.05;
    ctx.fillStyle = night > 0.5 ? '#f0f0e0' : '#ffe9a0'; ctx.fillRect(190, sunY, 14, 14); ctx.fillRect(188, sunY + 2, 18, 10); ctx.fillRect(192, sunY - 2, 10, 18);
    // skyline, two parallax layers
    const layer = (L, k, col, winCol) => {
      const base = GROUND + s.cam * k;
      for (const b of L) {
        ctx.fillStyle = col; ctx.fillRect(b.x, base - b.h, b.w, b.h);
        if (night > 0.2) { ctx.fillStyle = winCol; for (let y = base - b.h + 4; y < base - 4; y += 6) for (let x = b.x + 3; x < b.x + b.w - 3; x += 5) if ((x * 7 + y * 13 + b.win) % 5 === 0) ctx.fillRect(x, y, 2, 2); }
      }
    };
    layer(city.far, 0.25, night > 0.5 ? '#1a1838' : '#5a6a8a', '#ffd23f88');
    layer(city.near, 0.5, night > 0.5 ? '#0e0c22' : '#3a4660', '#ffd23f');
    // ground
    ctx.fillStyle = '#2a2a30'; ctx.fillRect(0, sy(0), 240, 400); ctx.fillStyle = '#4a4a52'; ctx.fillRect(0, sy(0), 240, 2);
    // tower
    s.tower.forEach((fl, i) => slab(ctx, fl.x, sy((i + 1) * FH), fl.w, fl.c, i === 0));
    // falling slab
    if (s.falling) slab(ctx, s.falling.x, sy(s.falling.y), s.falling.w, s.falling.c);
    // debris
    for (const d of s.debris) {
      ctx.save(); ctx.translate(d.x + d.w / 2, sy(d.wy) + d.y + FH / 2); ctx.rotate(d.r);
      slab(ctx, -d.w / 2, -FH / 2, d.w, d.c); ctx.restore();
    }
    // crane: jib + pivot + cable + hanging slab
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(0, 22, 240, 4);
    ctx.fillStyle = '#b08a10'; for (let x = 0; x < 240; x += 8) ctx.fillRect(x, 22, 4, 1);
    if (s.cur) {
      const cx = s.cur.x + s.cur.w / 2, cy = PIVOT_Y + HANG;
      ctx.fillStyle = '#4a4a52'; ctx.fillRect(cx - 5, 26, 10, 5);
      ctx.strokeStyle = '#222'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx + 0.5, 31); ctx.lineTo(cx + 0.5, cy - 2); ctx.stroke();
      ctx.fillStyle = '#ffd23f'; ctx.fillRect(cx - 3, cy - 3, 6, 3);
      slab(ctx, s.cur.x, cy, s.cur.w, s.cur.c);
    }
    // HUD band
    ctx.fillStyle = 'rgba(7,6,12,0.85)'; ctx.fillRect(0, 0, 240, 22);
    text(ctx, `FLOORS ${f}`, 4, 3, PAL.gold);
    text(ctx, String(eng.score).padStart(6, '0'), 236, 3, PAL.ink, 'right');
    text(ctx, s.streak ? `PERFECT x${s.streak}` : `WIDTH ${Math.round(s.cur ? s.cur.w : s.tower[s.tower.length - 1].w)}`, 4, 13, s.streak ? PAL.green : PAL.cyan);
    if (s.pop) text(ctx, s.pop.txt, 120, Math.min(250, sy(top) - 22) - (40 - s.pop.t) / 3, s.pop.c, 'center');
    if (f === 0 && !s.falling && !s.dead) text(ctx, 'PRESS A TO DROP', 120, 150, PAL.ink, 'center');
  },
};
function hangWorldY() { return GROUND - (PIVOT_Y + HANG) + s.cam; }
function newSlab() {
  const t = s.tower[s.tower.length - 1];
  s.cur = { x: 0, w: t.w, c: (s.tower.length) % FLOOR_C.length };
  s.ph = Math.random() < 0.5 ? -Math.PI / 2 : Math.PI / 2;
}
function land(eng, f, topY) {
  const t = s.tower[s.tower.length - 1];
  s.falling = null;
  const lo = Math.max(f.x, t.x), hi = Math.min(f.x + f.w, t.x + t.w);
  if (Math.abs(f.x - t.x) <= 2) {
    s.streak++; s.perfects++;
    let w = t.w, x = t.x;
    if (s.streak % 3 === 0 && w < BASE_W) { const nw = Math.min(BASE_W, w + 8); x -= (nw - w) / 2; w = nw; s.widen = 30; }
    s.tower.push({ x, w, c: f.c });
    eng.score += 10 + 15 * Math.min(s.streak, 6);
    s.pop = { txt: s.widen ? 'EXPANSION' : 'PERFECT', c: PAL.green, t: 40 };
    eng.beep(880 + Math.min(s.streak, 8) * 110, 0.08); eng.beep(1320 + Math.min(s.streak, 8) * 110, 0.1, 'triangle', 0.04);
  } else if (eng.god) { // god mode: nothing is trimmed and nothing misses; the floor is nudged square
    s.streak = 0;
    s.tower.push({ x: t.x, w: t.w, c: f.c });
    eng.score += 10;
    s.pop = { txt: 'NUDGED', c: PAL.gold, t: 40 };
    eng.beep(300, 0.06);
  } else if (hi - lo < 2) {
    s.debris.push({ x: f.x, w: f.w, c: f.c, wy: topY + FH, y: 0, vy: 0, vx: f.x < t.x ? -0.6 : 0.6, r: 0, vr: f.x < t.x ? -0.05 : 0.05 });
    s.dead = 70; s.cur = null; eng.beep(120, 0.4, 'sawtooth', 0.05, -60);
    s.pop = { txt: 'MISSED', c: PAL.red, t: 60 };
    return;
  } else {
    s.streak = 0;
    s.tower.push({ x: lo, w: hi - lo, c: f.c });
    const left = f.x < t.x;
    const ox = left ? f.x : hi, ow = f.w - (hi - lo);
    s.debris.push({ x: ox, w: ow, c: f.c, wy: topY + FH, y: 0, vy: -1, vx: left ? -0.8 : 0.8, r: 0, vr: left ? -0.06 : 0.06 });
    eng.score += 10;
    s.pop = { txt: `-${Math.round(ow)} TRIMMED`, c: PAL.orange, t: 40 };
    eng.beep(300, 0.06); eng.beep(160, 0.08, 'triangle');
  }
  s.floors++;
  newSlab();
}
// One office floor: frame colour, window strip with lit panes, dark floor line.
function slab(ctx, x, y, w, c, isBase = false) {
  const [face, dark] = isBase ? ['#6a6a74', '#3a3a44'] : FLOOR_C[c];
  ctx.fillStyle = dark; ctx.fillRect(x, y, w, FH);
  ctx.fillStyle = face; ctx.fillRect(x, y, w, FH - 2);
  if (w > 4 && !isBase) {
    ctx.fillStyle = '#2a3a52'; ctx.fillRect(x + 1, y + 3, w - 2, 5);
    ctx.fillStyle = '#9ad8ff';
    for (let wx = x + 3; wx < x + w - 3; wx += 6) ctx.fillRect(wx, y + 4, 3, 3);
  }
  if (isBase) { ctx.fillStyle = '#9a9aa4'; ctx.fillRect(x, y, w, 2); }
}
boot(game);
