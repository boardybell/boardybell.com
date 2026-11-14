// Risk Appetite: push-your-luck dice. Roll for returns or cash out; a margin call face ends the visit with nothing.
// Every successful roll turns the face that paid black. Eight visits; later visits start with more black faces but pay more.
import { boot, PAL, text } from '../engine.js';
const VISITS = 8, ROLLT = 40;
const VEL = '#5a1230', VEL2 = '#3a0b1f', GOLD = '#ffb238', PALE = '#ffe9a8', BRASS = '#c9a15a', CREAM = '#f4ead2', INK = '#07060c', IVORY = '#efe4cc';
const PIPS = [[], [[0, 0]], [[-1, -1], [1, 1]], [[-1, -1], [0, 0], [1, 1]], [[-1, -1], [1, -1], [-1, 1], [1, 1]], [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]]];
let s;

const tier = () => (s.visit <= 3 ? 1 : s.visit <= 6 ? 2 : 3);
const sealValue = (n) => n * 10 * tier();
function newVisit() {
  const b = tier(), black = [false, false, false, false, false, false];
  const order = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);
  for (let i = 0; i < b; i++) black[order[i]] = true;
  s.black = black; s.seals = 0; s.pend = 0; s.face = order[b]; s.phase = 'choose'; s.choice = 0; s.timer = 0; s.flash = -1;
  s.msg = s.visit === 1 ? 'ROLL FOR RETURNS. AVOID MARGIN CALLS.' : `VISIT ${s.visit}. THE DIE REMEMBERS NOTHING.`;
  if (b > 1 && (s.visit === 4 || s.visit === 7)) s.msg = 'DIE RE-RATED. RETURNS PAY MORE.';
}

const game = {
  id: 'dice', tapIsAct: true,
  reset() { s = { visit: 1, banked: 0, best: 0, lastPX: null, wob: 0 }; newVisit(); },
  update(eng) {
    if (s.wob) s.wob--;
    if (s.phase === 'roll') {
      if (s.timer % Math.max(2, (ROLLT - s.timer) >> 3) === 0) { s.face = (s.face + 1 + ((Math.random() * 5) | 0)) % 6; eng.beep(500 + Math.random() * 300, 0.02, 'square', 0.02); }
      if (--s.timer <= 0) settle(eng);
      return;
    }
    if (s.phase === 'between') {
      if (--s.timer <= 0) { if (s.visit >= VISITS) eng.gameOver(`APPETITE ASSESSED. ${s.banked} RETURNS ON FILE.`); else { s.visit++; newVisit(); } }
      return;
    }
    // choose: left/right between Roll and Cash Out; a tap picks by side of the screen and confirms
    if (eng.pressed.left && s.choice) { s.choice = 0; eng.beep(660, 0.03); }
    if (eng.pressed.right && !s.choice) { s.choice = 1; eng.beep(660, 0.03); }
    if (eng.pointerX != null && eng.pointerX !== s.lastPX) { s.choice = eng.pointerX < 120 ? 0 : 1; s.lastPX = eng.pointerX; }
    if (!eng.pressed.act) return;
    if (s.choice === 0) { s.phase = 'roll'; s.timer = ROLLT; s.out = (Math.random() * 6) | 0; s.flash = -1; s.msg = 'THE DIE IS CONSIDERING YOUR REQUEST.'; eng.beep(330, 0.06, 'triangle'); }
    else if (!s.seals) { s.msg = 'NOTHING TO DECLARE. PLEASE ROLL.'; s.wob = 12; eng.beep(150, 0.08, 'triangle', 0.04); }
    else {
      eng.score += s.pend; s.banked += s.seals; s.best = Math.max(s.best, s.seals);
      s.msg = `${s.seals} RETURN${s.seals > 1 ? 'S' : ''} BOOKED. +${s.pend}`; s.phase = 'between'; s.timer = 110; s.result = 'cash';
      eng.beep(880, 0.08); eng.beep(1175, 0.1); eng.beep(1568, 0.16, 'triangle', 0.04);
    }
  },
  draw(eng, ctx) {
    const { text } = eng;
    // velvet room and a brass-railed gaming tray
    for (let x = 0; x < 240; x += 16) { ctx.fillStyle = (x / 16) % 2 ? VEL : '#4c0f29'; ctx.fillRect(x, 0, 16, 320); }
    ctx.fillStyle = BRASS; ctx.fillRect(10, 58, 220, 126); ctx.fillStyle = VEL2; ctx.fillRect(14, 62, 212, 118);
    ctx.fillStyle = 'rgba(255,233,168,0.04)'; for (let y = 64; y < 178; y += 4) ctx.fillRect(16, y, 208, 1);
    // the die: large, center left, with a little wobble while rolling or when refused
    const sh = s.phase === 'roll' ? ((Math.random() - 0.5) * 6) | 0 : s.wob ? ((s.wob % 4) - 2) * 2 : 0;
    die(ctx, 48 + sh, 82 + (s.phase === 'roll' ? ((s.timer >> 1) % 2) * -3 : 0), 72, s.face, s.black[s.face], s.phase === 'between' && s.result === 'bust');
    // this visit's returns (chips), stacked to the right of the die
    const n = s.seals;
    for (let i = 0; i < Math.min(n, 9); i++) seal(ctx, 172, 162 - i * 9);
    if (n > 9) text(ctx, `+${n - 9}`, 172, 72, PALE, 'center', 6);
    text(ctx, n ? `${n} RETURN${n > 1 ? 'S' : ''}` : 'NO RETURNS', 172, 168, n ? PALE : PAL.grey, 'center', 6);
    // the six-face strip: every face, gold or margin call
    text(ctx, 'THE DIE, FULLY DISCLOSED', 120, 192, CREAM, 'center', 6);
    for (let i = 0; i < 6; i++) {
      const fl = s.flash === i && (eng.t >> 2) % 2;
      die(ctx, 4 + i * 39, 202, 36, i, s.black[i], fl);
    }
    const gold = s.black.filter((b) => !b).length;
    text(ctx, `ODDS OF ASSISTANCE ${gold}/6`, 120, 242, gold <= 2 ? PAL.red : PALE, 'center', 6);
    text(ctx, `NEXT RETURN +${sealValue(n + 1)}  HELD +${s.pend}`, 120, 254, CREAM, 'center', 6);
    // Roll / Cash Out buttons
    const btn = (x, label, on) => {
      ctx.fillStyle = on ? GOLD : '#2a0816'; ctx.fillRect(x, 270, 104, 26);
      ctx.fillStyle = on ? PALE : BRASS; ctx.fillRect(x, 270, 104, 2);
      text(ctx, label, x + 52, 279, on ? INK : CREAM, 'center');
      if (on && s.phase === 'choose' && (eng.t >> 4) % 2) { ctx.fillStyle = PALE; ctx.fillRect(x + 4, 280, 4, 6); ctx.fillRect(x + 96, 280, 4, 6); }
    };
    btn(10, 'ROLL', s.choice === 0); btn(126, 'CASH OUT', s.choice === 1);
    // message line
    const m = s.msg || '';
    text(ctx, m, 120, 304, s.phase === 'between' && s.result === 'bust' ? PAL.red : PALE, 'center', 6);
    // HUD
    ctx.fillStyle = 'rgba(7,6,12,0.85)'; ctx.fillRect(0, 0, 240, 32); ctx.fillStyle = BRASS; ctx.fillRect(0, 32, 240, 2);
    text(ctx, `VISIT ${s.visit}/${VISITS}`, 4, 4, GOLD);
    text(ctx, String(eng.score).padStart(6, '0'), 236, 4, PAL.ink, 'right');
    text(ctx, `RETURNS ON FILE ${s.banked}`, 4, 18, CREAM, 'left', 6);
    text(ctx, `TIER ${tier()}`, 236, 18, PALE, 'right', 6);
    if (s.phase === 'between') {
      const bust = s.result === 'bust';
      ctx.fillStyle = 'rgba(7,6,12,0.85)'; ctx.fillRect(14, 40, 212, 16);
      text(ctx, bust ? 'MARGIN CALL' : s.visit >= VISITS ? 'FINAL VISIT CONCLUDED' : 'VISIT CONCLUDED', 120, 44, bust ? PAL.red : GOLD, 'center');
    }
  },
};
function settle(eng) {
  const f = s.out; s.face = f;
  if (s.black[f] && !eng.god) {
    s.msg = 'MARGIN CALL. RETURNS WITHDRAWN.'; s.seals = 0; s.pend = 0; s.phase = 'between'; s.timer = 120; s.result = 'bust';
    eng.beep(200, 0.2, 'sawtooth', 0.05, -100); eng.beep(110, 0.4, 'sawtooth', 0.05, -60);
    return;
  }
  s.seals++; s.pend += sealValue(s.seals); s.phase = 'choose';
  if (s.black[f]) { s.msg = 'MARGIN CALL WAIVED. RETURN PAID.'; eng.beep(440, 0.08, 'triangle'); } // god mode: margin call faces pay a return too
  else { s.black[f] = true; s.flash = f; s.msg = s.black.every(Boolean) ? 'ALL MARGIN CALLS. CASH OUT ADVISED.' : 'RETURN BOOKED. THE DIE GROWS WARY.'; eng.beep(880, 0.06); eng.beep(1320, 0.08, 'triangle', 0.04); }
}
function die(ctx, x, y, sz, face, black, hot) {
  const r = Math.max(2, sz / 10);
  ctx.fillStyle = hot ? PAL.red : black ? '#000000' : '#8a7a5a'; ctx.fillRect(x + r, y + 2, sz - r * 2 + 2, sz);
  ctx.fillStyle = black ? '#141016' : IVORY;
  ctx.fillRect(x + r, y, sz - r * 2, sz); ctx.fillRect(x, y + r, sz, sz - r * 2);
  if (!black) { ctx.fillStyle = '#fffaf0'; ctx.fillRect(x + r, y, sz - r * 2, Math.max(1, sz / 24)); }
  else { ctx.strokeStyle = hot ? PAL.red : '#3a3040'; ctx.strokeRect(x + 0.5, y + r + 0.5, sz - 1, sz - r * 2 - 1); }
  if (black) { // margin call face: red lettering on matte black, no pips
    const big = sz > 40;
    if (big) { text(ctx, 'MARGIN', x + sz / 2, y + sz / 2 - 10, PAL.red, 'center', 8); text(ctx, 'CALL', x + sz / 2, y + sz / 2 + 2, PAL.red, 'center', 8); }
    else { ctx.fillStyle = PAL.red; ctx.fillRect(x + 5, y + 9, sz - 10, 2); ctx.fillRect(x + 5, y + sz - 11, sz - 10, 2); text(ctx, 'CALL', x + sz / 2, y + sz / 2 - 3, PAL.red, 'center', 6); } // strip faces are too narrow for MARGIN
    return;
  }
  const p = Math.max(2, Math.round(sz / 9)), off = sz * 0.27;
  for (const [dx, dy] of PIPS[face + 1]) {
    const cx = x + sz / 2 + dx * off, cy = y + sz / 2 + dy * off;
    ctx.fillStyle = black ? '#2c2430' : GOLD;
    ctx.fillRect(cx - p / 2, cy - p, p, p * 2); ctx.fillRect(cx - p, cy - p / 2, p * 2, p); // little diamond crests
    if (!black && sz > 40) { ctx.fillStyle = PALE; ctx.fillRect(cx - 1, cy - p + 1, 2, 2); }
  }
}
function seal(ctx, x, y) {
  ctx.fillStyle = '#7a5a20'; ctx.fillRect(x - 13, y + 2, 26, 6);
  ctx.fillStyle = GOLD; ctx.fillRect(x - 13, y, 26, 6); ctx.fillRect(x - 11, y - 1, 22, 8);
  ctx.fillStyle = PALE; ctx.fillRect(x - 9, y, 18, 1);
  text(ctx, '%', x, y, VEL, 'center', 6);
}
boot(game);
