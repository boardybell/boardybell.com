// Margin Invaders: a fixed shooter. Original sprites: envelopes, telephones and alarm bells; piggy-bank bunkers.
import { boot, PAL } from '../engine.js';
const SPR = {
  env: [['...........', '.rrrrrrrrr.', '.rWrrrrrWr.', '.rrWrrrWrr.', '.rrrWrWrrr.', '.rrrrWrrrr.', '.rrrrrrrrr.', '..r.....r..'],
        ['...........', '.rrrrrrrrr.', '.rWrrrrrWr.', '.rrWrrrWrr.', '.rrrWrWrrr.', '.rrrrWrrrr.', '.rrrrrrrrr.', '.r.......r.']],
  phone: [['...ooooo...', '..oo...oo..', '.ooo...ooo.', '...ooooo...', '..oWoWoWo..', '..ooooooo..', '.ooooooooo.', '..o.....o..'],
          ['...ooooo...', '..oo...oo..', '.ooo...ooo.', '...ooooo...', '..oWoWoWo..', '..ooooooo..', '.ooooooooo.', '.o.......o.']],
  bell: [['.....y.....', '....yyy....', '...yyyyy...', '...yyyyy...', '..yyyyyyy..', '.yyyyyyyyy.', '.....y.....', '..y.....y..'],
         ['.....y.....', '....yyy....', '...yyyyy...', '...yyyyy...', '..yyyyyyy..', '.yyyyyyyyy.', '.....y.....', '...y...y...']],
  calc: ['......c......', '.....ccc.....', '.ccccccccccc.', 'cGGGGGGGGGGGc', 'ccWcWcWcWcWcc', 'ccccccccccccc', 'ccWcWcWcWcWcc', 'ccccccccccccc'],
  case: ['....bbbb....', '...b....b...', 'bbbbbbbbbbbb', 'bBBBBByBBBBb', 'bBBBBBBBBBBb', 'bbbbbbbbbbbb'],
};
const COL = { r: '#ff4a4a', W: '#ffffff', o: '#ff9a3c', y: '#ffd23f', c: '#7df9ff', G: '#5dff7a', b: '#c58a3a', B: '#8a5a1f' };
const ROWS = [['bell', 30], ['phone', 20], ['phone', 20], ['env', 10], ['env', 10]];
const PIG = ['....pppppppppp....', '..pppppppppppppp..', '.pppppppppppppppp.', 'pppppppppppppppppp', 'pppppppppppppppppp', 'pppppppppppppppppp', 'pppppppppppppppppp', '.pppppppppppppppp.', '.pp............pp.', '.pp............pp.'];
let s;

function wave(n) {
  const top = 48 + Math.min(4, n - 1) * 8, foes = [];
  ROWS.forEach(([k, pts], r) => { for (let c = 0; c < 8; c++) foes.push({ k, pts, x: 22 + c * 24, y: top + r * 16, alive: true }); });
  return foes;
}
function bunkers() { return [36, 111, 186].map((x) => ({ x: x - 9, y: 258, px: PIG.map((r) => [...r].map((ch) => ch === 'p')) })); }
function hitBunker(x, y) {
  for (const b of s.bunk) {
    const i = Math.floor(x - b.x), j = Math.floor(y - b.y);
    if (j < 0 || j >= PIG.length || i < 0 || i >= PIG[0].length || !b.px[j][i]) continue;
    for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) if (b.px[j + dj] && Math.random() < 0.8) b.px[j + dj][i + di] = false;
    return true;
  }
  return false;
}

const game = {
  id: 'invaders', tapIsAct: true,
  reset(eng) { s = { wave: 1, lives: 3, px: 120, shot: null, foes: wave(1), dir: 1, step: 0, frame: 0, bombs: [], bunk: bunkers(), ufo: null, boom: [], hitT: 0, msg: 120 }; },
  update(eng) {
    if (s.msg) s.msg--;
    if (s.hitT) { if (--s.hitT === 0 && s.lives <= 0) eng.gameOver('MARGIN CALLED'); return; }
    if (eng.keys.left) s.px -= 1.7; if (eng.keys.right) s.px += 1.7;
    if (eng.pointerX != null && !eng.keys.left && !eng.keys.right && eng.keys.act) s.px += Math.sign(eng.pointerX - s.px) * Math.min(1.7, Math.abs(eng.pointerX - s.px));
    s.px = Math.max(10, Math.min(230, s.px));
    if ((eng.pressed.act || eng.pressed.up) && !s.shot) { s.shot = { x: s.px, y: 284 }; eng.beep(1200, 0.05, 'square', 0.04, -600); }
    if (s.shot) {
      s.shot.y -= 5;
      if (s.shot.y < 24 || hitBunker(s.shot.x, s.shot.y)) s.shot = null;
    }
    // formation march: fewer foes, faster march
    const alive = s.foes.filter((f) => f.alive);
    const every = Math.max(2, Math.floor(alive.length / 1.6));
    if (++s.step >= every) {
      s.step = 0; s.frame ^= 1;
      const minX = Math.min(...alive.map((f) => f.x)), maxX = Math.max(...alive.map((f) => f.x + 11));
      if ((s.dir > 0 && maxX + 3 > 236) || (s.dir < 0 && minX - 3 < 4)) { s.dir = -s.dir; alive.forEach((f) => (f.y += 6)); }
      else alive.forEach((f) => (f.x += 3 * s.dir));
      eng.beep([110, 98, 87, 82][s.frame + (s.step & 1) * 2] || 100, 0.05, 'square', 0.03);
    }
    // shot vs foes / ufo
    if (s.shot) for (const f of alive) if (s.shot && s.shot.x >= f.x && s.shot.x <= f.x + 11 && s.shot.y <= f.y + 8 && s.shot.y >= f.y) {
      f.alive = false; s.shot = null; eng.score += f.pts; s.boom.push({ x: f.x + 5, y: f.y + 4, l: 14 }); eng.beep(220, 0.08, 'sawtooth', 0.04, -150);
    }
    if (s.ufo) {
      s.ufo.x += s.ufo.v;
      if (s.shot && Math.abs(s.shot.x - (s.ufo.x + 6)) < 8 && s.shot.y < 40) { const pts = [100, 150, 300][Math.floor(Math.random() * 3)]; eng.score += pts; s.boom.push({ x: s.ufo.x + 6, y: 32, l: 40, txt: String(pts) }); s.ufo = null; s.shot = null; eng.beep(1500, 0.2); }
      else if (s.ufo.x < -20 || s.ufo.x > 260) s.ufo = null;
    } else if (eng.t % 1500 === 900) s.ufo = Math.random() < 0.5 ? { x: -16, v: 0.8 } : { x: 252, v: -0.8 };
    // foe bombs
    if (alive.length && s.bombs.length < 2 + Math.min(2, s.wave - 1) && Math.random() < 0.025 + s.wave * 0.004) {
      const cols = {}; alive.forEach((f) => { if (!cols[f.x] || cols[f.x].y < f.y) cols[f.x] = f; });
      const shooters = Object.values(cols), f = shooters[Math.floor(Math.random() * shooters.length)];
      s.bombs.push({ x: f.x + 5, y: f.y + 9 });
    }
    for (const b of s.bombs) {
      b.y += 1.8 + s.wave * 0.1;
      if (hitBunker(b.x, b.y)) b.dead = true;
      else if (b.y > 286 && b.y < 296 && Math.abs(b.x - s.px) < 7) { b.dead = true; s.lives--; s.hitT = 70; s.bombs = []; s.shot = null; s.boom.push({ x: s.px, y: 290, l: 40 }); eng.beep(90, 0.5, 'sawtooth', 0.06, -60); }
      else if (b.y > 320) b.dead = true;
    }
    s.bombs = s.bombs.filter((b) => !b.dead);
    // foes eat bunkers and reach the floor
    for (const f of alive) { if (f.y > 250) for (let i = 0; i < 11; i += 2) hitBunker(f.x + i, f.y + 7); if (f.y + 8 >= 286) { s.lives = 0; s.hitT = 1; } }
    s.boom.forEach((b) => b.l--); s.boom = s.boom.filter((b) => b.l > 0);
    if (!alive.length || s.foes.every((f) => !f.alive)) { s.wave++; s.foes = wave(s.wave); s.bombs = []; s.msg = 120; eng.score += 200; eng.beep(660, 0.1); eng.beep(880, 0.15); }
  },
  draw(eng, ctx) {
    const { text, sprite } = eng;
    text(ctx, String(eng.score).padStart(6, '0'), 6, 6, PAL.ink);
    text(ctx, `WAVE ${s.wave}`, 120, 6, PAL.gold, 'center');
    for (let i = 0; i < Math.max(0, s.lives); i++) sprite(ctx, SPR.calc, COL, 200 + i * 14 - 14, 5);
    // stars
    for (let i = 0; i < 40; i++) { ctx.fillStyle = i % 3 ? '#2b2550' : '#4b4580'; ctx.fillRect((i * 97) % 240, 24 + ((i * 53) % 230), 1, 1); }
    // skyline
    ctx.fillStyle = '#120f26';
    [[0, 40], [18, 60], [40, 30], [62, 70], [86, 45], [110, 80], [140, 50], [162, 65], [186, 35], [206, 75], [226, 40]].forEach(([x, h]) => ctx.fillRect(x, 300 - h, 20, h));
    ctx.fillStyle = '#2b2550'; ctx.fillRect(0, 300, 240, 1);
    if (s.ufo) sprite(ctx, SPR.case, COL, s.ufo.x, 30);
    for (const f of s.foes) if (f.alive) sprite(ctx, SPR[f.k][s.frame], COL, f.x, f.y);
    for (const b of s.bunk) b.px.forEach((r, j) => r.forEach((on, i) => { if (on) { ctx.fillStyle = j < 2 ? '#ff9ad5' : '#ff6fbf'; ctx.fillRect(b.x + i, b.y + j, 1, 1); } }));
    if (!s.hitT || Math.floor(s.hitT / 4) % 2) sprite(ctx, SPR.calc, COL, s.px - 6, 286);
    if (s.shot) { ctx.fillStyle = PAL.green; ctx.fillRect(s.shot.x, s.shot.y, 1, 5); }
    ctx.fillStyle = PAL.red; for (const b of s.bombs) { ctx.fillRect(b.x, b.y, 1, 2); ctx.fillRect(b.x + ((b.y >> 2) & 1 ? 1 : -1), b.y + 2, 1, 2); ctx.fillRect(b.x, b.y + 4, 1, 2); }
    for (const b of s.boom) { if (b.txt) { text(ctx, b.txt, b.x, b.y, PAL.gold, 'center'); continue; } ctx.fillStyle = b.l % 4 < 2 ? PAL.ink : PAL.gold; for (let k = 0; k < 6; k++) ctx.fillRect(b.x + Math.cos(k) * (14 - b.l) * 0.6, b.y + Math.sin(k) * (14 - b.l) * 0.6, 2, 2); }
    if (s.msg && eng.state === 'play') text(ctx, `WAVE ${s.wave}`, 120, 150, PAL.gold, 'center');
    ctx.fillStyle = '#5dff7a'; ctx.fillRect(0, 316, 240, 1);
  },
};
boot(game);
