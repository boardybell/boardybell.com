// Audit Season: whack-a-mole in a filing cabinet. Stamp the discrepancies, leave the correct paperwork alone.
import { boot, PAL } from '../engine.js';
const CW = 70, CH = 80, GX = 10, GY = 40, GAP_X = 5, GAP_Y = 8;
const cellX = (i) => GX + (i % 3) * (CW + GAP_X), cellY = (i) => GY + Math.floor(i / 3) * (CH + GAP_Y);
const KINDS = {
  bad: { paper: '#ff6b6b', edge: '#a02020', line: '#7a1010', pts: 100 },
  gold: { paper: '#ffd23f', edge: '#a07800', line: '#6a5000', pts: 500 },
  ok: { paper: '#f4f4ec', edge: '#9a9a92', line: '#6a6a72', pts: 0 },
};
let s, bound = false;

function spawn(eng) {
  const free = [...Array(9).keys()].filter((i) => !s.docs[i]);
  if (!free.length) return;
  const i = free[Math.floor(Math.random() * free.length)];
  const r = Math.random(), okChance = Math.min(0.42, 0.22 + s.round * 0.03);
  const kind = r < 0.07 + Math.min(0.05, s.round * 0.005) ? 'gold' : r < 0.07 + okChance ? 'ok' : 'bad';
  const life = Math.max(42, Math.round((kind === 'gold' ? 0.7 : 1) * (130 - s.round * 9)));
  s.docs[i] = { kind, t: 0, life, hit: 0 };
}
function stamp(eng, i) {
  s.stamps.push({ i, t: 16 });
  const d = s.docs[i];
  if (!d || d.hit || d.t > d.life + 10) { eng.beep(110, 0.05, 'triangle', 0.04); return; }
  d.hit = 30;
  if (d.kind === 'ok') {
    s.strikes++; eng.score = Math.max(0, eng.score - 200); s.flash = 14;
    pop(i, 'NOT AN ISSUE', PAL.orange); eng.beep(160, 0.25, 'sawtooth', 0.05, -60);
  } else {
    const pts = KINDS[d.kind].pts * s.round + (s.combo >= 4 ? 50 : 0);
    s.combo++; eng.score += pts; s.noted++;
    pop(i, d.kind === 'gold' ? `MATERIAL +${pts}` : `NOTED +${pts}`, d.kind === 'gold' ? PAL.gold : PAL.green);
    eng.beep(d.kind === 'gold' ? 990 : 620, 0.05); eng.beep(d.kind === 'gold' ? 1480 : 880, 0.06, 'triangle');
    if (s.noted % 12 === 0) { s.round++; s.banner = 90; eng.beep(1046, 0.15); }
  }
}
const pop = (i, txt, c) => s.pops.push({ x: cellX(i) + CW / 2, y: cellY(i) + 8, txt, c, t: 50 });

const game = {
  id: 'audit', tapIsAct: true,
  reset(eng) {
    s = { sel: 4, docs: Array(9).fill(null), stamps: [], pops: [], strikes: 0, round: 1, noted: 0, combo: 0, next: 50, flash: 0, banner: 90, end: 0 };
    if (!bound) {
      const cv = document.getElementById('ag-cv');
      // a tap selects that drawer; the engine's tapIsAct turns the same tap into a stamp
      cv?.addEventListener('pointerdown', (e) => {
        if (eng.state !== 'play') return;
        const r = cv.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * 240, y = ((e.clientY - r.top) / r.height) * 320;
        for (let i = 0; i < 9; i++) if (x >= cellX(i) - 2 && x < cellX(i) + CW + 2 && y >= cellY(i) - 4 && y < cellY(i) + CH + 4) { s.sel = i; break; }
      });
    }
    bound = true;
  },
  update(eng) {
    for (const p of s.pops) { p.t--; p.y -= 0.4; }
    s.pops = s.pops.filter((p) => p.t > 0);
    for (const st of s.stamps) st.t--;
    s.stamps = s.stamps.filter((st) => st.t > 0);
    if (s.flash) s.flash--;
    if (s.banner) s.banner--;
    if (s.end) { if (--s.end === 0) eng.gameOver('FINDINGS ISSUED'); return; }
    // selection
    const p = eng.pressed, sw = eng.swipe;
    if ((p.left || sw === 'left') && s.sel % 3) s.sel--;
    if ((p.right || sw === 'right') && s.sel % 3 < 2) s.sel++;
    if ((p.up || sw === 'up') && s.sel > 2) s.sel -= 3;
    if ((p.down || sw === 'down') && s.sel < 6) s.sel += 3;
    if (p.act) stamp(eng, s.sel);
    // documents
    for (let i = 0; i < 9; i++) {
      const d = s.docs[i]; if (!d) continue;
      d.t++;
      if (d.hit) { if (--d.hit === 0) s.docs[i] = null; continue; }
      if (d.t > d.life + 16) {
        if (d.kind !== 'ok') { s.strikes++; s.combo = 0; s.flash = 14; pop(i, 'MISSED', PAL.red); eng.beep(140, 0.2, 'sawtooth', 0.04, -40); }
        s.docs[i] = null;
      }
    }
    if (s.strikes >= 3 && !s.end) { s.end = 60; return; }
    // spawning
    if (--s.next <= 0) {
      const busy = s.docs.filter(Boolean).length, cap = Math.min(5, 1 + Math.floor(s.round / 2));
      if (busy < cap) spawn(eng);
      s.next = Math.max(14, 55 - s.round * 5) + Math.floor(Math.random() * 20);
    }
  },
  draw(eng, ctx) {
    const { text } = eng;
    // HUD
    text(ctx, `ROUND ${s.round}`, 4, 4, PAL.gold);
    text(ctx, String(eng.score).padStart(6, '0'), 236, 4, PAL.ink, 'right');
    text(ctx, 'STRIKES', 4, 16, PAL.grey);
    for (let k = 0; k < 3; k++) { ctx.fillStyle = k < s.strikes ? PAL.red : '#2a2236'; ctx.fillRect(64 + k * 12, 16, 8, 8); }
    if (s.combo >= 4) text(ctx, `STREAK ${s.combo}`, 236, 16, PAL.green, 'right');
    // office wall
    ctx.fillStyle = s.flash % 4 > 1 ? '#3a0c14' : '#141826'; ctx.fillRect(0, 30, 240, 290);
    ctx.fillStyle = '#1a2032'; for (let y = 34; y < 320; y += 8) ctx.fillRect(0, y, 240, 1);
    // cabinet body
    ctx.fillStyle = '#3a4252'; ctx.fillRect(GX - 6, GY - 6, 3 * CW + 2 * GAP_X + 12, 3 * CH + 2 * GAP_Y + 12);
    ctx.fillStyle = '#4a5468'; ctx.fillRect(GX - 6, GY - 6, 3 * CW + 2 * GAP_X + 12, 3);
    for (let i = 0; i < 9; i++) drawCell(eng, ctx, i);
    // selection frame
    const sx = cellX(s.sel), sy = cellY(s.sel), blink = Math.floor(eng.t / 15) % 2;
    ctx.strokeStyle = blink ? PAL.cyan : '#3ab8c0'; ctx.lineWidth = 2; ctx.strokeRect(sx - 2, sy - 2, CW + 4, CH + 4);
    ctx.fillStyle = PAL.cyan; for (const [cx, cy] of [[sx - 4, sy - 4], [sx + CW, sy - 4], [sx - 4, sy + CH], [sx + CW, sy + CH]]) ctx.fillRect(cx, cy, 4, 4);
    // stamp animations: rubber stamp slams down, leaves ink
    for (const st of s.stamps) {
      const x = cellX(st.i) + CW / 2, y = cellY(st.i) + 26, lift = Math.max(0, st.t - 10) * 4;
      ctx.fillStyle = '#5a3020'; ctx.fillRect(x - 5, y - 26 - lift, 10, 14);
      ctx.fillStyle = '#8a5030'; ctx.fillRect(x - 9, y - 30 - lift, 18, 6);
      ctx.fillStyle = '#2a2a2a'; ctx.fillRect(x - 14, y - 12 - lift, 28, 6);
      if (st.t <= 12) { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x - 18, y - 4, 2, 2); ctx.fillRect(x + 16, y - 4, 2, 2); ctx.fillRect(x - 20, y + 2, 2, 2); ctx.fillRect(x + 18, y + 2, 2, 2); }
    }
    for (const p of s.pops) {
      const w = p.txt.length * 8 + 6;
      ctx.fillStyle = 'rgba(7,6,12,0.75)'; ctx.fillRect(Math.max(0, Math.min(240 - w, p.x - w / 2)), p.y - 2, w, 12);
      text(ctx, p.txt, Math.max(w / 2 - 3, Math.min(240 - w / 2 + 3, p.x)), p.y, p.c, 'center');
    }
    if (s.banner && !s.end) {
      ctx.fillStyle = 'rgba(7,6,12,0.85)'; ctx.fillRect(20, 150, 200, 34);
      text(ctx, `AUDIT ROUND ${s.round}`, 120, 156, PAL.gold, 'center');
      text(ctx, s.round === 1 ? 'STAMP THE RED ONES' : 'PACE INCREASED', 120, 170, PAL.ink, 'center');
    }
  },
};
function drawCell(eng, ctx, i) {
  const x = cellX(i), y = cellY(i), d = s.docs[i];
  // drawer recess
  ctx.fillStyle = '#0c0e16'; ctx.fillRect(x, y, CW, CH);
  // document rising from the drawer (drawn behind the drawer front)
  if (d) {
    const up = d.hit ? Math.max(0, 1 - (30 - d.hit) / 30) : d.t < 10 ? d.t / 10 : d.t > d.life ? Math.max(0, 1 - (d.t - d.life) / 16) : 1;
    const ph = 46, py = y + 44 - Math.round(ph * up) + 4;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, CW, 48); ctx.clip();
    paper(eng, ctx, x + 14, py, d, i);
    ctx.restore();
  }
  // drawer front
  const fy = y + 48;
  ctx.fillStyle = '#8a94a8'; ctx.fillRect(x, fy, CW, CH - 48);
  ctx.fillStyle = '#a8b2c4'; ctx.fillRect(x, fy, CW, 2);
  ctx.fillStyle = '#5a6478'; ctx.fillRect(x, fy + CH - 50, CW, 2);
  ctx.fillStyle = '#f4ecd8'; ctx.fillRect(x + CW / 2 - 12, fy + 6, 24, 8);
  ctx.fillStyle = '#6a6a72'; ctx.fillRect(x + CW / 2 - 9, fy + 9, 18, 1); ctx.fillRect(x + CW / 2 - 9, fy + 11, 12, 1);
  ctx.fillStyle = '#3a4252'; ctx.fillRect(x + CW / 2 - 10, fy + 19, 20, 5);
  ctx.fillStyle = '#c8d0dc'; ctx.fillRect(x + CW / 2 - 10, fy + 19, 20, 1);
}
function paper(eng, ctx, x, y, d, i) {
  const k = KINDS[d.kind], w = 42, h = 46;
  ctx.fillStyle = k.edge; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = k.paper; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = k.edge; ctx.fillRect(x + w - 8, y, 8, 8); ctx.fillStyle = k.paper; ctx.fillRect(x + w - 8, y + 8, 8, 0);
  ctx.fillStyle = k.line; for (let r = 0; r < 3; r++) ctx.fillRect(x + 5, y + 26 + r * 5, r === 2 ? 18 : 30, 2);
  // face
  const ey = y + 10;
  if (d.kind === 'ok') {
    ctx.fillStyle = '#1a1a22'; ctx.fillRect(x + 10, ey + 3, 6, 2); ctx.fillRect(x + 24, ey + 3, 6, 2);
    ctx.fillRect(x + 16, ey + 10, 8, 2);
  } else {
    const look = Math.round(Math.sin((eng.t + i * 17) / 6) * 2);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 8, ey, 9, 7); ctx.fillRect(x + 23, ey, 9, 7);
    ctx.fillStyle = '#1a1a22'; ctx.fillRect(x + 11 + look, ey + 2, 3, 4); ctx.fillRect(x + 26 + look, ey + 2, 3, 4);
    ctx.fillRect(x + 7, ey - 3, 10, 2); ctx.fillRect(x + 23, ey - 2, 10, 2);
    ctx.fillRect(x + 15, ey + 11, 10, 2); ctx.fillRect(x + 24, ey + 10, 2, 1);
  }
  if (d.hit && d.kind !== 'ok') {
    ctx.save(); ctx.translate(x + w / 2, y + 22); ctx.rotate(-0.25);
    ctx.strokeStyle = d.kind === 'gold' ? '#7a1010' : '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(-23, -7, 46, 14);
    eng.text(ctx, 'NOTED', 0, -4, d.kind === 'gold' ? '#7a1010' : '#ffffff', 'center');
    ctx.restore();
  }
}
boot(game);
