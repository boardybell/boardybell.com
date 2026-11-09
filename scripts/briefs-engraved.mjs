// Round 4 plates (Bond, 2026-11-09: the nib and watch photos are "kind of cheesy"; wants engraved items
// "in the style of a tax stamp or currency engravings or stipple" newspaper-portrait style).
// Gold ink on deep navy to sit in N6 Midnight. Never imitates real currency or real stamps.
import { writeFileSync } from 'node:fs';
const L = 'landscape 1536x1024';
const shots = [
  ['80', 'e-nib', 'Banknote-style intaglio line engraving: a fountain pen nib, three-quarter view, rendered entirely in fine parallel hatching and cross-hatching that follows its curves, centred inside an oval vignette framed by an intricate guilloché rosette border and fine geometric lathe-work patterns, like the vignette of an old engraved certificate.'],
  ['81', 'e-watch', 'Revenue-stamp-style engraving: a pocket watch lying face down with its chain in a loose curve, drawn in dense line engraving and stipple, inside a rectangular stamp frame with a perforated (scalloped) edge, ornamental corner rosettes and a guilloché band around the border. Blank cartouches only.'],
  ['82', 'e-lamp', 'Stipple-and-hatch portrait-engraving style (the dot-and-line technique of classic newspaper portrait drawings): a brass desk lamp switched on, standing on a bare desk, the light shown by leaving paper bare and the shadows built from dense dots and fine hatching. Clean, crisp, no background clutter.'],
  ['83', 'e-chair', 'Stipple-and-hatch portrait-engraving style (the dot-and-line technique of classic newspaper portrait drawings): an empty high-backed wingback chair, three-quarter view, built from fine dots and cross-hatching, upholstery buttons and folds carefully rendered, plain ground.'],
];
for (const [n, slug, subject] of shots) writeFileSync(`visuals/prompts/${n}-${slug}.md`, `# Brief ${n}: ${slug}

You are an engraver. Work ONLY inside the current directory.

## Purpose
A still-life plate in a deadpan personal "annual report" website set in deep navy with gold accents. The look must be a genuine, finely made engraving: confident line work, consistent line weight, like a proof pulled from a steel plate. Restrained and expensive, never clip art, never cartoonish.

## Subject
${subject}

## Colour and medium
Printed in a single metallic-gold ink (about #C9A45C, highlights toward #E8CF94) on deep navy paper (about #0D1626 to #16233B), with subtle paper texture. No other colours. The image is 100% line engraving / stipple: no photographic shading, no gradients, no 3D render look.

## Method
1. Use your built-in image generation tool, ${L}, subject centred with generous navy margins.
2. Save the untouched result as \`raw-1.png\` and a second variant (different composition or border treatment) as \`raw-2.png\`.
3. Do not edit them.

## Must not appear
No text, letters, numerals, denominations, serial numbers, signatures, seals with lettering, portraits of people, flags, coats of arms, national or government emblems, or anything that could be mistaken for real currency, a real postage or tax stamp, or a real security document. No logos or watermarks.

## Report
Write \`NOTES.md\` with the exact prompt you used for each variant.
`);
console.log(shots.length);
