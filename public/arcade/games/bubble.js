// Asset Bubble: a bubble popper. Eight priced perks rise in gold bubbles; sell them all before any reaches the ceiling.
// Each bubble's price ticks upward as it swells.
// Every pop inflates the survivors: larger bubbles are worth more and are easier to hit, but closer to the ceiling.
import { boot, PAL } from '../engine.js';
const CEIL = 36, N = 8, GROW = 3, RMAX = 40;
const VEL = '#5a1230', VEL2 = '#3a0b1f', GOLD = '#ffb238', PALE = '#ffe9a8', BRASS = '#c9a15a', CREAM = '#f4ead2', INK = '#07060c';
const COLS = { g: GOLD, p: PALE, b: BRASS, c: CREAM, d: '#2a1a24', r: '#8a2048', w: '#ffffff' };
// Unnecessary perks, one per bubble: footstool, ice bucket, cocktail parasol, top hat, service bell, monocle.
const PERKS = [
  ['........', '.rrrrrr.', 'rrrrrrrr', 'bbbbbbbb', '.b....b.', '.b....b.'],
  ['.c....c.', '.bbbbbb.', '.bcwccb.', '.bccccb.', '..bbbb..', '..bbbb..'],
  ['...gg...', '.gpgggg.', 'gggggggg', '....c...', '....c...', '...cc...'],
  ['..dddd..', '..dddd..', '..dddd..', '..rrrr..', 'dddddddd', '........'],
  ['...b....', '..ggg...', '.gpggg..', '.ggggg..', 'bbbbbbb.', '........'],
  ['.bbb....', 'b.w.b...', 'b...b...', '.bbb....', '....b...', '.....b..'],
];
let s;
const price = (b) => Math.min(999, Math.round(b.base * (b.r / b.r0) ** 1.5));

function spawn() {
  const r = s.round, base = 0.2 + (r - 1) * 0.035;
  s.bubbles = []; let y = 330;
  for (let i = 0; i < N; i++) {
    const rad = 11 + Math.random() * 3 + Math.min(4, (r - 1) * 0.6);
    s.bubbles.push({ x: rad + 6 + Math.random() * (228 - rad * 2), y: y + rad, r: rad, tr: rad, vy: base * (0.85 + Math.random() * 0.3),
      ph: Math.random() * 6, perk: (Math.random() * PERKS.length) | 0, vb: 0, hit: 0, r0: rad, base: 80 + ((Math.random() * 40) | 0) + (r - 1) * 8 });
    y += Math.max(12, 34 - r * 2) + Math.random() * 18;
  }
  s.phase = 'play'; s.timer = 0;
}
function burst(x, y, n, col) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = 0.6 + Math.random() * 1.8; s.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 20 + Math.random() * 14, c: col }); } }

const game = {
  id: 'bubble', tapIsAct: true,
  reset() {
    s = { round: 1, bubbles: [], pin: { x: 120, y: 190 }, cd: 0, parts: [], pops: [], phase: 'play', timer: 0, lastPX: null, hint: 200, miss: 0 };
    spawn();
  },
  update(eng) {
    const p = s.pin, k = eng.keys;
    for (let i = s.parts.length - 1; i >= 0; i--) { const q = s.parts[i]; q.x += q.vx; q.y += q.vy; q.vy += 0.03; if (--q.l <= 0) s.parts.splice(i, 1); }
    for (let i = s.pops.length - 1; i >= 0; i--) if (--s.pops[i].l <= 0) s.pops.splice(i, 1);
    if (s.hint) s.hint--;
    if (s.phase === 'dead') { if (--s.timer <= 0) eng.gameOver('CEILING BREACHED. THE BUBBLE HAS BEEN CALLED.'); return; }
    if (s.phase === 'clear') { if (--s.timer <= 0) { s.round++; spawn(); } return; }
    // pin: arrows, or drag/tap on the canvas for x
    const sp = 2.4;
    if (k.left) p.x -= sp; if (k.right) p.x += sp; if (k.up) p.y -= sp; if (k.down) p.y += sp;
    if (eng.pointerX != null && eng.pointerX !== s.lastPX) { p.x = eng.pointerX; s.lastPX = eng.pointerX; }
    p.x = Math.max(4, Math.min(236, p.x)); p.y = Math.max(CEIL + 6, Math.min(314, p.y));
    if (s.cd) s.cd--;
    if (eng.pressed.act && !s.cd) pop(eng);
    // bubbles rise, wobble and inflate
    for (const b of s.bubbles) {
      b.ph += 0.03; b.r += (b.tr - b.r) * 0.12; if (b.hit) b.hit--;
      b.y -= b.vy; b.x += Math.sin(b.ph) * 0.35;
      if (b.vb) { b.y += b.vb; b.vb *= 0.94; if (b.vb < 0.05) b.vb = 0; }
      b.x = Math.max(b.r + 2, Math.min(238 - b.r, b.x));
      if (b.y - b.r <= CEIL) {
        if (eng.god) { b.y = CEIL + b.r; b.vb = 1.6; b.hit = 12; eng.beep(200, 0.05, 'triangle', 0.03); } // god mode: the ceiling is upholstered
        else { s.phase = 'dead'; s.timer = 80; b.hit = 80; burst(b.x, CEIL, 24, PAL.red); eng.beep(110, 0.5, 'sawtooth', 0.06, -60); return; }
      }
    }
  },
  draw(eng, ctx) {
    const { text } = eng;
    // velvet wall with a brass picture rail and a dark wainscot
    for (let x = 0; x < 240; x += 16) { ctx.fillStyle = (x / 16) % 2 ? VEL : '#4c0f29'; ctx.fillRect(x, 0, 16, 320); }
    ctx.fillStyle = 'rgba(255,233,168,0.05)'; for (let x = 7; x < 240; x += 16) ctx.fillRect(x, 0, 2, 320);
    ctx.fillStyle = VEL2; ctx.fillRect(0, 286, 240, 34); ctx.fillStyle = BRASS; ctx.fillRect(0, 286, 240, 2);
    ctx.fillStyle = '#2a0816'; for (let x = 10; x < 240; x += 40) ctx.fillRect(x, 294, 24, 20);
    // the ceiling: ornate brass moulding with a warning fringe that brightens as bubbles approach
    let near = 0; for (const b of s.bubbles) near = Math.max(near, 1 - (b.y - b.r - CEIL) / 50);
    near = Math.max(0, Math.min(1, near));
    ctx.fillStyle = INK; ctx.fillRect(0, 0, 240, CEIL);
    ctx.fillStyle = BRASS; ctx.fillRect(0, CEIL - 6, 240, 6); ctx.fillStyle = PALE; ctx.fillRect(0, CEIL - 6, 240, 1);
    ctx.fillStyle = near > 0.4 && (eng.t >> 3) % 2 ? PAL.red : GOLD;
    for (let x = 2; x < 240; x += 8) ctx.fillRect(x, CEIL, 4, 3);
    // bubbles
    for (const b of s.bubbles) {
      if (b.y - b.r > 322) continue;
      ctx.fillStyle = b.hit && s.phase === 'dead' ? 'rgba(255,74,74,0.35)' : 'rgba(255,178,56,0.2)';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.283); ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = b.hit ? (s.phase === 'dead' ? PAL.red : PALE) : GOLD; ctx.stroke();
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r - 4, 3.6, 4.6); ctx.stroke();
      // price label with a small up arrow; the perk itself shows once there is room for it
      const big = b.r >= 19, ly = big ? b.y + 3 : b.y - 3, ps = String(price(b)), w = ps.length * 6 + 5;
      if (big) eng.sprite(ctx, PERKS[b.perk], COLS, b.x - 8, b.y - 14, 2);
      text(ctx, ps, b.x - w / 2, ly, PALE, 'left', 6);
      const ax = b.x + w / 2 - 3; ctx.fillStyle = PAL.green; ctx.fillRect(ax, ly + 1, 1, 1); ctx.fillRect(ax - 1, ly + 2, 3, 1); ctx.fillRect(ax - 2, ly + 3, 5, 1); ctx.fillRect(ax, ly + 4, 1, 2);
    }
    for (const q of s.parts) { ctx.fillStyle = q.c; ctx.fillRect(q.x, q.y, 2, 2); }
    for (const q of s.pops) {
      if (q.f && q.l > 28) { ctx.fillStyle = (q.l >> 1) % 2 ? GOLD : INK; ctx.fillRect(q.x - 20, q.y - (40 - q.l) / 2 - 3, 40, 14); }
      text(ctx, q.s, q.x, q.y - (40 - q.l) / 2, q.f && q.l > 28 && (q.l >> 1) % 2 ? INK : q.c, 'center', 8);
    }
    // the pin: a pearl-headed hat pin; the point is what pops
    if (s.phase === 'play') {
      const { x, y } = s.pin, ready = !s.cd;
      ctx.strokeStyle = ready ? CREAM : '#8a7a70'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 10, y - 14); ctx.stroke(); ctx.lineWidth = 1;
      ctx.fillStyle = ready ? PALE : '#a09080'; ctx.fillRect(x + 8, y - 19, 7, 7); ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 9, y - 18, 2, 2);
      ctx.fillStyle = ready ? PAL.ink : PAL.grey; ctx.fillRect(x - 1, y - 1, 3, 3);
      ctx.fillStyle = 'rgba(255,233,168,0.35)'; ctx.fillRect(x - 6, y, 4, 1); ctx.fillRect(x + 3, y, 4, 1); ctx.fillRect(x, y + 3, 1, 4);
    }
    // HUD
    const left = s.bubbles.length;
    text(ctx, `ROUND ${s.round}`, 4, 4, GOLD);
    text(ctx, String(eng.score).padStart(6, '0'), 236, 4, PAL.ink, 'right');
    text(ctx, `HELD ${left}/${N}`, 4, 16, left <= 2 ? PAL.green : CREAM, 'left', 6);
    text(ctx, `VALUE x${(1 + (N - left) * 0.25).toFixed(2)}`, 236, 16, PALE, 'right', 6);
    if (s.hint && s.round === 1) {
      text(ctx, 'SELL EVERY POSITION', 120, 120, PALE, 'center');
      text(ctx, 'BEFORE THE CEILING', 120, 134, PALE, 'center');
      text(ctx, 'EACH SALE INFLATES THE REST', 120, 152, CREAM, 'center', 6);
    }
    if (s.phase === 'clear') {
      ctx.fillStyle = 'rgba(7,6,12,0.75)'; ctx.fillRect(20, 130, 200, 54); ctx.fillStyle = BRASS; ctx.fillRect(20, 130, 200, 2); ctx.fillRect(20, 182, 200, 2);
      text(ctx, 'POSITIONS SOLD', 120, 140, GOLD, 'center');
      text(ctx, `BONUS ${s.bonus}`, 120, 156, PALE, 'center');
      text(ctx, 'ROUND ' + (s.round + 1) + ' IS INFLATING', 120, 170, CREAM, 'center', 6);
    }
    if (s.phase === 'dead') text(ctx, 'CEILING BREACHED', 120, 150, PAL.red, 'center');
  },
};
function pop(eng) {
  const { x, y } = s.pin;
  let best = -1, bestTop = 1e9;
  s.bubbles.forEach((b, i) => { if ((b.x - x) ** 2 + (b.y - y) ** 2 <= b.r * b.r && b.y - b.r < bestTop) { best = i; bestTop = b.y - b.r; } });
  if (best < 0) { s.cd = 18; eng.beep(150, 0.06, 'triangle', 0.04); s.pops.push({ s: 'PFFT', x, y: y - 10, l: 24, c: PAL.grey }); return; }
  const b = s.bubbles.splice(best, 1)[0];
  const val = price(b) * (1 + (N - 1 - s.bubbles.length) * 0.25) | 0;
  eng.score += val; s.cd = 6;
  burst(b.x, b.y, 16, PALE); burst(b.x, b.y, 8, GOLD);
  s.pops.push({ s: 'SOLD', x: b.x, y: b.y - 10, l: 40, c: GOLD, f: 1 }, { s: '+' + val, x: b.x, y: b.y + 4, l: 40, c: PALE });
  eng.beep(700 + (N - s.bubbles.length) * 90, 0.06); eng.beep(1400, 0.04, 'triangle', 0.03);
  for (const o of s.bubbles) o.tr = Math.min(RMAX, o.tr + GROW);
  if (!s.bubbles.length) {
    s.bonus = 100 * s.round; eng.score += s.bonus; s.phase = 'clear'; s.timer = 110;
    eng.beep(880, 0.1); eng.beep(1320, 0.16, 'triangle', 0.04);
  }
}
boot(game);
