// Boardy Arcade engine. Shared by all four games. No network, no cookies; scores live in localStorage only.
export const W = 240, H = 320;
export const FONT = '"Press Start 2P", ui-monospace, monospace';
export const PAL = { bg: '#07060c', ink: '#e8fbff', cyan: '#7df9ff', pink: '#ff4fd8', gold: '#ffd23f', green: '#5dff7a', red: '#ff4a4a', grey: '#8a90a2', navy: '#101a3a', blue: '#3a6bff', orange: '#ff9a3c', purple: '#9d5cff' };

const store = {
  get(k, f) { try { const v = localStorage.getItem(k); return v == null ? f : JSON.parse(v); } catch { return f; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
export const DEFAULT_SCORES = [['BRD', 5000], ['CFO', 4000], ['AUD', 3000], ['TAX', 2000], ['ZZZ', 1000]];
export const loadScores = (id) => store.get('bb.hs.' + id, DEFAULT_SCORES.map(([n, s]) => ({ n, s })));
const saveScores = (id, l) => store.set('bb.hs.' + id, l);

// ---------- sound: tiny square-wave bleeps, off by default ----------
let actx = null, soundOn = store.get('bb.sound', false);
export function beep(f = 440, d = 0.06, type = 'square', vol = 0.05, slide = 0) {
  if (!soundOn) return;
  try {
    actx ??= new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.linearRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(actx.destination); o.start(t); o.stop(t + d + 0.02);
  } catch {}
}

// ---------- drawing helpers ----------
export function text(ctx, s, x, y, color = PAL.ink, align = 'left', size = 8) {
  ctx.font = `${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = 'top'; ctx.fillStyle = color; ctx.fillText(s, Math.round(x), Math.round(y));
}
// Sprites are arrays of strings; each char maps to a colour in `cols` ('.' = transparent).
const spriteCache = new Map();
export function sprite(ctx, rows, cols, x, y, scale = 1, flip = false) {
  const key = rows.join('|') + JSON.stringify(cols) + scale + flip;
  let c = spriteCache.get(key);
  if (!c) {
    c = document.createElement('canvas'); c.width = rows[0].length * scale; c.height = rows.length * scale;
    const g = c.getContext('2d');
    rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '.' || !cols[ch]) return; g.fillStyle = cols[ch]; g.fillRect((flip ? r.length - 1 - i : i) * scale, j * scale, scale, scale); }));
    spriteCache.set(key, c);
  }
  ctx.drawImage(c, Math.round(x), Math.round(y));
}

// ---------- boot ----------
export function boot(game) {
  if (document.documentElement.classList.contains('rope')) return null; // VIP cabinet, visitor is not a member
  const $ = (s) => document.querySelector(s);
  const cv = $('#ag-cv'), ctx = cv.getContext('2d');
  cv.width = W; cv.height = H; ctx.imageSmoothingEnabled = false;
  const ovTitle = $('#ag-title'), ovPause = $('#ag-pause'), ovOver = $('#ag-over');
  // VIP lounge (unlocked by the jackpot on the coin door): god mode is offered on every game.
  // Contract for games: when eng.god is true, the player cannot lose a life or die; everything else plays normally.
  const vip = !!store.get('bb.vip', false);
  const eng = { W, H, ctx, state: 'title', score: 0, keys: {}, pressed: {}, pointerX: null, swipe: null, t: 0, beep, text, sprite, PAL, store, vip, god: vip && !!store.get('bb.god', false) };
  if (vip) document.documentElement.classList.add('is-vip');

  // high-score tables
  const renderScores = () => {
    const l = loadScores(game.id);
    document.querySelectorAll('[data-scores]').forEach((ol) => { ol.innerHTML = l.map((e, i) => `<li><span>${i + 1}.</span> <span>${e.n}</span> <span>${String(e.s).padStart(6, ' ')}</span></li>`).join(''); });
  };
  renderScores();

  // ---------- input ----------
  const MAP = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ' ': 'act', z: 'act', Z: 'act', x: 'act', X: 'act', Enter: 'start' };
  const press = (b) => { if (!eng.keys[b]) eng.pressed[b] = true; eng.keys[b] = true; };
  const release = (b) => { eng.keys[b] = false; };
  addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') { e.preventDefault(); togglePause(); return; }
    if (e.key === 'm' || e.key === 'M') { toggleSound(); return; }
    const b = MAP[e.key]; if (!b) return;
    e.preventDefault();
    if ((b === 'start' || b === 'act') && eng.state === 'title') { start(); return; }
    if (b === 'start' && eng.state === 'paused') { togglePause(); return; }
    press(b);
  });
  addEventListener('keyup', (e) => { const b = MAP[e.key]; if (b) release(b); });
  // on-screen pad
  document.querySelectorAll('[data-btn]').forEach((el) => {
    const b = el.dataset.btn;
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); el.setPointerCapture?.(e.pointerId); if (eng.state === 'title') { start(); return; } press(b); el.classList.add('on'); });
    const up = () => { release(b); el.classList.remove('on'); };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  });
  // swipe + drag on the canvas
  let sx = 0, sy = 0, dragging = false;
  const toLogical = (e) => { const r = cv.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H]; };
  cv.addEventListener('pointerdown', (e) => { [sx, sy] = [e.clientX, e.clientY]; dragging = true; eng.pointerX = toLogical(e)[0]; cv.setPointerCapture?.(e.pointerId); if (game.tapIsAct) press('act'); });
  cv.addEventListener('pointermove', (e) => { if (dragging) eng.pointerX = toLogical(e)[0]; });
  cv.addEventListener('pointerup', (e) => {
    dragging = false; release('act');
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 24) eng.swipe = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  });
  cv.addEventListener('touchmove', (e) => { if (eng.state === 'play') e.preventDefault(); }, { passive: false });

  // ---------- states ----------
  const show = (el, on) => { el.hidden = !on; };
  function start() {
    eng.score = 0; eng.keys = {}; eng.pressed = {}; eng.swipe = null; eng.pointerX = null;
    game.reset(eng); eng.state = 'play';
    show(ovTitle, false); show(ovOver, false); show(ovPause, false);
    cv.focus({ preventScroll: true }); beep(660, 0.08); beep(990, 0.12);
  }
  function togglePause() {
    if (eng.state === 'play') { eng.state = 'paused'; show(ovPause, true); $('#ag-resume')?.focus(); }
    else if (eng.state === 'paused') { eng.state = 'play'; show(ovPause, false); cv.focus({ preventScroll: true }); }
  }
  eng.gameOver = (msg = 'GAME OVER') => {
    eng.state = 'over'; beep(220, 0.4, 'sawtooth', 0.05, -150);
    $('#ag-over-msg').textContent = msg; $('#ag-over-score').textContent = eng.score;
    const l = loadScores(game.id), qualifies = eng.score > 0 && (l.length < 5 || eng.score > l[l.length - 1].s);
    const form = $('#ag-init'); form.hidden = !qualifies; show(ovOver, true);
    if (qualifies) { const inp = form.querySelector('input'); inp.value = store.get('bb.initials', ''); setTimeout(() => inp.focus(), 50); }
    else $('#ag-again').focus();
  };
  $('#ag-init')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const inp = e.target.querySelector('input'), n = (inp.value.toUpperCase().replace(/[^A-Z0-9]/g, '') + '___').slice(0, 3);
    store.set('bb.initials', n);
    const l = loadScores(game.id); l.push({ n, s: eng.score }); l.sort((a, b) => b.s - a.s); saveScores(game.id, l.slice(0, 5));
    e.target.hidden = true; renderScores(); $('#ag-again').focus();
  });
  $('#ag-start')?.addEventListener('click', start);
  $('#ag-again')?.addEventListener('click', start);
  $('#ag-resume')?.addEventListener('click', togglePause);
  $('#ag-pausebtn')?.addEventListener('click', togglePause);
  const sb = $('#ag-sound');
  function toggleSound() { soundOn = !soundOn; store.set('bb.sound', soundOn); if (sb) { sb.textContent = soundOn ? 'SOUND ON' : 'SOUND OFF'; sb.setAttribute('aria-pressed', soundOn); } beep(880, 0.05); }
  if (sb) { sb.textContent = soundOn ? 'SOUND ON' : 'SOUND OFF'; sb.setAttribute('aria-pressed', soundOn); sb.addEventListener('click', toggleSound); }
  const gb = $('#ag-god');
  const paintGod = () => { if (gb) { gb.textContent = eng.god ? 'GOD MODE ON' : 'GOD MODE OFF'; gb.setAttribute('aria-pressed', eng.god); gb.classList.toggle('on', eng.god); } };
  if (gb && vip) { gb.hidden = false; paintGod(); gb.addEventListener('click', () => { eng.god = !eng.god; store.set('bb.god', eng.god); paintGod(); beep(eng.god ? 1320 : 330, 0.12); }); }
  addEventListener('keydown', (e) => { if (vip && (e.key === 'g' || e.key === 'G') && e.target.tagName !== 'INPUT') gb?.click(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && eng.state === 'play') togglePause(); });

  // ---------- loop: fixed 60 Hz step ----------
  const STEP = 1000 / 60; let acc = 0, last = performance.now();
  game.reset(eng);
  function frame(now) {
    acc += Math.min(250, now - last); last = now;
    while (acc >= STEP) {
      if (eng.state === 'play') { eng.t++; game.update(eng); eng.pressed = {}; eng.swipe = null; }
      acc -= STEP;
    }
    ctx.fillStyle = PAL.bg; ctx.fillRect(0, 0, W, H);
    game.draw(eng, ctx);
    if (eng.god && (eng.state === 'play' || eng.state === 'paused')) { ctx.globalAlpha = 0.85; text(ctx, 'GOD', W - 3, H - 11, PAL.gold, 'right', 6); ctx.globalAlpha = 1; }
    requestAnimationFrame(frame);
  }
  document.fonts?.load(`8px ${FONT}`).finally(() => requestAnimationFrame(frame));
  window.__arcade = eng; // for QA
  return eng;
}
