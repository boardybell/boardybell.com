// Reconciliation: a box-pushing puzzle. A clerk pushes ledger crates onto marked bays. Fifteen original rooms,
// each checked solvable with a breadth-first solver; PAR is the minimum number of pushes.
import { boot, PAL } from '../engine.js';
// '#' wall, ' ' floor, '.' bay, '$' crate, '*' crate on bay, '@' clerk, '+' clerk on bay
const LEVELS = [
  { par: 2, m: ['#######', '#@ $ .#', '#######'] },
  { par: 4, m: ['######', '#.   #', '# ##@#', '# $  #', '#  $.#', '##   #', ' #####'] },
  { par: 5, m: ['########', '#      #', '# @$  .#', '#   $ .#', '########'] },
  { par: 4, m: ['#######', '#.  $ #', '# ### #', '#     #', '###@# #', '  # $.#', '  #####'] },
  { par: 6, m: ['#######', '#     #', '# #$#$#', '#   @ #', '#. # .#', '#######'] },
  { par: 7, m: ['########', '#  .#  #', '#. $ $ #', '## # # #', '#    @ #', '#  #####', '####'] },
  { par: 8, m: [' #######', '##   . #', '#  # # #', '#@# $  #', '#.$  # #', '### #  #', '  #    #', '  ######'] },
  { par: 9, m: ['  ######', '  #    #', '###$## #', '#  $  .#', '# #  #@#', '# .  ###', '######'] },
  { par: 10, m: ['#########', '#   #  @#', '#   $   #', '## # # ##', '# $   . #', '#   #.  #', '#########'] },
  { par: 11, m: ['########', '#  #   #', '#  $   #', '# ## # #', '#    # #', '##$#   #', ' # .. @#', ' #######'] },
  { par: 9, m: ['#######', '#.  . #', '# $$# #', '#  @  #', '# #$$ #', '#.   .#', '#######'] },
  { par: 9, m: ['  ########', '  #   #  #', '### @.$  #', '#  .# ## #', '# #      #', '# $.##$# #', '### #    #', '  #   ####', '  #####'] },
  { par: 13, m: ['########', '#  # @ #', '# $ . .#', '# ## # #', '#  $ #$#', '## #   #', ' #.    #', ' #######'] },
  { par: 15, m: ['#########', '#  .#   #', '#  $ @  #', '##$# # ##', '# $    .#', '#   #  .#', '#########'] },
  { par: 13, m: ['  #######', '###  .  #', '#  $#$# #', '# . @ $.#', '## #$#  #', ' #  .  ##', ' #######'] },
];
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const HOURS = 2500, HOLD = 60, T = 20, TOP = 28;
const CLERK = ['...hhhh...', '..hhhhhh..', '..ssssss..', '..sKssKs..', '..ssssss..', '...ssss...', '.wwwttwww.', 'wwwwttwwww', 'ww.wwww.ww', '...wwww...', '...n..n...', '..kk..kk..'];
const CLERK2 = [...CLERK.slice(0, 10), '...n...n..', '..kk...kk.'];
const CLERK_C = { h: '#4a3020', s: '#f2c79a', K: '#07060c', w: '#e8fbff', t: '#3a6bff', n: '#2a2a3a', k: '#111' };
let s;

function load(i) {
  const L = LEVELS[i], walls = new Set(), bays = new Set(), crates = [];
  let px = 0, py = 0;
  const w = Math.max(...L.m.map((r) => r.length)), h = L.m.length;
  // floor = cells reachable from the clerk (so the outside of irregular rooms stays blank)
  L.m.forEach((r, y) => [...r].forEach((c, x) => {
    if (c === '#') walls.add(x + ',' + y);
    if ('.*+'.includes(c)) bays.add(x + ',' + y);
    if ('$*'.includes(c)) crates.push([x, y]);
    if ('@+'.includes(c)) { px = x; py = y; }
  }));
  const floor = new Set([px + ',' + py]), q = [[px, py]];
  while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of Object.values(DIRS)) { const k = (x + dx) + ',' + (y + dy); if (!walls.has(k) && !floor.has(k) && x + dx >= 0 && y + dy >= 0 && x + dx < w && y + dy < h) { floor.add(k); q.push([x + dx, y + dy]); } } }
  Object.assign(s, { lv: i, walls, bays, floor, crates, px, py, w, h, ox: Math.floor((240 - w * T) / 2), oy: TOP + 8 + Math.floor((256 - h * T) / 2),
    undo: [], pushes: 0, moves: 0, clear: 0, face: false, step: 0, rep: { dir: null, t: 0 }, bump: 0 });
}
const crateAt = (x, y) => s.crates.findIndex(([a, b]) => a === x && b === y);
const solved = () => s.crates.every(([x, y]) => s.bays.has(x + ',' + y));

function move(eng, dir) {
  const [dx, dy] = DIRS[dir], nx = s.px + dx, ny = s.py + dy;
  if (dx) s.face = dx < 0;
  if (s.walls.has(nx + ',' + ny)) { bump(eng); return; }
  const ci = crateAt(nx, ny);
  if (ci >= 0) {
    const bx = nx + dx, by = ny + dy;
    if (s.walls.has(bx + ',' + by) || crateAt(bx, by) >= 0) { bump(eng); return; }
    s.undo.push({ px: s.px, py: s.py, ci, cx: nx, cy: ny });
    s.crates[ci] = [bx, by]; s.pushes++;
    eng.beep(s.bays.has(bx + ',' + by) ? 880 : 260, 0.05, s.bays.has(bx + ',' + by) ? 'square' : 'triangle');
  } else { s.undo.push({ px: s.px, py: s.py, ci: -1 }); eng.beep(140, 0.015, 'triangle', 0.03); }
  s.px = nx; s.py = ny; s.moves++; s.step++; s.hours--;
  if (solved()) {
    s.clear = 100;
    const lvNum = s.lv + 1, over = Math.max(0, s.pushes - LEVELS[s.lv].par);
    s.gain = Math.max(25 * lvNum, 100 * lvNum - 10 * over); s.over = over;
    eng.score += s.gain;
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => eng.beep(f, 0.08), i * 80));
  }
}
function bump(eng) { s.bump = 6; eng.beep(90, 0.04, 'square', 0.03); }
function undo(eng) {
  const u = s.undo.pop(); if (!u) { bump(eng); return; }
  if (u.ci >= 0) { s.crates[u.ci] = [u.cx, u.cy]; s.pushes--; }
  s.px = u.px; s.py = u.py; eng.beep(500, 0.04, 'triangle', 0.04, -200);
}

const game = {
  id: 'ledger',
  reset(eng) { s = { hours: HOURS, hold: 0, holdUsed: false, writeoffs: 0, msg: null }; load(0); },
  update(eng) {
    if (s.msg && --s.msg.t <= 0) s.msg = null;
    if (s.bump) s.bump--;
    if (s.clear) {
      if (--s.clear === 0) {
        if (s.lv + 1 >= LEVELS.length) { eng.score += s.hours; eng.gameOver('BOOKS CLOSED'); return; }
        load(s.lv + 1);
      }
      return;
    }
    if (s.hours <= 0) { eng.gameOver('OUT OF HOURS'); return; }
    // act: tap = undo, hold = write-off (restart room)
    if (eng.keys.act) {
      s.hold++;
      if (s.hold >= HOLD && !s.holdUsed) {
        s.holdUsed = true; s.writeoffs++; eng.score = Math.max(0, eng.score - 50);
        load(s.lv); s.msg = { txt: 'WRITTEN OFF -50', t: 80 }; eng.beep(200, 0.2, 'sawtooth', 0.05, -100);
      }
    } else {
      if (s.hold > 0 && !s.holdUsed) undo(eng);
      s.hold = 0; s.holdUsed = false;
    }
    if (s.hold > 0) return;
    // movement: press, then auto-repeat while held
    let dir = null;
    for (const k of ['up', 'down', 'left', 'right']) if (eng.pressed[k]) dir = k;
    if (dir) { s.rep = { dir, t: 0 }; move(eng, dir); }
    else if (s.rep.dir && eng.keys[s.rep.dir]) { if (++s.rep.t > 14 && (s.rep.t - 14) % 7 === 0) move(eng, s.rep.dir); }
    else s.rep.dir = null;
    if (eng.swipe && !s.clear) move(eng, eng.swipe);
  },
  draw(eng, ctx) {
    const { text } = eng;
    // HUD
    text(ctx, `ROOM ${s.lv + 1}/${LEVELS.length}`, 4, 4, PAL.gold);
    text(ctx, String(eng.score).padStart(6, '0'), 236, 4, PAL.ink, 'right');
    text(ctx, `PUSH ${s.pushes} PAR ${LEVELS[s.lv].par}`, 4, 15, s.pushes > LEVELS[s.lv].par ? PAL.orange : PAL.cyan);
    text(ctx, `HRS ${Math.max(0, s.hours)}`, 236, 15, s.hours < 200 ? PAL.red : PAL.grey, 'right');
    ctx.fillStyle = '#2a2236'; ctx.fillRect(0, 25, 240, 1);
    const shake = s.bump ? (s.bump % 2 ? 1 : -1) : 0;
    const X = (x) => s.ox + x * T + shake, Y = (y) => s.oy + y * T;
    // floor and walls
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
      const k = x + ',' + y;
      if (s.walls.has(k)) {
        ctx.fillStyle = '#26304f'; ctx.fillRect(X(x), Y(y), T, T);
        ctx.fillStyle = '#3a4a78'; ctx.fillRect(X(x), Y(y), T, 2); ctx.fillRect(X(x), Y(y) + 10, T, 1);
        ctx.fillStyle = '#1a2038'; ctx.fillRect(X(x) + (y % 2 ? 6 : 14), Y(y) + 2, 1, 8); ctx.fillRect(X(x) + (y % 2 ? 14 : 6), Y(y) + 11, 1, 9);
      } else if (s.floor.has(k)) {
        ctx.fillStyle = (x + y) % 2 ? '#15131f' : '#1a1726'; ctx.fillRect(X(x), Y(y), T, T);
      }
      if (s.bays.has(k)) {
        ctx.strokeStyle = PAL.green; ctx.lineWidth = 1; ctx.setLineDash([2, 2]);
        ctx.strokeRect(X(x) + 3.5, Y(y) + 3.5, T - 7, T - 7); ctx.setLineDash([]);
        ctx.fillStyle = '#2f7a45'; ctx.fillRect(X(x) + 8, Y(y) + 9, 4, 2);
      }
    }
    // crates
    for (const [x, y] of s.crates) {
      const on = s.bays.has(x + ',' + y), px = X(x), py = Y(y);
      ctx.fillStyle = on ? '#2f6a3a' : '#6a4520'; ctx.fillRect(px + 1, py + 1, T - 2, T - 2);
      ctx.fillStyle = on ? '#5dbf6a' : '#b07a3c'; ctx.fillRect(px + 2, py + 2, T - 4, T - 4);
      ctx.fillStyle = on ? '#2f6a3a' : '#6a4520'; ctx.fillRect(px + 2, py + 6, T - 4, 1); ctx.fillRect(px + 2, py + 13, T - 4, 1);
      // ledger label
      ctx.fillStyle = '#f4ecd8'; ctx.fillRect(px + 6, py + 8, 8, 4);
      ctx.fillStyle = on ? '#2f6a3a' : '#a04030'; ctx.fillRect(px + 7, py + 9, 6, 1); ctx.fillRect(px + 7, py + 11, 4, 1);
    }
    // clerk
    eng.sprite(ctx, s.step % 2 ? CLERK2 : CLERK, CLERK_C, X(s.px), Y(s.py) - 4, 2, s.face);
    // footer
    const fy = 300;
    if (s.hold > 0 && !s.holdUsed) {
      text(ctx, 'HOLD TO WRITE OFF', 120, fy - 12, PAL.orange, 'center');
      ctx.fillStyle = '#3a2a1a'; ctx.fillRect(40, fy, 160, 6); ctx.fillStyle = PAL.orange; ctx.fillRect(40, fy, (160 * s.hold) / HOLD, 6);
    } else if (!s.clear) {
      text(ctx, 'A: UNDO  HOLD A: RESET', 120, fy, PAL.grey, 'center');
    }
    if (s.lv === 0 && s.moves === 0 && !s.clear) text(ctx, 'PUSH CRATES ONTO BAYS', 120, s.oy + s.h * T + 14, PAL.cyan, 'center');
    if (s.clear) {
      ctx.fillStyle = 'rgba(7,6,12,0.85)'; ctx.fillRect(10, 128, 220, 56);
      ctx.strokeStyle = PAL.green; ctx.strokeRect(10.5, 128.5, 219, 55);
      text(ctx, 'RECONCILED', 120, 136, PAL.green, 'center', 16);
      text(ctx, `+${s.gain}`, 120, 158, PAL.gold, 'center');
      text(ctx, s.over ? `${s.over} OVER PAR` : 'AT PAR', 120, 170, s.over ? PAL.orange : PAL.cyan, 'center');
    }
    if (s.msg) text(ctx, s.msg.txt, 120, 40, PAL.orange, 'center');
  },
};
boot(game);
