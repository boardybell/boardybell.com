import { chromium } from 'playwright';
const recs = JSON.parse(process.argv[2]);
const b = await chromium.connectOverCDP('http://127.0.0.1:9333');
const pg = b.contexts()[0].pages().find((p) => p.url().includes('squarespace'));
const panelInputs = () => pg.evaluate(() => {
  const panel = [...document.querySelectorAll('div')].filter((d) => (d.innerText || '').trim().startsWith('Add Record') && d.querySelector('input')).pop();
  if (!panel) return null;
  const vis = (e) => e.getBoundingClientRect().width > 0;
  const c = (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; };
  const combo = [...panel.querySelectorAll('[role=combobox]')].filter(vis);
  const inputs = [...panel.querySelectorAll('input')].filter((i) => vis(i) && !i.disabled && i.getAttribute('role') !== 'combobox' && !i.closest('[role=combobox]'));
  const btn = (t) => [...panel.querySelectorAll('button')].find((x) => (x.innerText || '').trim() === t);
  return { type: combo[0] ? c(combo[0]) : null, typeText: combo[0] ? combo[0].innerText.trim() : '', inputs: inputs.map(c), save: btn('SAVE') ? c(btn('SAVE')) : null };
});
for (const [type, name, data] of recs) {
  let P = await panelInputs();
  if (!P) {
    const a = await pg.evaluate(() => { const e = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim() === 'ADD RECORD'); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    await pg.mouse.click(a.x, a.y); await pg.waitForTimeout(1200); P = await panelInputs();
  }
  if (P.typeText.split('\n')[0] !== type) {
    await pg.mouse.click(P.type.x, P.type.y); await pg.waitForTimeout(500);
    await pg.keyboard.type(type); await pg.waitForTimeout(500);
    // pick the exact option if a list is showing, else Enter
    const opt = await pg.evaluate((type) => { const e = [...document.querySelectorAll('[role=option]')].find((x) => (x.innerText || '').trim() === type); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, type);
    if (opt) await pg.mouse.click(opt.x, opt.y); else await pg.keyboard.press('Enter');
    await pg.waitForTimeout(700); P = await panelInputs();
  }
  if (P.typeText.split('\n')[0] !== type) { console.log('TYPE NOT SET', type, 'got', JSON.stringify(P.typeText)); break; }
  // inputs order: name, (priority hidden for A/AAAA/CNAME), data last
  await pg.mouse.click(P.inputs[0].x, P.inputs[0].y); await pg.keyboard.press('Meta+A'); await pg.keyboard.press('Backspace'); await pg.keyboard.type(name);
  const d = P.inputs[P.inputs.length - 1]; await pg.mouse.click(d.x, d.y); await pg.keyboard.press('Meta+A'); await pg.keyboard.press('Backspace'); await pg.keyboard.type(data);
  await pg.waitForTimeout(300);
  await pg.mouse.click(P.save.x, P.save.y); await pg.waitForTimeout(3500);
  const still = await panelInputs();
  const txt = await pg.evaluate(() => document.body.innerText);
  const err = (txt.match(/[^\n]*(invalid|error|already|conflict|must)[^\n]*/i) || [])[0];
  console.log(type, name, data, still ? 'FORM STILL OPEN ' + (err || '') : 'saved', txt.includes(data) ? 'visible' : 'NOT visible');
  if (still) break;
}
await b.close().catch(() => {});
