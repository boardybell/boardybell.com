// Bear Market: a first-person maze. A raycast walk through office floors after hours.
// Bears are people in mascot costumes who wander the corridors. Touching one sends you back to the lift.
import { boot, PAL } from '../engine.js';
const VW = 240, VY = 24, VH = 296, HOR = VY + VH / 2, PROJ = 182, PLANE = 0.66, SH = 16, R = 0.2;
const zbuf = new Float32Array(VW);
let s;

// ---------- colours: each wall material is a set of pre-shaded rgb strings [side][shade] ----------
const shades = (r, g, b) => [1, 0.7].map((side) => Array.from({ length: SH }, (_, i) => { const k = ((i + 1) / SH) * side; return `rgb(${(r * k) | 0},${(g * k) | 0},${(b * k) | 0})`; }));
// 1 = cubicle panel, 2 = filing cabinet, 3 = outer wall with windows
const MAT = {
  1: { base: shades(64, 92, 150), trim: shades(170, 176, 190), line: shades(30, 44, 80) },
  2: { base: shades(128, 132, 142), trim: shades(190, 194, 204), line: shades(52, 54, 62) },
  3: { base: shades(110, 98, 84), trim: shades(150, 140, 120), line: shades(14, 22, 52) },
};
const CEIL = ['#0d0b1a', '#100e20', '#131126', '#15132b', '#121025', '#0f0d1f', '#0c0a19', '#090814'];
const FLOOR = ['#0b0d12', '#0e1118', '#11151e', '#141a25', '#171e2b', '#1a2231', '#1d2637', '#202a3d'];

// ---------- sprites: built once into offscreen canvases at three brightness levels ----------
const BEAR = [
  ['..bb....bb..', '.bBBb..bBBb.', '.bbbbbbbbbb.', 'bbbbbbbbbbbb', 'bbKbbbbbbKbb', 'bbbbttttbbbb', 'bbbbtKKtbbbb', '.bbbttttbbb.', '..bbbbbbbb..', '.bbbbWWbbbb.', 'bbbbbWrbbbbb', 'bbbbbWrbbbbb', 'bbtbbbbbbtbb', 'bbtbbbbbbtbb', '.bbbbbbbbbb.', '.bbbb..bbbb.', '.bbbb..bbbb.', '.bbb....bbb.', 'kkkk....kkkk'],
  ['..bb....bb..', '.bBBb..bBBb.', '.bbbbbbbbbb.', 'bbbbbbbbbbbb', 'bbKbbbbbbKbb', 'bbbbttttbbbb', 'bbbbtKKtbbbb', '.bbbttttbbb.', '..bbbbbbbb..', '.bbbbWWbbbb.', 'bbbbbWrbbbbb', 'bbbbbWrbbbbb', 'bbtbbbbbbtbb', 'bbtbbbbbbtbb', '.bbbbbbbbbb.', '..bbbbbbbb..', '..bbb..bbb..', '..bbb..bbb..', '.kkkk..kkkk.'],
];
const BCOL = { b: '#8a5a2b', B: '#d9a066', K: '#07060c', t: '#e8c39a', W: '#ffffff', r: '#ff4a4a', k: '#3b2a1a' };
const EXIT = [
  ['GGGGGGGGGGGG', 'GWWWWWWWWWWG', 'GWggggggggWG', 'GWggggggggWG', 'GWggggggggWG', 'GWggggggggWG', 'GWggggggggWG', 'GWggggggWgWG', 'GWggggggggWG', 'GWggggggggWG', 'GWggggggggWG', 'GWggggggggWG', 'GWggggggggWG', 'GWWWWWWWWWWG', 'GGGGGGGGGGGG'],
];
const ECOL = { G: '#5dff7a', g: '#1f7a35', W: '#e8fbff' };
function mk(rows, cols, k) {
  const c = document.createElement('canvas'); c.width = rows[0].length; c.height = rows.length;
  const g = c.getContext('2d');
  rows.forEach((r, j) => [...r].forEach((ch, i) => {
    const hex = cols[ch]; if (!hex) return;
    const n = parseInt(hex.slice(1), 16);
    g.fillStyle = `rgb(${((n >> 16) * k) | 0},${(((n >> 8) & 255) * k) | 0},${((n & 255) * k) | 0})`; g.fillRect(i, j, 1, 1);
  }));
  return c;
}
const LV = [1, 0.7, 0.45];
const IMG = {
  bear: BEAR.map((f) => LV.map((k) => mk(f, BCOL, k))),
  exit: [LV.map((k) => mk(EXIT[0], ECOL, k)), LV.map((k) => mk(EXIT[0], { ...ECOL, g: '#2fae4f' }, k))],
};

// ---------- maze: recursive backtracker on an odd grid, plus a few knocked-through walls ----------
function makeFloor(floor) {
  const c = Math.min(12, 4 + floor), n = 2 * c + 1, g = new Uint8Array(n * n).fill(1), mat = new Uint8Array(n * n);
  const stack = [[0, 0]]; g[n + 1] = 0;
  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1], opts = [];
    if (cx > 0 && g[(2 * cy + 1) * n + 2 * cx - 1]) opts.push([-1, 0]);
    if (cx < c - 1 && g[(2 * cy + 1) * n + 2 * cx + 3]) opts.push([1, 0]);
    if (cy > 0 && g[(2 * cy - 1) * n + 2 * cx + 1]) opts.push([0, -1]);
    if (cy < c - 1 && g[(2 * cy + 3) * n + 2 * cx + 1]) opts.push([0, 1]);
    if (!opts.length) { stack.pop(); continue; }
    const [dx, dy] = opts[(Math.random() * opts.length) | 0];
    g[(2 * cy + 1 + dy) * n + 2 * cx + 1 + dx] = 0; g[(2 * cy + 1 + 2 * dy) * n + 2 * cx + 1 + 2 * dx] = 0;
    stack.push([cx + dx, cy + dy]);
  }
  // loops make the bears avoidable
  for (let k = 0, tries = 0; k < c && tries < 400; tries++) {
    const x = 1 + ((Math.random() * (n - 2)) | 0), y = 1 + ((Math.random() * (n - 2)) | 0);
    if (!g[y * n + x] || (x % 2) === (y % 2)) continue;
    if ((g[y * n + x - 1] === 0 && g[y * n + x + 1] === 0) || (g[(y - 1) * n + x] === 0 && g[(y + 1) * n + x] === 0)) { g[y * n + x] = 0; k++; }
  }
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (!g[y * n + x]) continue;
    mat[y * n + x] = x === 0 || y === 0 || x === n - 1 || y === n - 1 ? 3 : (x * 7 + y * 13) % 5 < 2 ? 2 : 1;
  }
  // distances from the lift (start) to place the exit and the bears
  const dist = new Int16Array(n * n).fill(-1), q = [n + 1]; dist[n + 1] = 0;
  for (let i = 0; i < q.length; i++) {
    const v = q[i];
    for (const d of [1, -1, n, -n]) if (!g[v + d] && dist[v + d] < 0) { dist[v + d] = dist[v] + 1; q.push(v + d); }
  }
  let far = n + 1; for (const v of q) if (dist[v] > dist[far]) far = v;
  return { n, g, mat, dist, ex: far % n, ey: (far / n) | 0, cells: q };
}

// one wall column's horizontal detail band (trim, drawer seam, window), clipped to the view
const B = { x: 0, top: 0, lh: 0, side: 0, sh: 0 };
function band(ctx, f, h, col) {
  const a = B.top + B.lh * f, b = Math.max(1, B.lh * h);
  if (a + b > VY && a < 320) { ctx.fillStyle = col[B.side][B.sh]; ctx.fillRect(B.x, Math.max(VY, a), 1, Math.min(b, a + b - VY)); }
}
const solid = (x, y) => { const m = s.m; if (x < 0 || y < 0 || x >= m.n || y >= m.n) return true; return m.g[(y | 0) * m.n + (x | 0)] === 1; };
const open = (cx, cy) => !solid(cx + 0.5, cy + 0.5);

function placeBear(b, minD) {
  const m = s.m, pool = m.cells.filter((v) => m.dist[v] >= minD && v !== m.ey * m.n + m.ex);
  const v = pool.length ? pool[(Math.random() * pool.length) | 0] : m.cells[m.cells.length - 1];
  b.cx = v % m.n; b.cy = (v / m.n) | 0; b.x = b.cx + 0.5; b.y = b.cy + 0.5; b.tx = b.cx; b.ty = b.cy; b.px = -1; b.py = -1;
}
function newFloor(eng) {
  s.m = makeFloor(s.floor);
  const c = Math.min(12, 4 + s.floor);
  s.time = Math.round((30 + c * c * 0.8) * 60); s.timeMax = s.time;
  s.bears = [];
  for (let i = 0; i < Math.min(8, 1 + s.floor); i++) { const b = { anim: Math.random() * 20 }; placeBear(b, 7); s.bears.push(b); }
  toStart(); s.msg = 120;
}
function toStart() {
  s.p.x = 1.5; s.p.y = 1.5;
  s.p.a = solid(2.5, 1.5) ? Math.PI / 2 : 0;
  s.inv = 90;
}

function stepBear(b, speed) {
  const tx = b.tx + 0.5, ty = b.ty + 0.5, dx = tx - b.x, dy = ty - b.y, d = Math.abs(dx) + Math.abs(dy);
  if (d > speed) { b.x += Math.sign(dx) * Math.min(speed, Math.abs(dx)); b.y += Math.sign(dy) * Math.min(speed, Math.abs(dy)); b.anim += speed * 30; return; }
  b.x = tx; b.y = ty; const cx = b.tx, cy = b.ty;
  let best = null, bestD = 1e9, n = 0, pick = null;
  const near = Math.abs(s.p.x - b.x) + Math.abs(s.p.y - b.y) < 6 && Math.random() < 0.45;
  for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = cx + ox, ny = cy + oy;
    if (!open(nx, ny) || (nx === b.px && ny === b.py)) continue;
    n++; if (Math.random() * n < 1) pick = [nx, ny];
    const pd = (nx + 0.5 - s.p.x) ** 2 + (ny + 0.5 - s.p.y) ** 2; if (pd < bestD) { bestD = pd; best = [nx, ny]; }
  }
  if (near && best) pick = best;
  if (!pick) pick = [b.px, b.py]; // dead end: turn around
  b.px = cx; b.py = cy; b.tx = pick[0]; b.ty = pick[1];
}

const game = {
  id: 'bear',
  reset(eng) { s = { floor: 1, lives: 3, p: { x: 1.5, y: 1.5, a: 0 }, inv: 0, msg: 0, flash: 0, step: 0, bonus: 0, bonusT: 0 }; newFloor(eng); },
  update(eng) {
    const p = s.p, k = eng.keys;
    if (s.msg) s.msg--; if (s.inv) s.inv--; if (s.flash) s.flash--; if (s.bonusT) s.bonusT--;
    // turn + walk
    if (k.left) p.a -= 0.05; if (k.right) p.a += 0.05;
    const mv = (k.up ? 0.055 : 0) - (k.down ? 0.04 : 0);
    if (mv) {
      const dx = Math.cos(p.a) * mv, dy = Math.sin(p.a) * mv;
      if (!solid(p.x + dx + Math.sign(dx) * R, p.y - R * 0.9) && !solid(p.x + dx + Math.sign(dx) * R, p.y + R * 0.9)) p.x += dx;
      if (!solid(p.x - R * 0.9, p.y + dy + Math.sign(dy) * R) && !solid(p.x + R * 0.9, p.y + dy + Math.sign(dy) * R)) p.y += dy;
      if (++s.step % 20 === 0) eng.beep(70, 0.03, 'triangle', 0.03);
    }
    // the closing bell
    if (eng.god && s.time <= 1) s.time = 2; // god mode: the bell never rings
    if (--s.time <= 0) { eng.beep(880, 0.6, 'square', 0.05); eng.gameOver('MARKET CLOSED'); return; }
    if (s.time < 600 && s.time % 60 === 0) eng.beep(1200, 0.04);
    // bears
    const bs = Math.min(0.05, 0.022 + s.floor * 0.003);
    for (const b of s.bears) {
      stepBear(b, bs);
      if (!s.inv && !eng.god && (b.x - p.x) ** 2 + (b.y - p.y) ** 2 < 0.2) {
        s.lives--; s.flash = 30; eng.beep(140, 0.35, 'sawtooth', 0.06, -90);
        if (s.lives <= 0) { eng.gameOver('BEARISH OUTCOME'); return; }
        toStart();
        for (const o of s.bears) if (s.m.dist[o.ty * s.m.n + o.tx] < 5) placeBear(o, 7);
        break;
      }
    }
    // exit
    if ((p.x | 0) === s.m.ex && (p.y | 0) === s.m.ey) {
      const secs = Math.ceil(s.time / 60); s.bonus = 500 * s.floor + secs * 10; eng.score += s.bonus; s.bonusT = 150;
      eng.beep(660, 0.1); eng.beep(990, 0.2, 'square', 0.05, 200);
      s.floor++; newFloor(eng);
    }
  },
  draw(eng, ctx) {
    const { text } = eng, p = s.p, m = s.m;
    // ceiling + carpet
    for (let i = 0; i < 8; i++) { ctx.fillStyle = CEIL[i]; ctx.fillRect(0, VY + i * 19, VW, 19); ctx.fillStyle = FLOOR[i]; ctx.fillRect(0, HOR + i * 19, VW, 19); }
    ctx.fillStyle = '#1c1a33'; for (let i = 0; i < 4; i++) ctx.fillRect(40 + i * 44 - i * 4, VY + 6 + i * 10, 40 - i * 6, 2); // strip lights receding
    // walls
    const dx = Math.cos(p.a), dy = Math.sin(p.a), plx = -dy * PLANE, ply = dx * PLANE;
    for (let x = 0; x < VW; x++) {
      const cam = (2 * x) / VW - 1, rx = dx + plx * cam, ry = dy + ply * cam;
      let mx = p.x | 0, my = p.y | 0;
      const ddx = Math.abs(1 / rx), ddy = Math.abs(1 / ry), stx = rx < 0 ? -1 : 1, sty = ry < 0 ? -1 : 1;
      let sdx = rx < 0 ? (p.x - mx) * ddx : (mx + 1 - p.x) * ddx, sdy = ry < 0 ? (p.y - my) * ddy : (my + 1 - p.y) * ddy, side = 0;
      for (let guard = 0; guard < 64; guard++) {
        if (sdx < sdy) { sdx += ddx; mx += stx; side = 0; } else { sdy += ddy; my += sty; side = 1; }
        if (mx < 0 || my < 0 || mx >= m.n || my >= m.n || m.g[my * m.n + mx]) break;
      }
      const perp = Math.max(0.05, side ? sdy - ddy : sdx - ddx);
      zbuf[x] = perp;
      let wx = side ? p.x + perp * rx : p.y + perp * ry; wx -= Math.floor(wx);
      const mat = MAT[m.mat[my * m.n + mx] || 3], sh = Math.max(0, Math.min(SH - 1, (SH - 1 - perp * 1.9) | 0));
      const lh = PROJ / perp, top = HOR - lh / 2, y0 = Math.max(VY, top), y1 = Math.min(320, top + lh);
      ctx.fillStyle = (wx < 0.035 || wx > 0.965 ? mat.line : mat.base)[side][sh]; ctx.fillRect(x, y0, 1, y1 - y0);
      B.x = x; B.top = top; B.lh = lh; B.side = side; B.sh = sh;
      const t = m.mat[my * m.n + mx] || 3;
      if (t === 1) { band(ctx, 0, 0.07, mat.trim); band(ctx, 0.94, 0.06, mat.line); }
      else if (t === 2) {
        band(ctx, 0.02, 0.03, mat.trim); band(ctx, 0.34, 0.012, mat.line); band(ctx, 0.66, 0.012, mat.line); band(ctx, 0.97, 0.03, mat.line);
        if (wx > 0.4 && wx < 0.6) { band(ctx, 0.17, 0.025, mat.trim); band(ctx, 0.49, 0.025, mat.trim); band(ctx, 0.81, 0.025, mat.trim); }
      } else { band(ctx, 0.18, 0.3, mat.line); if (((wx * 4) | 0) % 2 && ((mx + my + x) & 7) === 0) band(ctx, 0.25, 0.02, MAT[2].trim); band(ctx, 0, 0.04, mat.trim); }
    }
    // sprites: exit + bears, far to near, clipped against the wall z-buffer
    const list = s.sl || (s.sl = []); list.length = 0;
    list.push({ x: m.ex + 0.5, y: m.ey + 0.5, exit: true, d: 0 });
    for (const b of s.bears) list.push({ x: b.x, y: b.y, b, d: 0 });
    for (const o of list) o.d = (o.x - p.x) ** 2 + (o.y - p.y) ** 2;
    list.sort((a, b) => b.d - a.d);
    const inv = 1 / (plx * dy - dx * ply);
    for (const o of list) {
      const sx = o.x - p.x, sy = o.y - p.y, tx = inv * (dy * sx - dx * sy), ty = inv * (-ply * sx + plx * sy);
      if (ty < 0.15) continue;
      const lv = ty < 3 ? 0 : ty < 6 ? 1 : 2;
      const img = o.exit ? IMG.exit[(eng.t >> 4) & 1][lv] : IMG.bear[((o.b.anim / 8) | 0) & 1][lv];
      const size = PROJ / ty, hgt = size * (o.exit ? 0.75 : 0.82), wid = hgt * (img.width / img.height);
      const cx = (VW / 2) * (1 + tx / ty), left = cx - wid / 2, top = HOR + size / 2 - hgt;
      if (o.exit) ctx.fillStyle = 'rgba(93,255,122,0.12)';
      const xa = Math.max(0, Math.ceil(left)), xb = Math.min(VW - 1, Math.floor(left + wid));
      for (let x = xa; x <= xb; x++) {
        if (ty >= zbuf[x]) continue;
        if (o.exit) ctx.fillRect(x, top - hgt * 0.15, 1, hgt * 1.3);
        const srcX = Math.min(img.width - 1, ((x - left) / wid) * img.width) | 0;
        ctx.drawImage(img, srcX, 0, 1, img.height, x, top, 1, hgt);
      }
    }
    if (s.flash) { ctx.fillStyle = `rgba(255,74,74,${s.flash / 60})`; ctx.fillRect(0, VY, VW, VH); }
    // minimap while act is held
    if (eng.keys.act) {
      const c = Math.max(2, Math.floor(84 / m.n)), ox = VW - m.n * c - 4, oy = VY + 4;
      ctx.fillStyle = 'rgba(7,6,12,0.85)'; ctx.fillRect(ox - 2, oy - 2, m.n * c + 4, m.n * c + 4);
      ctx.fillStyle = '#3a4a70';
      for (let y = 0; y < m.n; y++) for (let x = 0; x < m.n; x++) if (m.g[y * m.n + x]) ctx.fillRect(ox + x * c, oy + y * c, c, c);
      ctx.fillStyle = PAL.green; ctx.fillRect(ox + m.ex * c, oy + m.ey * c, c, c);
      ctx.fillStyle = '#d9a066'; for (const b of s.bears) ctx.fillRect(ox + b.x * c - 1, oy + b.y * c - 1, 2, 2);
      ctx.fillStyle = PAL.ink; ctx.fillRect(ox + p.x * c - 1, oy + p.y * c - 1, 3, 3);
      ctx.fillStyle = PAL.gold; ctx.fillRect(ox + (p.x + Math.cos(p.a) * 1.2) * c, oy + (p.y + Math.sin(p.a) * 1.2) * c, 1, 1);
    }
    // HUD
    ctx.fillStyle = PAL.bg; ctx.fillRect(0, 0, VW, VY);
    ctx.fillStyle = '#2b2550'; ctx.fillRect(0, VY - 1, VW, 1);
    text(ctx, String(eng.score).padStart(6, '0'), 4, 3, PAL.ink);
    text(ctx, `FLOOR ${s.floor}`, 120, 3, PAL.gold, 'center');
    for (let i = 0; i < s.lives; i++) { ctx.fillStyle = PAL.cyan; ctx.fillRect(228 - i * 10, 4, 7, 7); ctx.fillStyle = PAL.bg; ctx.fillRect(230 - i * 10, 6, 3, 3); }
    const secs = Math.max(0, Math.ceil(s.time / 60)), mm = (secs / 60) | 0, ss = secs % 60;
    text(ctx, `CLOSING BELL ${mm}:${ss < 10 ? '0' : ''}${ss}`, 120, 13, secs <= 10 && (eng.t >> 3) & 1 ? PAL.red : secs <= 10 ? PAL.orange : PAL.grey, 'center');
    if (eng.state !== 'play') return;
    if (s.bonusT) text(ctx, `FLOOR CLEARED +${s.bonus}`, 120, 60, PAL.green, 'center');
    else if (s.msg) { text(ctx, `FLOOR ${s.floor}`, 120, 60, PAL.gold, 'center'); text(ctx, 'FIND THE GREEN EXIT', 120, 74, PAL.ink, 'center'); if (s.floor === 1) text(ctx, 'HOLD A FOR FLOOR PLAN', 120, 88, PAL.grey, 'center'); }
  },
};
boot(game);
