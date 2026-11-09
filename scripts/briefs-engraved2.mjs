// Round 5: a wide selection of engraved plates for Bond to pick from (2026-11-09: liked the idea of the
// engraved watch and nib "but it's off"; wants other options). Fix for "off": pure line work, no 3D/airbrush
// shading; all tone made only from engraved lines, cross-hatching or dots, like a real steel-plate proof.
import { writeFileSync } from 'node:fs';
const STYLE = {
  banknote: 'banknote intaglio vignette: the object in fine parallel line engraving and cross-hatching, inside an oval or round frame of guilloché lathe-work rosettes',
  stamp: 'nineteenth-century revenue-stamp engraving: the object in line engraving inside a small rectangular frame with a perforated (scalloped) edge, corner rosettes and blank cartouches',
  stipple: 'newspaper-portrait stipple: the object built only from fine dots and short hatch lines, crisp edges, bare paper for highlights, no frame',
  bookplate: 'ex-libris bookplate engraving: the object in copperplate line engraving inside a decorative frame with a ribbon banner left blank and a laurel or acanthus border',
  tradecard: 'Victorian trade-card copperplate engraving: the object with crisp line engraving, a small ground line and shadow in hatching, an ornamental scroll frame',
  woodcut: 'fine wood engraving (white-line engraving): the object carved out of a dark ground with precise white lines and textures, small square block with a thin border',
};
const S = [
  ['90', 'p-lamp-banknote', 'banknote', 'a banker’s desk lamp with a domed shade, switched on'],
  ['91', 'p-chair-bookplate', 'bookplate', 'an empty high-backed wingback chair'],
  ['92', 'p-umbrella-stamp', 'stamp', 'a furled umbrella with a curved handle, standing upright'],
  ['93', 'p-cup-stipple', 'stipple', 'a cup of coffee on a saucer, faint steam'],
  ['94', 'p-key-banknote', 'banknote', 'an old house key, diagonal'],
  ['95', 'p-hourglass-woodcut', 'woodcut', 'an hourglass with the sand mostly run through'],
  ['96', 'p-ledger-tradecard', 'tradecard', 'a closed cloth-bound ledger with a ribbon bookmark, a fountain pen lying across it'],
  ['97', 'p-stamp-stipple', 'stipple', 'a wooden-handled rubber stamp standing upright beside its ink pad'],
  ['98', 'p-townhouse-banknote', 'banknote', 'the facade of a tall stone townhouse with one lit window, seen straight on'],
  ['99', 'p-watch-woodcut', 'woodcut', 'a pocket watch lying face down with its chain in a loose curve'],
  ['A0', 'p-nib-stamp', 'stamp', 'a single fountain pen nib, upright'],
  ['A1', 'p-paperclip-bookplate', 'bookplate', 'a single oversized paperclip, presented with total ceremony'],
  ['A2', 'p-cabinet-tradecard', 'tradecard', 'a four-drawer wooden filing cabinet with one drawer slightly open'],
  ['A3', 'p-telephone-stipple', 'stipple', 'a rotary desk telephone with the receiver resting in its cradle'],
  ['A4', 'p-mug-banknote', 'banknote', 'a plain coffee mug with a small chip in the rim'],
  ['A5', 'p-magnifier-woodcut', 'woodcut', 'a magnifying glass lying on a single blank sheet of paper'],
  // Round 6: objects from Bond's own interests (2026-11-09: "a list of items based off your understanding of my interests")
  ['B0', 'p-radio-stamp', 'stamp', 'a handheld two-way radio with a short rubber antenna, generic, no brand'],
  ['B1', 'p-cassette-banknote', 'banknote', 'an audio cassette tape, blank label, slightly angled'],
  ['B2', 'p-vinyl-bookplate', 'bookplate', 'a vinyl record sliding halfway out of a plain sleeve'],
  ['B3', 'p-television-woodcut', 'woodcut', 'a small 1980s CRT television with rabbit-ear antennas, blank screen'],
  ['B4', 'p-joystick-stipple', 'stipple', 'an arcade joystick with a ball top and two round buttons on a small panel'],
  ['B5', 'p-case-tradecard', 'tradecard', 'a rugged hard-shell equipment case with two latches and a handle, generic, no brand'],
  ['B6', 'p-labelmaker-stamp', 'stamp', 'a small handheld label maker with a blank strip of label coming out of it'],
  ['B7', 'p-sunglasses-banknote', 'banknote', 'a pair of classic thick-framed sunglasses, folded'],
  ['B8', 'p-microphone-stipple', 'stipple', 'a vintage studio microphone on a small stand'],
  ['B9', 'p-compass-bookplate', 'bookplate', 'an open pocket compass resting on a folded map with no legible place names'],
  ['C0', 'p-lantern-woodcut', 'woodcut', 'a hand-crank emergency lantern with its crank handle folded out'],
  ['C1', 'p-terminal-tradecard', 'tradecard', 'an old computer terminal with a keyboard and a glowing blank screen'],
  ['C2', 'p-camera-banknote', 'banknote', 'a vintage rangefinder film camera, three-quarter view, no brand'],
  ['C3', 'p-parcel-stipple', 'stipple', 'a brown-paper parcel tied with string, a blank tag attached'],
];
for (const [n, slug, style, subject] of S) if (n >= 'B0') writeFileSync(`visuals/prompts/${n}-${slug}.md`, `# Brief ${n}: ${slug}

You are an engraver. Work ONLY inside the current directory.

## Purpose
A small plate for a deadpan personal "annual report" website set in deep navy with gold accents. It must look like a genuine engraving proof pulled from a steel or copper plate (or a fine wood engraving where specified): confident, consistent line work, restrained and expensive. Never clip art, never cartoonish, never a 3D render.

## Style
${STYLE[style]}.
All shading must come ONLY from engraved lines, cross-hatching or dots. No smooth gradients, no airbrushed or photographic shading, no glow, no metallic sheen effects. Think of a real printed proof under a loupe.

## Subject
${subject}.

## Colour
One ink only: gold (about #C9A45C) printed on deep navy paper (about #0D1626 to #16233B), subtle paper texture. Nothing else.

## Method
1. Use your built-in image generation tool, square 1024x1024, subject centred with generous navy margins.
2. Save the untouched result as \`raw-1.png\` and a second variant (different angle or framing) as \`raw-2.png\`.
3. Do not edit them.

## Must not appear
No text, letters, numerals, denominations, serial numbers, signatures, portraits of people, flags, coats of arms, national or government emblems, or anything that could be mistaken for real currency, a real postage or tax stamp, or a real security document. No logos or watermarks.

## Report
Write \`NOTES.md\` with the exact prompt you used for each variant.
`);
console.log(S.length);
