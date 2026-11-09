// Tax Man: a maze chase in a filing system. Original maze, characters and auditor behaviours.
import { boot, PAL } from '../engine.js';
const T = 12, OX = 6, OY = 34;
const MAZE = [
  '###################',
  '#........#........#',
  '#o##.###.#.###.##o#',
  '#.................#',
  '#.##.#.#####.#.##.#',
  '#....#...#...#....#',
  '####.###.#.###.####',
  '####.#.......#.####',
  '####.#.##-##.#.####',
  'T......#   #......T',
  '####.#.#####.#.####',
  '####.#.......#.####',
  '####.#.#####.#.####',
  '#........#........#',
  '#.##.###.#.###.##.#',
  '#o.#...........#.o#',
  '##.#.#.#####.#.#.##',
  '#....#...#...#....#',
  '#.######.#.######.#',
  '#.................#',
  '###################',
];
const MW = MAZE[0].length, MH = MAZE.length;
const DIR = { up: [0, -1], left: [-1, 0], down: [0, 1], right: [1, 0] };
const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
const HOUSE = [9, 9], DOOR = [9, 8], EXIT = [9, 7];
const P1 = ['....GGGG....', '..GGGGGGGG..', '.GGGGGGGGGG.', '...ssssss...', '..ssssssss..', '..ssKssKss..', '..ssssssss..', '...ssssss...', '..bbbWWbbb..', '..bbbWWbbb..', '...b....b...', '..kk....kk..'];
const P2 = [...P1.slice(0, 10), '...bb..bb...', '...kk..kk...'];
const AUD = ['...hhhhhh...', '..hhhhhhhh..', '..sKssssKs..', '..ssssssss..', '...ssssss...', '.gggWttWggg.', 'ggggWttWgggg', 'ggggWttWggcc', 'gggggttgggcc', '.gggggggggcc', '..gg....gg..', '..kk....kk..'];
const AUD2 = [...AUD.slice(0, 10), '...gg..gg...', '...kk..kk...'];
const EYES = ['............', '............', '..WKW..WKW..', '..WWW..WWW..', '............', '..........cc', '..........cc', '..........cc'];
const PCOL = { G: '#5dff7a', s: '#f2c79a', K: '#07060c', b: '#c58a3a', W: '#ffffff', k: '#3b2a1a' };
const TIES = ['#ff4a4a', '#3a6bff', '#5dff7a', '#ff9a3c'];
const CORNERS = [[17, 1], [1, 1], [17, 19], [1, 19]];
let s;

const wall = (x, y) => { if (x < 0 || x >= MW) return y !== 9; const c = MAZE[y]?.[x]; return c === '#' || c === undefined; };
const open = (x, y, door = false) => !wall(x, y) && (door || MAZE[y][((x % MW) + MW) % MW] !== '-');
const wrap = (x) => (x < 0 ? MW - 1 : x >= MW ? 0 : x);
const dist = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

function freshLevel(keepScore) {
  s.dots = new Set(); s.power = new Set();
  MAZE.forEach((r, y) => [...r].forEach((c, x) => { if (c === '.') s.dots.add(x + ',' + y); if (c === 'o') s.power.add(x + ',' + y); }));
  s.total = s.dots.size + s.power.size;
  resetActors();
}
function resetActors() {
  s.p = { x: 9, y: 15, dir: 'left', want: 'left', prog: 0, moving: true };
  s.a = [0, 1, 2, 3].map((i) => ({ i, x: i === 0 ? 9 : 8 + (i - 1), y: i === 0 ? 7 : 9, dir: i === 0 ? 'left' : 'up', prog: 0, mode: i === 0 ? 'roam' : 'house', wait: [0, 120, 300, 480][i], fright: 0 }));
  s.ready = 120; s.mode = 'scatter'; s.modeT = 0; s.fright = 0; s.chain = 0;
}
function choose(a, target, allowDoor) {
  const opts = Object.keys(DIR).filter((d) => d !== OPP[a.dir] && open(wrap(a.x + DIR[d][0]), a.y + DIR[d][1], allowDoor));
  if (!opts.length) return OPP[a.dir];
  if (!target) return opts[Math.floor(Math.random() * opts.length)];
  return opts.sort((d1, d2) => dist([a.x + DIR[d1][0], a.y + DIR[d1][1]], target) - dist([a.x + DIR[d2][0], a.y + DIR[d2][1]], target))[0];
}
function auditorTarget(a) {
  const p = [s.p.x, s.p.y], [dx, dy] = DIR[s.p.dir];
  if (a.mode === 'eaten') return HOUSE;
  if (a.mode === 'out') return EXIT;
  if (s.mode === 'scatter') return CORNERS[a.i];
  switch (a.i) {
    case 0: return p;                                   // the senior auditor: straight at you
    case 1: return [p[0] + dx * 3, p[1] + dy * 3];      // reads ahead in the file
    case 2: return CORNERS[Math.floor(s.t / 420) % 4];  // works the building floor by floor
    default: return Math.random() < 0.5 ? p : null;     // new hire: half chasing, half lost
  }
}
function stepActor(a, speed, isPlayer, eng) {
  if (isPlayer && !a.moving) {
    if (open(wrap(a.x + DIR[a.want][0]), a.y + DIR[a.want][1])) { a.dir = a.want; a.moving = true; } else return;
  }
  if (isPlayer && a.want === OPP[a.dir] && a.prog > 0) {           // instant reverse mid-corridor
    a.x = wrap(a.x + DIR[a.dir][0]); a.y += DIR[a.dir][1]; a.prog = T - a.prog; a.dir = a.want;
  }
  a.prog += speed;
  while (a.prog >= T) {
    a.prog -= T; a.x = wrap(a.x + DIR[a.dir][0]); a.y += DIR[a.dir][1];
    if (isPlayer) {
      eat(a.x, a.y, eng);
      if (open(wrap(a.x + DIR[a.want][0]), a.y + DIR[a.want][1])) a.dir = a.want;
      if (!open(wrap(a.x + DIR[a.dir][0]), a.y + DIR[a.dir][1])) { a.moving = false; a.prog = 0; break; }
    } else arrive(a);
  }
}
function arrive(a) {
  if (a.mode === 'eaten' && a.x === HOUSE[0] && a.y === HOUSE[1]) { a.mode = 'out'; a.fright = 0; }
  if (a.mode === 'out' && a.x === EXIT[0] && a.y === EXIT[1]) a.mode = 'roam';
  const door = a.mode === 'eaten' || a.mode === 'out';
  a.dir = choose(a, a.fright ? null : auditorTarget(a), door);
}
function eat(x, y, eng) {
  const k = x + ',' + y;
  if (s.dots.delete(k)) { eng.score += 10; if ((s.dots.size & 1) === 0) eng.beep(520, 0.03, 'square', 0.03); }
  if (s.power.delete(k)) {
    eng.score += 50; s.chain = 0; s.fright = Math.max(180, 420 - s.level * 40);
    s.a.forEach((a) => { if (a.mode === 'roam') { a.fright = 1; a.dir = OPP[a.dir]; } });
    eng.beep(300, 0.25, 'triangle', 0.06, 400);
  }
}

const game = {
  id: 'taxman',
  reset(eng) { s = { level: 1, lives: 3, t: 0, pops: [], dying: 0 }; freshLevel(); },
  update(eng) {
    s.t++;
    for (const d of Object.keys(DIR)) if (eng.pressed[d] || eng.keys[d]) s.p.want = d;
    if (eng.swipe) s.p.want = eng.swipe;
    s.pops.forEach((p) => p.l--); s.pops = s.pops.filter((p) => p.l > 0);
    if (s.dying) {
      if (--s.dying === 0) { if (s.lives <= 0) { eng.gameOver('AUDITED'); return; } resetActors(); }
      return;
    }
    if (s.ready) { s.ready--; return; }
    // scatter ("lunch break") and chase phases
    if (!s.fright) { s.modeT++; const len = s.mode === 'scatter' ? 420 : 1200; if (s.modeT > len) { s.modeT = 0; s.mode = s.mode === 'scatter' ? 'chase' : 'scatter'; s.a.forEach((a) => { if (a.mode === 'roam') a.dir = OPP[a.dir]; }); } }
    if (s.fright && --s.fright === 0) s.a.forEach((a) => (a.fright = 0));
    const lv = Math.min(s.level - 1, 6);
    stepActor(s.p, 1.0 + lv * 0.07, true, eng);
    for (const a of s.a) {
      if (a.mode === 'house') { if (--a.wait <= 0) { a.mode = 'out'; a.x = 9; a.y = 9; a.prog = 0; a.dir = 'up'; } continue; }
      const sp = a.mode === 'eaten' ? 2.4 : a.fright ? 0.55 : 0.88 + lv * 0.07;
      stepActor(a, sp, false, eng);
    }
    // collisions in pixel space
    const pp = pos(s.p);
    for (const a of s.a) {
      if (a.mode === 'house' || a.mode === 'eaten') continue;
      const ap = pos(a);
      if (Math.abs(ap[0] - pp[0]) < 8 && Math.abs(ap[1] - pp[1]) < 8) {
        if (a.fright) { a.mode = 'eaten'; a.fright = 0; s.chain++; const pts = 100 * 2 ** s.chain; eng.score += pts; s.pops.push({ x: ap[0], y: ap[1], txt: String(pts), l: 50 }); eng.beep(1200, 0.12, 'square', 0.05, 600); }
        else { s.lives--; s.dying = 90; eng.beep(400, 0.8, 'sawtooth', 0.05, -350); return; }
      }
    }
    if (!s.dots.size && !s.power.size) { s.level++; eng.score += 1000; s.pops.push({ x: 120, y: 160, txt: 'FILED', l: 90 }); freshLevel(); eng.beep(660, 0.1); eng.beep(880, 0.1); eng.beep(1100, 0.2); }
  },
  draw(eng, ctx) {
    const { text, sprite } = eng;
    text(ctx, String(eng.score).padStart(6, '0'), 6, 6, PAL.ink);
    text(ctx, `FLOOR ${s.level}`, 120, 6, PAL.gold, 'center');
    for (let i = 0; i < s.lives; i++) sprite(ctx, P1, PCOL, 222 - i * 14, 3);
    text(ctx, s.fright ? 'DEDUCTION' : s.mode === 'scatter' ? 'LUNCH BREAK' : 'AUDIT IN PROGRESS', 120, 19, s.fright ? PAL.cyan : PAL.grey, 'center');
    // filing cabinets
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const c = MAZE[y][x], px = OX + x * T, py = OY + y * T;
      if (c === '#') {
        ctx.fillStyle = '#1d2747'; ctx.fillRect(px, py, T, T);
        ctx.fillStyle = '#3a4a7c';
        if (!wall(x, y - 1)) ctx.fillRect(px, py, T, 1);
        if (!wall(x - 1, y)) ctx.fillRect(px, py, 1, T);
        if (!wall(x + 1, y)) ctx.fillRect(px + T - 1, py, 1, T);
        if (!wall(x, y + 1)) { ctx.fillRect(px, py + T - 1, T, 1); ctx.fillStyle = '#c9a24a'; ctx.fillRect(px + 4, py + 6, 4, 1); }
      } else if (c === '-') { ctx.fillStyle = '#ff9ad5'; ctx.fillRect(px, py + 5, T, 2); }
    }
    // receipts and deductions
    ctx.fillStyle = '#e8fbff';
    for (const k of s.dots) { const [x, y] = k.split(',').map(Number); ctx.fillRect(OX + x * T + 5, OY + y * T + 4, 2, 4); }
    for (const k of s.power) {
      if ((s.t >> 4) & 1) continue;
      const [x, y] = k.split(',').map(Number), px = OX + x * T + 2, py = OY + y * T + 1;
      ctx.fillStyle = PAL.gold; ctx.fillRect(px, py, 8, 10); ctx.fillStyle = '#a8730f'; ctx.fillRect(px + 2, py + 3, 4, 1); ctx.fillRect(px + 2, py + 6, 4, 1);
    }
    // auditors
    for (const a of s.a) {
      const [x, y] = pos(a), fr = (s.t >> 3) & 1;
      if (a.mode === 'eaten') { sprite(ctx, EYES, { W: '#fff', K: '#07060c', c: '#c9a24a' }, x - 6, y - 6); continue; }
      const blink = s.fright && s.fright < 100 && (s.t >> 3) & 1;
      const col = a.fright ? { h: '#1b2a6b', s: blink ? '#ffffff' : '#9fb4ff', K: '#ffffff', g: blink ? '#ffffff' : '#2f4bd6', W: '#9fb4ff', t: '#9fb4ff', c: '#ffffff', k: '#07060c' }
        : { h: '#2a2a2a', s: '#e9c19a', K: '#07060c', g: '#7d8597', W: '#ffffff', t: TIES[a.i], c: '#c9a24a', k: '#07060c' };
      sprite(ctx, fr ? AUD2 : AUD, col, x - 6, y - 6);
    }
    // player
    if (!s.dying || (s.dying >> 2) & 1) { const [x, y] = pos(s.p); sprite(ctx, (s.t >> 3) & 1 && s.p.moving ? P2 : P1, PCOL, x - 6, y - 6, 1, s.p.dir === 'left'); }
    for (const p of s.pops) text(ctx, p.txt, p.x, p.y - 4, PAL.cyan, 'center');
    if (s.ready && eng.state === 'play') text(ctx, s.level === 1 ? 'AUDIT BEGINS' : 'NEXT FLOOR', 120, OY + 11 * T + 2, PAL.gold, 'center');
  },
};
function pos(a) { const [dx, dy] = DIR[a.dir]; return [OX + a.x * T + T / 2 + dx * a.prog, OY + a.y * T + T / 2 + dy * a.prog]; }
boot(game);
