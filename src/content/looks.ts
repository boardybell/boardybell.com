// Image sets per look. 'c' = the originally picked C1 set; n1-n3 = round 2 navy and gold iterations;
// n4-n6 = round 3 (Bond: N1 Midnight's layout and format with the N2 and N3 photographs);
// n7-n8 = round 4 (N6 with engraved plates; Bond found the nib and watch photographs cheesy).
type Look = { cover: string; a: string; b: string; capA: string; capB: string; key: string; objects: [string, string, string] };
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
  n8: { cover: 'l-facade', a: 'e-lamp', b: 'e-chair', capA: 'The lamp, left on.', capB: 'The board, in session.', key: 'g-key', objects: ['g-key', 'g-mug', 'g-umbrella'] },
};
