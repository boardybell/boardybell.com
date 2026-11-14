// Crossing Wall Street: a lane-crossing game. Hop a junior analyst over six lanes of traffic and a canal to the cafe.
import { boot, PAL } from '../engine.js';
const T = 16, COLS = 15, Y0 = 48, START = 13, CANAL = [1, 5], ROAD = [7, 12], HOP = 7, TIME = 1800, LOOP = 336;
const SLOTS = [1, 4, 7, 10, 13];
// lane: row, kind, direction, base speed, pieces [x, length in px]
const LANES = [
  { row: 12, kind: 'taxi', dir: -1, sp: 0.55, at: [[0, 26], [112, 26], [224, 26]] },
  { row: 11, kind: 'bike', dir: 1, sp: 1.2, at: [[0, 14], [150, 14]] },
  { row: 10, kind: 'bus', dir: -1, sp: 0.45, at: [[20, 58], [190, 58]] },
  { row: 9, kind: 'taxi', dir: 1, sp: 0.85, at: [[0, 26], [80, 26], [200, 26]] },
  { row: 8, kind: 'bike', dir: -1, sp: 1.6, at: [[40, 14], [130, 14], [250, 14]] },
  { row: 7, kind: 'mix', dir: 1, sp: 0.7, at: [[0, 58], [150, 26], [250, 26]] },
  { row: 5, kind: 'barge', dir: -1, sp: 0.5, at: [[0, 64], [150, 64], [260, 48]] },
  { row: 4, kind: 'crate', dir: 1, sp: 0.7, at: [[0, 32], [90, 32], [190, 32], [270, 32]] },
  { row: 3, kind: 'barge', dir: -1, sp: 0.5, at: [[10, 80], [170, 80]] },
  { row: 2, kind: 'crate', dir: 1, sp: 0.9, at: [[0, 48], [120, 48], [230, 48]] },
  { row: 1, kind: 'barge', dir: -1, sp: 0.65, at: [[30, 96], [200, 64]] },
];
const ANALYST = ['...hhhhhh...', '..hhhhhhhh..', '..hssssssh..', '..sKssssKs..', '...ssssss...', '..wwwbbwww..', '.wwwwbbwwww.', '.swwwbbwwws.', '.swwwwwwwws.', '...nnnnnn...', '...nn..nn...', '...kk..kk...'];
const ACOL = { h: '#3b2a1a', s: '#f2c79a', K: '#07060c', w: '#e8fbff', b: '#3a6bff', n: '#2b3566', k: '#07060c' };
let s;

function setLevel(level) {
  const f = 1 + (level - 1) * 0.18;
  s.lanes = LANES.map((L) => ({ row: L.row, kind: L.kind, v: L.dir * L.sp * f, items: L.at.map(([x, w], i) => ({ x, w, alt: i })) }));
}
function resetPlayer() { s.p = { x: 7 * T, row: START, hop: 0, fx: 0, frow: 0, next: null, best: START, dead: 0, why: '' }; s.time = TIME; }
const laneFor = (row) => { for (const L of s.lanes) if (L.row === row) return L; return null; };
const isCanal = (r) => r >= CANAL[0] && r <= CANAL[1];
const isRoad = (r) => r >= ROAD[0] && r <= ROAD[1];

function tryHop(eng, dir) {
  const p = s.p; let x = p.x, row = p.row;
  if (dir === 'up') row--; else if (dir === 'down') row++; else if (dir === 'left') x -= T; else x += T;
  if (row > START || x < 0 || x > (COLS - 1) * T) return;
  if (row === 0) {
    const i = SLOTS.findIndex((c) => Math.abs(c * T - x) < 9);
    if (i < 0 || s.filled[i]) { eng.beep(110, 0.05, 'square', 0.03); return; }
    x = SLOTS[i] * T;
  }
  if (!isCanal(row)) x = Math.round(x / T) * T;
  p.fx = p.x; p.frow = p.row; p.x = x; p.row = row; p.hop = HOP;
  eng.beep(dir === 'up' ? 700 : 560, 0.03, 'square', 0.03);
}
function die(eng, why) {
  if (eng.god) { if (why === 'OUT OF TIME') s.time = TIME; return; } // god mode: traffic, water and the clock cannot stop you
  s.p.dead = 70; s.p.why = why; s.lives--; eng.beep(180, 0.5, 'sawtooth', 0.05, -120); }

const game = {
  id: 'crossing',
  reset() { s = { level: 1, lives: 3, filled: [0, 0, 0, 0, 0], t: 0, msg: 'GET COFFEE', msgT: 90 }; setLevel(1); resetPlayer(); },
  update(eng) {
    s.t++;
    if (s.msgT) s.msgT--;
    // traffic and barges
    for (const L of s.lanes) for (const it of L.items) {
      it.x += L.v;
      if (L.v > 0 && it.x > 240) it.x -= LOOP; else if (L.v < 0 && it.x + it.w < 0) it.x += LOOP;
    }
    const p = s.p;
    if (p.dead) { if (--p.dead === 0) { if (s.lives <= 0) { eng.gameOver('COFFEE GOT COLD'); return; } resetPlayer(); } return; }
    // input (one hop at a time, one buffered)
    let want = null;
    for (const d of ['up', 'down', 'left', 'right']) if (eng.pressed[d]) want = d;
    if (eng.swipe) want = eng.swipe;
    if (want) { if (p.hop) p.next = want; else tryHop(eng, want); }
    if (p.hop) {
      if (--p.hop === 0) {
        if (p.row < p.best) { eng.score += 10 * (p.best - p.row); p.best = p.row; }
        if (p.row === 0) {
          const i = SLOTS.indexOf(p.x / T); s.filled[i] = 1;
          const bonus = 200 + Math.floor(s.time / 60) * 10; eng.score += bonus; s.msg = 'SEATED +' + bonus; s.msgT = 70;
          eng.beep(880, 0.08); eng.beep(1175, 0.12);
          if (s.filled.every(Boolean)) {
            s.level++; s.filled = [0, 0, 0, 0, 0]; eng.score += 1000; setLevel(s.level); s.msg = 'MARKET OPENS ' + s.level; s.msgT = 120;
            eng.beep(660, 0.1); eng.beep(990, 0.2);
          }
          resetPlayer(); return;
        }
        if (p.next) { const n = p.next; p.next = null; tryHop(eng, n); }
      }
    }
    // riding the canal
    const landed = !p.hop || p.hop < HOP / 2;
    if (isCanal(p.row) && landed) {
      const L = laneFor(p.row), cx = p.x + T / 2;
      let on = false;
      for (const it of L.items) if (cx > it.x + 1 && cx < it.x + it.w - 1) { on = true; break; }
      if (!on && !p.hop && !eng.god) { die(eng, 'SPLASH'); return; }
      if (on) { p.x += L.v; if (p.hop) p.fx += L.v; }
      if (p.x < -6 || p.x > 240 - T + 6) { if (eng.god) p.x = Math.max(-6, Math.min(240 - T + 6, p.x)); else { die(eng, 'SWEPT AWAY'); return; } }
    }
    // traffic
    const row = p.hop ? (p.hop > HOP / 2 ? p.frow : p.row) : p.row;
    if (isRoad(row)) {
      const L = laneFor(row), px = p.hop ? p.fx + (p.x - p.fx) * (1 - p.hop / HOP) : p.x;
      for (const it of L.items) if (px + 13 > it.x + 1 && px + 3 < it.x + it.w - 1) { die(eng, L.kind === 'bike' || (L.kind === 'mix' && it.w < 20) ? 'COURIERED' : 'HIT BY TRAFFIC'); return; }
    }
    if (--s.time <= 0) die(eng, 'OUT OF TIME');
  },
  draw(eng, ctx) {
    const { text, sprite } = eng;
    // terrace with awning
    for (let x = 0; x < 240; x += 16) { ctx.fillStyle = (x / 16) & 1 ? '#e8fbff' : PAL.red; ctx.fillRect(x, 30, 16, 8); }
    ctx.fillStyle = '#e8fbff'; for (let x = 0; x < 240; x += 16) ctx.fillRect(x + 4, 38, 8, 3);
    ctx.fillStyle = '#1f4a33'; ctx.fillRect(0, Y0, 240, T);
    ctx.fillStyle = '#2e6b45'; for (let x = 0; x < 240; x += 6) ctx.fillRect(x, Y0 + 2 + (x % 4), 4, 3);
    SLOTS.forEach((c, i) => {
      const x = c * T;
      ctx.fillStyle = '#5a3a20'; ctx.fillRect(x - 2, Y0, T + 4, T);
      ctx.fillStyle = '#e0c088'; ctx.fillRect(x + 2, Y0 + 3, 12, 9); ctx.fillStyle = '#c58a3a'; ctx.fillRect(x + 2, Y0 + 11, 12, 1);
      if (s.filled[i]) { sprite(ctx, ANALYST, ACOL, x + 2, Y0 + 2); ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 11, Y0 + 9, 4, 4); ctx.fillStyle = '#3b2a1a'; ctx.fillRect(x + 12, Y0 + 9, 2, 1); }
      else { ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 6, Y0 + 5, 4, 4); ctx.fillStyle = '#3b2a1a'; ctx.fillRect(x + 7, Y0 + 5, 2, 1); }
    });
    // canal
    ctx.fillStyle = '#123a6b'; ctx.fillRect(0, Y0 + T, 240, T * 5);
    ctx.fillStyle = '#1d5291';
    for (let r = 1; r <= 5; r++) for (let x = ((s.t >> 2) + r * 13) % 30 - 30; x < 240; x += 30) ctx.fillRect(x, Y0 + r * T + 6 + (r & 1) * 4, 8, 1);
    // median quay
    ctx.fillStyle = '#5a6380'; ctx.fillRect(0, Y0 + 6 * T, 240, T); ctx.fillStyle = '#8a90a2'; ctx.fillRect(0, Y0 + 6 * T, 240, 2);
    ctx.fillStyle = '#4a5270'; for (let x = 0; x < 240; x += 16) ctx.fillRect(x, Y0 + 6 * T + 2, 1, T - 2);
    // road
    ctx.fillStyle = '#1c1c24'; ctx.fillRect(0, Y0 + 7 * T, 240, 6 * T);
    ctx.fillStyle = '#5a5a66'; for (let r = 8; r <= 12; r++) for (let x = 0; x < 240; x += 24) ctx.fillRect(x + 4, Y0 + r * T, 12, 1);
    ctx.fillStyle = PAL.gold; ctx.fillRect(0, Y0 + 10 * T - 1, 240, 1); ctx.fillRect(0, Y0 + 10 * T + 1, 240, 1);
    // start kerb
    ctx.fillStyle = '#8a90a2'; ctx.fillRect(0, Y0 + START * T, 240, T); ctx.fillStyle = '#c3c8d6'; ctx.fillRect(0, Y0 + START * T, 240, 2);
    ctx.fillStyle = '#6a7088'; for (let x = 0; x < 240; x += 16) ctx.fillRect(x, Y0 + START * T + 2, 1, T - 2);
    // lane contents
    for (const L of s.lanes) {
      const y = Y0 + L.row * T;
      for (const it of L.items) {
        if (it.x > 240 || it.x + it.w < 0) continue;
        const kind = L.kind === 'mix' ? (it.w > 30 ? 'bus' : 'taxi') : L.kind;
        drawThing(ctx, kind, it.x, y, it.w, L.v > 0, it.alt);
      }
    }
    // analyst
    const p = s.p;
    let px = p.x, py = Y0 + p.row * T;
    if (p.hop) { const k = 1 - p.hop / HOP; px = p.fx + (p.x - p.fx) * k; py = Y0 + (p.frow + (p.row - p.frow) * k) * T - Math.sin(k * Math.PI) * 4; }
    if (p.dead) {
      const k = (70 - p.dead) / 70, cx = px + 8, cy = py + 8;
      if (p.why === 'SPLASH') { ctx.strokeStyle = PAL.cyan; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, 2 + k * 9, 0, 6.2832); ctx.stroke(); }
      else { ctx.fillStyle = '#e8fbff'; for (let i = 0; i < 6; i++) ctx.fillRect(cx + Math.cos(i * 1.05) * k * 12 - 2, cy + Math.sin(i * 1.05) * k * 12 - 1, 4, 3); }
      text(ctx, p.why, 120, Y0 + 7 * T - 12, PAL.gold, 'center');
    } else sprite(ctx, ANALYST, ACOL, px + 2, py + 2);
    // timer
    const f = s.time / TIME;
    text(ctx, 'TIME', 4, 282, PAL.grey);
    ctx.fillStyle = '#2b3566'; ctx.fillRect(40, 283, 196, 6); ctx.fillStyle = f < 0.25 ? PAL.red : f < 0.5 ? PAL.gold : PAL.green; ctx.fillRect(40, 283, 196 * f, 6);
    text(ctx, 'COFFEE IS AT THE TOP', 120, 302, '#3b4470', 'center');
    // HUD
    text(ctx, String(eng.score).padStart(6, '0'), 4, 4, PAL.ink);
    text(ctx, 'LEVEL ' + s.level, 120, 4, PAL.gold, 'center');
    for (let i = 0; i < s.lives; i++) sprite(ctx, ANALYST, ACOL, 224 - i * 14, 2);
    text(ctx, 'TABLES ' + s.filled.filter(Boolean).length + '/5', 4, 16, PAL.grey);
    if (s.msgT && eng.state === 'play' && !p.dead) { ctx.fillStyle = 'rgba(7,6,12,.8)'; ctx.fillRect(30, Y0 + 6 * T + 2, 180, 12); text(ctx, s.msg, 120, Y0 + 6 * T + 4, PAL.gold, 'center'); }
  },
};

function drawThing(ctx, kind, x, y, w, right, alt) {
  if (kind === 'taxi') {
    ctx.fillStyle = '#07060c'; ctx.fillRect(x + 3, y + 1, 5, 14); ctx.fillRect(x + w - 8, y + 1, 5, 14);
    ctx.fillStyle = PAL.gold; ctx.fillRect(x, y + 3, w, 10);
    ctx.fillStyle = '#7df9ff'; ctx.fillRect(right ? x + w - 9 : x + 5, y + 4, 4, 8);
    ctx.fillStyle = '#07060c'; for (let i = 2; i < w - 2; i += 4) ctx.fillRect(x + i, y + 7, 2, 2);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(right ? x + w - 1 : x, y + 4, 1, 2); ctx.fillRect(right ? x + w - 1 : x, y + 10, 1, 2);
  } else if (kind === 'bus') {
    ctx.fillStyle = alt & 1 ? PAL.blue : PAL.red; ctx.fillRect(x, y + 1, w, 14);
    ctx.fillStyle = '#e8fbff'; ctx.fillRect(x + 2, y + 3, w - 4, 2); ctx.fillRect(x + 2, y + 11, w - 4, 2);
    ctx.fillStyle = '#7df9ff'; ctx.fillRect(right ? x + w - 4 : x + 1, y + 2, 3, 12);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; for (let i = 8; i < w - 6; i += 12) ctx.fillRect(x + i, y + 6, 6, 4);
  } else if (kind === 'bike') {
    ctx.fillStyle = '#5a6380'; ctx.fillRect(x, y + 7, w, 2);
    ctx.fillStyle = '#07060c'; ctx.fillRect(x, y + 6, 3, 4); ctx.fillRect(x + w - 3, y + 6, 3, 4);
    ctx.fillStyle = alt & 1 ? PAL.green : PAL.orange; ctx.fillRect(x + 4, y + 3, 6, 6);
    ctx.fillStyle = '#f2c79a'; ctx.fillRect(right ? x + 9 : x + 2, y + 4, 3, 3);
  } else if (kind === 'barge') {
    ctx.fillStyle = '#3b2a1a'; ctx.fillRect(x, y + 2, w, 12); ctx.fillStyle = '#5a3a20'; ctx.fillRect(x + 2, y + 3, w - 4, 10);
    ctx.fillStyle = '#7a5530'; for (let i = 4; i < w - 4; i += 8) ctx.fillRect(x + i, y + 4, 1, 8);
    ctx.fillStyle = '#c3c8d6'; ctx.fillRect(right ? x : x + w - 3, y + 4, 3, 8);
  } else if (kind === 'crate') {
    for (let i = 0; i + 14 <= w; i += 16) {
      ctx.fillStyle = '#c58a3a'; ctx.fillRect(x + i + 1, y + 1, 14, 14); ctx.fillStyle = '#8a5a1f';
      ctx.fillRect(x + i + 1, y + 1, 14, 1); ctx.fillRect(x + i + 1, y + 14, 14, 1); ctx.fillRect(x + i + 7, y + 1, 2, 14);
    }
  }
}

boot(game);
