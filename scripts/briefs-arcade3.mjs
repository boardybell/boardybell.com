// Round 3 arcade art: the VIP Lounge (10 title screens + the lounge marquee). Subjects written by ChatGPT in
// visuals/inbox/_names-vip/FINAL.md (names and concepts co-designed with it over two rounds).
import { writeFileSync, readFileSync } from 'node:fs';
const shots = JSON.parse(readFileSync(process.argv[2], 'utf8'));
for (const [n, slug, subject] of shots) writeFileSync(`visuals/prompts/${n}-${slug}.md`, `# Brief ${n}: ${slug}

You are the pixel artist. Work ONLY inside the current directory.

## Purpose
${slug === 'vip-lounge' ? 'A wide banner for the secret VIP Lounge section of a hidden arcade.' : 'Title-screen art for a game in the secret VIP Lounge of a hidden arcade (the title is added later as text; do not draw any). Keep the top third calm for the title.'}
This is the hidden arcade room of a deadpan personal website; the VIP Lounge is reached by hitting a jackpot on a coin machine, so it feels like private banking: burgundy velvet, brass, warm gold light, perks nobody needs. It must look retro on purpose and still be genuinely well made: confident 16-bit console or arcade-attract-screen quality, limited palette, clean pixel clusters, no muddy gradients. Match the look of the arcade's existing title screens (crisp 16-bit pixel art), shifted to the lounge's gold-and-velvet palette.

## Subject
${subject}

## Method
1. Use your built-in image generation tool, landscape 1536x1024.
2. Save the untouched result as \`raw-1.png\`, and a second variant as \`raw-2.png\`.
3. Do not edit them.

## Must not appear
No text, letters, numbers, logos or watermarks. No characters or designs from any existing video game, film, or brand. No real currency symbols, real company names, or stock tickers. No real people.

## Report
Write \`NOTES.md\` with the exact prompt you used for each variant.
`);
console.log(shots.length);
