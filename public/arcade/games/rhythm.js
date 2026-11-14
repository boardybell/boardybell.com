// Market Timing: a rhythm game. Applaud the green BUY candles as they cross the beat line;
// let the red SELL candles pass in silence. A recital lasts thirty seconds; five mistakes in one
// recital ends the evening. Each recital is a little brisker than the last.
import { boot, PAL } from '../engine.js';
const VEL = '#5a1230', VEL2 = '#3a0b1f', GOLD = '#ffb238', CREAM = '#ffe9a8', BRASS = '#c9a15a', SILVER = '#c8ccd8';
const LINE = 236, TOP = 38, RECITAL = 1800, WIN = 9, MAXMISS = 5, LANE = 120;
const SCALE = [262, 294, 330, 392, 440, 392, 330, 294, 330, 392, 523, 440];
const BUY = ['#5dff7a', '#1f8a3a', '#c8ffd0'], SELL = ['#ff4a4a', '#8a1a1a', '#ffc0b8'];
const GLOVE = ['..w.w...', '.wwwww..', '.wwwww.w', '.wwwwwww', '.wwwwww.', '..wwww..', '..gggg..', '..gggg..'];
const GLOVE_C = { w: '#f4f0e6', g: BRASS };
let s;

const period = () => 3600 / s.bpm;
const beatAt = (i) => s.t0 + i * period();
const lead = () => Math.max(66, 104 - s.r * 6);
const yOf = (hit) => LINE - ((hit - s.t) / lead()) * (LINE - TOP);

function startRecital(r) {
  Object.assign(s, { r, bpm: Math.min(168, 84 + (r - 1) * 14), t: 0, t0: 120, next: 0, notes: [], miss: 0, combo: 0, phase: 'play', timer: 0, prevOff: false, lastBeat: -1, banner: 110 });
}
function schedule(i) {
  const hit = beatAt(i), p = period();
  const trayP = Math.min(0.38, 0.12 + s.r * 0.06), offP = Math.min(0.45, (s.r - 1) * 0.12);
  let kind = i < 3 ? 'crest' : Math.random() < 0.84 ? (s.prevOff || Math.random() >= trayP ? 'crest' : 'tray') : null;
  if (kind) s.notes.push({ hit, kind, done: 0, ...candle() });
  s.prevOff = false;
  if (i >= 3 && kind !== 'tray' && Math.random() < offP && beatAt(i + 1) < RECITAL) { s.notes.push({ hit: hit + p / 2, kind: 'crest', done: 0, ...candle() }); s.prevOff = true; }
}
const candle = () => ({ bh: 10 + ((Math.random() * 10) | 0), wt: 3 + ((Math.random() * 6) | 0), wb: 3 + ((Math.random() * 6) | 0), px: (Math.random() - 0.5) * 30 });
const pop = (txt, c) => s.pops.push({ txt, c, t: 40 });
function mistake(eng, txt) {
  s.combo = 0; s.shake = 8; pop(txt, PAL.red); eng.beep(140, 0.2, 'sawtooth', 0.05, -50);
  if (++s.miss >= MAXMISS) { s.phase = 'dead'; s.timer = 70; }
}
function judge(eng, n, d) {
  n.done = 1; n.dt = s.t;
  const [g, base, c] = d <= 3 ? ['SPLENDID', 300, PAL.green] : d <= 6 ? ['QUITE GOOD', 150, CREAM] : ['ADEQUATE', 60, BRASS];
  s.combo++; s.best = Math.max(s.best, s.combo);
  eng.score += base * s.r + Math.min(s.combo, 30) * 5;
  pop(g, c); s.ring = 12;
  eng.beep(SCALE[s.mel++ % SCALE.length] * 2, 0.12, 'triangle', 0.05);
}

const game = {
  id: 'rhythm', tapIsAct: true,
  reset() { s = { pops: [], mel: 0, best: 0, shake: 0, clap: 0, pulse: 0, ring: 0 }; startRecital(1); },
  update(eng) {
    for (const p of s.pops) p.t--;
    s.pops = s.pops.filter((p) => p.t > 0);
    if (s.shake) s.shake--; if (s.clap) s.clap--; if (s.pulse) s.pulse--; if (s.ring) s.ring--; if (s.banner) s.banner--;
    if (s.phase === 'dead') { if (--s.timer <= 0) eng.gameOver('APPLAUSE WITHDRAWN'); return; }
    if (s.phase === 'interval') { if (--s.timer <= 0) startRecital(s.r + 1); return; }
    s.t++;
    const p = period(), bi = Math.floor((s.t - s.t0) / p);
    if (s.t >= s.t0 && bi !== s.lastBeat && beatAt(bi) <= RECITAL) {
      s.lastBeat = bi; s.pulse = 10;
      eng.beep(bi % 4 ? 1760 : 2200, 0.02, 'square', 0.015);
      if (bi % 2 === 0) eng.beep(SCALE[(bi >> 1) % 4] / 2, 0.18, 'triangle', 0.03);
    }
    while (beatAt(s.next) < RECITAL && beatAt(s.next) - s.t < lead()) schedule(s.next++);
    // applause
    if (eng.pressed.act) {
      s.clap = 8;
      let best = null, bd = 1e9;
      for (const n of s.notes) if (!n.done) { const d = Math.abs(n.hit - s.t); if (d < bd) { bd = d; best = n; } }
      if (best && bd <= WIN) {
        if (best.kind === 'crest') judge(eng, best, bd);
        else { best.done = 1; best.dt = s.t; best.clapped = 1; if (eng.god) pop('STRUCK FROM RECORD', SILVER); else mistake(eng, 'APPLAUDED A SELL'); }
      } else if (eng.god) pop('CORRECTED', SILVER); // god mode: stray applause is quietly ignored
      else mistake(eng, 'UNSCHEDULED');
    }
    // notes that passed the line
    for (const n of s.notes) {
      if (n.done || s.t - n.hit <= WIN) continue;
      if (n.kind === 'crest') {
        if (eng.god) { n.done = 1; n.dt = s.t; s.combo++; eng.score += 50 * s.r; pop('CORRECTED', SILVER); s.ring = 12; } // god mode: the miss is applauded on your behalf
        else { n.done = 1; n.dt = s.t; n.missed = 1; mistake(eng, 'CUE MISSED'); }
      } else { n.done = 1; n.dt = s.t; n.passed = 1; eng.score += 20 * s.r; pop('DISCREET', BRASS); }
      if (s.phase === 'dead') return;
    }
    s.notes = s.notes.filter((n) => !n.done || s.t - n.dt < 18);
    if (s.t > RECITAL + 30 && s.notes.every((n) => n.done)) {
      s.bonus = (MAXMISS - s.miss) * 250 * s.r; eng.score += s.bonus;
      s.phase = 'interval'; s.timer = 150; eng.beep(523, 0.12); eng.beep(659, 0.12); eng.beep(784, 0.3, 'triangle');
    }
  },
  draw(eng, ctx) {
    const { text } = eng, ox = s.shake ? (s.shake & 2 ? 2 : -2) : 0;
    // velvet curtain
    for (let x = 0; x < 240; x += 16) { ctx.fillStyle = VEL; ctx.fillRect(x, 26, 10, 270); ctx.fillStyle = VEL2; ctx.fillRect(x + 10, 26, 6, 270); ctx.fillStyle = '#7a1a40'; ctx.fillRect(x + 3, 26, 2, 270); }
    ctx.fillStyle = GOLD; for (let x = 0; x < 240; x += 6) ctx.fillRect(x, 30, 4, 4 + ((x / 6) & 1) * 3);
    // stage floor
    ctx.fillStyle = '#2a1408'; ctx.fillRect(0, 262, 240, 58); ctx.fillStyle = '#4a2810'; for (let y = 268; y < 320; y += 8) ctx.fillRect(0, y, 240, 1);
    ctx.fillStyle = BRASS; ctx.fillRect(0, 262, 240, 2);
    // lane
    ctx.save(); ctx.translate(ox, 0);
    ctx.fillStyle = 'rgba(7,6,12,0.82)'; ctx.fillRect(LANE - 24, TOP, 48, LINE - TOP + 18);
    ctx.fillStyle = BRASS; ctx.fillRect(LANE - 26, TOP, 2, LINE - TOP + 18); ctx.fillRect(LANE + 24, TOP, 2, LINE - TOP + 18);
    // beat grid sliding down the lane
    if (s.phase === 'play') for (let i = Math.max(0, s.lastBeat - 1); i < s.lastBeat + 6; i++) {
      const y = yOf(beatAt(i)); if (y < TOP || y > LINE + 16 || beatAt(i) > RECITAL) continue;
      ctx.fillStyle = i % 4 ? 'rgba(201,161,90,0.35)' : 'rgba(255,233,168,0.6)'; ctx.fillRect(LANE - 24, Math.round(y), 48, 1);
    }
    // beat line, pulsing on every beat
    const pl = s.pulse / 10;
    ctx.fillStyle = s.ring ? PAL.green : pl > 0.4 ? CREAM : GOLD; ctx.fillRect(0, LINE - 1 - Math.round(pl * 2), 240, 3 + Math.round(pl * 4));
    ctx.fillStyle = VEL2; ctx.fillRect(LANE - 14, LINE - 6, 2, 13); ctx.fillRect(LANE + 12, LINE - 6, 2, 13);
    // price line traced through the candles
    const live = s.notes.filter((n) => yOf(n.hit) > TOP - 10).sort((a, b) => a.hit - b.hit);
    if (live.length > 1) { ctx.strokeStyle = 'rgba(255,233,168,0.45)'; ctx.lineWidth = 1; ctx.beginPath(); live.forEach((n, i) => { const x = LANE + n.px, y = Math.min(LINE + 16, yOf(n.hit)); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); }
    // notes
    for (const n of s.notes) {
      let y = yOf(n.hit); if (y < TOP - 22) continue;
      if (n.done && !n.missed && !n.passed) { ctx.globalAlpha = Math.max(0, 1 - (s.t - n.dt) / 18); y = LINE - (s.t - n.dt); }
      else if (n.done) ctx.globalAlpha = Math.max(0, 1 - (s.t - n.dt) / 18);
      const [c0, c1, c2] = n.kind === 'crest' ? BUY : SELL, yy = Math.round(y);
      ctx.fillStyle = c1; ctx.fillRect(LANE - 1, yy - n.bh / 2 - n.wt, 3, n.bh + n.wt + n.wb);
      ctx.fillStyle = c1; ctx.fillRect(LANE - 9, yy - n.bh / 2, 18, n.bh); ctx.fillStyle = c0; ctx.fillRect(LANE - 8, yy - n.bh / 2 + 1, 16, n.bh - 2);
      ctx.fillStyle = c2; ctx.fillRect(LANE - 7, yy - n.bh / 2 + 2, 2, n.bh - 4);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    // gloves below the line
    const gap = s.clap > 4 ? 1 : s.clap ? 5 : 12;
    eng.sprite(ctx, GLOVE, GLOVE_C, LANE - gap - 16, 270, 2, true); eng.sprite(ctx, GLOVE, GLOVE_C, LANE + gap, 270, 2);
    if (s.clap > 4) { ctx.fillStyle = CREAM; ctx.fillRect(LANE - 22, 268, 3, 2); ctx.fillRect(LANE + 19, 268, 3, 2); ctx.fillRect(LANE - 1, 262, 2, 3); }
    // metronome: arm reaches an extreme on every beat
    const ph = s.phase === 'play' ? (s.t - s.t0) / period() : 0, ang = Math.cos(ph * Math.PI) * 0.5;
    ctx.fillStyle = '#6a3a10'; ctx.beginPath(); ctx.moveTo(26, 300); ctx.lineTo(54, 300); ctx.lineTo(46, 248); ctx.lineTo(34, 248); ctx.fill();
    ctx.fillStyle = BRASS; ctx.fillRect(26, 298, 28, 3);
    ctx.strokeStyle = CREAM; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(40, 292); ctx.lineTo(40 + Math.sin(ang) * 46, 292 - Math.cos(ang) * 46); ctx.stroke();
    ctx.fillStyle = s.pulse ? CREAM : GOLD; ctx.fillRect(40 + Math.sin(ang) * 32 - 3, 292 - Math.cos(ang) * 32 - 3, 6, 6);
    // unattended piano
    ctx.fillStyle = VEL2; ctx.beginPath(); ctx.moveTo(168, 276); ctx.lineTo(234, 276); ctx.lineTo(234, 258); ctx.quadraticCurveTo(206, 244, 186, 262); ctx.lineTo(168, 262); ctx.fill();
    ctx.fillStyle = '#f4f0e6'; ctx.fillRect(168, 276, 66, 6); ctx.fillStyle = PAL.bg; for (let x = 171; x < 232; x += 5) ctx.fillRect(x, 276, 2, 3);
    ctx.fillStyle = BRASS; ctx.fillRect(172, 282, 3, 18); ctx.fillRect(226, 282, 3, 18); ctx.fillRect(168, 262, 66, 1);
    // pops
    for (const p of s.pops) { ctx.globalAlpha = Math.min(1, p.t / 15); text(ctx, p.txt, LANE, LINE - 52 - (40 - p.t) / 2, p.c, 'center'); ctx.globalAlpha = 1; }
    // HUD
    ctx.fillStyle = PAL.bg; ctx.fillRect(0, 0, 240, 26); ctx.fillStyle = BRASS; ctx.fillRect(0, 26, 240, 1);
    text(ctx, String(eng.score).padStart(6, '0'), 4, 3, PAL.ink);
    text(ctx, `RECITAL ${s.r}`, 120, 3, GOLD, 'center');
    for (let i = 0; i < MAXMISS; i++) { ctx.fillStyle = i < s.miss ? PAL.red : '#3a2a30'; ctx.fillRect(196 + i * 8, 4, 6, 6); }
    text(ctx, s.combo > 1 ? `x${s.combo}` : '', 4, 14, PAL.green, 'left', 6);
    text(ctx, `${s.bpm} BPM`, 236, 15, BRASS, 'right', 6);
    ctx.fillStyle = '#2a1a20'; ctx.fillRect(60, 15, 120, 6);
    ctx.fillStyle = GOLD; ctx.fillRect(60, 15, Math.max(0, 1 - Math.max(0, s.t - s.t0) / (RECITAL - s.t0)) * 120, 6);
    if (eng.state !== 'play') return;
    if (s.phase === 'interval') {
      ctx.fillStyle = 'rgba(7,6,12,0.85)'; ctx.fillRect(16, 110, 208, 64);
      text(ctx, `RECITAL ${s.r} CONCLUDED`, 120, 118, GOLD, 'center'); text(ctx, `COMPOSURE +${s.bonus}`, 120, 136, PAL.green, 'center'); text(ctx, 'TEMPO REVISED UPWARD', 120, 154, CREAM, 'center', 6);
    } else if (s.phase === 'dead') {
      ctx.fillStyle = 'rgba(7,6,12,0.85)'; ctx.fillRect(16, 120, 208, 34); text(ctx, 'FIVE IRREGULARITIES', 120, 132, PAL.red, 'center');
    } else if (s.banner && s.t < s.t0 + 60) {
      ctx.fillStyle = 'rgba(7,6,12,0.85)'; ctx.fillRect(16, 104, 208, 54);
      text(ctx, 'APPLAUD GREEN BUYS', 120, 112, PAL.green, 'center'); text(ctx, 'ON THE LINE', 120, 126, CREAM, 'center'); text(ctx, 'LET THE RED SELLS PASS', 120, 142, PAL.red, 'center', 6);
    }
  },
};
boot(game);
