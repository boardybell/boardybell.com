// Arcade art: deliberately retro, still well made. Original characters; no likeness of any existing game.
import { writeFileSync } from 'node:fs';
const shots = [
  ['13', 'arcade-hall', 'landscape 1536x1024', 'Full-screen background behind a 1990s arcade menu. Menu text sits in the centre, so the centre must be calm and darker.',
    'A detailed 16-bit pixel-art scene of a small dim 1990s arcade at night: a row of four upright arcade cabinets along the back wall, their screens glowing in different colours (abstract light only), neon tube strips on the ceiling, a patterned cosmic carpet, a coin changer machine, purple and teal ambient light. Seen straight on, symmetrical.'],
  ['14', 'title-taxman', 'landscape 1536x1024', 'Title-screen art for a maze game called Tax Man (the title is added later as text, do not draw it). Keep the top third calm for the title.',
    'Original 16-bit pixel art: an overhead view of a maze made of office filing cabinets and desks at night, small glowing paper receipts dotted along the corridors, a tiny round-headed accountant character in a green visor running through it, and four stern auditor characters in grey suits with clipboards, each in a different tie colour, chasing him. Bright, crisp pixels, dark navy floor.'],
  ['15', 'title-invaders', 'landscape 1536x1024', 'Title-screen art for a shooting game called Margin Invaders (the title is added later as text, do not draw it). Keep the top third calm for the title.',
    'Original 16-bit pixel art: neat rows of small red envelope-shaped and rotary-telephone-shaped alien ships descending over a pixel city skyline at night, a small calculator-shaped laser cannon at the bottom firing upward, starfield, a few crumbling green bunkers shaped like piggy banks.'],
  ['16', 'title-snake', 'landscape 1536x1024', 'Title-screen art for a snake game called Compound Interest (the title is added later as text, do not draw it). Keep the top third calm for the title.',
    'Original 16-bit pixel art: a long snake made of stacked gold coins winding across a dark green ledger-paper grid, starting tiny at one end and getting enormous at the other, a single coin pellet ahead of its head. Glowing, satisfying, retro.'],
  ['17', 'title-breakout', 'landscape 1536x1024', 'Title-screen art for a brick-breaking game called Break the Market (the title is added later as text, do not draw it). Keep the top third calm for the title.',
    'Original 16-bit pixel art: a wall of brightly coloured bricks arranged like a jagged bar chart, a glowing ball smashing through it with pixel debris flying, a small paddle at the bottom, deep purple background with a faint grid.'],
];
for (const [n, slug, size, purpose, subject] of shots) writeFileSync(`visuals/prompts/${n}-${slug}.md`, `# Brief ${n}: ${slug}

You are the pixel artist. Work ONLY inside the current directory.

## Purpose
${purpose}
This is the hidden arcade room of a deadpan personal website. It must look retro on purpose and still be genuinely well made: confident 16-bit console or arcade-attract-screen quality, limited palette, clean pixel clusters, no muddy gradients.

## Subject
${subject}

## Method
1. Use your built-in image generation tool, ${size}.
2. Save the untouched result as \`raw-1.png\`, and a second variant as \`raw-2.png\`.
3. Do not edit them.

## Must not appear
No text, letters, numbers, logos or watermarks. No characters or designs from any existing video game, film, or brand (no yellow pie-shaped characters, no ghosts, no existing alien designs). No real currency symbols, real company names, or stock tickers. No real people.

## Report
Write \`NOTES.md\` with the exact prompt you used for each variant.
`);
console.log(shots.length);
