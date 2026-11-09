// Image sets per look. 'c' = the originally picked C1 set; n1-n3 = round 2 navy and gold iterations.
type Look = { cover: string; a: string; b: string; capA: string; capB: string; key: string; objects: [string, string, string] };
export const LOOKS: Record<string, Look> = {
  c: { cover: 'c-chair', a: 'c-watch', b: 'c-pen', capA: 'The year, face down.', capB: 'The ledger, closed.', key: 'd-key', objects: ['d-key', 'd-mug', 'd-umbrella'] },
  n1: { cover: 'n-chair', a: 'n-watch', b: 'n-pen', capA: 'The year, face down.', capB: 'The ledger, closed.', key: 'n-key', objects: ['n-key', 'n-mug', 'n-umbrella'] },
  n2: { cover: 'l-facade', a: 'l-clock', b: 'l-door', capA: 'The time, approximately.', capB: 'The office, closed.', key: 'n-key', objects: ['n-key', 'n-mug', 'n-umbrella'] },
  n3: { cover: 'g-edges', a: 'g-nib', b: 'g-watch', capA: 'The pen, at rest.', capB: 'The year, face down.', key: 'g-key', objects: ['g-key', 'g-mug', 'g-umbrella'] },
};
