// [[secret]] -> clickable redaction bar. Copy is authored here, so set:html is safe.
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const rich = (s: string) =>
  esc(s).replace(/\[\[(.+?)\]\]/g, (_, t) =>
    `<button type="button" class="redact" aria-expanded="false"><span class="sr">Redacted. Press to reveal: </span><span class="redact-t">${t}</span></button>`);
export const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
