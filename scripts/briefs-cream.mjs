// Round 9 (Bond 2026-11-09): retool the remaining imagery in the style of the chosen beach portrait:
// fine line engraving, black ink on warm cream paper, vignette edges. Terminal without the stamp border.
import { writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
const S = [
  ['E0', 'c-terminal', 'square 1024x1024', 'an old computer terminal with a keyboard and a blank screen, three-quarter view, no frame or border of any kind'],
  ['E1', 'c-joystick', 'square 1024x1024', 'an arcade joystick with a ball top and two large round buttons side by side on a small rectangular panel, three-quarter view from the front left, both buttons clearly visible, no frame'],
  ['E2', 'c-key', 'portrait 1024x1536', 'a single old brass house key lying on a small stone plinth, museum-catalogue presentation'],
  ['E3', 'c-mug', 'portrait 1024x1536', 'a plain coffee mug with a small chip in the rim, standing on a small stone plinth, museum-catalogue presentation'],
  ['E4', 'c-umbrella', 'portrait 1024x1536', 'a tightly furled umbrella with a curved wooden handle, standing upright and leaning against a small stone plinth, museum-catalogue presentation'],
];
for (const [n, slug, size, subject] of S) {
  mkdirSync(`visuals/inbox/${n}-${slug}/_ref`, { recursive: true });
  copyFileSync('visuals/inbox/_portrait-ref/style.png', `visuals/inbox/${n}-${slug}/_ref/style.png`);
  writeFileSync(`visuals/prompts/${n}-${slug}.md`, `# Brief ${n}: ${slug}

You are an engraver. Work ONLY inside the current directory.

## Style: match \`_ref/style.png\` exactly
The same hand and medium as that portrait plate: fine steel-plate line engraving in black ink on warm cream paper (about #F6F0E4), tone built only from engraved lines, cross-hatching and stipple, crisp contours, a soft vignette fading to bare cream paper at the edges. No colour, no gradients, no pencil smudging, no 3D render look. (Ignore the person and the beach in the reference; use it only for the technique.)

## Subject
${subject}.

## Method
1. Use your built-in image generation tool, ${size}, subject centred with generous cream margins.
2. Save the untouched result as \`raw-1.png\` and a second variant as \`raw-2.png\`. Do not edit them.

## Must not appear
No text, letters, numerals, logos, brand names, people, frames, borders, stamps, or watermarks.

## Report
Write \`NOTES.md\` with the exact prompt you used for each variant.
`);
}
console.log(S.length);
