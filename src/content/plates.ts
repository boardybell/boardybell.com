// Engraved plate options for Bond to pick from (round 5). Each brief produced two variants (-1, -2).
export const PLATE_STYLES: Record<string, string> = {
  banknote: 'Banknote vignette', stamp: 'Revenue stamp', stipple: 'Newspaper stipple',
  bookplate: 'Bookplate', tradecard: 'Trade card', woodcut: 'Wood engraving', earlier: 'Round 4 (for comparison)',
};
export const PLATE_SUBJECTS: [string, string, string][] = [
  ['p-lamp-banknote', 'The lamp, left on', 'banknote'],
  ['p-chair-bookplate', 'The chair, occupied', 'bookplate'],
  ['p-umbrella-stamp', 'The umbrella, unopened', 'stamp'],
  ['p-cup-stipple', 'Cup of coffee', 'stipple'],
  ['p-key-banknote', 'The key', 'banknote'],
  ['p-hourglass-woodcut', 'The year, mostly elapsed', 'woodcut'],
  ['p-ledger-tradecard', 'The ledger, closed', 'tradecard'],
  ['p-stamp-stipple', 'The rubber stamp', 'stipple'],
  ['p-townhouse-banknote', 'The office, after hours', 'banknote'],
  ['p-watch-woodcut', 'The year, face down', 'woodcut'],
  ['p-nib-stamp', 'The pen, at rest', 'stamp'],
  ['p-paperclip-bookplate', 'A paperclip, with ceremony', 'bookplate'],
  ['p-cabinet-tradecard', 'The files', 'tradecard'],
  ['p-telephone-stipple', 'The telephone, not ringing', 'stipple'],
  ['p-mug-banknote', 'The mug, chipped', 'banknote'],
  ['p-magnifier-woodcut', 'The review', 'woodcut'],
];
// Round 6, appended after EARLIER so existing picker numbers never change.
export const PLATE_SUBJECTS_2: [string, string, string][] = [
  ['p-radio-stamp', 'The radio, on channel', 'stamp'],
  ['p-cassette-banknote', 'The tape, rewound', 'banknote'],
  ['p-vinyl-bookplate', 'The record, half out', 'bookplate'],
  ['p-television-woodcut', 'The set, between channels', 'woodcut'],
  ['p-joystick-stipple', 'The controls', 'stipple'],
  ['p-case-tradecard', 'The case, packed', 'tradecard'],
  ['p-labelmaker-stamp', 'The label, blank', 'stamp'],
  ['p-sunglasses-banknote', 'The glasses, folded', 'banknote'],
  ['p-microphone-stipple', 'The microphone, off', 'stipple'],
  ['p-compass-bookplate', 'The compass, consulted', 'bookplate'],
  ['p-lantern-woodcut', 'The lantern, charged', 'woodcut'],
  ['p-terminal-tradecard', 'The terminal, ready', 'tradecard'],
  ['p-camera-banknote', 'The camera, loaded', 'banknote'],
  ['p-parcel-stipple', 'The parcel, outbound', 'stipple'],
];
export const EARLIER: [string, string][] = [['e-nib', 'The pen, at rest'], ['e-watch', 'The year, face down'], ['e-lamp', 'The lamp, left on'], ['e-chair', 'The board, in session']];
