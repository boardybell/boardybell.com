// Asset Allocation: a falling-block packing game. Clusters of cardboard filing boxes drop into a storage bay;
// complete rows are archived. Original shapes palette, scoring names and visuals.
import { boot, PAL } from '../engine.js';
const C = 14, COLS = 10, ROWS = 20, WX = 6, WY = 28, PX = WX + COLS * C + 8, PW = 240 - PX - 4;
// Seven four-box clusters, each with its own box colour (body, dark edge, light flap).
const SHAPES = [
  { name: 'SHELF', m: ['....', '####', '....', '....'], c: ['#c9955a', '#7a5228', '#ecc48c'] },
  { name: 'PALLET', m: ['##', '##'], c: ['#5d88c9', '#2d4a7a', '#9cc0f0'] },
  { name: 'PODIUM', m: ['.#.', '###', '...'], c: ['#5fae6a', '#2d6a36', '#9be0a3'] },
  { name: 'STAIR', m: ['.##', '##.', '...'], c: ['#c9604f', '#7a2c22', '#f2a090'] },
  { name: 'RAMP', m: ['##.', '.##', '...'], c: ['#a070c8', '#583078', '#d4b0f0'] },
  { name: 'HOOK', m: ['#..', '###', '...'], c: ['#d6b440', '#7f6a14', '#f6e08a'] },
  { name: 'CRANK', m: ['..#', '###', '...'], c: ['#8c9aa6', '#46525c', '#c8d4dc'] },
];
const SPEED = [48, 40, 33, 27, 22, 18, 14, 11, 9, 7, 6, 5, 4, 3];
const CLEAR_NAMES = ['', 'FILED', 'CROSS-FILED', 'CONSOLIDATED', 'FULL ARCHIVE'];
const CLEAR_PTS = [0, 100, 300, 500, 800];
let s;

const cellsOf = (m) => { const out = []; m.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '#') out.push([x, y]); })); return out; };
function rotate(m) { const n = m.length, out = []; for (let y = 0; y < n; y++) { let r = ''; for (let x = 0; x < n; x++) r += m[n - 1 - x][y]; out.push(r); } return out; }
function nextFromBag() {
  if (!s.bag.length) { s.bag = [0, 1, 2, 3, 4, 5, 6]; for (let i = 6; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [s.bag[i], s.bag[j]] = [s.bag[j], s.bag[i]]; } }
  return s.bag.pop();
}
function fits(m, px, py) {
  for (const [x, y] of cellsOf(m)) {
    const gx = px + x, gy = py + y;
    if (gx < 0 || gx >= COLS || gy >= ROWS) return false;
    if (gy >= 0 && s.well[gy][gx] >= 0) return false;
  }
  return true;
}
function spawn(eng) {
  const k = s.next; s.next = nextFromBag();
  const m = SHAPES[k].m;
  s.cur = { k, m, x: Math.floor((COLS - m.length) / 2), y: k === 0 ? -1 : 0 };
  s.fall = 0; s.lock = 0; s.lockMoves = 0;
  if (!fits(s.cur.m, s.cur.x, s.cur.y) && eng.god) { // god mode: shred the top of the backlog instead of topping out
    for (let y = 0; y < 8; y++) s.well[y].fill(-1);
    s.banner = { txt: 'SHREDDED', t: 70 }; eng.beep(300, 0.2, 'square', 0.04, -150);
  }
  if (!fits(s.cur.m, s.cur.x, s.cur.y)) { s.cur = null; s.dead = 70; eng.beep(140, 0.5, 'sawtooth', 0.05, -80); }
}
function tryMove(dx, dy) {
  if (fits(s.cur.m, s.cur.x + dx, s.cur.y + dy)) { s.cur.x += dx; s.cur.y += dy; if (s.lock && s.lockMoves++ < 15) s.lock = 0; return true; }
  return false;
}
function tryRotate(eng) {
  const r = rotate(s.cur.m);
  for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1], [-1, -1], [1, -1]]) {
    if (fits(r, s.cur.x + dx, s.cur.y + dy)) { s.cur.m = r; s.cur.x += dx; s.cur.y += dy; if (s.lock && s.lockMoves++ < 15) s.lock = 0; eng.beep(620, 0.03); return; }
  }
}
function ghostY() { let y = s.cur.y; while (fits(s.cur.m, s.cur.x, y + 1)) y++; return y; }
function lockPiece(eng) {
  for (const [x, y] of cellsOf(s.cur.m)) { const gy = s.cur.y + y; if (gy >= 0) s.well[gy][s.cur.x + x] = s.cur.k; }
  s.cur = null;
  const full = [];
  for (let y = 0; y < ROWS; y++) if (s.well[y].every((v) => v >= 0)) full.push(y);
  if (full.length) {
    s.clearing = { rows: full, t: 20 };
    const n = full.length;
    eng.score += CLEAR_PTS[n] * s.level;
    s.banner = { txt: CLEAR_NAMES[n], t: 70 };
    [523, 659, 784, 1046].slice(0, n + 0).forEach((f, i) => setTimeout(() => eng.beep(f, 0.07), i * 60));
  } else { eng.beep(180, 0.04, 'triangle'); spawn(eng); }
}

const game = {
  id: 'blocks',
  reset(eng) {
    s = { well: Array.from({ length: ROWS }, () => Array(COLS).fill(-1)), bag: [], cur: null, next: 0, level: 1, rows: 0, fall: 0, lock: 0, lockMoves: 0,
      das: { dir: 0, t: 0 }, clearing: null, banner: null, dead: 0 };
    s.next = nextFromBag(); spawn(eng);
  },
  update(eng) {
    if (s.banner && --s.banner.t <= 0) s.banner = null;
    if (s.dead) { if (--s.dead === 0) eng.gameOver('BACKLOG FULL'); return; }
    if (s.clearing) {
      if (--s.clearing.t > 0) return;
      for (const y of s.clearing.rows) { s.well.splice(y, 1); s.well.unshift(Array(COLS).fill(-1)); }
      s.rows += s.clearing.rows.length; s.clearing = null;
      const lv = 1 + Math.floor(s.rows / 10);
      if (lv > s.level) { s.level = lv; s.banner = { txt: 'NEW FISCAL YEAR', t: 90 }; eng.beep(880, 0.1); eng.beep(1320, 0.15); }
      spawn(eng); return;
    }
    if (!s.cur) return;
    const k = eng.keys, p = eng.pressed;
    // left/right with auto-repeat
    const dir = k.left && !k.right ? -1 : k.right && !k.left ? 1 : 0;
    if (dir !== s.das.dir) { s.das = { dir, t: 0 }; if (dir) tryMove(dir, 0); }
    else if (dir) { s.das.t++; if (s.das.t > 10 && (s.das.t - 10) % 3 === 0) tryMove(dir, 0); }
    if (eng.swipe === 'left') tryMove(-1, 0); if (eng.swipe === 'right') tryMove(1, 0);
    if (p.up || eng.swipe === 'up') tryRotate(eng);
    if (p.act || eng.swipe === 'down') {
      const gy = ghostY(); eng.score += (gy - s.cur.y) * 2; s.cur.y = gy; eng.beep(120, 0.06, 'square', 0.05, -40); lockPiece(eng); return;
    }
    // gravity / soft drop
    const every = k.down ? 2 : SPEED[Math.min(SPEED.length - 1, s.level - 1)];
    if (++s.fall >= every) {
      s.fall = 0;
      if (tryMove(0, 1)) { if (k.down) eng.score += 1; s.lock = 0; }
    }
    if (!fits(s.cur.m, s.cur.x, s.cur.y + 1)) { if (++s.lock > 30) lockPiece(eng); }
    else s.lock = 0;
  },
  draw(eng, ctx) {
    const { text } = eng;
    // HUD
    text(ctx, 'ASSET ALLOCATION', 6, 6, PAL.gold);
    text(ctx, String(eng.score).padStart(7, '0'), 234, 6, PAL.ink, 'right');
    ctx.fillStyle = '#2a2236'; ctx.fillRect(0, 21, 240, 1);
    // well: concrete storeroom floor
    ctx.fillStyle = '#14111c'; ctx.fillRect(WX, WY, COLS * C, ROWS * C);
    ctx.fillStyle = '#1c1828';
    for (let x = 1; x < COLS; x++) ctx.fillRect(WX + x * C, WY, 1, ROWS * C);
    for (let y = 1; y < ROWS; y++) ctx.fillRect(WX, WY + y * C, COLS * C, 1);
    ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 2; ctx.strokeRect(WX - 1, WY - 1, COLS * C + 2, ROWS * C + 2);
    const flashOn = s.clearing && Math.floor(s.clearing.t / 3) % 2 === 0;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const v = s.well[y][x]; if (v < 0) continue;
      if (s.clearing && s.clearing.rows.includes(y)) { if (flashOn) { ctx.fillStyle = '#fff6d8'; ctx.fillRect(WX + x * C, WY + y * C, C, C); } else box(ctx, WX + x * C, WY + y * C, v); }
      else box(ctx, WX + x * C, WY + y * C, v, s.dead ? 0.45 : 1);
    }
    if (s.cur) {
      const gy = ghostY(), col = SHAPES[s.cur.k].c[2];
      ctx.strokeStyle = col; ctx.lineWidth = 1;
      for (const [x, y] of cellsOf(s.cur.m)) if (gy + y >= 0) { ctx.globalAlpha = 0.55; ctx.strokeRect(WX + (s.cur.x + x) * C + 1.5, WY + (gy + y) * C + 1.5, C - 3, C - 3); ctx.globalAlpha = 1; }
      for (const [x, y] of cellsOf(s.cur.m)) if (s.cur.y + y >= 0) box(ctx, WX + (s.cur.x + x) * C, WY + (s.cur.y + y) * C, s.cur.k);
    }
    // side panel
    panel(ctx, PX, WY, PW, 56, 'NEXT', text);
    const nm = SHAPES[s.next].m, cells = cellsOf(nm);
    const minX = Math.min(...cells.map((c) => c[0])), maxX = Math.max(...cells.map((c) => c[0])), minY = Math.min(...cells.map((c) => c[1])), maxY = Math.max(...cells.map((c) => c[1]));
    const sc = 12, ox = PX + (PW - (maxX - minX + 1) * sc) / 2, oy = WY + 16 + (36 - (maxY - minY + 1) * sc) / 2;
    for (const [x, y] of cells) box(ctx, ox + (x - minX) * sc, oy + (y - minY) * sc, s.next, 1, sc);
    panel(ctx, PX, WY + 64, PW, 56, 'ROWS', text); text(ctx, 'ARCHIVED', PX + PW / 2, WY + 78, PAL.cyan, 'center');
    text(ctx, String(s.rows), PX + PW / 2, WY + 100, PAL.ink, 'center');
    panel(ctx, PX, WY + 128, PW, 40, 'LEVEL', text); text(ctx, String(s.level), PX + PW / 2, WY + 148, PAL.ink, 'center');
    panel(ctx, PX, WY + 176, PW, 40, 'NEXT LVL', text); text(ctx, String(s.level * 10 - s.rows), PX + PW / 2, WY + 196, PAL.ink, 'center');
    // tiny storage-room art
    for (let i = 0; i < 3; i++) box(ctx, PX + 10 + i * 20, 300 - 16, (i * 3 + s.level) % 7, 0.5, 16);
    box(ctx, PX + 20, 300 - 32, (s.level + 1) % 7, 0.5, 16);
    if (s.banner) {
      const y = WY + 100;
      ctx.fillStyle = 'rgba(7,6,12,0.85)'; ctx.fillRect(WX, y - 6, COLS * C, 22);
      text(ctx, s.banner.txt, WX + (COLS * C) / 2, y, PAL.gold, 'center');
    }
    if (eng.state === 'play' && eng.t < 200 && !s.rows) text(ctx, 'FILL ROWS', WX + (COLS * C) / 2, WY + 60, PAL.cyan, 'center');
  },
};
function panel(ctx, x, y, w, h, label, text) {
  ctx.fillStyle = '#100d18'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#3a3048'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  text(ctx, label, x + w / 2, y + 5, PAL.cyan, 'center');
}
// One cardboard filing box: body, dark edge, light lid flap along the top, a small handle slot and label.
function box(ctx, x, y, k, alpha = 1, c = C) {
  const [body, dark, lite] = SHAPES[k].c;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = dark; ctx.fillRect(x, y, c, c);
  ctx.fillStyle = body; ctx.fillRect(x + 1, y + 1, c - 2, c - 2);
  ctx.fillStyle = lite; ctx.fillRect(x + 1, y + 1, c - 2, 3);
  ctx.fillStyle = dark; ctx.fillRect(x + 1, y + 4, c - 2, 1);
  const hw = Math.max(3, Math.round(c / 3));
  ctx.fillRect(x + (c - hw) / 2, y + 6, hw, 1);
  if (c >= 12) { ctx.fillStyle = '#f4ecd8'; ctx.fillRect(x + 3, y + c - 5, c - 6, 3); }
  ctx.globalAlpha = 1;
}
boot(game);
