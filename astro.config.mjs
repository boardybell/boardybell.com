import { defineConfig } from 'astro/config';
// Gallery (staging) lives at boardybell.github.io/boardybell.com/; production at boardybell.com/.
const base = process.env.SITE_BASE ?? '/boardybell.com/';
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://boardybell.github.io',
  base,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  devToolbar: { enabled: false },
});
