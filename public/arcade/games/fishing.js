// Bottom Fishing: hold to lower the hook, release to reel in whatever bit first.
// Three gold fish per 45 second round qualify for the trophy photograph; the silver fish above them earn nothing
// and waste a retrieval. Each round adds silver fish and quickens the gold.
import { boot, PAL } from '../engine.js';
const VEL = '#5a1230', VEL2 = '#3a0b1f', GOLD = '#ffb238', CREAM = '#ffe9a8', BRASS = '#c9a15a', SILVER = '#c8ccd8';
const SURF = 76, BOTTOM = 292, REST = SURF - 6, ROUND_T = 45 * 60, NEED = 3;
const FISH = ['....bbb...', 'b..bBBBBb.', 'bbbBBBBeBb', 'bbbBBBBBBb', 'b..bBBBBb.', '....bbb...'];
const GOLD_C = { B: GOLD, b: '#a05a10', e: PAL.bg }, SILV_C = { B: SILVER, b: '#5a6070', e: PAL.bg };
let s;

function silver() {
  const dir = Math.random() < 0.5 ? -1 : 1;
  return { kind: 'silver', x: Math.random() * 260 - 10, y: 104 + Math.random() * 148, vx: dir * (0.35 + Math.random() * 0.5 + s.r * 0.07), ph: Math.random() * 6, cool: 0 };
}
function gold(offscreen) {
  const dir = Math.random() < 0.5 ? -1 : 1;
  return { kind: 'gold', x: offscreen ? (dir > 0 ? -24 : 254) : 20 + Math.random() * 200, y: 266 + Math.random() * 18, vx: dir * (0.3 + Math.random() * 0.25 + s.r * 0.08), ph: Math.random() * 6, cool: 0 };
}
function startRound(r) {
  s.r = r; s.time = ROUND_T; s.gold = 0; s.phase = 'play'; s.caught = null; s.hookY = REST; s.banner = 120;
  s.fish = [];
  for (let i = 0; i < Math.min(26, 8 + r * 3); i++) s.fish.push(silver());
  for (let i = 0; i < 4; i++) s.fish.push(gold(false));
}
// price tag on a string: gold fish wear red down-arrow tags (undervalued), silver wear green up-arrow tags (overpriced)
function tag(ctx, f) {
  const gold = f.kind === 'gold', x = Math.round(f.x + (f.vx < 0 && f !== s.caught ? 12 : 3)), y = Math.round(f.y) - 7;
  ctx.fillStyle = '#e8e0d0'; ctx.fillRect(x + 2, y + 6, 1, 2);
  ctx.fillStyle = gold ? '#d02a2a' : '#1f9a40'; ctx.fillRect(x, y, 6, 6);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 2, y + 1, 2, 4);
  if (gold) ctx.fillRect(x + 1, y + 3, 4, 1); else ctx.fillRect(x + 1, y + 2, 4, 1);
}
const pop = (txt, x, y, c) => s.pops.push({ txt, x: Math.max(40, Math.min(200, x)), y, c, t: 50 });

const game = {
  id: 'fishing',
  reset() { s = { boatX: 104, pops: [], flash: 0, timer: 0, hookY: REST }; startRound(1); },
  update(eng) {
    const k = eng.keys;
    for (const p of s.pops) { p.t--; p.y -= 0.4; }
    s.pops = s.pops.filter((p) => p.t > 0);
    if (s.flash) s.flash--; if (s.banner) s.banner--;
    // fish swim in every phase
    for (const f of s.fish) {
      if (f === s.caught) continue;
      if (f.cool) f.cool--;
      f.ph += 0.05; f.x += f.vx * (f.cool ? 3 : 1);
      if (f.kind === 'silver') f.y += Math.sin(f.ph) * 0.25;
      if (f.x > 256) f.x = -24; if (f.x < -26) f.x = 254;
    }
    if (s.phase === 'photo') { if (--s.timer <= 0) { s.phase = s.gold >= NEED ? 'clear' : 'play'; s.timer = 150; if (s.phase === 'clear') { s.bonus = Math.ceil(s.time / 60) * 25 * s.r; eng.score += s.bonus; } } return; }
    if (s.phase === 'clear') { if (--s.timer <= 0) startRound(s.r + 1); return; }
    // clock; god mode holds it at one second
    s.time--;
    if (eng.god) s.time = Math.max(s.time, 60);
    if (s.time <= 0) { eng.gameOver('THE PHOTOGRAPHER HAS LEFT'); return; }
    if (s.time % 60 === 0 && s.time <= 600) eng.beep(1200, 0.03, 'square', 0.02);
    // boat
    const sp = s.hookY > REST + 4 ? 1.0 : 1.6;
    if (k.left) s.boatX -= sp; if (k.right) s.boatX += sp;
    s.boatX = Math.max(8, Math.min(200, s.boatX));
    const hx = s.boatX + 30;
    // hook: hold to lower, release to reel
    if (k.act && !s.caught) { s.hookY = Math.min(BOTTOM - 6, s.hookY + 1.6); if ((eng.t & 7) === 0) eng.beep(300 - (s.hookY - SURF), 0.02, 'triangle', 0.02); }
    else if (!k.act) {
      s.hookY -= s.caught?.kind === 'gold' ? 1.7 : 2.4;
      if ((eng.t & 3) === 0 && s.hookY > REST) eng.beep(500 + (BOTTOM - s.hookY), 0.015, 'square', 0.015);
      if (s.hookY <= REST) {
        s.hookY = REST;
        const f = s.caught;
        if (f?.kind === 'gold') {
          s.gold++; const pts = 1000 * s.r + Math.ceil(s.time / 60) * 10; eng.score += pts;
          pop(`PHOTOGRAPHED +${pts}`, hx, SURF - 30, GOLD); s.flash = 22; s.phase = 'photo'; s.timer = 60;
          eng.beep(1568, 0.05); eng.beep(2093, 0.15, 'triangle');
          Object.assign(f, gold(true)); s.caught = null;
        } else if (f) {
          pop('NO MARGIN OF SAFETY', hx, SURF - 30, SILVER); eng.beep(200, 0.15, 'triangle', 0.04);
          Object.assign(f, silver(), { y: 110 + Math.random() * 60, cool: 40 }); s.caught = null;
        }
      }
    }
    // bites: the first fish the hook touches
    if (!s.caught && s.hookY > SURF + 4) {
      for (const f of s.fish) {
        if (f.cool || Math.abs(hx - (f.x + 10)) > 8 || Math.abs(s.hookY + 4 - (f.y + 6)) > 6) continue;
        if (f.kind === 'silver' && eng.god) { f.cool = 30; pop('SLIPPED OFF', f.x + 10, f.y - 10, SILVER); eng.beep(700, 0.04, 'triangle', 0.03); continue; } // god mode: silver never sticks
        s.caught = f; eng.beep(f.kind === 'gold' ? 880 : 330, 0.08); eng.beep(f.kind === 'gold' ? 1320 : 220, 0.1, 'triangle');
        if (f.kind === 'silver') pop('OVERPRICED. REGRETTABLY.', hx, f.y - 12, SILVER); else pop('UNDERVALUED. SPLENDID.', hx, f.y - 12, GOLD);
        break;
      }
    }
    if (s.caught) { s.caught.x = hx - 10; s.caught.y = s.hookY + 2; }
  },
  draw(eng, ctx) {
    const { text } = eng, hx = s.boatX + 30;
    // gold-lit mist above the pond, velvet drapes at the sides
    let g = ctx.createLinearGradient(0, 26, 0, SURF); g.addColorStop(0, VEL2); g.addColorStop(1, '#8a4a30');
    ctx.fillStyle = g; ctx.fillRect(0, 26, 240, SURF - 26);
    ctx.fillStyle = 'rgba(255,233,168,0.12)'; for (let i = 0; i < 6; i++) ctx.fillRect(((i * 53 + eng.t * 0.1) % 280) - 30, 40 + (i % 3) * 9, 40, 3);
    // water
    g = ctx.createLinearGradient(0, SURF, 0, BOTTOM); g.addColorStop(0, '#163848'); g.addColorStop(1, '#070f18');
    ctx.fillStyle = g; ctx.fillRect(0, SURF, 240, BOTTOM - SURF);
    ctx.fillStyle = 'rgba(255,233,168,0.08)'; for (let i = 0; i < 9; i++) ctx.fillRect((i * 31 + Math.sin(eng.t / 40 + i) * 6) % 240, SURF + 12 + i * 22, 18, 1);
    ctx.fillStyle = '#7ab0c0'; for (let x = 0; x < 240; x += 8) ctx.fillRect(x + ((eng.t >> 4) & 3), SURF, 4, 1);
    // bed: gravel with gold glints, swaying weed
    ctx.fillStyle = '#2a1a12'; ctx.fillRect(0, BOTTOM, 240, 320 - BOTTOM);
    ctx.fillStyle = '#4a3020'; for (let x = 0; x < 240; x += 6) ctx.fillRect(x, BOTTOM + ((x * 7) % 5), 3, 2);
    ctx.fillStyle = BRASS; for (let x = 11; x < 240; x += 37) ctx.fillRect(x, BOTTOM + 8, 1, 1);
    ctx.fillStyle = '#1f4a30'; for (let x = 14; x < 240; x += 46) for (let j = 0; j < 7; j++) ctx.fillRect(x + Math.round(Math.sin(eng.t / 30 + j * 0.6 + x) * 2), BOTTOM - j * 4, 2, 4);
    // fish
    for (const f of s.fish) { eng.sprite(ctx, FISH, f.kind === 'gold' ? GOLD_C : SILV_C, f.x, f.y, 2, f !== s.caught && f.vx < 0); tag(ctx, f); }
    // depth marker on the seabed
    ctx.fillStyle = BRASS; ctx.fillRect(196, BOTTOM - 14, 1, 16); ctx.fillStyle = VEL; ctx.fillRect(188, BOTTOM - 22, 34, 9); eng.text(ctx, 'BOTTOM', 205, BOTTOM - 20, CREAM, 'center', 6);
    // drapes
    ctx.fillStyle = VEL; ctx.fillRect(0, 26, 8, 294); ctx.fillRect(232, 26, 8, 294); ctx.fillStyle = VEL2; ctx.fillRect(5, 26, 3, 294); ctx.fillRect(232, 26, 3, 294);
    // boat with attendant and rod
    const bx = Math.round(s.boatX), by = SURF - 10;
    ctx.fillStyle = VEL; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 36, by); ctx.lineTo(bx + 30, by + 10); ctx.lineTo(bx + 6, by + 10); ctx.fill();
    ctx.fillStyle = GOLD; ctx.fillRect(bx, by, 36, 2); ctx.fillStyle = BRASS; ctx.fillRect(bx + 8, by + 5, 20, 1);
    ctx.fillStyle = PAL.bg; ctx.fillRect(bx + 10, by - 9, 7, 9); ctx.fillStyle = '#f4f0e6'; ctx.fillRect(bx + 12, by - 7, 3, 6); ctx.fillStyle = '#e8c8a0'; ctx.fillRect(bx + 11, by - 15, 5, 6);
    ctx.fillStyle = PAL.bg; ctx.fillRect(bx + 10, by - 17, 7, 3);
    ctx.strokeStyle = BRASS; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx + 16, by - 4); ctx.lineTo(hx + 0.5, by - 22); ctx.stroke();
    // line and hook
    ctx.strokeStyle = CREAM; ctx.beginPath(); ctx.moveTo(hx + 0.5, by - 22); ctx.lineTo(hx + 0.5, s.hookY); ctx.stroke();
    ctx.fillStyle = GOLD; const hy = Math.round(s.hookY);
    ctx.fillRect(hx, hy, 1, 6); ctx.fillRect(hx - 3, hy + 6, 4, 1); ctx.fillRect(hx - 4, hy + 3, 1, 3); ctx.fillRect(hx - 2, hy + 1, 3, 2);
    // pops
    for (const p of s.pops) { ctx.globalAlpha = Math.min(1, p.t / 15); text(ctx, p.txt, p.x, p.y, p.c, 'center', 6); ctx.globalAlpha = 1; }
    // photograph flash
    if (s.flash) {
      ctx.fillStyle = `rgba(255,248,230,${s.flash / 26})`; ctx.fillRect(0, 0, 240, 320);
      ctx.strokeStyle = GOLD; ctx.lineWidth = 2; ctx.strokeRect(60, 96, 120, 76); text(ctx, 'TROPHY', 120, 114, VEL, 'center'); text(ctx, 'PHOTOGRAPH', 120, 128, VEL, 'center'); text(ctx, 'FISH RETURNED', 120, 150, VEL2, 'center', 6);
    }
    // HUD
    ctx.fillStyle = PAL.bg; ctx.fillRect(0, 0, 240, 26); ctx.fillStyle = BRASS; ctx.fillRect(0, 26, 240, 1);
    text(ctx, String(eng.score).padStart(6, '0'), 4, 3, PAL.ink);
    text(ctx, `POND ${s.r}`, 4, 15, BRASS, 'left', 6);
    for (let i = 0; i < NEED; i++) eng.sprite(ctx, FISH, i < s.gold ? GOLD_C : { B: '#3a2a30', b: '#2a1a20', e: '#2a1a20' }, 92 + i * 22, 6, 2);
    const secs = Math.ceil(s.time / 60);
    text(ctx, `${secs}`, 236, 3, secs <= 10 ? PAL.red : GOLD, 'right');
    text(ctx, eng.god && secs <= 1 ? 'CLOCK WAITS' : 'SECONDS', 236, 15, BRASS, 'right', 6);
    if (eng.state !== 'play') return;
    if (s.phase === 'clear') {
      ctx.fillStyle = 'rgba(7,6,12,0.85)'; ctx.fillRect(16, 120, 208, 62);
      text(ctx, 'THREE PHOTOGRAPHS', 120, 128, GOLD, 'center'); text(ctx, `PUNCTUALITY +${s.bonus}`, 120, 146, PAL.green, 'center'); text(ctx, 'THE POND HAS BEEN RESTOCKED', 120, 164, CREAM, 'center', 6);
    } else if (s.banner && s.phase === 'play') {
      ctx.fillStyle = 'rgba(7,6,12,0.8)'; ctx.fillRect(16, 168, 208, 50);
      text(ctx, 'UNDERVALUED GOLD ONLY', 120, 176, GOLD, 'center'); text(ctx, 'HOLD A TO LOWER', 120, 192, CREAM, 'center', 6); text(ctx, 'RELEASE TO REEL', 120, 204, CREAM, 'center', 6);
    }
  },
};
boot(game);
