// Know Your Customer: a memory game. Four members arrive in a sequence, then change seats.
// Each carries an identity card with a distinct emblem. Recall the arrival order by guest, not by chair. The sequence grows by one each round.
import { boot, PAL } from '../engine.js';
const C = { vel: '#5a1230', vel2: '#3a0b1f', gold: '#ffb238', pale: '#ffe9a8', brass: '#c9a15a', cream: '#f4ead2', black: '#07060c' };
const FW = 100, FH = 128, SEAT = [[14, 40], [126, 40], [14, 176], [126, 176]];
const SK = { s: '#f0c8a0', K: '#07060c', W: '#f4ead2', r: '#b0303a', G: '#ffb238', w: '#ffffff' };
const GUESTS = [
  { name: 'THE ADMIRAL', bg: '#1a2a4a', f: 392, cols: { ...SK, N: '#22305a' }, rows: [
    '................', '....NNNNNNNN....', '...NNNNNGNNNN...', '...NNNNGGGNNN...', '..NNNNNNNNNNNN..', '..KKKKKKKKKKKK..', '....ssssssss....',
    '...ssKssssKss...', '...ssssssssss...', '...ssssssssss...', '...WWssssssWW...', '...WWWWWWWWWW...', '...WWWWrrWWWW...', '....WWWWWWWW....',
    '.....WWWWWW.....', '..NNNNWWWWNNNN..', '.NNNGNNNNNNGNNN.', '.NNNNNNGNNNNNNN.', '.NNNNNNGNNNNNNN.', '.NNNNNNNNNNNNNN.'] },
  { name: 'THE DOWAGER', bg: '#3a1a40', f: 494, cols: { ...SK, V: '#8a3aa0', P: '#ff7ab0', h: '#c8c8d0' }, rows: [
    '..........PP....', '.........PPP....', '........PPP.....', '.......PP.......', '....VVVVVVVV....', '..VVVVVVVVVVVV..', 'VVVVVVVVVVVVVVVV',
    '....hhhhhhhh....', '...hhsssssshh...', '...hsKssssKsh...', '...hssssssssh...', '...hsssrrsssh...', '....ssssssss....', '.....wwwwww.....',
    '....w.w.w.w.w...', '...VVVVVVVVVV...', '..VVVVVVVVVVVV..', '.VVVVVVVVVVVVVV.', '.VVVVVVVVVVVVVV.', '.VVVVVVVVVVVVVV.'] },
  { name: 'THE BARON', bg: '#3a3020', f: 587, cols: { ...SK, O: '#ffe9a8', M: '#4a2a18' }, rows: [
    '....KKKKKKKK....', '....KKKKKKKK....', '....KKKKKKKK....', '....KKKKKKKK....', '....GGGGGGGG....', '..KKKKKKKKKKKK..', '....ssssssss....',
    '...ssssssssss...', '...sKssssOOOs...', '...ssssssOKOs...', '...ssssssOOOs...', '...ssssssssss...', '...sMMMMMMMMs...', '....ssssssss....',
    '.....ssssss.....', '..KKKKWWWWKKKK..', '.KKKKKWrrWKKKKK.', '.KKKKKWrrWKKKKK.', '.KKKKKKrrKKKKKK.', '.KKKKKKKKKKKKKK.'] },
  { name: 'THE HEIR', bg: '#1a3a30', f: 698, cols: { ...SK, Y: '#ffd23f', P: '#ff4fd8' }, rows: [
    '................', '.....YYYYYYY....', '...YYYYYYYYYY...', '..YYYYYYYYYYYY..', '..YYssssssssY...', '..YsssssssssY...', '...ssssssssss...',
    '...KKKKssKKKK...', '...KKKKKKKKKK...', '...ssssssssss...', '...ssssssssss...', '...sssrrrrsss...', '....ssssssss....', '.....ssssss.....',
    '...PPPPssPPPP...', '..PPPPPPPPPPPP..', '.PPPPPPPPPPPPPP.', '.PPPPWWWWWWPPPP.', '.PPPPPPPPPPPPPP.', '.PPPPPPPPPPPPPP.'] },
];
let s, bound = false;

const tier = () => 1 + Math.floor((s.round - 1) / 5);
function newRound() {
  s.seq.push((Math.random() * 4) | 0);
  if (s.seq.length < 3) return newRound();
  s.phase = 'demo'; s.i = 0; s.timer = 50; s.lit = -1; s.hint = false; s.stamp = null;
}
function shuffleSeats() {
  s.from = s.seats.slice();
  let p;
  do { p = s.seats.slice().sort(() => Math.random() - 0.5); } while (p.filter((g, i) => g !== s.seats[i]).length < (tier() > 1 ? 4 : 2));
  s.seats = p; s.phase = 'shuffle'; s.timer = 54;
}
const seatOf = (g, arr = s.seats) => arr.indexOf(g);

const game = {
  id: 'kyc', tapIsAct: true,
  reset(eng) {
    s = { round: 1, seq: [], seats: [0, 1, 2, 3], cur: 0, pops: [], banner: 0 };
    newRound();
    if (!bound) {
      const cv = document.getElementById('ag-cv');
      // a tap picks that seat; tapIsAct then confirms it
      cv?.addEventListener('pointerdown', (e) => {
        if (eng.state !== 'play' || !s || s.phase !== 'reply') return;
        const r = cv.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * 240, y = ((e.clientY - r.top) / r.height) * 320;
        SEAT.forEach(([sx, sy], i) => { if (x >= sx && x < sx + FW && y >= sy && y < sy + FH) s.cur = i; });
      });
      bound = true;
    }
  },
  update(eng) {
    for (const q of s.pops) { q.t--; q.y -= 0.3; }
    s.pops = s.pops.filter((q) => q.t > 0);
    if (s.flash) s.flash--;
    if (s.stamp && --s.stamp.t <= 0) s.stamp = null;
    if (s.banner) s.banner--;
    if (s.phase === 'demo') {
      const on = Math.max(14, 36 - tier() * 6 - s.round), gap = 10;
      if (--s.timer > 0) { if (s.timer === gap) s.lit = -1; return; }
      if (s.i >= s.seq.length) { s.lit = -1; shuffleSeats(); return; }
      const g = s.seq[s.i++]; s.lit = seatOf(g); s.timer = on + gap; eng.beep(GUESTS[g].f, 0.15, 'triangle', 0.06);
      return;
    }
    if (s.phase === 'shuffle') { if (--s.timer <= 0) { s.phase = 'reply'; s.i = 0; s.stamp = null; } return; }
    if (s.phase === 'ok' || s.phase === 'fail') {
      if (--s.timer > 0) return;
      if (s.phase === 'fail') { eng.gameOver('MEMBER NOT RECOGNISED'); return; }
      if (s.round % 5 === 0) { const b = 500 * tier(); eng.score += b; s.banner = 120; s.bannerTxt = `TIER ${tier()} VERIFIED +${b}`; eng.beep(1046, 0.2); }
      s.round++; newRound(); return;
    }
    // reply
    if (eng.pressed.left || eng.pressed.right) { s.cur ^= 1; eng.beep(330, 0.03, 'square', 0.02); }
    if (eng.pressed.up || eng.pressed.down) { s.cur ^= 2; eng.beep(330, 0.03, 'square', 0.02); }
    if (eng.pressed.act) {
      const g = s.seats[s.cur], want = s.seq[s.i];
      s.lit = s.cur; s.flash = 16; s.stamp = { seat: s.cur, ok: g === want, t: 40 };
      if (g === want) {
        eng.beep(GUESTS[g].f, 0.12, 'triangle', 0.06); eng.score += 10 * s.round; s.i++; s.hint = false;
        if (s.i >= s.seq.length) { const b = 100 * s.round; eng.score += b; s.phase = 'ok'; s.timer = 70; s.pops.push({ x: 120, y: 166, txt: `KNOWN +${b}`, c: C.gold, t: 60 }); }
      } else if (eng.god) { // god mode: the error is politely ignored and the right guest waves
        s.hint = true; s.pops.push({ x: SEAT[s.cur][0] + FW / 2, y: SEAT[s.cur][1] + 40, txt: 'PARDON US', c: C.pale, t: 50 }); eng.beep(200, 0.08, 'triangle', 0.04);
      } else { s.phase = 'fail'; s.timer = 100; s.want = want; eng.beep(140, 0.5, 'sawtooth', 0.05, -60); }
    }
  },
  draw(eng, ctx) {
    const { text } = eng;
    for (let x = 0; x < 240; x += 8) { ctx.fillStyle = (x / 8) % 2 ? C.vel : C.vel2; ctx.fillRect(x, 32, 8, 288); }
    ctx.fillStyle = 'rgba(255,178,56,0.08)'; ctx.fillRect(0, 168, 240, 8);
    const k = s.phase === 'shuffle' ? Math.min(1, Math.max(0, 1 - (s.timer - 6) / 44)) : 1, e = k * k * (3 - 2 * k);
    for (let g = 0; g < 4; g++) {
      const a = SEAT[seatOf(g, s.phase === 'shuffle' ? s.from : s.seats)], b = SEAT[seatOf(g)];
      const x = a[0] + (b[0] - a[0]) * e, y = a[1] + (b[1] - a[1]) * e - Math.sin(e * Math.PI) * 10;
      portrait(eng, ctx, g, x, y, s.lit === seatOf(g) && s.phase !== 'shuffle' && (s.phase === 'demo' || s.flash > 0));
    }
    // cursor and the discreet wave
    if (s.phase === 'reply') {
      const [x, y] = SEAT[s.cur];
      ctx.strokeStyle = (eng.t >> 3) & 1 ? C.cream : C.gold; ctx.lineWidth = 2; ctx.strokeRect(x - 3, y - 3, FW + 6, FH + 6);
      if (s.hint && eng.god) {
        const [hx, hy] = SEAT[seatOf(s.seq[s.i])], w = Math.sin(eng.t * 0.3) * 3;
        ctx.fillStyle = C.cream; ctx.fillRect(hx + FW - 22 + w, hy + 62, 10, 10); ctx.fillRect(hx + FW - 22 + w, hy + 56, 2, 6); ctx.fillRect(hx + FW - 19 + w, hy + 54, 2, 8); ctx.fillRect(hx + FW - 16 + w, hy + 55, 2, 7); ctx.fillRect(hx + FW - 13 + w, hy + 57, 2, 5);
        ctx.fillRect(hx + FW - 19, hy + 72, 4, 10);
      }
    }
    if (s.phase === 'fail') { const [x, y] = SEAT[seatOf(s.want)]; if ((eng.t >> 3) & 1) { ctx.strokeStyle = PAL.red; ctx.lineWidth = 3; ctx.strokeRect(x - 3, y - 3, FW + 6, FH + 6); } }
    if (s.stamp && s.phase !== 'shuffle') {
      const [x, y] = SEAT[s.stamp.seat], col = s.stamp.ok ? PAL.green : PAL.red, txt = s.stamp.ok ? 'VERIFIED' : 'FLAGGED';
      ctx.save(); ctx.translate(x + FW / 2, y + 52); ctx.rotate(-0.22); ctx.globalAlpha = Math.min(1, s.stamp.t / 10);
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.strokeRect(-40, -11, 80, 22); ctx.lineWidth = 1; ctx.strokeRect(-36, -7, 72, 14);
      text(ctx, txt, 0, -4, col, 'center', 8); ctx.restore();
    }
    for (const q of s.pops) { ctx.fillStyle = 'rgba(7,6,12,0.8)'; ctx.fillRect(q.x - 50, q.y - 3, 100, 13); text(ctx, q.txt, q.x, q.y, q.c, 'center', 6); }
    // HUD
    ctx.fillStyle = C.black; ctx.fillRect(0, 0, 240, 32); ctx.fillStyle = C.brass; ctx.fillRect(0, 32, 240, 1);
    text(ctx, `ROUND ${s.round}`, 4, 4, C.gold);
    text(ctx, String(eng.score).padStart(6, '0'), 236, 4, C.cream, 'right');
    const line = s.phase === 'demo' ? 'OBSERVE THE ARRIVALS' : s.phase === 'shuffle' ? 'SEATING HAS CHANGED' : s.phase === 'reply' ? `RECALL ${s.i + 1} OF ${s.seq.length}` : s.phase === 'ok' ? 'ALL MEMBERS KNOWN' : 'AN UNFAMILIAR FACE';
    text(ctx, line, 4, 19, s.phase === 'fail' ? PAL.red : C.pale, 'left', 6);
    text(ctx, `TIER ${tier()}`, 236, 19, C.brass, 'right', 6);
    if (s.banner) { ctx.fillStyle = 'rgba(7,6,12,0.88)'; ctx.fillRect(10, 160, 220, 24); text(ctx, s.bannerTxt, 120, 168, C.gold, 'center', 6); }
  },
};
function portrait(eng, ctx, g, x, y, lit) {
  const G = GUESTS[g];
  if (lit) { ctx.fillStyle = C.pale; ctx.fillRect(x - 4, y - 4, FW + 8, FH + 8); y -= 3; }
  ctx.fillStyle = '#7a5a26'; ctx.fillRect(x, y, FW, FH);
  ctx.fillStyle = C.brass; ctx.fillRect(x + 2, y + 2, FW - 4, FH - 4);
  ctx.fillStyle = C.gold; ctx.fillRect(x + 4, y + 4, FW - 8, 1);
  ctx.fillStyle = lit ? '#5a4a30' : G.bg; ctx.fillRect(x + 6, y + 6, FW - 12, 102);
  eng.sprite(ctx, G.rows, G.cols, x + 10, y + 6, 5);
  ctx.fillStyle = C.black; ctx.fillRect(x + 6, y + 110, FW - 12, 13);
  eng.text(ctx, G.name, x + FW / 2, y + 113, lit ? C.gold : C.cream, 'center', 6);
  idCard(ctx, g, x + 40, y + 74);
}
// each guest holds up an identity card with their own emblem
function idCard(ctx, g, x, y) {
  ctx.fillStyle = '#7a5a26'; ctx.fillRect(x - 1, y - 1, 54, 32);
  ctx.fillStyle = C.cream; ctx.fillRect(x, y, 52, 30);
  ctx.fillStyle = C.vel; ctx.fillRect(x, y, 52, 6);
  ctx.fillStyle = GUESTS[g].bg; ctx.fillRect(x + 3, y + 9, 13, 16);
  ctx.fillStyle = '#f0c8a0'; ctx.fillRect(x + 6, y + 12, 7, 7); ctx.fillRect(x + 4, y + 20, 11, 5);
  ctx.fillStyle = '#9a8a70'; ctx.fillRect(x + 19, y + 10, 14, 2); ctx.fillRect(x + 19, y + 15, 10, 2); ctx.fillRect(x + 19, y + 20, 12, 2);
  const ex = x + 43, ey = y + 18; ctx.fillStyle = C.gold;
  if (g === 0) { ctx.fillRect(ex - 1, ey - 7, 2, 12); ctx.fillRect(ex - 4, ey - 4, 8, 2); ctx.fillRect(ex - 5, ey + 2, 2, 3); ctx.fillRect(ex + 3, ey + 2, 2, 3); ctx.fillRect(ex - 4, ey + 4, 8, 2); } // anchor
  else if (g === 1) { for (let i = 0; i < 10; i++) ctx.fillRect(ex - 3 + (i >> 1), ey + 5 - i, 3 - Math.abs(i - 5) / 3, 1); ctx.fillRect(ex - 4, ey + 5, 1, 3); } // feather
  else if (g === 2) { ctx.fillRect(ex - 5, ey - 6, 6, 6); ctx.fillStyle = C.cream; ctx.fillRect(ex - 3, ey - 4, 2, 2); ctx.fillStyle = C.gold; ctx.fillRect(ex - 1, ey - 2, 2, 9); ctx.fillRect(ex + 1, ey + 3, 3, 2); ctx.fillRect(ex + 1, ey + 6, 2, 1); } // key
  else { for (let i = 0; i < 6; i++) ctx.fillRect(ex - 5 + i, ey - i, 11 - 2 * i, 1); for (let i = 1; i < 7; i++) ctx.fillRect(ex - 5 + i, ey + i, 11 - 2 * i, 1); } // diamond
}
boot(game);
