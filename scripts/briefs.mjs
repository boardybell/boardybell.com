// Writes visuals/prompts/NN-slug.md from one table so every brief carries the same rules.
// Front-room imagery: still life and empty interiors. No people. Graded afterwards by scripts/grade.py.
import { writeFileSync, mkdirSync } from 'node:fs';
mkdirSync('visuals/prompts', { recursive: true });

const L = 'landscape 1536x1024';
const P = 'portrait 1024x1536';
export const shots = [
  // Family A: The Redacted File
  ['01', 'a-folio', L, 'Hero for a "classified dossier" page. Text sits in the right third, so keep the right third dark and quiet.',
    'Overhead still life: a closed, worn dark-leather document folio tied shut with a faded cloth ribbon, lying slightly askew on a dark walnut desk. One brass paperclip beside it. A single soft window light from the upper left. Nothing written on anything.'],
  ['02', 'a-lamp', L, 'Hero for a dossier page, shown full width under a headline.',
    'An empty private office at night: a brass desk lamp with a dark shade left switched on, casting one warm pool of light on a bare, tidy wooden desk. The chair is pushed in. The rest of the room falls into darkness: panelled walls, a tall window with faint night blue. No papers, no screens.'],
  ['03', 'a-drawers', L, 'Wide image band for a dossier page about records.',
    'A long wall of old oak card-catalogue drawers with small brass label holders (labels blank), in a quiet archive room. One drawer is pulled fully open and is visibly empty. Soft directional light from a high window.'],
  // Family B: The Overqualified Page
  ['04', 'b-atrium', L, 'Full-bleed hero for an extremely expensive-looking page that says almost nothing. Large calm empty area in the upper half for type.',
    'A vast, empty neoclassical marble atrium with tall columns and a coffered ceiling, daylight from a high oculus. In the exact centre of the enormous floor stands one small plain wooden chair. Nothing else. The emptiness is the point.'],
  ['05', 'b-plinth', P, 'Tall image beside a headline, cropped to about 4:5 from the centre.',
    'A plain pale stone museum plinth in an otherwise empty gallery room, lit by one precise overhead spotlight. There is nothing on the plinth. Soft shadow on a plain plaster wall behind it.'],
  ['06', 'b-boardroom', L, 'Full-width band for a page that jokes about a board of directors with one member.',
    'A long, very polished dark wood boardroom table in a panelled room, seen from one end. There is exactly one leather chair, at the far head of the table; every other place has no chair at all. Tall windows, soft overcast light, absolutely tidy.'],
  // Family C: The Annual Report
  ['07', 'c-chair', P, 'Cover image of a mock "annual report", cropped to about 3:4 from the centre. Keep the top quarter calm for a title.',
    'An empty high-backed leather wingback chair beside a tall window in a quiet panelled study, morning light falling across the seat. A small side table holds nothing. Still, expensive, slightly melancholy.'],
  ['08', 'c-watch', L, 'Still-life plate inside a mock annual report, about 3:2.',
    'Overhead still life: an antique gold pocket watch lying face down on heavy cream laid paper, its chain trailing in a loose curve. Soft light from the left, fine paper texture visible.'],
  ['09', 'c-pen', L, 'Still-life plate inside a mock annual report, about 3:2.',
    'Close still life: a black fountain pen with gold trim resting, capped, across a closed cloth-bound ledger on a dark desk. Raking light shows the cloth weave. Nothing written anywhere.'],
  // Family D: The Permanent Collection (wildcard, museum labels for ordinary objects). One series.
  ['10', 'd-key', P, 'One of three museum-catalogue plates in the same series. Subject centred, generous margins, plain backdrop.',
    'Museum catalogue photograph: a single ordinary brass house key lying on a small stone plinth, against a plain warm grey seamless backdrop. Precise, reverent museum lighting, soft shadow.'],
  ['11', 'd-mug', P, 'Second of three museum-catalogue plates in the same series (must match 10: same backdrop, plinth, lighting).',
    'Museum catalogue photograph: a plain white ceramic coffee mug with no markings, slightly chipped at the rim, standing on a small stone plinth against a plain warm grey seamless backdrop. Precise, reverent museum lighting.'],
  ['12', 'd-umbrella', P, 'Third of three museum-catalogue plates in the same series (must match 10 and 11).',
    'Museum catalogue photograph: a tightly furled black umbrella with a wooden handle, standing upright and propped against a small stone plinth, against a plain warm grey seamless backdrop. Precise, reverent museum lighting.'],
];

for (const [n, slug, size, purpose, subject] of shots) {
  writeFileSync(`visuals/prompts/${n}-${slug}.md`, `# Brief ${n}: ${slug}

You are the photographer. Work ONLY inside the current directory.

## Purpose
${purpose}
The site is a dry, deadpan personal page dressed as a very expensive private-bank website. The photography must look genuinely expensive: restrained, cinematic, editorial still life and architecture, like a high-end annual report.

## Subject
${subject}

## Method
1. Use your built-in image generation tool to create the photograph, ${size}, photographic realism, natural lens, shallow but believable depth of field, no stylization, no illustration.
2. Save the untouched result as \`raw-1.png\`. Generate a second variant with a different camera angle or composition as \`raw-2.png\`.
3. Do not edit, grade, or resize them. Colour grading happens later.

## Must not appear
No people, hands, body parts, reflections of people, or silhouettes. No animals. No text, letters, numbers, signage, logos, monograms, or watermarks anywhere, including on paper, spines, labels, and screens. No computers or phones. No flags. Nothing cropped awkwardly at the frame edges.

## Report
Write \`NOTES.md\` with the exact prompt you used for each variant.
`);
}
console.log(shots.length, 'briefs');
