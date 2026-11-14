// The Road to Generational Wealth: a trail journey across 900 miles of paperwork country.
// Original events, landmarks and art. Menus use up/down + act (left/right also adjust in the shop).
import { boot, PAL } from '../engine.js';
const GOAL = 900, LH = 11, SCENE_Y = 26, SCENE_H = 112;
const PACES = ['STEADY', 'STRENUOUS', 'GRUELLING'], RATIONS = ['FULL', 'MODEST', 'SYMBOLIC'];
const PACE_MI = [16, 22, 29], PACE_H = [1, -2, -5], PACE_M = [1, -1, -3];
const RAT_CUPS = [3, 2, 1], RAT_H = [2, 0, -4], RAT_M = [1, 0, -2];
const NAMES = ['THE ELDEST', 'THE ACCOUNTANT', 'THE COUSIN', 'THE YOUNGEST', 'THE UNCLE'];
const SHOP = [
  { k: 'coffee', name: 'COFFEE SACK', each: 15, per: 25, note: '25 CUPS PER SACK' },
  { k: 'wheels', name: 'SPARE WHEEL', each: 30, per: 1, note: 'WHEELS BREAK. THIS IS KNOWN.' },
  { k: 'forms', name: 'FORMS', each: 4, per: 1, note: 'REQUIRED AT CHECKPOINTS' },
  { k: 'morale', name: 'PEP TALK', each: 25, per: 10, note: '+10 MORALE, PRE-RECORDED' },
];
let s;

const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function wrap(str, n = 28) {
  const out = [];
  for (const para of String(str).split('\n')) {
    let line = '';
    for (const w of para.split(' ')) { if (!line) line = w; else if ((line + ' ' + w).length <= n) line += ' ' + w; else { out.push(line); line = w; } }
    out.push(line);
  }
  return out;
}
const here = () => s.fam.filter((m) => m.on);
const say = (t, c = PAL.ink) => s.msgs.push({ t, c });

// ---------- landmarks: each option returns the message to show ----------
const LANDMARKS = [
  { mile: 150, name: 'THE RIVER OF PAPERWORK', desc: 'A WIDE RIVER OF LOOSE PAGES BLOCKS THE ROAD. IT IS MOSTLY CARBON COPIES.',
    opts: [['FORD IT', () => { if (Math.random() < 0.45) { s.coffee = Math.max(0, s.coffee - 30); s.morale -= 8; return 'THE WAGON TIPS. 30 CUPS OF COFFEE ARE NOW PART OF THE RIVER.'; } return 'THE WAGON CROSSES. EVERYONE IS SLIGHTLY DAMP AND LEGALLY UNCHANGED.'; }],
      ['WAIT FOR LOW WATER', () => { pass(2); return 'TWO DAYS PASS. THE RIVER RECEDES TO A STACK. YOU STEP OVER IT.'; }],
      ['PAY FERRY (3 FORMS)', () => { if (s.forms < 3) return 'THE FERRY REQUIRES 3 FORMS. YOU HAVE ' + s.forms + '. THE FERRY WAITS.'; s.forms -= 3; return 'THE FERRYMAN STAMPS EACH FORM TWICE. THE CROSSING IS UNEVENTFUL.'; }]] },
  { mile: 300, name: 'FORT COMPLIANCE', desc: 'A FORTIFIED OFFICE. IT SELLS SUPPLIES AT A MARGIN IT DESCRIBES AS FAIR.',
    opts: [['BUY COFFEE SACK (20 CR)', () => { if (s.credits < 20) return 'INSUFFICIENT CREDITS. THE CLERK NODS AS IF THIS WAS EXPECTED.'; s.credits -= 20; s.coffee += 25; return 'ONE SACK OF COFFEE ACQUIRED. A RECEIPT IS ISSUED FOR THE RECEIPT.'; }, true],
      ['TRADE 2 FORMS FOR WHEEL', () => { if (s.forms < 2) return 'YOU LACK THE FORMS TO REQUEST A WHEEL.'; s.forms -= 2; s.wheels++; return 'A WHEEL IS ISSUED. IT IS ROUND, AS STATED.'; }, true],
      ['MOVE ON', () => 'THE FORT RECEDES. NOBODY WAVES, BY POLICY.']] },
  { mile: 450, name: 'THE NOTARY PASS', desc: 'A STEEP PASS GUARDED BY A NOTARY. THE NOTARY IS ON A BREAK OF NO FIXED LENGTH.',
    opts: [['CLIMB AROUND THE NOTARY', () => { here().forEach((m) => (m.hp -= 18)); return 'THE CLIMB IS HARD. EVERYONE IS TIRED AND FEELS IT WAS PERSONAL.'; }],
      ['WAIT FOR THE NOTARY', () => { pass(3); return 'THREE DAYS LATER THE NOTARY RETURNS AND WAVES YOU THROUGH WITHOUT LOOKING.'; }],
      ['PRESENT 4 FORMS', () => { if (s.forms < 4) return 'YOU DO NOT HAVE 4 FORMS. THE NOTARY CONTINUES THEIR BREAK.'; s.forms -= 4; s.morale += 6; return 'THE FORMS ARE NOTARISED. THE FAMILY FEELS OFFICIALLY ENCOURAGED.'; }]] },
  { mile: 600, name: 'THE ESCROW FLATS', desc: 'A DRY PLAIN WHERE FUNDS ARE HELD PENDING. NOTHING GROWS. NOTHING IS RELEASED.',
    opts: [['PUSH STRAIGHT ACROSS', () => { s.coffee = Math.max(0, s.coffee - 20); s.morale -= 6; return 'THE CROSSING USES 20 EXTRA CUPS OF COFFEE AND SOME OPTIMISM.'; }],
      ['TRAVEL BY NIGHT', () => { pass(1); here().forEach((m) => (m.hp -= 6)); return 'YOU CROSS AT NIGHT. NOBODY SLEEPS. THE FLATS ARE COOLER, IF NOT NICER.'; }],
      ['FILE FOR RELEASE (2 FORMS)', () => { if (s.forms < 2) return 'NO FORMS. THE FLATS CONTINUE TO HOLD.'; s.forms -= 2; s.credits += 40; return 'THE FLATS RELEASE 40 CREDITS HELD SINCE AN EARLIER ERA.'; }]] },
  { mile: 750, name: 'THE FINAL REVIEW', desc: 'A COMMITTEE HAS ASSEMBLED ON THE ROAD. IT WISHES TO REVIEW THE WAGON.',
    opts: [['SUBMIT 5 FORMS', () => { if (s.forms < 5) return 'THE COMMITTEE COUNTS YOUR FORMS AND ADJOURNS TO DISCUSS IT. YOU LEAVE QUIETLY.'; s.forms -= 5; s.morale += 12; return 'THE REVIEW IS FAVOURABLE. THE MINUTES DESCRIBE YOU AS ADEQUATE.'; }],
      ['APPEAL IN PERSON', () => { if (Math.random() < 0.5) { s.morale += 8; return 'THE APPEAL SUCCEEDS. NOBODY KNOWS WHAT WAS APPEALED.'; } s.morale -= 12; pass(1); return 'THE APPEAL IS DEFERRED. YOU LOSE A DAY AND SOME FAITH.'; }],
      ['PROCEED UNREVIEWED', () => { const m = here().filter((x) => x.on); if (m.length > 1) { const x = pick(m); x.on = false; return x.name + ' STAYS BEHIND TO ARGUE THE MATTER, INDEFINITELY.'; } return 'THE COMMITTEE DOES NOT NOTICE. THIS IS ALSO A RESULT.'; }]] },
];

// ---------- daily simulation ----------
function pass(days) { for (let i = 0; i < days; i++) daily(false); }
function daily(moving) {
  s.day++;
  const fam = here(), need = fam.length * RAT_CUPS[s.rations];
  if (eng0.god && s.coffee < need) s.coffee = need; // god mode: the coffee never runs out
  const short = s.coffee < need;
  s.coffee = Math.max(0, s.coffee - need);
  const resting = !moving;
  for (const m of fam) {
    let d = (resting ? 5 : PACE_H[s.pace]) + RAT_H[s.rations] + rnd(-2, 1) + (s.morale < 25 ? -3 : 0) + (short ? -9 : 0);
    if (Math.random() < 0.025) { d -= 22; say(m.name + ' HAS A HEADACHE OF A PROCEDURAL NATURE.', PAL.orange); }
    m.hp = clamp(m.hp + d, -10, 100);
  }
  s.morale += (resting ? 2 : PACE_M[s.pace]) + RAT_M[s.rations] + (short ? -6 : 0);
  if (short) say('THE COFFEE HAS RUN OUT. THIS IS NOTED BY EVERYONE.', PAL.red);
  if (moving) {
    let mi = PACE_MI[s.pace] * (0.75 + clamp(s.morale, 0, 100) / 200) * (s.weather === 'RAIN' ? 0.6 : 1);
    if (s.stall > 0) { s.stall--; mi = 0; }
    const next = LANDMARKS.find((l) => l.mile > s.miles && !l.done), cap = next ? next.mile : GOAL;
    s.miles = Math.min(cap, s.miles + Math.round(mi));
    if (Math.random() < 0.28) event();
    s.weather = Math.random() < 0.15 ? pick(['RAIN', 'FOG', 'WIND']) : s.weather === 'CLEAR' || Math.random() < 0.5 ? 'CLEAR' : s.weather;
  }
  checkFamily();
}
function checkFamily() {
  if (eng0.god) { for (const m of here()) m.hp = Math.max(m.hp, 1); s.morale = Math.max(s.morale, 1); } // god mode: nobody leaves and morale holds
  for (const m of here()) if (m.hp <= 0) { m.on = false; s.morale -= 10; say(m.name + ' IS EXHAUSTED AND LEAVES THE WAGON TO PURSUE OTHER INTERESTS.', PAL.pink); }
  s.morale = clamp(s.morale, 0, 100);
}
function event() {
  const r = rnd(0, 11), fam = here();
  if (r === 0) { if (s.forms) { s.forms--; say('A FORM REQUIRES A SECOND FORM. ONE FORM IS USED.'); } else { s.stall++; say('A FORM REQUIRES A SECOND FORM. YOU HAVE NEITHER. A DAY IS LOST.'); } }
  else if (r === 1) { s.stall++; say('THE OXEN REQUEST A MEETING. IT RUNS LONG. NO MILES TOMORROW.'); }
  else if (r === 2) { if (s.wheels) { s.wheels--; say('A WHEEL BREAKS. IT HAD BEEN UNDER STRAIN. THE SPARE IS FITTED.'); } else { s.stall += 2; s.morale -= 8; say('A WHEEL BREAKS AND THERE IS NO SPARE. TWO DAYS ARE SPENT CARVING ONE.', PAL.orange); } }
  else if (r === 3) { s.weather = 'RAIN'; s.morale -= 3; say('IT RAINS. EVERYONE AGREES THAT IT IS RAINING.'); }
  else if (r === 4) { if (s.forms >= 2) { s.forms -= 2; say('A TOLL BOOTH. THE ATTENDANT ACCEPTS FORMS ONLY. TWO FORMS ARE PAID.'); } else { s.stall++; s.morale -= 5; say('A TOLL BOOTH ACCEPTS FORMS ONLY. YOU HAVE TOO FEW. A DAY IS SPENT ON AN APPEAL.', PAL.orange); } }
  else if (r === 5) { s.coffee += 20; say('YOU FIND AN UNCLAIMED SACK OF COFFEE. NOBODY CLAIMS IT. 20 CUPS.', PAL.green); }
  else if (r === 6) { const l = Math.min(s.coffee, rnd(8, 18)); s.coffee -= l; say('THE ACCOUNTANT RECONCILES THE COFFEE. IT IS DOWN ' + l + ' CUPS.'); }
  else if (r === 7) { s.forms += 2; say('A PASSING CLERK GIVES YOU TWO FORMS. THEY ARE BLANK, WHICH IS IDEAL.', PAL.green); }
  else if (r === 8) { s.morale += 8; say('MORALE IMPROVES FOR NO DOCUMENTED REASON.', PAL.green); }
  else if (r === 9) { s.weather = 'FOG'; say('FOG. THE ROAD CONTINUES REGARDLESS.'); }
  else if (r === 10) { s.morale += 3; say('A SIGN READS: GENERATIONAL WEALTH, FURTHER. IT IS ENCOURAGING, ON BALANCE.'); }
  else if (fam.length) { const m = pick(fam); m.hp -= 15; say(m.name + ' SPRAINS AN ANKLE ON A LOOSE APPENDIX.', PAL.orange); }
}
function finish() {
  const fam = here().length;
  if (s.miles >= GOAL) {
    eng0.score = 900 + fam * 250 + s.coffee + s.wheels * 15 + s.forms * 5 + s.morale * 4 + s.credits + Math.max(0, 70 - s.day) * 10;
    say('THE WAGON ARRIVES AT GENERATIONAL WEALTH. IT IS SMALLER THAN DESCRIBED.', PAL.gold);
    say(fam + ' OF 5 ARRIVED IN ' + s.day + ' DAYS. THE REST ARE PURSUING OTHER INTERESTS.', PAL.ink);
    s.endMsg = 'ARRIVED, MOSTLY';
  } else {
    eng0.score = s.miles + fam * 25;
    if (!fam) { say('NOBODY REMAINS IN THE WAGON. THE OXEN CONTINUE ALONE, OUT OF HABIT.', PAL.red); s.endMsg = 'NOBODY REMAINS'; }
    else { say('MORALE HAS REACHED ZERO. THE FAMILY SETTLES HERE AND CALLS IT WEALTH.', PAL.red); s.endMsg = 'MORALE DEPLETED'; }
  }
  s.after = 'end';
}
function afterDay() {
  if (!here().length || s.morale <= 0) return finish();
  if (s.miles >= GOAL) return finish();
  const lm = LANDMARKS.find((l) => l.mile === s.miles && !l.done);
  if (lm) { lm.done = true; s.lm = lm; s.cur = 0; s.after = 'landmark'; eng0.beep(523, 0.1); eng0.beep(784, 0.15); return; }
  s.after = s.msgs.length ? 'travel' : null;
}

let eng0;
const game = {
  id: 'trail',
  reset(eng) {
    eng0 = eng;
    s = { phase: 'shop', cur: 0, day: 1, miles: 0, credits: 400, coffee: 0, wheels: 0, forms: 0, morale: 50, pace: 0, rations: 1,
      fam: NAMES.map((name) => ({ name, hp: rnd(70, 90), on: true })), msgs: [], after: null, scroll: 0, dayT: 0, stall: 0, weather: 'CLEAR', buy: [0, 0, 0, 0], lm: null };
    LANDMARKS.forEach((l) => (l.done = false));
  },
  update(eng) {
    const p = eng.pressed, n = (len) => { if (p.up) { s.cur = (s.cur + len - 1) % len; eng.beep(330, 0.03); } if (p.down) { s.cur = (s.cur + 1) % len; eng.beep(330, 0.03); } };
    if (s.msgs.length) {
      if (p.act) { s.msgs.shift(); eng.beep(440, 0.04); if (!s.msgs.length) { if (s.after === 'end') { eng.gameOver(s.endMsg); return; } s.phase = s.after || s.phase; s.after = null; } }
      return;
    }
    if (s.phase === 'shop') {
      n(SHOP.length + 1);
      const it = SHOP[s.cur];
      if (it) {
        const cost = s.buy.reduce((a, q, i) => a + q * SHOP[i].each, 0);
        if ((p.act || p.right) && cost + it.each <= s.credits) { s.buy[s.cur]++; eng.beep(660, 0.04); }
        else if (p.act || p.right) eng.beep(150, 0.08);
        if (p.left && s.buy[s.cur] > 0) { s.buy[s.cur]--; eng.beep(500, 0.04); }
      } else if (p.act) {
        SHOP.forEach((it, i) => { const q = s.buy[i]; if (it.k === 'morale') s.morale = clamp(s.morale + q * it.per, 0, 100); else s[it.k] += q * it.per; s.credits -= q * it.each; });
        s.phase = 'travel'; s.cur = 0; say('THE WAGON DEPARTS. THE ROAD IS LONG AND MOSTLY PAPERWORK. SPACE STOPS TO CAMP.', PAL.gold);
      }
    } else if (s.phase === 'travel') {
      s.scroll += s.stall ? 0.2 : 0.6 + s.pace * 0.35;
      if (p.act) { s.phase = 'camp'; s.cur = 0; eng.beep(392, 0.06); return; }
      if (++s.dayT >= 46) { s.dayT = 0; daily(true); afterDay(); if (s.after === 'landmark' && !s.msgs.length) { s.phase = 'landmark'; s.after = null; } }
    } else if (s.phase === 'camp') {
      n(4);
      if (p.act || p.left || p.right) {
        const dir = p.left ? 2 : 1;
        if (s.cur === 0 && p.act) { s.phase = 'travel'; eng.beep(523, 0.06); }
        else if (s.cur === 1) { s.pace = (s.pace + dir) % 3; eng.beep(600, 0.04); }
        else if (s.cur === 2) { s.rations = (s.rations + dir) % 3; eng.beep(600, 0.04); }
        else if (s.cur === 3 && p.act) { daily(false); say('THE FAMILY RESTS FOR A DAY. NOTHING IS ACCOMPLISHED, FORMALLY.'); afterDay(); if (s.after !== 'end') s.after = 'camp'; }
      }
    } else if (s.phase === 'landmark') {
      n(s.lm.opts.length);
      if (p.act) {
        const [, fn, stay] = s.lm.opts[s.cur];
        say(fn()); checkFamily(); eng.beep(700, 0.05);
        if (stay) { s.after = 'landmark'; s.cur = s.lm.opts.length - 1; return; }
        s.miles = s.lm.mile; s.cur = 0; afterDay(); if (s.after !== 'end' && s.after !== 'landmark') s.after = 'camp';
      }
    }
  },
  draw(eng, ctx) {
    const { text } = eng;
    // HUD
    text(ctx, 'DAY ' + s.day, 6, 5, PAL.cyan);
    text(ctx, s.miles + '/' + GOAL + ' MI', 234, 5, PAL.gold, 'right');
    ctx.fillStyle = '#1d2747'; ctx.fillRect(6, 16, 228, 4);
    ctx.fillStyle = PAL.gold; ctx.fillRect(6, 16, Math.round((228 * s.miles) / GOAL), 4);
    ctx.fillStyle = PAL.ink; LANDMARKS.forEach((l) => ctx.fillRect(6 + Math.round((228 * l.mile) / GOAL), 15, 1, 6));
    drawScene(eng, ctx);
    const Y = SCENE_Y + SCENE_H + 6;
    if (s.phase === 'shop' && !s.msgs.length) return drawShop(eng, ctx, Y);
    if (s.phase !== 'landmark' || s.msgs.length) drawStatus(eng, ctx, Y);
    const MY = Y + 9 * LH + 4;
    if (s.msgs.length) return box(eng, ctx, s.msgs[0].t, s.msgs[0].c);
    if (s.phase === 'travel') {
      const next = LANDMARKS.find((l) => !l.done && l.mile > s.miles);
      text(ctx, next ? 'NEXT: ' + (next.mile - s.miles) + ' MI' : 'DESTINATION: ' + (GOAL - s.miles) + ' MI', 120, MY, PAL.grey, 'center');
      if (next) text(ctx, next.name, 120, MY + LH, PAL.grey, 'center');
      if ((eng.t >> 5) & 1 || eng.state !== 'play') text(ctx, 'SPACE: STOP AND CAMP', 120, MY + LH * 2 + 6, PAL.cyan, 'center');
    } else if (s.phase === 'camp') {
      menu(eng, ctx, ['CONTINUE ON', 'PACE: ' + PACES[s.pace], 'RATIONS: ' + RATIONS[s.rations], 'REST FOR A DAY'], MY - 4);
    } else if (s.phase === 'landmark') {
            text(ctx, s.lm.name, 120, Y, PAL.gold, 'center');
      const lines = wrap(s.lm.desc); lines.forEach((l, i) => text(ctx, l, 8, Y + 16 + i * LH, PAL.ink));
      menu(eng, ctx, s.lm.opts.map((o) => o[0]), Y + 24 + lines.length * LH);
      text(ctx, 'CREDITS ' + s.credits + '  FORMS ' + s.forms, 120, 306, PAL.grey, 'center');
    }
  },
};

function menu(eng, ctx, items, y) {
  items.forEach((it, i) => {
    const sel = i === s.cur;
    if (sel) cursor(ctx, 8, y + i * 13);
    eng.text(ctx, it, 18, y + i * 13, sel ? PAL.ink : PAL.grey);
  });
}
function cursor(ctx, x, y) { ctx.fillStyle = PAL.gold; for (let i = 0; i < 4; i++) ctx.fillRect(x + i, y + i, 1, 8 - i * 2); }
function box(eng, ctx, t, c) {
  const lines = wrap(t, 26), h = lines.length * LH + 24, y = 314 - h;
  ctx.fillStyle = '#0d1230'; ctx.fillRect(4, y, 232, h); ctx.strokeStyle = PAL.cyan; ctx.strokeRect(4.5, y + 0.5, 231, h - 1);
  lines.forEach((l, i) => eng.text(ctx, l, 12, y + 7 + i * LH, c));
  if ((eng.t >> 4) & 1 || eng.state !== 'play') eng.text(ctx, 'SPACE', 228, y + h - 11, PAL.grey, 'right', 8);
}
function drawStatus(eng, ctx, y) {
  const { text } = eng;
  s.fam.forEach((m, i) => {
    const st = !m.on ? 'ELSEWHERE' : m.hp > 70 ? 'GOOD' : m.hp > 40 ? 'FAIR' : m.hp > 15 ? 'POOR' : 'WEARY';
    const col = !m.on ? '#4a4f60' : m.hp > 40 ? PAL.green : m.hp > 15 ? PAL.gold : PAL.red;
    text(ctx, m.name, 8, y + i * LH, m.on ? PAL.ink : '#4a4f60');
    text(ctx, st, 232, y + i * LH, col, 'right');
  });
  const y2 = y + 5 * LH + 4;
  text(ctx, 'COFFEE ' + s.coffee, 8, y2, s.coffee < here().length * 6 ? PAL.red : PAL.ink);
  text(ctx, 'WHEELS ' + s.wheels, 232, y2, PAL.ink, 'right');
  text(ctx, 'FORMS ' + s.forms, 8, y2 + LH, PAL.ink);
  text(ctx, 'MORALE ' + s.morale, 232, y2 + LH, s.morale < 25 ? PAL.red : PAL.ink, 'right');
  text(ctx, PACES[s.pace] + ' / ' + RATIONS[s.rations], 120, y2 + LH * 2 + 2, PAL.grey, 'center');
}
function drawShop(eng, ctx, y) {
  const { text } = eng;
  const cost = s.buy.reduce((a, q, i) => a + q * SHOP[i].each, 0);
  text(ctx, 'OUTFITTERS OF RECORD', 120, y, PAL.gold, 'center');
  text(ctx, 'CREDITS LEFT ' + (s.credits - cost), 120, y + 13, PAL.cyan, 'center');
  SHOP.forEach((it, i) => {
    const yy = y + 32 + i * 15, sel = i === s.cur;
    if (sel) cursor(ctx, 4, yy);
    text(ctx, it.name, 14, yy, sel ? PAL.ink : PAL.grey);
    text(ctx, 'x' + s.buy[i], 174, yy, PAL.ink, 'right');
    text(ctx, String(s.buy[i] * it.each), 234, yy, PAL.gold, 'right');
  });
  const dy = y + 32 + 4 * 15 + 4;
  if (s.cur === 4) cursor(ctx, 4, dy);
  text(ctx, 'DEPART', 14, dy, s.cur === 4 ? PAL.green : PAL.grey);
  const it = SHOP[s.cur];
  const lines = it ? [it.each + ' CR EACH. ' + it.note, 'SPACE/RIGHT ADD, LEFT REMOVE'] : ['UNSPENT CREDITS TRAVEL WITH YOU AND COUNT AT THE END.'];
  wrap(lines.join('\n')).forEach((l, i) => text(ctx, l, 120, 270 + i * LH, PAL.grey, 'center'));
}

// ---------- scene ----------
function drawScene(eng, ctx) {
  const top = SCENE_Y, hz = top + 74, bot = top + SCENE_H, sc = s.scroll;
  const sky = s.weather === 'RAIN' ? '#1a2033' : s.weather === 'FOG' ? '#2a2e3e' : '#16204e';
  ctx.fillStyle = sky; ctx.fillRect(0, top, 240, SCENE_H);
  ctx.fillStyle = '#ffe9a8'; if (s.weather === 'CLEAR') ctx.fillRect(196, top + 10, 12, 12);
  // far hills
  ctx.fillStyle = '#2b3570';
  for (let x = 0; x < 240; x += 2) { const h = 14 + Math.sin((x + sc * 0.2) / 23) * 7 + Math.sin((x + sc * 0.2) / 9) * 3; ctx.fillRect(x, hz - h, 2, h); }
  // ground
  ctx.fillStyle = '#4a3b22'; ctx.fillRect(0, hz, 240, bot - hz);
  ctx.fillStyle = '#5e4b2c';
  for (let i = 0; i < 9; i++) { const x = ((i * 37 - sc * 1.4) % 260 + 260) % 260 - 10; ctx.fillRect(x, hz + 8 + (i % 3) * 10, 14, 2); }
  ctx.fillStyle = '#6d5a38'; ctx.fillRect(0, hz + 27, 240, 6);
  // roadside props: filing cabinets, mile posts, paper shrubs
  for (let i = 0; i < 4; i++) {
    const x = ((i * 83 + 40 - sc) % 332 + 332) % 332 - 40, kind = i % 3, gy = hz + 2;
    if (kind === 0) { ctx.fillStyle = '#7d8597'; ctx.fillRect(x, gy - 22, 12, 22); ctx.fillStyle = '#4a4f60'; [4, 11, 18].forEach((d) => ctx.fillRect(x + 1, gy - 22 + d, 10, 1)); ctx.fillStyle = PAL.gold; [2, 9, 16].forEach((d) => ctx.fillRect(x + 5, gy - 22 + d, 2, 1)); }
    else if (kind === 1) { ctx.fillStyle = '#8a6a3a'; ctx.fillRect(x + 4, gy - 18, 2, 18); ctx.fillStyle = PAL.ink; ctx.fillRect(x - 2, gy - 18, 14, 6); ctx.fillStyle = '#07060c'; ctx.fillRect(x, gy - 16, 10, 1); ctx.fillRect(x, gy - 14, 7, 1); }
    else { ctx.fillStyle = '#d8dce8'; ctx.fillRect(x, gy - 6, 6, 6); ctx.fillRect(x + 4, gy - 9, 6, 9); ctx.fillStyle = '#9aa1b5'; ctx.fillRect(x + 4, gy - 9, 6, 1); }
  }
  // wagon + oxen
  const moving = s.phase === 'travel' && !s.msgs.length, bob = moving && (eng.t >> 3) & 1 ? 1 : 0, wy = hz + 14;
  ctx.fillStyle = '#6b4423'; ctx.fillRect(60, wy - 4 - bob, 52, 12);
  ctx.fillStyle = '#8a5a2e'; ctx.fillRect(60, wy - 4 - bob, 52, 2);
  ctx.fillStyle = '#efe6cf';
  for (let i = 0; i < 52; i++) { const h = 14 + Math.round(Math.sin((i / 51) * Math.PI) * 9); ctx.fillRect(60 + i, wy - 4 - bob - h, 1, h); }
  ctx.fillStyle = '#c9bfa5'; [72, 86, 100].forEach((x) => ctx.fillRect(x, wy - 26 - bob, 1, 22));
  ctx.fillStyle = '#3b2a1a'; ctx.fillRect(112, wy + 2 - bob, 20, 2);
  for (const cx of [72, 102]) wheel(ctx, cx, wy + 10, moving ? sc / 6 : 0);
  for (const ox of [134, 162]) ox_(ctx, ox, wy - 6, moving ? (eng.t >> 3) & 1 : 0);
  if (moving && (eng.t >> 2) & 1) { ctx.fillStyle = '#7a6a4a'; ctx.fillRect(52 - ((eng.t >> 2) % 3) * 4, wy + 14, 4, 2); }
  // weather overlays
  if (s.weather === 'RAIN') { ctx.fillStyle = '#7d8fbf'; for (let i = 0; i < 40; i++) { const x = (i * 53 + eng.t * 3) % 240, y = top + ((i * 31 + eng.t * 6) % SCENE_H); ctx.fillRect(x, y, 1, 4); } }
  if (s.weather === 'FOG') { ctx.fillStyle = 'rgba(190,196,214,.35)'; ctx.fillRect(0, top, 240, SCENE_H); }
  if (s.weather === 'WIND') { ctx.fillStyle = PAL.ink; for (let i = 0; i < 5; i++) { const x = 240 - ((i * 61 + eng.t * 4) % 280), y = top + 12 + ((i * 17) % 50) + Math.round(Math.sin(eng.t / 6 + i) * 3); ctx.fillRect(x, y, 5, 4); } }
  ctx.fillStyle = '#2b3570'; ctx.fillRect(0, bot, 240, 1);
  if (s.stall && s.phase === 'travel') eng.text(ctx, 'DELAYED', 120, top + 6, PAL.orange, 'center');
}
function wheel(ctx, cx, cy, a) {
  ctx.fillStyle = '#3b2a1a';
  for (let i = 0; i < 24; i++) { const t = (i / 24) * Math.PI * 2; ctx.fillRect(Math.round(cx + Math.cos(t) * 8) - 1, Math.round(cy + Math.sin(t) * 8) - 1, 2, 2); }
  ctx.fillStyle = '#8a6a3a';
  for (let k = 0; k < 4; k++) { const t = a + (k * Math.PI) / 4; for (let r = -7; r <= 7; r += 1) ctx.fillRect(Math.round(cx + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r), 1, 1); }
  ctx.fillStyle = '#3b2a1a'; ctx.fillRect(cx - 1, cy - 1, 3, 3);
}
function ox_(ctx, x, y, f) {
  ctx.fillStyle = '#8b6b4a'; ctx.fillRect(x, y, 20, 10);
  ctx.fillStyle = '#6e5238'; ctx.fillRect(x, y + 8, 20, 2);
  ctx.fillStyle = '#8b6b4a'; ctx.fillRect(x + 19, y - 3, 7, 7);
  ctx.fillStyle = PAL.ink; ctx.fillRect(x + 20, y - 5, 1, 2); ctx.fillRect(x + 25, y - 5, 1, 2);
  ctx.fillStyle = '#07060c'; ctx.fillRect(x + 23, y - 1, 1, 1);
  ctx.fillStyle = '#5a4230';
  const legs = f ? [1, 6, 13, 17] : [3, 4, 15, 15];
  legs.forEach((lx) => ctx.fillRect(x + lx, y + 10, 2, 6));
  ctx.fillStyle = '#3b2a1a'; ctx.fillRect(x - 2, y + 2, 2, 1);
}
boot(game);
