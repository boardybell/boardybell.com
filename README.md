# boardybell.com

A personal page. Static Astro site, deployed to GitHub Pages by Actions.

- `npm run build` builds to `dist/` (base path from `SITE_BASE`, default `/boardybell.com/` for the github.io gallery; `/` in production).
- `node scripts/qa.mjs [--thumbs]` checks layout at 360/768/1280/1920, images, privacy rules, copy rules, every Easter egg, and one-page certificate printing.
- Imagery: `node scripts/briefs.mjs` writes prompts, `scripts/codex-run.sh` generates them, `visuals/selected.json` picks and grades, `node scripts/images.mjs` encodes AVIF/WebP/JPEG without metadata.
- Copy lives in `src/content/copy.ts`. No em dashes.
