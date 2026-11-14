// Compound Interest: a snake game where each coin adds ~7% of your current length (minimum 1).
import { boot, PAL } from '../engine.js';
const C = 12, COLS = 20, ROWS = 24, TOP = 28, RATE = 0.07;
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
const COIN = ['..gggg..', '.gGGGGg.', 'gGGyyGGg', 'gGyGGGGg', 'gGyGGGGg', 'gGGGGGGg', '.gGGGGg.', '..gggg..'];
const COIN_C = { g: '#a8730f', G: '#ffd23f', y: '#fff3b0' };
let s;

const game = {
  id: 'snake',
  reset(eng) {
    s = { body: [[6, 12], [5, 12], [4, 12]], dir: 'right', queue: [], grow: 0, coin: null, tick: 0, every: 9, lastGain: 0, flash: 0, coins: 0, dead: 0 };
    place();
  },
  update(eng) {
    if (s.dead) { if (--s.dead === 0) eng.gameOver(s.full ? 'FULLY COMPOUNDED' : 'OVEREXTENDED'); return; }
    for (const k of ['up', 'down', 'left', 'right']) if (eng.pressed[k]) queue(k);
    if (eng.swipe) queue(eng.swipe);
    if (++s.tick < s.every) return;
    s.tick = 0;
    if (s.queue.length) s.dir = s.queue.shift();
    const [dx, dy] = DIRS[s.dir], [hx, hy] = s.body[0];
    let nx = hx + dx, ny = hy + dy;
    if (eng.god) { nx = (nx + COLS) % COLS; ny = (ny + ROWS) % ROWS; } // god mode: wrap at walls, pass through yourself
    const willGrow = s.grow > 0;
    const hitSelf = s.body.some(([x, y], i) => x === nx && y === ny && (willGrow || i < s.body.length - 1));
    if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || (hitSelf && !eng.god)) { s.dead = 50; eng.beep(160, 0.3, 'sawtooth', 0.05, -100); return; }
    s.body.unshift([nx, ny]);
    if (s.grow > 0) { s.grow--; eng.score += 10; } else s.body.pop();
    if (s.coin && nx === s.coin[0] && ny === s.coin[1]) {
      const gain = Math.max(1, Math.floor(s.body.length * RATE));
      s.grow += gain; s.lastGain = gain; s.flash = 40; s.coins++;
      eng.score += 25 * s.coins;
      s.every = Math.max(4, 9 - Math.floor(s.coins / 5));
      eng.beep(880 + Math.min(gain, 20) * 40, 0.07);
      if (!place()) { s.full = true; s.dead = 1; }
    }
    if (s.flash) s.flash--;
  },
  draw(eng, ctx) {
    const { text } = eng;
    // HUD
    text(ctx, 'LENGTH', 6, 6, PAL.cyan); text(ctx, String(s.body.length + s.grow), 60, 6, PAL.ink);
    text(ctx, 'RATE 7%', 234, 6, PAL.gold, 'right');
    text(ctx, String(eng.score).padStart(6, '0'), 120, 17, PAL.ink, 'center');
    // ledger paper
    ctx.fillStyle = '#062016'; ctx.fillRect(0, TOP, COLS * C, ROWS * C);
    ctx.fillStyle = '#0b3324';
    for (let i = 1; i < ROWS; i++) ctx.fillRect(0, TOP + i * C, COLS * C, 1);
    ctx.fillStyle = '#1b4d2a'; ctx.fillRect(36, TOP, 1, ROWS * C);
    ctx.strokeStyle = '#2f7a45'; ctx.lineWidth = 2; ctx.strokeRect(1, TOP + 1, COLS * C - 2, ROWS * C - 2);
    // coin
    if (s.coin) {
      const bob = Math.round(Math.sin(eng.t / 8));
      eng.sprite(ctx, COIN, COIN_C, s.coin[0] * C + 2, TOP + s.coin[1] * C + 2 + bob);
    }
    // snake: stacked coins, head on top
    const dying = s.dead && Math.floor(s.dead / 5) % 2;
    for (let i = s.body.length - 1; i >= 0; i--) {
      const [x, y] = s.body[i], px = x * C, py = TOP + y * C;
      ctx.fillStyle = dying ? PAL.red : i === 0 ? '#ffe680' : i % 2 ? '#e0a92a' : '#c99018';
      ctx.fillRect(px + 1, py + 2, C - 2, C - 4); ctx.fillRect(px + 2, py + 1, C - 4, C - 2);
      ctx.fillStyle = '#8a5b06'; ctx.fillRect(px + 2, py + C - 3, C - 4, 1);
      if (i === 0) {
        ctx.fillStyle = '#07060c';
        const [dx, dy] = DIRS[s.dir];
        const ex = px + 6 + dx * 2, ey = py + 6 + dy * 2;
        if (dx) { ctx.fillRect(ex, ey - 3, 2, 2); ctx.fillRect(ex, ey + 1, 2, 2); } else { ctx.fillRect(ex - 3, ey, 2, 2); ctx.fillRect(ex + 1, ey, 2, 2); }
      }
    }
    if (s.flash) text(ctx, `+${s.lastGain}`, s.body[0][0] * C + 6, TOP + s.body[0][1] * C - 10 - (40 - s.flash) / 4, PAL.gold, 'center');
    if (eng.state === 'play' && s.coins === 0 && eng.t < 240) text(ctx, 'COLLECT COINS', 120, 160, PAL.cyan, 'center');
  },
};
function queue(k) {
  const last = s.queue.length ? s.queue[s.queue.length - 1] : s.dir;
  if (k !== last && k !== OPP[last] && s.queue.length < 2) s.queue.push(k);
}
function place() {
  const free = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (!s.body.some(([a, b]) => a === x && b === y)) free.push([x, y]);
  s.coin = free.length ? free[Math.floor(Math.random() * free.length)] : null;
  return !!s.coin;
}
boot(game);
