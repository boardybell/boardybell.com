// Round 2 imagery (Bond, 2026-11-09: "more of the blue gold theme", images "need a complete revamp").
// Direction: the family's monochrome navy photography (see _ref/family-hero.jpg) with gold as the only warm note.
import { writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
const REF = `${process.env.HOME}/Developer/bellassetmanagement-site/assets/inbox/02-hero-01-colonnade/_ref/bbco-hero.jpg`;
const L = 'landscape 1536x1024', P = 'portrait 1024x1536';
const shots = [
  ['20', 'n-chair', P, 'Cover image of a mock annual report, cropped about 3:4 from the centre, sitting on a deep navy page. Keep the top quarter calm and dark.',
    'An empty high-backed wingback chair upholstered in deep navy velvet with small brass nailhead trim, in a dark panelled study painted navy. One small brass picture light on the wall above casts a single warm gold glow across the top of the chair. Everything else falls into navy shadow. A tall window edge at one side with faint blue night light.'],
  ['21', 'n-watch', L, 'Still-life plate in a mock annual report, about 3:2.',
    'Overhead still life: an antique gold pocket watch lying face down on deep navy blue leather, its gold chain trailing in a loose curve. One soft warm light from the upper left makes the gold glow; the leather stays deep navy with subtle grain.'],
  ['22', 'n-pen', L, 'Still-life plate in a mock annual report, about 3:2.',
    'Close still life: a black fountain pen with gold trim and a gold nib cap ring resting across a closed navy blue cloth-bound ledger with gilt page edges, on a dark navy desk surface. Raking warm light picks out the gold trim and gilt edges; everything else is navy and shadow.'],
  ['23', 'n-key', P, 'One of three museum-catalogue plates in the same series. Subject centred, generous margins.',
    'Museum catalogue photograph: a single brass house key lying on a small dark navy stone plinth, against a deep navy seamless backdrop. Precise, reverent museum lighting: one warm spotlight from above makes the brass glow gold; soft gradient falloff into navy.'],
  ['24', 'n-mug', P, 'Second of three museum-catalogue plates (must match 23: same navy backdrop, navy plinth, single warm spotlight).',
    'Museum catalogue photograph: a plain cream porcelain coffee mug with a thin gold rim, slightly chipped at the rim, standing on a small dark navy stone plinth against a deep navy seamless backdrop. One warm spotlight from above.'],
  ['25', 'n-umbrella', P, 'Third of three museum-catalogue plates (must match 23 and 24).',
    'Museum catalogue photograph: a tightly furled navy blue umbrella with a polished brass ferrule and a curved brass-capped handle, standing upright and propped against a small dark navy stone plinth, against a deep navy seamless backdrop. One warm spotlight from above makes the brass glow.'],
  // N2 Lamplit: navy architecture at night, gold only where a light is on
  ['30', 'l-facade', P, 'Cover image of a mock annual report, about 3:4, on a cream page with navy bands. Keep the top quarter calm sky.',
    'A stately four-storey stone townhouse facade at blue hour, photographed straight on, every window dark except one on the second floor where a single lamp glows warm gold behind sheer curtains. Wet pavement, iron railings, deep navy sky. Architectural, symmetrical, very quiet.'],
  ['31', 'l-clock', L, 'Still-life plate in a mock annual report, about 3:2.',
    'A tall-case clock in a dark navy-painted hallway at night, its brass pendulum and dial ring catching one warm gold light; the dial itself in soft shadow so no numerals read. Navy panelling, polished floor.'],
  ['32', 'l-door', L, 'Still-life plate in a mock annual report, about 3:2.',
    'A glossy navy front door at night with a heavy brass knocker and brass letter plate, lit by one warm lantern from the side; stone doorcase in navy shadow. Close and calm.'],
  // N3 Gilt: macro details, gold leaf and navy
  ['40', 'g-edges', P, 'Cover image of a mock annual report, about 3:4, on a deep navy page with gilt frames. Keep the top quarter calm and dark.',
    'Extreme close-up of a neat stack of navy blue leather-bound ledgers seen side-on, their gilded page edges glowing gold in one warm raking light, deep navy shadows around. Abstract, luxurious, graphic stripes of gold and navy.'],
  ['41', 'g-nib', L, 'Macro still-life plate in a mock annual report, about 3:2.',
    'Macro photograph of a gold fountain pen nib resting on deep navy laid paper, razor-thin depth of field, warm gold highlights, the rest dissolving into navy. No engraving or text on the nib.'],
  ['42', 'g-watch', L, 'Macro still-life plate in a mock annual report, about 3:2.',
    'Macro photograph of the plain polished gold back of a pocket watch and the first links of its chain on deep navy velvet, warm light sliding across the curve of the case. No engraving, no dial visible.'],
  ['43', 'g-key', P, 'One of three museum detail plates in the same series. Subject centred.',
    'Macro museum photograph of the cut teeth of a brass house key against a deep navy seamless backdrop, single warm spotlight, extremely shallow depth of field, reverent and absurdly serious.'],
  ['44', 'g-mug', P, 'Second of three museum detail plates (match 43: navy backdrop, single warm spotlight, macro).',
    'Macro museum photograph of the gold-rimmed lip of a cream porcelain mug showing one small chip in the rim, against a deep navy seamless backdrop, single warm spotlight.'],
  ['45', 'g-umbrella', P, 'Third of three museum detail plates (match 43 and 44).',
    'Macro museum photograph of the polished brass tip and ferrule of a furled navy umbrella, the fabric folds in navy, against a deep navy seamless backdrop, single warm spotlight.'],
];
for (const [n, slug, size, purpose, subject] of shots) {
  mkdirSync(`visuals/inbox/${n}-${slug}/_ref`, { recursive: true });
  copyFileSync(REF, `visuals/inbox/${n}-${slug}/_ref/family-hero.jpg`);
  writeFileSync(`visuals/prompts/${n}-${slug}.md`, `# Brief ${n}: ${slug}

You are the photographer. Work ONLY inside the current directory.

## Purpose
${purpose}
The site is a dry, deadpan personal page dressed as a very expensive private-bank website in a navy and gold palette. Look at \`_ref/family-hero.jpg\`: the family's photography is deep, moody, monochrome navy. Match that navy mood exactly, then let gold, brass and warm light be the ONLY warm colour in the frame. Restrained, cinematic, editorial, like a high-end annual report.

## Palette
Deep navy #0D1626 to #16233B dominates every frame. Gold and brass around #B98B3E to #D9B36C for metal and highlights. Cream #FDF6EC only for the very brightest highlights. No brown wood, no green, no red, no orange cast.

## Subject
${subject}

## Method
1. Use your built-in image generation tool, ${size}, photographic realism, natural lens, believable shallow depth of field, no illustration.
2. Save the untouched result as \`raw-1.png\`. Generate a second variant with a different camera angle or composition as \`raw-2.png\`.
3. Do not edit, grade, or resize them.

## Must not appear
No people, hands, body parts, reflections of people, or silhouettes. No animals. No text, letters, numbers, signage, logos, monograms, or watermarks anywhere. No computers or phones. No flags. Nothing cropped awkwardly at the frame edges.

## Report
Write \`NOTES.md\` with the exact prompt you used for each variant.
`);
}
console.log(shots.length, 'briefs');
