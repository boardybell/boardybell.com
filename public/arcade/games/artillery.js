// Capital Deployment: an artillery game. Set the angle and power, launch a money bag, land one on each of
// three start-up balconies within six launches. Striped awnings bounce bags onward instead of stopping them.
// Later rounds narrow the balconies, add canopies and introduce a breeze.
import { boot, PAL } from '../engine.js';
const VEL = '#5a1230', VEL2 = '#3a0b1f', GOLD = '#ffb238', CREAM = '#ffe9a8', BRASS = '#c9a15a', STONE = '#e6d6b0';
const G = 0.12, GROUND = 292, FACADE = 204, LX = 24, LY = 278, SHOTS = 6, R = 4;
const BAG = ['..k...k..', '...kkk...', '...sss...', '..sssss..', '.ssGGGsS.', 'ssGgGGGsS', 'ssGGGGGsS', 'ssGGGGGSS', '.sssGsSS.', '..sSSSS..'];
const BAG_C = { k: BRASS, s: '#c8b088', S: '#9a8060', G: GOLD, g: CREAM };
const NAMES = ['ZORBL', 'KWIBB', 'PLUMO', 'DRUBB', 'YONKA', 'QUIBO', 'TREMM', 'WOBLR', 'FENNO', 'SNERF'];
const GLOVE = ['..w.w...', '.wwwww..', '.wwwww.w', '.wwwwwww', '.wwwwww.', '..wwww..', '..gggg..', '..gggg..'];
const GLOVE_C = { w: '#f4f0e6', g: BRASS };
let s;

function layout(r) {
  const y1 = 112 + Math.random() * 18, y2 = y1 + 48 + Math.random() * 12, y3 = Math.min(262, y2 + 48 + Math.random() * 12);
  const shrink = Math.min(8, (r - 1) * 2);
  let ws = [22, 30, 38].map((w) => w - shrink + Math.round(Math.random() * 4));
  if (r >= 3 && Math.random() < 0.5) ws = [ws[1], ws[0], ws[2]];
  s.balc = [y1, y2, y3].map((y, i) => ({ y: Math.round(y), x: FACADE - ws[i], w: ws[i], served: 0 }));
  const pool = [...NAMES].sort(() => Math.random() - 0.5); s.balc.forEach((b, i) => { b.name = pool[i]; });
  const kx = 78 + Math.random() * 40;
  s.awn = [{ x: Math.round(kx), y: Math.round(206 + Math.random() * 30), w: 36, kick: 0.5, post: true }];
  if (r >= 2) { const b = s.balc[(Math.random() * 2) | 0]; const aw = Math.max(14, Math.round(b.w * 0.6)); s.awn.push({ x: FACADE - aw, y: b.y - 22, w: aw, kick: -0.3 }); }
  if (r >= 4) s.awn.push({ x: 40 + Math.random() * 30, y: 150 + Math.random() * 30, w: 28, kick: 0.6 });
  s.wind = r >= 3 ? (Math.random() - 0.5) * Math.min(0.008, 0.002 * (r - 2)) : 0;
}
function startRound(r) { s.r = r; s.shots = SHOTS; s.phase = 'aim'; s.ham = null; s.banner = 100; layout(r); }
const pop = (txt, x, y, c) => s.pops.push({ txt, x: Math.max(50, Math.min(190, x)), y, c, t: 60 });
const unserved = () => s.balc.filter((b) => !b.served);

function launch(eng) {
  const a = (s.ang * Math.PI) / 180, v = s.pow * 0.09;
  s.ham = { x: LX + Math.cos(a) * 16, y: LY - Math.sin(a) * 16, vx: Math.cos(a) * v, vy: -Math.sin(a) * v, bounces: 0, t: 0 };
  s.shots--; s.phase = 'fly'; eng.beep(160, 0.15, 'square', 0.05, 300); eng.beep(90, 0.2, 'triangle', 0.05);
}
function deliver(eng, b, how) {
  b.served = 1; const h = s.ham, pts = 500 * s.r + h.bounces * 300;
  eng.score += pts; s.ham = null;
  pop(how || (h.bounces ? `PARTNER ASSISTED +${pts}` : `FUNDED +${pts}`), b.x + b.w / 2, b.y - 22, h.bounces ? PAL.green : GOLD);
  eng.beep(784, 0.08); eng.beep(1046, 0.08); eng.beep(1568, 0.2, 'triangle');
  resolve(eng);
}
function miss(eng, txt) {
  const h = s.ham, open = unserved();
  if (eng.god && open.length) { // god mode: a gloved attendant catches the bag and redirects it to an unfunded balcony
    const b = open.reduce((m, o) => (Math.hypot(o.x - h.x, o.y - h.y) < Math.hypot(m.x - h.x, m.y - h.y) ? o : m));
    h.x = Math.max(8, Math.min(FACADE - 8, h.x)); h.y = Math.min(GROUND - R, h.y);
    s.glove = { x: h.x, y: h.y, t: 24 }; h.hold = 24; h.guide = b; h.T = 50;
    const tx = b.x + b.w / 2, ty = b.y - R;
    h.vx = (tx - h.x) / h.T; h.vy = (ty - h.y - 0.5 * G * h.T * h.T) / h.T;
    pop('REDIRECTED', h.x, h.y - 20, CREAM); eng.beep(1320, 0.06, 'triangle');
    return;
  }
  pop(txt, h.x, Math.min(250, h.y - 20), PAL.red); eng.beep(110, 0.3, 'sawtooth', 0.05, -40);
  s.ham = null; resolve(eng);
}
function resolve(eng) {
  if (!unserved().length) { s.bonus = s.shots * 250 * s.r; eng.score += s.bonus; s.phase = 'clear'; s.timer = 150; }
  else if (s.shots <= 0 && !eng.god) { s.phase = 'dead'; s.timer = 90; }
  else { if (s.shots <= 0) s.shots = 1; s.phase = 'wait'; s.timer = 30; }
}
function step(eng, h) {
  const px = h.x, py = h.y;
  h.vy += G; h.vx += s.wind; h.x += h.vx; h.y += h.vy;
  for (const a of s.awn) {
    if (h.x < a.x - 2 || h.x > a.x + a.w + 2) continue;
    if (py + R <= a.y && h.y + R >= a.y && h.vy > 0) { h.y = a.y - R; h.vy = -Math.max(2.4, h.vy * 0.82); h.vx += a.kick; h.bounces++; a.wob = 14; eng.beep(420, 0.1, 'triangle', 0.05, 300); return; }
    if (py - R >= a.y + 5 && h.y - R <= a.y + 5 && h.vy < 0) { h.y = a.y + 5 + R; h.vy = Math.abs(h.vy) * 0.3; return; }
  }
  for (const b of s.balc) {
    if (h.x >= b.x - 1 && py + R <= b.y && h.y + R >= b.y && h.vy > 0) {
      if (!b.served) { h.y = b.y - R; deliver(eng, b); } else miss(eng, 'ALREADY FUNDED');
      return;
    }
    if (h.x >= b.x && py - R >= b.y + 6 && h.y - R <= b.y + 6 && h.vy < 0) { h.y = b.y + 6 + R; h.vy = Math.abs(h.vy) * 0.3; }
    if (px + R <= b.x && h.x + R >= b.x && h.y > b.y - 2 && h.y < b.y + 8) { h.x = b.x - R; h.vx = -Math.abs(h.vx) * 0.4; }
  }
  if (h.x + R >= FACADE) { h.x = FACADE - R; h.vx = -Math.max(0.6, Math.abs(h.vx) * 0.45); }
  if (h.y + R >= GROUND) miss(eng, 'RECEIVED BY THE LAWN');
  else if (h.x < -12) miss(eng, 'SENT TO THE NEIGHBOURS');
  else if (++h.t > 900) miss(eng, 'LOST IN TRANSIT');
}

const game = {
  id: 'artillery',
  reset() { s = { ang: 50, pow: 62, pops: [], glove: null, timer: 0 }; startRound(1); },
  update(eng) {
    const k = eng.keys;
    for (const p of s.pops) { p.t--; p.y -= 0.3; }
    s.pops = s.pops.filter((p) => p.t > 0);
    for (const a of s.awn) if (a.wob) a.wob--;
    if (s.banner) s.banner--;
    if (s.glove && --s.glove.t <= 0) s.glove = null;
    if (s.phase === 'dead') { if (--s.timer <= 0) eng.gameOver('CAPITAL DECLINED'); return; }
    if (s.phase === 'clear') { if (--s.timer <= 0) startRound(s.r + 1); return; }
    if (s.phase === 'wait') { if (--s.timer <= 0) s.phase = 'aim'; return; }
    if (s.phase === 'aim') {
      if (k.left) s.ang = Math.min(80, s.ang + 0.5); if (k.right) s.ang = Math.max(10, s.ang - 0.5);
      if (k.up) s.pow = Math.min(100, s.pow + 0.4); if (k.down) s.pow = Math.max(15, s.pow - 0.4);
      if ((k.up || k.down || k.left || k.right) && (eng.t & 7) === 0) eng.beep(200 + s.pow * 6, 0.02, 'square', 0.015);
      if (eng.pressed.act) launch(eng);
      return;
    }
    const h = s.ham; if (!h) return;
    if (h.guide) { // redirected flight: no collisions, lands on the chosen balcony
      if (h.hold) { h.hold--; return; }
      h.vy += G; h.x += h.vx; h.y += h.vy;
      if (--h.T <= 0) { h.x = h.guide.x + h.guide.w / 2; h.y = h.guide.y - R; deliver(eng, h.guide, 'ATTENDED DELIVERY'); }
      return;
    }
    for (let i = 0; i < 2 && s.ham === h && !h.guide; i++) step(eng, h);
  },
  draw(eng, ctx) {
    const { text } = eng;
    // softly glowing gold sky
    const g = ctx.createLinearGradient(0, 26, 0, GROUND); g.addColorStop(0, VEL2); g.addColorStop(0.55, '#7a2a3a'); g.addColorStop(1, '#e0a050');
    ctx.fillStyle = g; ctx.fillRect(0, 26, 240, GROUND - 26);
    ctx.fillStyle = 'rgba(255,233,168,0.5)'; for (let i = 0; i < 18; i++) ctx.fillRect((i * 67) % 200, 34 + ((i * 29) % 70), 1, 1);
    // courtyard hedge and paving
    ctx.fillStyle = '#2a3a20'; for (let x = 0; x < FACADE; x += 14) ctx.fillRect(x, GROUND - 10 - ((x / 14) & 1) * 3, 14, 12);
    ctx.fillStyle = '#3a2a20'; ctx.fillRect(0, GROUND, 240, 320 - GROUND);
    ctx.fillStyle = '#4a382a'; for (let x = 0; x < 240; x += 12) for (let y = GROUND + 2; y < 320; y += 8) ctx.fillRect(x + ((y >> 3) & 1) * 6, y, 10, 6);
    ctx.fillStyle = BRASS; ctx.fillRect(0, GROUND, 240, 1);
    // facade with windows
    ctx.fillStyle = STONE; ctx.fillRect(FACADE, 26, 36, GROUND - 26);
    ctx.fillStyle = '#c4b08a'; ctx.fillRect(FACADE, 26, 2, GROUND - 26);
    for (let y = 40; y < GROUND - 14; y += 24) { ctx.fillStyle = '#2a1830'; ctx.fillRect(FACADE + 10, y, 16, 14); ctx.fillStyle = 'rgba(255,178,56,0.55)'; ctx.fillRect(FACADE + 12, y + 2, 5, 10); ctx.fillRect(FACADE + 19, y + 2, 5, 10); }
    // balconies
    for (const b of s.balc) {
      ctx.fillStyle = STONE; ctx.fillRect(b.x, b.y, b.w, 6); ctx.fillStyle = '#9a8a6a'; ctx.fillRect(b.x, b.y + 6, b.w, 2);
      ctx.fillStyle = BRASS; ctx.fillRect(b.x, b.y - 6, 1, 6); ctx.fillRect(b.x, b.y - 6, b.w, 1); for (let x = b.x + 4; x < FACADE; x += 4) ctx.fillRect(x, b.y - 5, 1, 5);
      ctx.fillStyle = VEL; ctx.fillRect(FACADE - 34, b.y + 10, 34, 10); ctx.fillStyle = BRASS; ctx.fillRect(FACADE - 34, b.y + 8, 1, 2); ctx.fillRect(FACADE - 2, b.y + 8, 1, 2);
      eng.text(ctx, b.name, FACADE - 17, b.y + 12, b.served ? PAL.green : CREAM, 'center', 6);
      if (b.served) {
        eng.sprite(ctx, BAG, BAG_C, b.x + 2, b.y - 20, 2);
        ctx.fillStyle = PAL.bg; ctx.fillRect(FACADE - 8, b.y - 14, 5, 14); ctx.fillStyle = '#f4f0e6'; ctx.fillRect(FACADE - 9, b.y - 10, 2, 2); ctx.fillStyle = '#e8c8a0'; ctx.fillRect(FACADE - 8, b.y - 19, 5, 5);
      } else if ((eng.t >> 4) & 1) { ctx.fillStyle = GOLD; ctx.fillRect(b.x + b.w / 2 - 3, b.y - 16, 7, 2); ctx.fillRect(b.x + b.w / 2 - 1, b.y - 14, 3, 3); }
    }
    // awnings: striped, scalloped; the kiosk one stands on brass posts
    for (const a of s.awn) {
      const y = a.y + (a.wob ? Math.round(Math.sin(a.wob) * 2) : 0);
      if (a.post) { ctx.fillStyle = BRASS; ctx.fillRect(a.x + 2, y + 5, 2, GROUND - y - 5); ctx.fillRect(a.x + a.w - 4, y + 5, 2, GROUND - y - 5); ctx.fillStyle = VEL2; ctx.fillRect(a.x + 4, GROUND - 16, a.w - 8, 16); }
      ctx.fillStyle = VEL2; ctx.fillRect(a.x - 1, y - 1, a.w + 2, 7);
      for (let x = 0; x < a.w; x += 4) { ctx.fillStyle = (x >> 2) & 1 ? CREAM : '#c0284a'; ctx.fillRect(a.x + x, y, Math.min(4, a.w - x), 5); ctx.fillRect(a.x + x + 1, y + 5, 2, 2); }
    }
    // launcher: brass barrel on a burgundy carriage
    const a = (s.ang * Math.PI) / 180;
    ctx.save(); ctx.translate(LX, LY); ctx.rotate(-a); ctx.fillStyle = BRASS; ctx.fillRect(-2, -4, 20, 8); ctx.fillStyle = GOLD; ctx.fillRect(14, -5, 4, 10); ctx.fillStyle = '#8a6a30'; ctx.fillRect(-2, 2, 20, 2); ctx.restore();
    ctx.fillStyle = VEL; ctx.fillRect(LX - 12, LY, 24, 8); ctx.fillStyle = PAL.bg; ctx.beginPath(); ctx.arc(LX - 6, LY + 9, 5, 0, 7); ctx.arc(LX + 6, LY + 9, 5, 0, 7); ctx.fill();
    ctx.fillStyle = BRASS; ctx.fillRect(LX - 7, LY + 8, 2, 2); ctx.fillRect(LX + 5, LY + 8, 2, 2);
    // aiming dots: the preview shortens as the rounds go on
    if (s.phase === 'aim') {
      const v = s.pow * 0.09; let x = LX + Math.cos(a) * 16, y = LY - Math.sin(a) * 16, vx = Math.cos(a) * v, vy = -Math.sin(a) * v;
      const n = Math.max(18, 48 - s.r * 8);
      for (let i = 1; i <= n; i++) { vy += G; vx += s.wind; x += vx; y += vy; if (i % 4 === 0) { ctx.fillStyle = i < n * 0.6 ? CREAM : 'rgba(255,233,168,0.4)'; ctx.fillRect(Math.round(x), Math.round(y), 2, 2); } }
    }
    const h = s.ham;
    if (h) { eng.sprite(ctx, BAG, BAG_C, h.x - 9, h.y - 14, 2); if (h.y < 30) { ctx.fillStyle = GOLD; ctx.fillRect(h.x - 2, 30, 5, 3); } }
    if (s.glove) eng.sprite(ctx, GLOVE, GLOVE_C, s.glove.x - 8, s.glove.y + 4, 2);
    for (const p of s.pops) { ctx.globalAlpha = Math.min(1, p.t / 15); text(ctx, p.txt, p.x, p.y, p.c, 'center', 6); ctx.globalAlpha = 1; }
    // HUD
    ctx.fillStyle = PAL.bg; ctx.fillRect(0, 0, 240, 26); ctx.fillStyle = BRASS; ctx.fillRect(0, 26, 240, 1);
    text(ctx, String(eng.score).padStart(6, '0'), 4, 3, PAL.ink);
    text(ctx, `ROUND ${s.r}`, 120, 3, GOLD, 'center');
    for (let i = 0; i < SHOTS; i++) { ctx.fillStyle = i < s.shots ? '#c8b088' : '#2a1a20'; ctx.fillRect(234 - i * 9, 4, 7, 6); ctx.fillRect(236 - i * 9, 2, 3, 2); if (i < s.shots) { ctx.fillStyle = GOLD; ctx.fillRect(236 - i * 9, 6, 3, 3); } }
    text(ctx, `ANGLE ${Math.round(s.ang)}`, 4, 15, CREAM, 'left', 6);
    text(ctx, 'POWER', 82, 15, CREAM, 'left', 6);
    ctx.fillStyle = '#2a1a20'; ctx.fillRect(116, 15, 50, 6); ctx.fillStyle = s.pow > 85 ? PAL.orange : GOLD; ctx.fillRect(116, 15, (s.pow / 100) * 50, 6);
    if (s.wind) {
      const w = Math.round(s.wind * 2500), x0 = 206; text(ctx, 'AIR', 172, 15, BRASS, 'left', 6);
      ctx.fillStyle = CREAM; ctx.fillRect(Math.min(x0, x0 + w), 18, Math.abs(w) + 1, 1); const d = Math.sign(w); if (d) { ctx.fillRect(x0 + w - d, 17, 1, 3); ctx.fillRect(x0 + w - 2 * d, 16, 1, 5); }
    }
    if (eng.state !== 'play') return;
    if (s.phase === 'clear') {
      ctx.fillStyle = 'rgba(7,6,12,0.85)'; ctx.fillRect(12, 100, 216, 60);
      text(ctx, 'ALL START-UPS FUNDED', 120, 108, GOLD, 'center'); text(ctx, `RESTRAINT +${s.bonus}`, 120, 126, PAL.green, 'center'); text(ctx, 'FURTHER CAPITAL AUTHORISED', 120, 144, CREAM, 'center', 6);
    } else if (s.phase === 'dead') {
      ctx.fillStyle = 'rgba(7,6,12,0.85)'; ctx.fillRect(12, 110, 216, 30); text(ctx, 'ALLOCATION EXHAUSTED', 120, 121, PAL.red, 'center');
    } else if (s.banner && s.phase === 'aim') {
      ctx.fillStyle = 'rgba(7,6,12,0.8)'; ctx.fillRect(12, 60, 176, 40);
      text(ctx, 'FUND 3 START-UPS', 100, 68, GOLD, 'center'); text(ctx, `${SHOTS} BAGS ALLOCATED`, 100, 84, CREAM, 'center', 6);
    }
  },
};
boot(game);
