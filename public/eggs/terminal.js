/* BoardyOS: a fake terminal opened from the computer engraving (and the backtick key).
   A small emulated shell with a file system. The trail to the arcade:
   login guest -> cat README -> ls /srv -> cat notes.txt -> ls -a -> cat .cabinet_key
   -> unlock /srv/arcade -> cd /srv/arcade -> ./insert_coin -> start
   No network, nothing stored except progress in localStorage (try/catch). */
(() => {
  if (window.bbTerminal) return;
  const d = document, BASE = d.documentElement.dataset.base || '/';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ls = { get(k, f) { try { const v = localStorage.getItem('bb.' + k); return v == null ? f : JSON.parse(v); } catch { return f; } }, set(k, v) { try { localStorage.setItem('bb.' + k, JSON.stringify(v)); } catch {} } };

  // ---------- file system ----------
  const F = (text) => ({ t: 'f', text });
  const D = (kids, o = {}) => ({ t: 'd', kids, ...o });
  const FS = D({
    home: D({
      guest: D({
        'README': F('Welcome, guest.\n\nThis machine belongs to the Chairman of the Boardman.\nPublic areas: /home/guest and /srv. Everything else is withheld.\n\nThere is an arcade on this machine. Finding it is your problem.'),
        'notes.txt': F('Note to self:\n- The arcade in /srv is locked after hours.\n- The spare cabinet key is with the other hidden files.\n- Hidden files start with a dot. Use ls -a.\n- Do not tell the board. (I am the board.)'),
        '.cabinet_key': F('CABINET KEY\nBrass, circa 2019. Opens one cabinet.\n\nUsage: unlock /srv/arcade'),
        '.history_of_this_page': F('Version 1: blank.\nVersion 2: also blank, but expensive.\nVersion 3: this.'),
      }),
      boardy: D({}, { locked: 'Permission denied. Details withheld.' }),
    }),
    srv: D({
      arcade: D({
        'README': F('BOARDY ARCADE\nTwenty cabinets. Free play.\nRun ./insert_coin, then type start.'),
        'insert_coin': { t: 'x' },
        'cabinets.txt': F('tax-man  margin-invaders  compound-interest  break-the-market\nbear-market  the-road-to-generational-wealth  bond-trader\ncrossing-wall-street  market-volatility  family-office-simulator\nthe-corporate-ladder  asset-allocation  soft-landing  audit-season\nliquidity-event  lifestyle-creep  defensive-position\nreconciliation  holding-company  risk-committee'),
      }, { locked: 'Permission denied. The cabinet is locked after hours.' }),
      'lost+found': D({ 'umbrella': F('Found: one umbrella. Never opened in the rain.') }),
    }),
    etc: D({
      'motd': F('Message of the day: There is no message today.'),
      'passwd': F('Nice try.'),
    }, { locked: null }),
    var: D({ log: D({ 'lamp.log': F('22:00 lamp on\n23:00 lamp on\n00:00 lamp on\n01:00 lamp still on\n02:00 see previous entries') }) }),
    root: D({}, { locked: 'Permission denied. The board said no.' }),
  });

  // ---------- state ----------
  let cwd = ['home', 'guest'], user = null, unlocked = ls.get('arcadeUnlocked', false), credit = false, booting = true;
  const hist = []; let hi = -1;
  const path = (p = cwd) => '/' + p.join('/');
  const prompt = () => `${user || 'guest'}@boardyos:${path().replace('/home/guest', '~') || '/'}$ `;
  const resolve = (arg) => {
    if (!arg || arg === '~') return ['home', 'guest'];
    let parts = arg.startsWith('/') ? [] : arg.startsWith('~') ? ['home', 'guest'] : [...cwd];
    for (const seg of arg.replace(/^~\/?/, '').split('/')) {
      if (!seg || seg === '.') continue;
      if (seg === '..') parts.pop(); else parts.push(seg);
    }
    return parts;
  };
  const node = (parts) => parts.reduce((n, s) => (n && n.t === 'd' ? n.kids[s] : undefined), FS);
  const blocked = (parts) => {
    for (let i = 1; i <= parts.length; i++) {
      const n = node(parts.slice(0, i));
      if (n && n.locked && !(unlocked && parts[0] === 'srv' && parts[1] === 'arcade')) return n.locked;
    }
    return null;
  };

  // ---------- DOM ----------
  const W = d.createElement('div');
  W.className = 'bos'; W.setAttribute('role', 'dialog'); W.setAttribute('aria-label', 'BoardyOS terminal'); W.setAttribute('aria-modal', 'true');
  W.innerHTML = `<div class="bos-screen"><div class="bos-bar"><span>BoardyOS 4.2 · tty1</span><button type="button" class="bos-x" aria-label="Close terminal">close ✕</button></div>
<div class="bos-out" aria-live="polite"></div>
<form class="bos-line"><span class="bos-ps"></span><input class="bos-in" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go" aria-label="Command"></form>
<div class="bos-keys" aria-hidden="true"><button type="button" data-k="tab">TAB</button><button type="button" data-k="up">↑</button><button type="button" data-k="down">↓</button><button type="button" data-k="ls">ls</button><button type="button" data-k="cat ">cat</button><button type="button" data-k="cd ">cd</button><button type="button" data-k="hint">hint</button><button type="button" data-k="ctrlc">^C</button></div></div>`;
  const out = W.querySelector('.bos-out'), inp = W.querySelector('.bos-in'), ps = W.querySelector('.bos-ps'), form = W.querySelector('.bos-line');
  const print = (s = '', cls = '') => { const p = d.createElement('div'); if (cls) p.className = cls; p.textContent = s; out.append(p); out.scrollTop = out.scrollHeight; };
  const echo = (cmd) => print(prompt() + cmd, 'bos-cmd');
  const setPS = () => { ps.textContent = user ? prompt() : 'login: '; };
  const sleep = (ms) => new Promise((r) => setTimeout(r, RM ? 0 : ms));

  async function boot() {
    booting = true; form.hidden = true;
    const lines = ['BoardyOS 4.2 (unregistered)', 'Checking chairs............... 1 found', 'Checking lamps............... on', 'Mounting /srv/arcade......... locked (after hours)', 'Withholding details.......... done', '', 'Visitors may log in as guest.', ''];
    for (const l of lines) { print(l, 'bos-dim'); await sleep(170); }
    booting = false; form.hidden = false; setPS(); inp.focus();
  }

  // ---------- commands ----------
  const listing = (n, all) => Object.keys(n.kids).filter((k) => all || !k.startsWith('.')).sort().map((k) => (n.kids[k].t === 'd' ? k + '/' : n.kids[k].t === 'x' ? k + '*' : k)).join('  ');
  const MAN = {
    ls: 'ls [-a] [dir]: list a directory. -a includes hidden files, which start with a dot.',
    cd: 'cd [dir]: change directory. cd .. goes up. cd ~ goes home.',
    cat: 'cat <file>: print a file.', pwd: 'pwd: print the current directory.',
    unlock: 'unlock <dir>: unlock a directory, if you hold the key.',
    hint: 'hint: a nudge, given reluctantly.', clear: 'clear: clear the screen.', exit: 'exit: leave the terminal.',
  };
  const C = {
    help: () => print('Commands: ls, cd, cat, pwd, whoami, unlock, hint, man, history, clear, date, uname, echo, certificate, exit\nRun programs with ./name. Tab completes. Up and down recall history.'),
    man: (a) => print(MAN[a[0]] || (a[0] ? `No manual entry for ${a[0]}. There is barely a manual.` : 'What manual page do you want?')),
    whoami: () => print(user), pwd: () => print(path() || '/'),
    date: () => print('It is today. Further detail withheld.'), uname: () => print('BoardyOS 4.2 boardyos 1-chair x86_64 Details/Withheld'),
    echo: (a) => print(a.join(' ')), history: () => hist.forEach((h, i) => print(`${String(i + 1).padStart(4)}  ${h}`)),
    clear: () => { out.textContent = ''; },
    ls: (a) => {
      const all = a.includes('-a') || a.includes('-la') || a.includes('-al'); const target = a.find((x) => !x.startsWith('-'));
      const p = resolve(target ?? '.'); const b = blocked(p); if (b) return print(`ls: ${target || '.'}: ${b}`);
      const n = node(p); if (!n) return print(`ls: ${target}: No such file or directory`);
      if (n.t !== 'd') return print(target);
      const s = listing(n, all); print(s || '(empty)');
      if (p.join('/') === 'srv' && !unlocked) ls.set('tsSawSrv', true);
    },
    cd: (a) => {
      const p = resolve(a[0]); const b = blocked(p); if (b) return print(`cd: ${a[0]}: ${b}`);
      const n = node(p); if (!n) return print(`cd: ${a[0]}: No such file or directory`); if (n.t !== 'd') return print(`cd: ${a[0]}: Not a directory`);
      cwd = p;
    },
    cat: (a) => {
      if (!a[0]) return print('cat: which one?');
      const p = resolve(a[0]); const b = blocked(p); if (b) return print(`cat: ${a[0]}: ${b}`);
      const n = node(p); if (!n) return print(`cat: ${a[0]}: No such file or directory`); if (n.t === 'd') return print(`cat: ${a[0]}: Is a directory`);
      if (n.t === 'x') return print('cat: binary file. It mostly says "insert coin".');
      print(n.text);
    },
    unlock: (a) => {
      const p = resolve(a[0]);
      if (p.join('/') !== 'srv/arcade') return print(a[0] ? `unlock: ${a[0]}: nothing to unlock` : 'unlock: unlock what?');
      if (!ls.get('tsKey', false)) return print('unlock: you do not hold a key. Keys are usually hidden.');
      unlocked = true; ls.set('arcadeUnlocked', true); print('Unlocking /srv/arcade ... click.\nThe cabinet is open. cd /srv/arcade');
    },
    sudo: () => print('Request forwarded to the board. The board is one person. The board said no.'),
    rm: () => print('rm: nothing here is worth deleting. That is the point of it.'),
    vi: () => print('You are now trapped in vi. Just kidding. That would be cruel.'), vim: () => C.vi(), nano: () => C.vi(), emacs: () => C.vi(),
    exit: () => close(), logout: () => close(), quit: () => close(),
    coin: () => insertCoin(), start: () => startArcade(), arcade: () => print('arcade: command not found. Perhaps it is in /srv.'),
    konami: () => { close(); setTimeout(() => window.bb1994?.(), 200); },
    certificate: () => { print('Preparing your certificate.'); setTimeout(() => (location.href = BASE + 'certificate/'), 500); },
    hint: () => {
      const h = !ls.get('tsReadme', false) ? 'Read the README. cat README' : !unlocked && !ls.get('tsSawSrv', false) ? 'The README mentions /srv. Try ls /srv' : !unlocked && !ls.get('tsKey', false) ? 'Your notes mention hidden files. cat notes.txt, then ls -a' : !unlocked ? 'You have the key. unlock /srv/arcade' : path() !== '/srv/arcade' ? 'cd /srv/arcade' : !credit ? 'Run the coin slot: ./insert_coin' : 'Type start.';
      print('Hint: ' + h);
    },
  };
  function insertCoin() {
    if (!unlocked || path() !== '/srv/arcade') return print('insert_coin: there is no coin slot here.');
    credit = true; print('*clunk*\nCREDIT 01\nPRESS START (type start)', 'bos-hot');
  }
  async function startArcade() {
    if (!credit) return print(unlocked ? 'start: insert coin first.' : 'start: nothing to start.');
    form.hidden = true;
    for (const l of ['Loading BOARDY ARCADE', '[##########----------]', '[####################] 100%', 'Good luck. Not investment advice.']) { print(l, 'bos-hot'); await sleep(320); }
    window.bbFound?.('door'); window.bbFound?.('terminal'); ls.set('tsArcade', true);
    location.href = BASE + 'arcade/';
  }
  function run(raw) {
    const line = raw.trim(); if (!line) return;
    hist.push(line); hi = hist.length;
    const [cmd, ...args] = line.split(/\s+/);
    if (cmd === './insert_coin' || (cmd === 'insert_coin' && path() === '/srv/arcade') || cmd === '/srv/arcade/insert_coin') return insertCoin();
    if (cmd.startsWith('./')) return print(`${cmd}: No such file or directory`);
    const fn = C[cmd.toLowerCase()];
    if (!fn) return print(`${cmd}: command not found. Type help.`);
    fn(args);
    if (cmd === 'cat' && resolve(args[0] || '').join('/') === 'home/guest/README') ls.set('tsReadme', true);
    if (cmd === 'cat' && /\.cabinet_key$/.test(args[0] || '')) ls.set('tsKey', true);
  }

  // ---------- input ----------
  form.addEventListener('submit', (e) => {
    e.preventDefault(); const v = inp.value; inp.value = '';
    if (!user) {
      print('login: ' + v);
      if (v.trim().toLowerCase() === 'guest') { user = 'guest'; print('Last login: never. Welcome.\nType help. Type hint if stuck.\n', 'bos-dim'); window.bbFound?.('terminal'); }
      else if (/^(boardy|root|admin|bond)$/i.test(v.trim())) print('Password: ********\nLogin incorrect. That account is not available to visitors. Try guest.');
      else print('Login incorrect. Visitors may log in as guest.');
      setPS(); return;
    }
    echo(v); run(v); setPS();
  });
  const complete = () => {
    const v = inp.value, parts = v.split(/\s+/), last = parts[parts.length - 1] || '';
    if (parts.length === 1) { const m = Object.keys(C).filter((c) => c.startsWith(last)); if (m.length === 1) inp.value = m[0] + ' '; else if (m.length) print(m.join('  ')); return; }
    const slash = last.lastIndexOf('/'), dir = slash >= 0 ? last.slice(0, slash + 1) : '', stem = last.slice(slash + 1);
    const n = node(resolve(dir || '.')); if (!n || n.t !== 'd' || blocked(resolve(dir || '.'))) return;
    const m = Object.keys(n.kids).filter((k) => k.startsWith(stem) && (stem.startsWith('.') || !k.startsWith('.')));
    if (m.length === 1) { parts[parts.length - 1] = dir + m[0] + (n.kids[m[0]].t === 'd' ? '/' : ''); inp.value = parts.join(' '); }
    else if (m.length) print(m.join('  '));
  };
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') { e.preventDefault(); complete(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (hist.length) { hi = Math.max(0, hi - 1); inp.value = hist[hi] || ''; } }
    else if (e.key === 'ArrowDown') { e.preventDefault(); hi = Math.min(hist.length, hi + 1); inp.value = hist[hi] || ''; }
    else if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) { e.preventDefault(); print((user ? prompt() : 'login: ') + inp.value + '^C'); inp.value = ''; }
    else if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) { e.preventDefault(); out.textContent = ''; }
    else if (e.key === 'Escape') close();
  });
  W.querySelectorAll('.bos-keys button').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.k;
    if (k === 'tab') complete();
    else if (k === 'up') inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    else if (k === 'down') inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    else if (k === 'ctrlc') inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', ctrlKey: true }));
    else if (k === 'ls' || k === 'hint') { inp.value = k; form.requestSubmit(); }
    else inp.value = k;
    inp.focus();
  }));
  W.addEventListener('click', (e) => { if (!e.target.closest('button') && !getSelection().toString()) inp.focus(); });
  W.querySelector('.bos-x').onclick = () => close();

  let lastFocus = null;
  function open() {
    if (W.isConnected) { inp.focus(); return; }
    lastFocus = d.activeElement; d.body.append(W); d.documentElement.classList.add('bos-open');
    if (!out.childElementCount) boot(); else { setPS(); inp.focus(); }
  }
  function close() { W.remove(); d.documentElement.classList.remove('bos-open'); lastFocus?.focus?.(); }
  window.bbTerminal = { open, close };
})();
