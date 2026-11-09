/* Front-room Easter eggs. No network, no cookies, no tracking. Local storage only, always in try/catch. */
(() => {
  const d = document, root = d.documentElement, BASE = root.dataset.base || '/';
  root.classList.add('js');
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const QUIET = (/[?&]quiet\b/.test(location.search) || navigator.webdriver) && !/[?&]loader\b/.test(location.search);
  const ls = {
    get(k, f) { try { const v = localStorage.getItem('bb.' + k); return v == null ? f : JSON.parse(v); } catch { return f; } },
    set(k, v) { try { localStorage.setItem('bb.' + k, JSON.stringify(v)); } catch {} },
  };
  const ss = {
    get(k) { try { return sessionStorage.getItem('bb.' + k); } catch { return null; } },
    set(k) { try { sessionStorage.setItem('bb.' + k, '1'); } catch {} },
  };

  // ---------- finds + certificate ----------
  const NAMES = { door: 'Found an unmarked door', konami: 'Entered the code', terminal: 'Located the terminal', guestbook: 'Attempted the guestbook',
    highlight: 'Highlighted something it asked you not to', redaction: 'Lifted a redaction', counter: 'Counted the counter', loader: 'Read the loading screen', notfound: 'Visited a page that is not there', y1994: 'Restored dignity',
    tab: 'Left, and came back', idle: 'Stopped reading', name: 'Called him by name', forecast: 'Withdrew a forecast', print: 'Printed it', lamp: 'Found the lamp on' };
  window.bbNames = NAMES;
  let toastT;
  const toast = (html, ms = 5200) => {
    d.querySelector('.toast')?.remove();
    const t = d.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.innerHTML = html; d.body.append(t);
    clearTimeout(toastT); toastT = setTimeout(() => t.remove(), ms);
  };
  const found = (k) => {
    const f = ls.get('found', []);
    if (f.includes(k)) return;
    f.push(k); ls.set('found', f);
    if (f.length === 3 && !ls.get('certAnnounced', false)) {
      ls.set('certAnnounced', true);
      setTimeout(() => toast(`You have found three things. A certificate has been <a href="${BASE}certificate/">prepared</a>.`, 9000), 900);
    }
  };
  window.bbFound = found;
  if (d.body?.dataset.notfound != null) found('notfound');

  // ---------- reveal on scroll ----------
  const rv = d.querySelectorAll('.rv');
  if (RM || !('IntersectionObserver' in window)) rv.forEach((e) => e.classList.add('in'));
  else { const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' }); rv.forEach((e) => io.observe(e)); }

  // ---------- redactions ----------
  d.addEventListener('click', (e) => {
    const r = e.target.closest?.('.redact');
    if (r && r.getAttribute('aria-expanded') === 'false') { r.setAttribute('aria-expanded', 'true'); found('redaction'); }
    if (e.target.closest?.('[data-egg=door]')) found('door');
  });

  // ---------- highlight swaps ----------
  let swapT;
  d.addEventListener('selectionchange', () => {
    clearTimeout(swapT);
    swapT = setTimeout(() => {
      const s = getSelection(); if (!s || s.isCollapsed) return;
      d.querySelectorAll('[data-swap]:not([data-swapped])').forEach((el) => {
        if (s.containsNode(el, true)) { el.dataset.was = el.textContent; el.textContent = el.dataset.swap; el.dataset.swapped = ''; s.removeAllRanges(); found('highlight'); }
      });
    }, 450);
  });

  // ---------- visitor counter ----------
  const counter = d.querySelector('[data-counter] .counter-d');
  if (counter) {
    const visits = ls.get('visits', 0) + 1; ls.set('visits', visits);
    const paint = (n) => { const s = String(n).padStart(10, '0'); counter.querySelectorAll('span').forEach((sp, i) => (sp.textContent = s[i])); counter.setAttribute('aria-label', `Visitor number ${n.toLocaleString('en-US')}`); };
    let n = +counter.parentElement.dataset.base + visits * 3; paint(n);
    let pressT, long = false;
    const start = () => { long = false; pressT = setTimeout(() => { long = true; openTerm(); }, 650); };
    const stop = () => clearTimeout(pressT);
    counter.addEventListener('pointerdown', start); ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => counter.addEventListener(ev, stop));
    counter.addEventListener('contextmenu', (e) => e.preventDefault());
    counter.addEventListener('click', () => { if (long) return; n += 1; paint(n); found('counter'); toast(['Thank you for visiting again. You have been counted.', 'Counted. Twice, for safety.', 'Each click is a visit. That is the policy.'][n % 3], 3000); });
  }

  // ---------- guestbook ----------
  const gb = d.querySelector('[data-guestbook]');
  if (gb) {
    const out = gb.querySelector('.gb-r'), declines = JSON.parse(out.dataset.declines); let i = 0;
    gb.addEventListener('submit', (e) => { e.preventDefault(); out.textContent = declines[i++ % declines.length]; gb.querySelector('textarea').value = ''; found('guestbook'); });
  }

  // ---------- lying loader (once per session) ----------
  if (!QUIET && !ss.get('loaded') && d.body && !d.body.dataset.noloader) {
    ss.set('loaded');
    const msgs = ['Polishing the brass', 'Consulting the board (1 member)', 'Withholding details', 'Calculating gravitas: 98%', 'Locating a point. None found', 'Almost done. This is not true', 'Done. Mostly'];
    const L = d.createElement('div'); L.className = 'loader'; L.setAttribute('role', 'status'); L.setAttribute('aria-live', 'polite');
    L.innerHTML = '<div class="loader-b"><p class="loader-t">One moment.</p><div class="loader-bar"><i></i></div><p class="loader-m"></p><p class="loader-s">Press any key, or tap, to skip</p></div>';
    d.body.append(L);
    const bar = L.querySelector('i'), m = L.querySelector('.loader-m'); let k = 0;
    const steps = [12, 31, 47, 98, 96, 99, 100];
    const done = () => { if (L.classList.contains('out')) return; L.classList.add('out'); setTimeout(() => L.remove(), 500); removeEventListener('keydown', done); };
    const tick = () => { if (k >= msgs.length) { setTimeout(done, 350); found('loader'); return; } m.textContent = msgs[k] + '.'; bar.style.width = steps[k] + '%'; k++; setTimeout(tick, RM ? 260 : 420); };
    tick(); L.addEventListener('click', done); addEventListener('keydown', done);
  }

  // ---------- terminal ----------
  let term;
  const FILES = { 'chair.txt': 'It is a chair. It is occupied.', 'lamp.txt': 'The lamp is on. See previous filings.', 'plans.txt': 'There are no plans. This is the plan.' };
  const CMDS = {
    help: () => 'Commands: help, whoami, ls, cat <file>, cd, pwd, date, uptime, sudo, arcade, certificate, konami, clear, exit',
    whoami: () => 'boardy. Details withheld.',
    ls: () => Object.keys(FILES).join('    ') + '    [redacted]/',
    cat: (a) => !a ? 'cat: which one' : a.startsWith('[redacted]') ? 'cat: Permission denied. By you, earlier.' : FILES[a] || `cat: ${a}: Not on file.`,
    cd: () => 'There is nowhere to go. You are already here.',
    pwd: () => '/home/boardy/this-page',
    date: () => 'It is today. Further detail withheld.',
    uptime: () => 'Up since this morning. Load average: one chair.',
    sudo: () => 'Request forwarded to the board. The board is one person. The board said no.',
    rm: () => 'Nothing here is worth deleting. That is the point of it.',
    ping: () => 'pong. Do not tell anyone.',
    exit: () => (closeTerm(), ''),
    clear: () => { term.querySelector('.term-o').textContent = ''; return ''; },
    arcade: () => { setTimeout(() => (location.href = BASE + 'arcade/'), 500); return 'Opening the door.'; },
    certificate: () => { setTimeout(() => (location.href = BASE + 'certificate/'), 500); return 'Preparing your certificate.'; },
    buy: () => 'This terminal does not do that. Nothing on this page does.',
    sell: () => 'This terminal does not do that. Nothing on this page does.',
    hello: () => 'Hello.', hi: () => 'Hello.',
    vi: () => 'You are now trapped in vi. Just kidding. That would be cruel.',
    vim: () => 'You are now trapped in vim. Just kidding. That would be cruel.',
    man: () => 'No manual entry. There is no manual. There is barely a page.',
  };
  function openTerm() {
    if (term) { term.querySelector('input').focus(); return; }
    found('terminal');
    term = d.createElement('div'); term.className = 'term'; term.setAttribute('role', 'dialog'); term.setAttribute('aria-label', 'Terminal');
    term.innerHTML = '<button class="term-x" type="button" aria-label="Close terminal">[esc] close</button><div class="term-o" aria-live="polite">BoardyOS 1.0 (unregistered)\nType help for commands.\n\n</div><form class="term-f"><span aria-hidden="true">boardy@here:~$</span><input aria-label="Command" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go"></form>';
    d.body.append(term);
    const o = term.querySelector('.term-o'), inp = term.querySelector('input');
    term.querySelector('.term-x').onclick = closeTerm;
    term.querySelector('form').onsubmit = (e) => {
      e.preventDefault(); const raw = inp.value.trim(); inp.value = ''; if (!raw) return;
      const [c, ...rest] = raw.split(/\s+/); const fn = CMDS[c.toLowerCase()];
      const res = fn ? fn(rest.join(' ')) : `${c}: command not found. It has been noted, and will be ignored.`;
      if (c.toLowerCase() !== 'clear') o.textContent += `boardy@here:~$ ${raw}\n${res ? res + '\n' : ''}`;
      o.scrollTop = o.scrollHeight;
    };
    inp.focus();
  }
  function closeTerm() { term?.remove(); term = null; }
  d.querySelector('[data-terminal-tap]')?.addEventListener('dblclick', openTerm);

  // ---------- keys: terminal + Konami ----------
  // Forgiving matcher: only arrows, B and A count; other keys, Shift, key-repeat and ordinary
  // scrolling never break the sequence. Overlaps (an extra "up" at the start) are handled.
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  const RELEVANT = new Set(KONAMI);
  let kIdx = 0;
  const step = (k) => {
    if (!RELEVANT.has(k)) return;
    if (k === KONAMI[kIdx]) kIdx++;
    else if (kIdx === 2 && k === 'ArrowUp') kIdx = 2;
    else kIdx = k === KONAMI[0] ? 1 : 0;
    if (kIdx === KONAMI.length) { kIdx = 0; go1994(); }
  };
  let typed = '';
  addEventListener('keydown', (e) => {
    const typing = /INPUT|TEXTAREA/.test(e.target.tagName);
    if (e.key === 'Escape') closeTerm();
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === '`' || e.key === '~') { e.preventDefault(); openTerm(); return; }
    if (e.repeat) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    step(k);
    if (k.length === 1) { typed = (typed + k).slice(-6); if (typed === 'boardy') nameCalled(); }
  });
  // Touch: swipe up, up, down, down, left, right, left, right, then tap twice anywhere.
  // Taps only count once the eight swipes are in, so reading and scrolling first is harmless.
  let tx = 0, ty = 0, tt = 0;
  addEventListener('touchstart', (e) => { const t = e.touches[0]; tx = t.clientX; ty = t.clientY; tt = Date.now(); }, { passive: true });
  addEventListener('touchend', (e) => {
    const t = e.changedTouches[0], dx = t.clientX - tx, dy = t.clientY - ty, ax = Math.abs(dx), ay = Math.abs(dy);
    if (ax < 24 && ay < 24) { if (kIdx >= 8 && Date.now() - tt < 500) step(KONAMI[kIdx]); return; }
    if (Math.max(ax, ay) < 40 || Math.min(ax, ay) > Math.max(ax, ay) * 0.75) return; // diagonal or tiny: ignore
    step(ax > ay ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : (dy > 0 ? 'ArrowDown' : 'ArrowUp'));
  }, { passive: true });

  // ---------- 1994 ----------
  function go1994() {
    if (root.classList.contains('y1994')) return;
    found('konami');
    if (!d.getElementById('css1994')) { const l = d.createElement('link'); l.id = 'css1994'; l.rel = 'stylesheet'; l.href = BASE + 'eggs/1994.css'; d.head.append(l); }
    root.classList.add('y1994');
    const n = (ls.get('visits', 1) * 3 + 4812377).toString().padStart(8, '0');
    const bar = d.createElement('div'); bar.className = 'y94-bar';
    bar.innerHTML = `<div class="y94-top"><img class="y94-uc" src="${BASE}eggs/construction.png" width="120" height="80" alt=""><div><p class="y94-h">~*~ Welcome to Boardy's Home Page ~*~</p><p class="y94-sub">This page is <b>UNDER CONSTRUCTION</b>. Please come back soon!!!</p></div><img class="y94-uc" src="${BASE}eggs/construction.png" width="120" height="80" alt=""></div>
<div class="y94-mq"><span>Welcome to my HOME PAGE!!! You are visitor number ${n}!!! Please sign my guestbook. Best viewed at 800x600 in any browser. This page is Y2K compliant. No frames were harmed.</span></div>
<div class="y94-row"><span class="y94-count">${[...n].map((c) => `<i>${c}</i>`).join('')}</span><span class="y94-new">NEW!</span><span class="y94-btns"><b>MADE WITH NOTEPAD</b><b>800 x 600</b><b>Y2K READY</b><b>NO FRAMES</b></span></div>
<div class="y94-ring">&lt;&lt; Prev | <u>Boardy WebRing</u> | Next &gt;&gt;</div>
<button type="button" class="y94-x">Restore dignity</button>`;
    d.body.prepend(bar); scrollTo({ top: 0 });
    bar.querySelector('.y94-ring').onclick = () => toast('The webring has been dissolved by mutual agreement.', 3500);
    if (!RM && matchMedia('(pointer:fine)').matches) sparkles(true);
    toast('Code accepted. Welcome to 1996.', 3000);
    bar.querySelector('.y94-x').onclick = () => { root.classList.remove('y1994'); bar.remove(); sparkles(false); found('y1994'); toast('Dignity restored. It was close.', 3200); };
  }
  // the classic cursor sparkle trail, desktop only, off for reduced motion
  let spark = null;
  function sparkles(on) {
    if (!on) { if (spark) removeEventListener('mousemove', spark); spark = null; d.querySelectorAll('.y94-s').forEach((x) => x.remove()); return; }
    let last = 0;
    spark = (e) => {
      const now = performance.now(); if (now - last < 40) return; last = now;
      const s = d.createElement('span'); s.className = 'y94-s'; s.textContent = '*';
      s.style.left = e.clientX + 'px'; s.style.top = e.clientY + 'px'; s.style.color = ['#ff0', '#f0f', '#0ff', '#fff'][Math.floor(Math.random() * 4)];
      d.body.append(s); setTimeout(() => s.remove(), 700);
    };
    addEventListener('mousemove', spark);
  }

  // ---------- round 2 eggs ----------
  // 1. Leave the tab: the title begs.
  const origTitle = d.title;
  d.addEventListener('visibilitychange', () => {
    if (d.hidden) { d.title = 'Come back. The lamp is still on.'; ls.set('tabLeft', true); }
    else { d.title = origTitle; if (ls.get('tabLeft', false)) found('tab'); }
  });
  // 2. Stop reading for a while: the page notices.
  let idleT; const idle = () => { clearTimeout(idleT); idleT = setTimeout(() => { if (!d.hidden && !term) { toast('The page has noticed you have stopped reading. It will wait.', 6000); found('idle'); } }, 75000); };
  ['pointermove', 'keydown', 'scroll', 'touchstart'].forEach((ev) => addEventListener(ev, idle, { passive: true })); idle();
  // 3. Type his name.
  function nameCalled() {
    const m = d.querySelector('.c-mark,.d-mark,.a-mark,.b-mark'); if (m) { m.classList.remove('bow'); void m.offsetWidth; m.classList.add('bow'); }
    toast('Yes?', 2200); found('name');
  }
  // 4. Click the year on the report cover: forecasts, then a withdrawal.
  const yr = d.querySelector('.c-yr');
  if (yr) {
    const base0 = +yr.textContent; let clicks = 0;
    const LBL = ['', ' (forecast)', ' (projected)', ' (aspirational)'];
    yr.style.cursor = 'pointer'; yr.setAttribute('role', 'button'); yr.tabIndex = 0;
    const bump = () => {
      clicks++;
      if (clicks < 4) { yr.textContent = String(base0 + clicks); yr.dataset.note = LBL[clicks]; yr.setAttribute('aria-label', `${base0 + clicks}${LBL[clicks]}`); toast(`${base0 + clicks}${LBL[clicks]}.`, 1800); }
      else { clicks = 0; yr.textContent = String(base0); delete yr.dataset.note; toast('Forecast withdrawn. Results remain as reported.', 3200); found('forecast'); }
    };
    yr.addEventListener('click', bump); yr.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bump(); } });
  }
  // 5. Print the page: it is stamped (see the print styles) and noted.
  addEventListener('beforeprint', () => found('print'));
  // 6. After hours (10pm to 5am local time) the lamp in the masthead is on.
  const hr = new Date().getHours();
  if (hr >= 22 || hr < 5) {
    const m = d.querySelector('.c-mast,.d-mast,.a-mast,.b-mast');
    if (m) {
      const lamp = d.createElement('button'); lamp.type = 'button'; lamp.className = 'lamp-on'; lamp.setAttribute('aria-label', 'A lamp, left on');
      lamp.onclick = () => { toast('After hours. The lamp has been left on. It is not involved.', 4000); found('lamp'); };
      m.append(lamp);
    }
  }
  // Terminal shortcut for anyone who cannot do the code.
  CMDS.konami = () => { setTimeout(go1994, 300); return 'Fine. Going back to 1996.'; };
  CMDS['1996'] = CMDS.konami;
  window.bb1994 = go1994;
})();
