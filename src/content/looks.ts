// Image sets per look. 'c' = the originally picked C1 set; n1-n3 = round 2 navy and gold iterations;
// n4-n6 = round 3 (Bond: N1 Midnight's layout and format with the N2 and N3 photographs);
// n7-n8 = round 4 (N6 with engraved plates; Bond found the nib and watch photographs cheesy).
type Look = { cover: string; a: string; b: string; capA: string; capB: string; key: string; objects: [string, string, string]; eggA?: boolean; cream?: boolean; eggB?: { x: number; y: number; r: number } };
export const LOOKS: Record<string, Look> = {
  c: { cover: 'c-chair', a: 'c-watch', b: 'c-pen', capA: 'The year, face down.', capB: 'The ledger, closed.', key: 'd-key', objects: ['d-key', 'd-mug', 'd-umbrella'] },
  n1: { cover: 'n-chair', a: 'n-watch', b: 'n-pen', capA: 'The year, face down.', capB: 'The ledger, closed.', key: 'n-key', objects: ['n-key', 'n-mug', 'n-umbrella'] },
  n2: { cover: 'l-facade', a: 'l-clock', b: 'l-door', capA: 'The time, approximately.', capB: 'The office, closed.', key: 'n-key', objects: ['n-key', 'n-mug', 'n-umbrella'] },
  n3: { cover: 'g-edges', a: 'g-nib', b: 'g-watch', capA: 'The pen, at rest.', capB: 'The year, face down.', key: 'g-key', objects: ['g-key', 'g-mug', 'g-umbrella'] },
  n4: { cover: 'l-facade', a: 'l-clock', b: 'l-door', capA: 'The time, approximately.', capB: 'The office, closed.', key: 'g-key', objects: ['g-key', 'g-mug', 'g-umbrella'] },
  n5: { cover: 'g-edges', a: 'g-nib', b: 'g-watch', capA: 'The pen, at rest.', capB: 'The year, face down.', key: 'g-key', objects: ['g-key', 'g-mug', 'g-umbrella'] },
  n6: { cover: 'l-facade', a: 'g-nib', b: 'g-watch', capA: 'The pen, at rest.', capB: 'The year, face down.', key: 'g-key', objects: ['g-key', 'g-mug', 'g-umbrella'] },
  n7: { cover: 'l-facade', a: 'e-nib', b: 'e-watch', capA: 'The pen, at rest.', capB: 'The year, face down.', key: 'g-key', objects: ['g-key', 'g-mug', 'g-umbrella'] },
  n9: { cover: 'l-facade', a: 'p-terminal-stamp-1', b: 'p-microphone-stamp-1', capA: 'The terminal, ready.', capB: 'The microphone, off.', key: 'g-key', objects: ['g-key', 'g-mug', 'g-umbrella'] },
  n10: { cover: 'l-facade', a: 'p-terminal-stamp-1', b: 'p-microphone-stipple-1', capA: 'The terminal, ready.', capB: 'The microphone, off.', key: 'g-key', objects: ['g-key', 'g-mug', 'g-umbrella'] },
  n11: { cover: 'l-facade', a: 'p-terminal-tradecard-1', b: 'p-joystick-stipple-2', capA: 'The terminal, ready.', capB: 'The controls.', key: 'g-key', objects: ['g-key', 'g-mug', 'g-umbrella'] },
  n12: { cover: 'l-facade', a: 'p-terminal-stamp-1', b: 'p-joystick-stipple-2', capA: 'The terminal, ready.', capB: 'The controls.', key: 'g-key', objects: ['g-key', 'g-mug', 'g-umbrella'] },
  // FINAL (Bond, 2026-11-09): N9 with the microphone swapped for the game controller (#46);
  // the controller's right-hand button is an Easter egg into the arcade (position as % of the square image).
  // previous final kept for reference
  final8: { cover: 'l-facade', a: 'p-terminal-stamp-1', b: 'p-joystick-stipple-2', capA: 'The terminal, ready.', capB: 'The controls.', key: 'g-key', objects: ['g-key', 'g-mug', 'g-umbrella'], eggA: true, eggB: { x: 67.5, y: 61.3, r: 7.2 } },
  // LAUNCH (Bond 2026-11-09): portrait P2 on the cover; everything else redrawn in the portrait's black-on-cream engraving
  final: { cover: 'portrait-q', a: 'c-terminal', b: 'c-joystick', capA: 'The terminal, ready.', capB: 'The controls.', key: 'c-key', objects: ['c-key', 'c-mug', 'c-umbrella'], eggA: true, eggB: { x: 74.2, y: 53, r: 9.5 }, cream: true },
  // Round 6: Bond's engraved beach portrait on the cover, five refinements of the head angle
  pa: { cover: 'portrait-a', a: 'p-terminal-stamp-1', b: 'p-joystick-stipple-2', capA: 'The terminal, ready.', capB: 'The controls.', key: 'g-key', objects: ['g-key', 'g-mug', 'g-umbrella'], eggA: true, eggB: { x: 67.5, y: 61.3, r: 7.2 } },
  pb: { cover: 'portrait-b', a: 'p-terminal-stamp-1', b: 'p-joystick-stipple-2', capA: 'The terminal, ready.', capB: 'The controls.', key: 'g-key', objects: ['g-key', 'g-mug', 'g-umbrella'], eggA: true, eggB: { x: 67.5, y: 61.3, r: 7.2 } },
  pc: { cover: 'portrait-c', a: 'p-terminal-stamp-1', b: 'p-joystick-stipple-2', capA: 'The terminal, ready.', capB: 'The controls.', key: 'g-key', objects: ['g-key', 'g-mug', 'g-umbrella'], eggA: true, eggB: { x: 67.5, y: 61.3, r: 7.2 } },
  pd: { cover: 'portrait-d', a: 'p-terminal-stamp-1', b: 'p-joystick-stipple-2', capA: 'The terminal, ready.', capB: 'The controls.', key: 'g-key', objects: ['g-key', 'g-mug', 'g-umbrella'], eggA: true, eggB: { x: 67.5, y: 61.3, r: 7.2 } },
  pe: { cover: 'portrait-e', a: 'p-terminal-stamp-1', b: 'p-joystick-stipple-2', capA: 'The terminal, ready.', capB: 'The controls.', key: 'g-key', objects: ['g-key', 'g-mug', 'g-umbrella'], eggA: true, eggB: { x: 67.5, y: 61.3, r: 7.2 } },
  // Round 7: facing the sea, cottages in the style of Bond's reference photo
  pf: { cover: 'portrait-f', a: 'p-terminal-stamp-1', b: 'p-joystick-stipple-2', capA: 'The terminal, ready.', capB: 'The controls.', key: 'g-key', objects: ['g-key', 'g-mug', 'g-umbrella'], eggA: true, eggB: { x: 67.5, y: 61.3, r: 7.2 } },
  pg: { cover: 'portrait-g', a: 'p-terminal-stamp-1', b: 'p-joystick-stipple-2', capA: 'The terminal, ready.', capB: 'The controls.', key: 'g-key', objects: ['g-key', 'g-mug', 'g-umbrella'], eggA: true, eggB: { x: 67.5, y: 61.3, r: 7.2 } },
  ph: { cover: 'portrait-h', a: 'p-terminal-stamp-1', b: 'p-joystick-stipple-2', capA: 'The terminal, ready.', capB: 'The controls.', key: 'g-key', objects: ['g-key', 'g-mug', 'g-umbrella'], eggA: true, eggB: { x: 67.5, y: 61.3, r: 7.2 } },
  pi: { cover: 'portrait-i', a: 'p-terminal-stamp-1', b: 'p-joystick-stipple-2', capA: 'The terminal, ready.', capB: 'The controls.', key: 'g-key', objects: ['g-key', 'g-mug', 'g-umbrella'], eggA: true, eggB: { x: 67.5, y: 61.3, r: 7.2 } },
  pj: { cover: 'portrait-j', a: 'p-terminal-stamp-1', b: 'p-joystick-stipple-2', capA: 'The terminal, ready.', capB: 'The controls.', key: 'g-key', objects: ['g-key', 'g-mug', 'g-umbrella'], eggA: true, eggB: { x: 67.5, y: 61.3, r: 7.2 } },
  // Round 8: F's background with natural proportions; P1/P2 = J's figure in F's background
  pk: { cover: 'portrait-k', a: 'p-terminal-stamp-1', b: 'p-joystick-stipple-2', capA: 'The terminal, ready.', capB: 'The controls.', key: 'g-key', objects: ['g-key', 'g-mug', 'g-umbrella'], eggA: true, eggB: { x: 67.5, y: 61.3, r: 7.2 } },
  pl: { cover: 'portrait-l', a: 'p-terminal-stamp-1', b: 'p-joystick-stipple-2', capA: 'The terminal, ready.', capB: 'The controls.', key: 'g-key', objects: ['g-key', 'g-mug', 'g-umbrella'], eggA: true, eggB: { x: 67.5, y: 61.3, r: 7.2 } },
  pm: { cover: 'portrait-m', a: 'p-terminal-stamp-1', b: 'p-joystick-stipple-2', capA: 'The terminal, ready.', capB: 'The controls.', key: 'g-key', objects: ['g-key', 'g-mug', 'g-umbrella'], eggA: true, eggB: { x: 67.5, y: 61.3, r: 7.2 } },
  pn: { cover: 'portrait-n', a: 'p-terminal-stamp-1', b: 'p-joystick-stipple-2', capA: 'The terminal, ready.', capB: 'The controls.', key: 'g-key', objects: ['g-key', 'g-mug', 'g-umbrella'], eggA: true, eggB: { x: 67.5, y: 61.3, r: 7.2 } },
  po: { cover: 'portrait-o', a: 'p-terminal-stamp-1', b: 'p-joystick-stipple-2', capA: 'The terminal, ready.', capB: 'The controls.', key: 'g-key', objects: ['g-key', 'g-mug', 'g-umbrella'], eggA: true, eggB: { x: 67.5, y: 61.3, r: 7.2 } },
  pp: { cover: 'portrait-p', a: 'p-terminal-stamp-1', b: 'p-joystick-stipple-2', capA: 'The terminal, ready.', capB: 'The controls.', key: 'g-key', objects: ['g-key', 'g-mug', 'g-umbrella'], eggA: true, eggB: { x: 67.5, y: 61.3, r: 7.2 } },
  pq: { cover: 'portrait-q', a: 'p-terminal-stamp-1', b: 'p-joystick-stipple-2', capA: 'The terminal, ready.', capB: 'The controls.', key: 'g-key', objects: ['g-key', 'g-mug', 'g-umbrella'], eggA: true, eggB: { x: 67.5, y: 61.3, r: 7.2 } },
  n8: { cover: 'l-facade', a: 'e-lamp', b: 'e-chair', capA: 'The lamp, left on.', capB: 'The board, in session.', key: 'g-key', objects: ['g-key', 'g-mug', 'g-umbrella'] },
};
