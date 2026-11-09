// Round 2 arcade art: 16 title screens + 2 retro web graphics for the 1994 Konami mode.
import { writeFileSync } from 'node:fs';
const T = 'Title-screen art (the title is added later as text; do not draw any). Keep the top third calm for the title.';
const shots = [
  ['50', 'title-bear', T, 'Original 16-bit pixel art: a first-person view down a long dim office corridor at night, rows of cubicles, flickering ceiling lights, a glowing green exit sign shape (no letters) far away, and a friendly person in a brown bear mascot costume standing in the way holding a coffee mug.'],
  ['51', 'title-trail', T, 'Original 16-bit pixel art: a small covered wagon pulled by two oxen along a dusty trail across wide prairie at sunset, the wagon loaded with filing boxes and a desk lamp, a river ahead with floating paper forms, mountains far off.'],
  ['52', 'title-trader', T, 'Original 16-bit pixel art: a busy pixel city market street at dusk with a little handcart piled with staplers, desk chairs, rubber-stamp sets and printer paper, shop awnings, glowing price boards drawn as abstract coloured bars only.'],
  ['53', 'title-crossing', T, 'Original 16-bit pixel art seen from above: a wide city street with yellow taxis and bicycle couriers in lanes, then a canal with drifting flat barges, a tiny analyst character in a suit with a briefcase waiting at the kerb, a café on the far bank.'],
  ['54', 'title-volatility', T, 'Original 16-bit vector-style pixel art: a small triangular ship in deep space firing a laser at jagged glowing rocks that are cracking into smaller rocks, neon wireframe look, starfield.'],
  ['55', 'title-office', T, 'Original 16-bit pixel art: a charming wooden lemonade stand on a suburban lawn decorated like a stately private office with a tiny brass lamp and a portrait frame, pitchers of lemonade, sunny sky, picket fence.'],
  ['56', 'title-ladder', T, 'Original 16-bit pixel art: a tall stack of floating office desks rising up into the clouds like steps, a small office worker mid-jump between them, the ground floor far below being rearranged by tiny movers.'],
  ['57', 'title-blocks', T, 'Original 16-bit pixel art: a tall archive room where clusters of cardboard filing boxes in bright colours fall from the ceiling and stack into neat rows, one row glowing as it clears.'],
  ['58', 'title-lander', T, 'Original 16-bit pixel art: a small boxy capsule with landing legs and a gentle thruster flame descending toward a tiny landing pad on a rugged grey moon-like surface, earth-blue planet in the black sky.'],
  ['59', 'title-audit', T, 'Original 16-bit pixel art: a wall of nine wooden filing drawers in a 3x3 grid, some drawers open with mischievous paper documents with cartoon eyes peeking out, a big red rubber stamp hovering above.'],
  ['60', 'title-pinball', T, 'Original 16-bit pixel art: a compact vertical pinball table themed like a bank vault, round bumpers shaped like coin stacks, two small flippers, a silver ball in motion, neon lights.'],
  ['61', 'title-runner', T, 'Original 16-bit pixel art side view: an office worker running down an endless ornate hallway, jumping over a cardboard box, with a comically huge pile of luggage, hatboxes and shopping bags tumbling after him.'],
  ['62', 'title-defence', T, 'Original 16-bit pixel art top-down: a winding office corridor with a queue of tiny paper-request characters marching toward a grand executive door, small desks with stamps placed along the path firing paper clips.'],
  ['63', 'title-ledger', T, 'Original 16-bit pixel art top-down: a tidy little storeroom puzzle with wooden ledger crates and glowing marked floor bays, a small clerk character pushing a crate.'],
  ['64', 'title-stack', T, 'Original 16-bit pixel art: a construction crane swinging a single office floor slab over a slightly wobbly skyscraper made of stacked office floors, city skyline at golden hour.'],
  ['65', 'title-missile', T, 'Original 16-bit pixel art: red pennant flags falling from a night sky toward three thick binders on the ground, glowing circular interceptor bursts catching several flags in a chain reaction.'],
  ['70', 'geo-tile', 'A small seamless tiling background for a deliberately amateur 1996 personal home page.', 'A 512x512 seamlessly tiling pixel-art starfield with tiny twinkling stars and a couple of small ringed planets, deep purple-blue, crisp pixels, designed to repeat with no visible seams.'],
  ['71', 'geo-construction', 'A small "under construction" graphic for a deliberately amateur 1996 personal home page (no text).', 'Pixel-art illustration of a striped yellow and black road barricade with two orange traffic cones, a flashing amber warning light on top, and a small shovel leaning on it, on a plain white background, crisp 1990s web-graphic style.'],
];
for (const [n, slug, purpose, subject] of shots) writeFileSync(`visuals/prompts/${n}-${slug}.md`, `# Brief ${n}: ${slug}

You are the pixel artist. Work ONLY inside the current directory.

## Purpose
${purpose}
This is the hidden arcade room of a deadpan personal website. It must look retro on purpose and still be genuinely well made: confident 16-bit console or arcade-attract-screen quality, limited palette, clean pixel clusters, no muddy gradients.

## Subject
${subject}

## Method
1. Use your built-in image generation tool, ${slug === 'geo-tile' ? 'square 1024x1024' : 'landscape 1536x1024'}.
2. Save the untouched result as \`raw-1.png\`, and a second variant as \`raw-2.png\`.
3. Do not edit them.

## Must not appear
No text, letters, numbers, logos or watermarks. No characters or designs from any existing video game, film, or brand. No real currency symbols, real company names, or stock tickers. No real people.

## Report
Write \`NOTES.md\` with the exact prompt you used for each variant.
`);
console.log(shots.length);
