// Risk Committee: missile defence. Red flags fall toward three policy binders and the launcher.
// Interceptors burst where you aim; flags caught in a burst burst too, and the bursts chain.
import { boot, PAL } from '../engine.js';
const GROUND = 300, LX = 120, LY = 288;
const BX = [40, 80, 180];
const BINDER = ['.kkkkkkkkkk.', 'kccccccccccK', 'kcWWWWWWWWcK', 'kcWkkkkkkWcK', 'kcWWWWWWWWcK', 'kccccccccccK', 'kcccOcccOccK', 'kccccccccccK', 'kccccccccccK', 'kcccOcccOccK', 'kccccccccccK', 'kccccccccccK', 'kkkkkkkkkkkK'];
const BCOLS = [{ k: '#1a1430', K: '#0c0a18', W: '#e8fbff', O: '#c8c8d8', c: '#3a6bff' }, { k: '#1a1430', K: '#0c0a18', W: '#e8fbff', O: '#c8c8d8', c: '#ff9a3c' }, { k: '#1a1430', K: '#0c0a18', W: '#e8fbff', O: '#c8c8d8', c: '#9d5cff' }];
const RUBBLE = ['............', '............', '............', '............', '............', '............', '............', '............', '....W...c...', '..c.WW.cc...', '.ccWcWWcWc..', 'kcWcccWccWck', 'kkkkkkkkkkkK'];
const FLAG = [['rRR...', 'rRRRR.', 'rRRRRR', 'rRRRR.', 'rRR...', 'r.....', 'r.....', 'r.....'], ['rRRR..', 'rRRRRR', 'rRRRR.', 'rRRRRR', 'rR....', 'r.....', 'r.....', 'r.....']];
const FCOL = { r: '#c8c8d8', R: '#ff4a4a' };
const BURSTC = ['#ffffff', '#ffd23f', '#ff9a3c', '#ff4fd8', '#7df9ff'];
let s;
const taps = [];

function targets() { const t = []; s.binders.forEach((b, i) => { if (b) t.push(i); }); if (s.launcher) t.push(3); return t; }
function spawnFlag(x, y, speed) {
  const t = targets(); if (!t.length) return;
  const i = t[(Math.random() * t.length) | 0], tx = (i === 3 ? LX : BX[i]) + (Math.random() - 0.5) * 8, ty = i === 3 ? LY - 2 : GROUND - 14;
  const d = Math.hypot(tx - x, ty - y);
  const split = s.wave >= 3 && y < 40 && Math.random() < Math.min(0.5, 0.15 + s.wave * 0.04) ? 100 + Math.random() * 80 : 0;
  const f = { x0: x, y0: y, x, y, vx: ((tx - x) / d) * speed, vy: ((ty - y) / d) * speed, ty, target: i, split };
  s.flags.push(f); return f;
}
function startWave() {
  s.toSpawn = 6 + s.wave * 2; s.ammo = 10 + s.wave * 2; s.launcher = true;
  s.speed = Math.min(1.0, 0.28 + s.wave * 0.06); s.spawnT = 60; s.msg = 120; s.summary = 0; s.mult = 1 + ((s.wave - 1) >> 1);
}
function boom(x, y, max, harmful) { s.bursts.push({ x, y, r: 0, max, t: 0, harmful }); }

const game = {
  id: 'missile', tapIsAct: true,
  reset(eng) {
    s = { wave: 1, binders: [true, true, true], launcher: true, rx: 120, ry: 160, flags: [], shots: [], bursts: [], ammo: 0, msg: 0, summary: 0, bonus: 0, endT: 0, note: '', noteT: 0 };
    taps.length = 0; startWave();
    if (!game.hooked) {
      game.hooked = true;
      const cv = document.getElementById('ag-cv');
      cv?.addEventListener('pointerdown', (e) => {
        if (eng.state !== 'play') return;
        const r = cv.getBoundingClientRect();
        if (taps.length < 4) taps.push({ x: ((e.clientX - r.left) / r.width) * eng.W, y: ((e.clientY - r.top) / r.height) * eng.H });
      });
    }
  },
  update(eng) {
    const k = eng.keys;
    if (s.msg) s.msg--; if (s.noteT) s.noteT--;
    if (s.endT) { if (--s.endT === 0) eng.gameOver('POLICY SHREDDED'); stepBursts(eng); return; }
    // between waves: tally then continue
    if (s.summary) {
      if (--s.summary === 0) { s.wave++; if (s.wave % 3 === 1) { const d = s.binders.indexOf(false); if (d >= 0) { s.binders[d] = true; s.note = 'BINDER REISSUED'; s.noteT = 150; } } startWave(); }
      return;
    }
    // aim
    const sp = 3.2;
    if (k.left) s.rx -= sp; if (k.right) s.rx += sp; if (k.up) s.ry -= sp; if (k.down) s.ry += sp;
    let fire = eng.pressed.act;
    if (taps.length) { const tp = taps.shift(); s.rx = tp.x; s.ry = tp.y; fire = true; }
    s.rx = Math.max(4, Math.min(236, s.rx)); s.ry = Math.max(30, Math.min(272, s.ry));
    if (fire) {
      if (s.ammo > 0 && s.launcher) {
        s.ammo--; const d = Math.max(1, Math.hypot(s.rx - LX, s.ry - LY));
        s.shots.push({ x: LX, y: LY - 4, tx: s.rx, ty: s.ry, vx: ((s.rx - LX) / d) * 5, vy: ((s.ry - LY + 4) / d) * 5, n: Math.ceil(d / 5) });
        eng.beep(900, 0.08, 'square', 0.04, -500);
      } else eng.beep(120, 0.05, 'square', 0.03);
    }
    // spawn flags
    if (s.toSpawn > 0 && --s.spawnT <= 0) {
      const n = Math.min(s.toSpawn, 1 + (Math.random() < 0.3 + s.wave * 0.04 ? 1 : 0));
      for (let i = 0; i < n; i++) spawnFlag(10 + Math.random() * 220, 26, s.speed * (0.85 + Math.random() * 0.3));
      s.toSpawn -= n; s.spawnT = Math.max(28, 100 - s.wave * 7) + Math.random() * 40;
    }
    // interceptors
    for (let i = s.shots.length - 1; i >= 0; i--) {
      const o = s.shots[i]; o.x += o.vx; o.y += o.vy;
      if (--o.n <= 0) { boom(o.tx, o.ty, 18, true); s.shots.splice(i, 1); eng.beep(220, 0.2, 'sawtooth', 0.05, -120); }
    }
    // flags
    for (let i = s.flags.length - 1; i >= 0; i--) {
      const f = s.flags[i]; f.x += f.vx; f.y += f.vy;
      if (f.split && f.y >= f.split) {
        f.split = 0; const sp2 = Math.hypot(f.vx, f.vy);
        for (let j = 0; j < 2; j++) { const c = spawnFlag(f.x, f.y, sp2); if (c) c.split = 0; }
        eng.beep(700, 0.05, 'triangle', 0.04);
      }
      if (f.y >= f.ty) {
        s.flags.splice(i, 1); boom(f.x, f.y, 14, false); eng.beep(80, 0.4, 'sawtooth', 0.07, -40);
        if (f.target === 3) { if (s.launcher) { s.launcher = false; s.ammo = 0; s.note = 'LAUNCHER OFFLINE'; s.noteT = 120; } }
        else if (s.binders[f.target] && !eng.god) s.binders[f.target] = false; // god mode: binders cannot be destroyed
      }
    }
    stepBursts(eng);
    if (!s.binders.some(Boolean)) { s.endT = 90; return; }
    // wave cleared
    if (!s.toSpawn && !s.flags.length && !s.shots.length && !s.bursts.length) {
      const alive = s.binders.filter(Boolean).length;
      s.bonus = (alive * 100 + s.ammo * 5) * s.mult; eng.score += s.bonus; s.summary = 150;
      eng.beep(660, 0.1); eng.beep(880, 0.1); eng.beep(1320, 0.2);
    }
  },
  draw(eng, ctx) {
    const { text, sprite } = eng;
    // sky
    for (let i = 0; i < 6; i++) { ctx.fillStyle = ['#07060c', '#0a0816', '#0d0a1e', '#120c26', '#1a0f2e', '#241232'][i]; ctx.fillRect(0, 24 + i * 46, 240, 46); }
    for (let i = 0; i < 30; i++) { ctx.fillStyle = '#2b2550'; ctx.fillRect((i * 83 + 7) % 240, 28 + ((i * 47) % 180), 1, 1); }
    // ground
    ctx.fillStyle = '#1d3a2a'; ctx.fillRect(0, GROUND, 240, 20);
    ctx.fillStyle = '#2f6b45'; ctx.fillRect(0, GROUND, 240, 2);
    ctx.fillStyle = '#1d3a2a'; ctx.beginPath(); ctx.moveTo(100, GROUND); ctx.lineTo(108, LY + 2); ctx.lineTo(132, LY + 2); ctx.lineTo(140, GROUND); ctx.fill();
    // binders
    for (let i = 0; i < 3; i++) sprite(ctx, s.binders[i] ? BINDER : RUBBLE, BCOLS[i], BX[i] - 12, GROUND - 26, 2);
    // launcher + remaining interceptors
    ctx.fillStyle = s.launcher ? PAL.cyan : '#3a3a4a'; ctx.fillRect(LX - 6, LY - 2, 12, 4); ctx.fillRect(LX - 2, LY - 7, 4, 5);
    ctx.fillStyle = PAL.gold;
    for (let i = 0; i < Math.min(s.ammo, 30); i++) ctx.fillRect(LX - 29 + (i % 15) * 4, GROUND + 6 + ((i / 15) | 0) * 5, 2, 3);
    // flag trails + flags
    ctx.lineWidth = 1;
    for (const f of s.flags) {
      ctx.strokeStyle = 'rgba(255,74,74,0.55)'; ctx.beginPath(); ctx.moveTo(f.x0, f.y0); ctx.lineTo(f.x, f.y); ctx.stroke();
      sprite(ctx, FLAG[((eng.t >> 3) + (f.x0 | 0)) & 1], FCOL, f.x, f.y - 7);
    }
    // interceptors
    for (const o of s.shots) {
      ctx.strokeStyle = 'rgba(125,249,255,0.5)'; ctx.beginPath(); ctx.moveTo(LX, LY - 4); ctx.lineTo(o.x, o.y); ctx.stroke();
      ctx.fillStyle = PAL.ink; ctx.fillRect(o.x - 1, o.y - 1, 2, 2);
      ctx.fillStyle = PAL.cyan; ctx.fillRect(o.tx - 2, o.ty, 5, 1); ctx.fillRect(o.tx, o.ty - 2, 1, 5);
    }
    // bursts
    for (const b of s.bursts) {
      ctx.fillStyle = b.harmful ? BURSTC[((eng.t >> 2) + (b.x | 0)) % BURSTC.length] : (eng.t & 4 ? PAL.red : PAL.orange);
      ctx.beginPath(); ctx.arc(b.x, b.y, Math.max(0.5, b.r), 0, Math.PI * 2); ctx.fill();
    }
    // reticle
    if (eng.state === 'play' && !s.summary) {
      const x = Math.round(s.rx), y = Math.round(s.ry);
      ctx.fillStyle = s.ammo > 0 && s.launcher ? PAL.gold : PAL.grey;
      ctx.fillRect(x - 6, y, 4, 1); ctx.fillRect(x + 3, y, 4, 1); ctx.fillRect(x, y - 6, 1, 4); ctx.fillRect(x, y + 3, 1, 4);
    }
    // HUD
    ctx.fillStyle = PAL.bg; ctx.fillRect(0, 0, 240, 23); ctx.fillStyle = '#2b2550'; ctx.fillRect(0, 23, 240, 1);
    text(ctx, String(eng.score).padStart(6, '0'), 4, 3, PAL.ink);
    text(ctx, `WAVE ${s.wave}`, 120, 3, PAL.gold, 'center');
    text(ctx, `INT ${String(s.ammo).padStart(2, '0')}`, 236, 3, s.ammo ? PAL.cyan : PAL.red, 'right');
    text(ctx, `FLAGS ${s.toSpawn + s.flags.length}`, 4, 13, PAL.red);
    if (s.mult > 1) text(ctx, `X${s.mult}`, 236, 13, PAL.grey, 'right');
    if (eng.state !== 'play') return;
    if (s.summary) {
      text(ctx, `WAVE ${s.wave} CONTAINED`, 120, 110, PAL.gold, 'center');
      text(ctx, `BINDERS ${s.binders.filter(Boolean).length} X ${100 * s.mult}`, 120, 130, PAL.ink, 'center');
      text(ctx, `UNUSED ${s.ammo} X ${5 * s.mult}`, 120, 144, PAL.ink, 'center');
      text(ctx, `BONUS ${s.bonus}`, 120, 162, PAL.green, 'center');
    } else if (s.msg) {
      text(ctx, `WAVE ${s.wave}`, 120, 120, PAL.gold, 'center');
      text(ctx, s.wave === 1 ? 'PROTECT THE BINDERS' : 'MORE RED FLAGS', 120, 136, PAL.ink, 'center');
    }
    if (s.noteT) text(ctx, s.note, 120, 200, s.note === 'BINDER REISSUED' ? PAL.green : PAL.red, 'center');
  },
};
function stepBursts(eng) {
  for (let i = s.bursts.length - 1; i >= 0; i--) {
    const b = s.bursts[i]; b.t++;
    b.r = b.t < 18 ? (b.t / 18) * b.max : b.t < 34 ? b.max : b.max * (1 - (b.t - 34) / 18);
    if (b.t >= 52) { s.bursts.splice(i, 1); continue; }
    if (!b.harmful) continue;
    for (let j = s.flags.length - 1; j >= 0; j--) {
      const f = s.flags[j];
      if ((f.x - b.x) ** 2 + (f.y - b.y) ** 2 < b.r * b.r) {
        s.flags.splice(j, 1); eng.score += 25 * s.mult; boom(f.x, f.y, 13, true);
        eng.beep(330 + Math.random() * 300, 0.12, 'sawtooth', 0.04, -200);
      }
    }
  }
}
boot(game);
