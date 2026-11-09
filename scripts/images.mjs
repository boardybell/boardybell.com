// visuals/selected.json -> graded master -> public/img/<name>-<w>.{avif,webp,jpg} + public/img/manifest.json
// Grading: scripts/grade.py (palette gradient map). sharp drops all EXIF/XMP/ICC metadata by default.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
const PY = process.env.PY ?? `${process.env.HOME}/Developer/_refs/fontvenv/bin/python`;
const sel = JSON.parse(readFileSync('visuals/selected.json', 'utf8'));
mkdirSync('public/img', { recursive: true }); mkdirSync('visuals/graded', { recursive: true });
const man = {};
for (const [name, o] of Object.entries(sel)) {
  const graded = `visuals/graded/${name}.png`;
  const args = [o.grade, o.src, graded, '--lift', String(o.lift ?? 0), '--gamma', String(o.gamma ?? 1), '--mix', String(o.mix ?? 0)];
  if (o.grade === 'none') execFileSync('cp', [o.src, graded]); else execFileSync(PY, ['scripts/grade.py', ...args]);
  let img = sharp(graded);
  if (o.crop) img = img.extract(o.crop);
  if (o.up) img = sharp(await img.toBuffer()).resize({ width: o.up, kernel: 'lanczos3' });
  const buf = await img.toBuffer(); const meta = await sharp(buf).metadata();
  const widths = (o.up ? [640, 1280, 1920, o.up] : [640, 1024, meta.width]).filter((w, i, a) => w <= meta.width && a.indexOf(w) === i);
  for (const w of widths) {
    const r = sharp(buf).resize({ width: w });
    await r.clone().avif({ quality: o.q ?? 52, effort: 6 }).toFile(`public/img/${name}-${w}.avif`);
    await r.clone().webp({ quality: o.grade === 'none' ? 82 : 74 }).toFile(`public/img/${name}-${w}.webp`);
    await r.clone().jpeg({ quality: 78, mozjpeg: true, progressive: true }).toFile(`public/img/${name}-${w}.jpg`);
  }
  man[name] = { w: meta.width, h: meta.height, widths };
  console.log(name, meta.width + 'x' + meta.height, widths.join(','));
}
writeFileSync('public/img/manifest.json', JSON.stringify(man, null, 1));
