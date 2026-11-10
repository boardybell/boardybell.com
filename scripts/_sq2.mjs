import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://127.0.0.1:9333');
const ctx = b.contexts()[0];
const pg = ctx.pages().find((p) => p.url().includes('squarespace')) || ctx.pages()[0];
const fn = new Function('pg', 'shot', `return (async () => { ${process.argv[2]} })()`);
try { const r = await fn(pg, process.argv[3]); if (r !== undefined) console.log(typeof r === 'string' ? r : JSON.stringify(r, null, 1)); }
catch (e) { console.log('ERR', e.message.split('\n')[0]); }
console.log('URL', pg.url());
if (process.argv[3]) await pg.screenshot({ path: process.argv[3], fullPage: true });
await b.close().catch(() => {});
