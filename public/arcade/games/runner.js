// Lifestyle Creep: an endless runner down a long hallway, pursued by a growing pile of luggage.
import { boot, PAL } from '../engine.js';
const FLOOR = 280, CEIL = 70, PX = 96, PW = 24, STAND = 44, DUCK = 22, SC = 2;
const RUN1 = ['....hhhh....', '...hhhhhh...', '...hssss....', '...sKsKs....', '...ssssss...', '....sss.....', '..nnnWnnn...', '.nnnnWnnnn..', '.nnnnynnnsn.', '.snnnynnn.s.', '.s.nnnnnn...', '...nnnnnn...', '...nnnnnn...', '...ddd.dd...', '..dd....dd..', '..dd.....dd.', '.dd......dd.', '.dd.......dd', 'dd........kk', 'kk..........', '............', '............'];
const RUN2 = [...RUN1.slice(0, 13), '...ddddd....', '....ddd.....', '....dd.d....', '....dd.dd...', '....dd..d...', '....dd..d...', '....dd..d...', '....kk..kk..', '............'];
const JUMP = [...RUN1.slice(0, 13), '..ddddddd...', '.dd.....dd..', 'kk.......dd.', '.........kk.', '............', '............', '............', '............', '............'];
const SLIDE = ['......hhhh......', '.....hhhhhh.....', '.....sKsKs......', '..nnnnWnnnss....', '.nnnnnWnnnn.....', '.nnnnnynnnn.....', 'ddddddnnnnn.....', 'dddddddddddddd..', '..........ddddkk', '..............kk', '................'];
const PCOL = { h: '#3b2a1a', s: '#f2c79a', K: '#07060c', n: '#ff4fd8', W: '#ffffff', y: '#ffd23f', d: '#2b3566', k: '#07060c' };
const CASE_C = ['#c58a3a', '#9d5cff', '#3a6bff', '#ff4a4a', '#5dff7a', '#ff9a3c', '#7df9ff'];
let s;
const add = (o) => { o.dy = 0; o.vy = 0; s.items.push(o); };

function spawn(x) {
  const d = Math.min(1, s.dist / 24000), r = Math.random();
  if (s.toHatch <= 0) { add({ k: 'hatch', x, w: 40 }); s.toHatch = 2600 + Math.random() * 2000; return 80; }
  if (r < 0.4) { const tall = Math.random() < 0.2 + d * 0.35; add({ k: 'box', x, w: 22, h: tall ? 44 : 22 }); }
  else if (r < 0.7) add({ k: 'chand', x, w: 34 });
  else if (r < 0.84) { add({ k: 'box', x, w: 22, h: 22 }); add({ k: 'chand', x: x + 150 - d * 30, w: 34 }); return 150; }
  // a short row of parcels, sometimes in the air
  if (r >= 0.7 || Math.random() < 0.45) {
    const air = Math.random() < 0.5, n = 1 + Math.floor(Math.random() * 3), base = r < 0.7 ? 70 : 0;
    for (let i = 0; i < n; i++) add({ k: 'parcel', x: x + base + i * 24, y: air ? FLOOR - 78 : FLOOR - 18 });
  }
  return 0;
}

const game = {
  id: 'runner', tapIsAct: true,
  reset() {
    s = { y: FLOOR, vy: 0, on: true, duck: false, duckT: 0, buf: 0, coyote: 0, speed: 3, slow: 0, dist: 0, items: [], nextAt: 300,
      parcels: 0, bonus: 0, pile: 0, pileX: 28, inv: 0, toHatch: 2400, t: 0, msg: 'RUN', msgT: 70, pops: [] };
  },
  update(eng) {
    s.t++;
    const k = eng.keys, d = Math.min(1, s.dist / 24000);
    if (s.msgT) s.msgT--;
    // speed ramps with distance; a stumble costs momentum
    const target = 3 + d * 3;
    if (s.slow) { s.slow--; s.speed = Math.max(target * 0.55, s.speed - 0.25); } else s.speed += (target - s.speed) * 0.02;
    const v = s.speed; s.dist += v; s.toHatch -= v;
    // jump (variable height by hold), duck / slide
    if (eng.pressed.act || eng.pressed.up || eng.swipe === 'up') s.buf = 7;
    if (s.buf) s.buf--;
    if (s.on) s.coyote = 5; else if (s.coyote) s.coyote--;
    if (s.buf && s.coyote) { s.vy = -8; s.on = false; s.coyote = 0; s.buf = 0; eng.beep(480, 0.05, 'square', 0.04, 300); }
    if (eng.swipe === 'down') s.duckT = 36;
    s.duck = k.down || s.duckT > 0;
    if (s.duckT) s.duckT--;
    if (!s.on) {
      s.vy += (k.act || k.up) && s.vy < 0 ? 0.34 : 0.55;
      if (k.down) s.vy += 0.6;
      s.y += s.vy;
      if (s.y >= FLOOR) { s.y = FLOOR; s.vy = 0; s.on = true; }
    }
    const top = s.y - (s.duck && s.on ? DUCK : STAND), x0 = PX + 5, x1 = PX + PW - 5;
    // world items
    for (const it of s.items) {
      it.x -= v;
      if (it.dead) { it.vy += 0.5; it.dy += it.vy; continue; }
      if (it.k === 'box') {
        if (x1 > it.x && x0 < it.x + it.w && s.y > FLOOR - it.h + 2) hitObstacle(eng, it);
      } else if (it.k === 'chand') {
        if (x1 > it.x + 3 && x0 < it.x + it.w - 3 && top < FLOOR - 28) hitObstacle(eng, it);
      } else if (it.k === 'parcel') {
        if (x1 + 2 > it.x && x0 - 2 < it.x + 14 && s.y > it.y && top < it.y + 14) {
          it.gone = true; s.parcels++; s.pile++; s.pileX += 3; s.bonus += 50;
          s.pops.push({ x: it.x + 7, y: it.y, l: 36 }); eng.beep(880 + (s.parcels % 5) * 80, 0.05);
        }
      } else if (it.k === 'hatch' && !it.used && s.on && x1 > it.x && x0 < it.x + it.w) {
        it.used = true; const before = s.pile; s.pile = Math.max(0, s.pile - 8); s.pileX = Math.max(16, s.pileX - 50);
        s.bonus += 25 * (before - s.pile); s.msg = 'DONATED'; s.msgT = 70; eng.beep(660, 0.08); eng.beep(440, 0.12, 'triangle');
      }
    }
    s.items = s.items.filter((it) => it.x > -60 && !it.gone && it.dy < 200);
    // spawn ahead
    s.nextAt -= v;
    if (s.nextAt <= 0) s.nextAt = spawn(250) + 130 + Math.random() * (170 - d * 60) + v * 16;
    // the pile creeps forward, faster the bigger it is
    s.pileX += 0.008 + s.pile * 0.002 + d * 0.03;
    if (s.inv) s.inv--;
    for (const p of s.pops) p.l--;
    if (s.pops.length && s.pops[0].l <= 0) s.pops.shift();
    eng.score = Math.floor(s.dist / 12) + s.bonus;
    if (eng.god) s.pileX = Math.min(s.pileX, PX - 8); // god mode: the pile never quite catches up
    if (s.pileX >= PX + 4) eng.gameOver('LIFESTYLE CREPT');
  },
  draw(eng, ctx) {
    const { text, sprite } = eng, sc = s.dist;
    // wallpaper (slow parallax)
    ctx.fillStyle = '#2a1430'; ctx.fillRect(0, CEIL, 240, FLOOR - CEIL);
    const w1 = (sc * 0.3) % 14; ctx.fillStyle = '#331a3b'; for (let x = -w1; x < 240; x += 14) ctx.fillRect(x, CEIL, 6, FLOOR - CEIL);
    // portraits in frames
    const pf = (sc * 0.5) % 130;
    for (let i = -1; i < 3; i++) {
      const x = i * 130 - pf + 50, n = Math.floor((sc * 0.5) / 130) + i, y = 106;
      ctx.fillStyle = PAL.gold; ctx.fillRect(x, y, 44, 58); ctx.fillStyle = '#a8730f'; ctx.fillRect(x + 3, y + 3, 38, 52);
      ctx.fillStyle = ['#1d2c5e', '#3b2a1a', '#1f4a33', '#4a1f3a'][((n % 4) + 4) % 4]; ctx.fillRect(x + 5, y + 5, 34, 48);
      ctx.fillStyle = '#f2c79a'; ctx.fillRect(x + 17, y + 13, 10, 12); ctx.fillStyle = (n & 1) ? '#9a9a9a' : '#3b2a1a'; ctx.fillRect(x + 16, y + 11, 12, 4);
      ctx.fillStyle = '#07060c'; ctx.fillRect(x + 11, y + 27, 22, 26); ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 20, y + 27, 4, 8);
    }
    // ceiling moulding, wainscot, carpet
    ctx.fillStyle = '#e0c088'; ctx.fillRect(0, CEIL, 240, 5); ctx.fillStyle = '#8a5a1f'; ctx.fillRect(0, CEIL + 5, 240, 2);
    ctx.fillStyle = '#4a2a1a'; ctx.fillRect(0, 206, 240, FLOOR - 206); ctx.fillStyle = '#e0c088'; ctx.fillRect(0, 204, 240, 2);
    const wf = sc % 48; ctx.fillStyle = '#3b2010';
    for (let x = -wf; x < 240; x += 48) { ctx.fillRect(x + 5, 214, 38, 1); ctx.fillRect(x + 5, 270, 38, 1); ctx.fillRect(x + 5, 214, 1, 56); ctx.fillRect(x + 42, 214, 1, 56); }
    ctx.fillStyle = '#8a1c2a'; ctx.fillRect(0, FLOOR, 240, 22); ctx.fillStyle = '#b8323f'; ctx.fillRect(0, FLOOR, 240, 2);
    const ff = sc % 24; ctx.fillStyle = '#6a1420'; for (let x = -ff; x < 240; x += 24) ctx.fillRect(x, FLOOR + 9, 12, 2);
    // items
    for (const it of s.items) {
      const x = it.x, dy = it.dy;
      if (it.k === 'hatch') {
        ctx.fillStyle = it.used ? '#2a1a1a' : '#3a6bff'; ctx.fillRect(x, FLOOR, it.w, 6); ctx.fillStyle = it.used ? '#07060c' : PAL.cyan; ctx.fillRect(x + 2, FLOOR + 1, it.w - 4, 3);
        if (!it.used) text(ctx, 'GIVE', x + it.w / 2, FLOOR + 10, PAL.cyan, 'center');
      } else if (it.k === 'box') {
        const y = FLOOR - it.h + dy;
        for (let j = 0; j < it.h; j += 22) {
          ctx.fillStyle = '#c58a3a'; ctx.fillRect(x, y + j, it.w, 21); ctx.fillStyle = '#e0c088'; ctx.fillRect(x + 9, y + j, 4, 21);
          ctx.fillStyle = '#8a5a1f'; ctx.fillRect(x, y + j + 20, it.w, 2); ctx.fillRect(x + 2, y + j + 12, 6, 1); ctx.fillRect(x + 2, y + j + 14, 5, 1);
        }
      } else if (it.k === 'chand') {
        const by = FLOOR - 28 - 18 + dy, cx = x + it.w / 2;
        ctx.fillStyle = '#a8730f'; ctx.fillRect(cx, CEIL + 7, 1, Math.max(0, by - CEIL - 7));
        ctx.fillStyle = PAL.gold; ctx.fillRect(cx - 3, by, 6, 16); ctx.fillRect(x + 3, by + 6, it.w - 6, 3); ctx.fillRect(x, by + 11, it.w, 3);
        ctx.fillStyle = '#fff3b0'; ctx.fillRect(x + 2, by + 2, 3, 4); ctx.fillRect(x + it.w - 5, by + 2, 3, 4); ctx.fillRect(cx - 1, by - 4, 2, 4);
        ctx.fillStyle = '#ffffff'; for (let i = 1; i < it.w; i += 5) ctx.fillRect(x + i, by + 14 + (i % 3), 2, 4);
      } else if (it.k === 'parcel') {
        const y = it.y + Math.sin((s.t + x) / 9) * 2;
        ctx.fillStyle = PAL.pink; ctx.fillRect(x, y, 14, 14); ctx.fillStyle = PAL.gold; ctx.fillRect(x + 6, y, 2, 14); ctx.fillRect(x, y + 6, 14, 2);
        ctx.fillRect(x + 3, y - 3, 3, 3); ctx.fillRect(x + 8, y - 3, 3, 3);
      }
    }
    // the luggage pile
    const rows = Math.min(12, 3 + Math.floor(s.pile / 2)), wob = Math.sin(s.t / 6);
    for (let r = 0; r < rows; r++) {
      const y = FLOOR - (r + 1) * 14, sh = (r & 1) * wob;
      for (let i = 0, x = s.pileX - 34 - r * 3 - ((r * 7) % 9); x > -40; i++, x -= 34) {
        ctx.fillStyle = CASE_C[(r * 3 + i * 5) % CASE_C.length]; ctx.fillRect(x + sh, y + 2, 32, 12);
        ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(x + sh, y + 11, 32, 3); ctx.fillRect(x + sh + 10, y + 2, 2, 12); ctx.fillRect(x + sh + 20, y + 2, 2, 12);
        ctx.fillStyle = '#e0c088'; ctx.fillRect(x + sh + 12, y, 8, 2);
      }
    }
    // runner
    if (!s.inv || (s.t >> 2) & 1) {
      if (s.duck && s.on) sprite(ctx, SLIDE, PCOL, PX - 4, s.y - DUCK, SC);
      else sprite(ctx, !s.on ? JUMP : (s.t >> 3) & 1 ? RUN2 : RUN1, PCOL, PX, s.y - STAND, SC);
    }
    for (const p of s.pops) text(ctx, '+50', p.x, p.y - (36 - p.l) / 2, PAL.gold, 'center');
    // HUD
    ctx.fillStyle = PAL.bg; ctx.fillRect(0, 0, 240, CEIL); ctx.fillRect(0, FLOOR + 22, 240, 320 - FLOOR - 22);
    text(ctx, String(eng.score).padStart(6, '0'), 4, 4, PAL.ink);
    text(ctx, Math.floor(s.dist / 24) + 'm', 236, 4, PAL.gold, 'right');
    ctx.fillStyle = PAL.pink; ctx.fillRect(4, 15, 7, 7); ctx.fillStyle = PAL.gold; ctx.fillRect(7, 15, 1, 7);
    text(ctx, 'x' + s.parcels, 14, 15, PAL.ink);
    const gap = Math.max(0, Math.min(1, (PX + 4 - s.pileX) / 72));
    text(ctx, 'PILE', 146, 15, PAL.grey, 'right');
    ctx.fillStyle = '#2b3566'; ctx.fillRect(150, 17, 86, 4); ctx.fillStyle = gap < 0.3 ? PAL.red : PAL.green; ctx.fillRect(150, 17, 86 * gap, 4);
    ctx.fillStyle = '#2b2550'; ctx.fillRect(0, 26, 240, 2);
    text(ctx, 'THE HALLWAY OF', 120, 38, '#4a3a5a', 'center'); text(ctx, 'NICER THINGS', 120, 50, '#4a3a5a', 'center');
    text(ctx, 'SPACE JUMP  DOWN DUCK', 120, 308, '#3b4470', 'center');
    if (s.msgT && eng.state === 'play') text(ctx, s.msg, 120, 88, PAL.gold, 'center');
  },
};

function hitObstacle(eng, it) {
  if (s.inv || eng.god) return; // god mode: obstacles pass through
  it.dead = true; it.vy = -3; s.inv = 50; s.slow = 40; s.pileX += 16; s.msg = 'STUMBLED'; s.msgT = 40;
  eng.beep(140, 0.2, 'sawtooth', 0.05, -60);
}

boot(game);
