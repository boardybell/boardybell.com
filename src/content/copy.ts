// All front-room copy. Rules: no em dashes, no personal facts, no firm names, no money talk.
// Register (Bond, tone interview 2026-11-09): starts bone dry, escalates as you scroll;
// self-deprecation rotates between the page, Boardy, and corporate formality.

export const OCCUPATION = 'Works in private wealth. Details withheld.'; // use at most once per page

// Three thesis options per concept. Each gallery variant shows one; Bond picks per concept.
export const THESES = {
  A: [
    'The file on Bond Bell. Most of it is withheld.',
    'A complete record. Heavily edited for length.',
    'Everything on file about Boardy, minus the parts on file.',
  ],
  B: [
    'Nothing to announce.',
    'Built to the highest standard. For no clear reason.',
    'A considered presence. Of no particular kind.',
  ],
  C: [
    'A year in review. It was a year.',
    'Another year of steady, unremarkable progress.',
    'Results were achieved. They are listed below.',
  ],
  D: [
    'Ordinary objects, treated with suspicious respect.',
  ],
} as const;

// ---------- A: The Redacted File ----------
// [[secret|shown]] marks a clickable redaction: black bar, click reveals `secret`.
export const DOSSIER = {
  fileNo: 'BB-0001',
  header: [
    ['File no.', 'BB-0001'],
    ['Classification', 'Mildly confidential'],
    ['Status', 'Open. Nobody has looked.'],
    ['Pages', '1 of 1, plus this one'],
  ],
  subject: [
    ['Name', 'Bond Bell'],
    ['Known as', 'Boardy'],
    ['Occupation', OCCUPATION],
    ['Known associates', '[[a chair]]'],
    ['Distinguishing marks', '[[none]]'],
    ['Last seen', '[[here]]'],
  ],
  observations: [
    'Subject was observed at [[a table]] eating [[a sandwich]].',
    'Subject was later seen leaving [[the same table]].',
    'Subject owns [[an umbrella]]. On the day in question, it did not rain. Subject brought it anyway.',
    'Subject was overheard saying [[“sounds good”]] to a question that had not been asked.',
    'Subject left a lamp on overnight. [[The lamp is not involved.]]',
  ],
  exhibits: [
    ['Exhibit A', 'A photograph of a folio. It is closed.'],
    ['Exhibit B', 'A photograph of a lamp. See above.'],
    ['Exhibit C', 'A drawer. Empty on arrival.'],
  ],
  closing: [
    'The remainder of this file has been withheld at the request of the file.',
    'Declassified [[last Tuesday]]. Reclassified shortly after, out of embarrassment.',
  ],
};

// ---------- B: The Overqualified Page ----------
export const OVERQUALIFIED = {
  eyebrow: 'Est. at some point',
  intro: 'Welcome. You have arrived at a website. It has been built with great care, at considerable length, and with no particular objective in mind.',
  principal: ['The Principal', 'Bond Bell, known as Boardy.', OCCUPATION],
  principles: [
    ['Discretion', 'We say very little. This is most of it.'],
    ['Patience', 'This page loads slowly on purpose. It wants you to think it is busy.'],
    ['Permanence', 'This page will be here for some time. Nobody asked.'],
    ['Restraint', 'There was going to be a fourth principle. We held back.'],
  ],
  procedure: [
    'Visitors are asked to remain seated while the page scrolls.',
    'Please keep your hands inside the browser at all times.',
    'Should you wish to proceed, there is nowhere further to proceed to.',
  ],
  committee: 'This page was reviewed by a committee of one. The committee approved it, with reservations it has declined to share.',
  close: 'Thank you for visiting. Please take nothing with you.',
};

// ---------- C: The Annual Report ----------
export const REPORT = {
  title: 'Annual Report',
  year: '2026',
  letterTitle: 'Letter from the Chairman',
  letter: [
    'Dear Reader,',
    'This was a year. I am pleased to report that it began in January and ended, as forecast, at midnight on the thirty-first of December.',
    'There were challenges. Most of them were chairs. All of them were met.',
    'I would like to thank the board, the staff, and the shareholders, all of whom are me, for their patience with me.',
    'I look forward to next year, which is expected to be roughly the same length.',
  ],
  signoff: 'The Chairman of the Boardman',
  signoffNote: 'Also the board. Also the reader of this report.',
  // Every figure is about objects. Nothing here is money, a return, or a market.
  // Columns run 2026 back to 2020. Every figure is about objects. Nothing here is money, a return, or a market.
  metrics: [
    ['Chairs occupied', ['1.00', '1.00', '1.00', '1.00', '1.00', '1.00', '1.00'], ''],
    ['Lamps left on overnight', ['14', '9', '7', '8', '6', '5', '3'], '1'],
    ['Umbrellas owned', ['3', '3', '3', '2', '2', '1', '1'], ''],
    ['Umbrellas present when it rained', ['0', '0', '0', '0', '0', '0', '0'], '2'],
    ['Cups of coffee', ['1,140', '1,096', '1,062', '1,010', '955', '901', '812'], '3'],
    ['Emails answered promptly', ['≈0', '≈0', '≈0', '≈0', '≈0', 'Few', 'Some'], ''],
    ['Days', ['365', '365', '366', '365', '365', '365', '366'], '4'],
  ],
  footnotes: [
    'Includes one lamp that is still on.',
    'Management is reviewing the umbrella situation.',
    'Restated after a recount of the cups. The cups have been informed.',
    'In line with guidance from the calendar. 2020 and 2024 included an additional day at no extra charge.',
  ],
  highlights: [
    ['Year one of one', 'This report covers a full year. Previous reports are not available, because there were none.'],
    ['Operations', 'The desk was used. The lamp was used. The chair was used extensively.'],
    ['Outlook', 'Management expects more of the same, with a slight chance of rain.'],
  ],
  risks: [
    'The reader may finish this page. The reader may not. Both outcomes have been planned for.',
    'The lamp may be on.',
    'Past chairs are no guarantee of future chairs.',
  ],
  collection: {
    title: 'Objects held',
    text: 'In keeping with tradition, a selection of the Chairman’s objects is on public view. It includes a key, a mug and an umbrella. The chair is not shown, because it is in use.',
    link: 'Visit the Permanent Collection',
  },
  technical: {
    title: 'Technical analysis',
    intro: 'The figures above have been charted monthly, in the manner of serious people.',
    coffee: ['Cups of coffee per day, monthly', 'Each candle is a month: the first and last week’s daily average, and the best and worst weeks. Support has held at the morning cup since 2020.'],
    lamps: ['Lamps left on overnight, monthly', 'Six-month bands. The breakout in the second half of 2026 is attributed to the lamp that is still on.'],
    chairs: ['Chairs occupied', 'A consolidation phase now in its seventh year. Analysts expect continued sitting.'],
    note: 'Patterns identified are decorative. Nothing on this page is investment advice, or about investments.',
  },
  auditor: 'We have reviewed the above and have no opinion.',
  auditorSign: 'An auditor, unaffiliated, possibly asleep',
};

// ---------- D: The Permanent Collection ----------
export const COLLECTION = {
  title: 'The Permanent Collection',
  intro: 'Selected works from the collection of Bond Bell, known as Boardy. On view indefinitely. Admission is free. Leaving is also free.',
  rules: ['Please do not touch the objects.', 'Please do not touch the screen near the objects.', 'Flash photography is permitted. Nothing here minds.'],
  works: [
    { img: 'd-key', title: 'Key', medium: 'Brass, circa 2019', label: 'Opens one door. Which door is [[a door]].', provenance: 'Acquired from a hardware store. Cut while you wait.' },
    { img: 'd-mug', title: 'Mug', medium: 'Glazed ceramic, date unknown', label: 'Chipped at the rim in an incident the owner describes as “fine”.', provenance: 'Gift. Giver [[unknown, but grateful]].' },
    { img: 'd-umbrella', title: 'Umbrella', medium: 'Cotton, wood, steel', label: 'Has never been opened in the rain. Conservators believe this is deliberate.', provenance: 'Carried daily since acquisition. Weather unaffected.' },
  ],
  absent: ['Chair', 'Leather, not shown', 'On permanent loan to its owner, who is sitting in it.'],
  audio: 'Audio guide: press 1 for this label. There is no 2.',
  principal: OCCUPATION,
};

// ---------- Shared furniture ----------
export const COUNTER = { prefix: 'You are visitor no.', base: 4812377, note: 'Figure unaudited.' };
export const GUESTBOOK = {
  title: 'Guestbook',
  intro: 'Please sign the guestbook. Every entry is read carefully.',
  declines: [
    'Thank you. Your entry has been reviewed and respectfully declined.',
    'Thank you. The committee has considered your entry and will not be taking it further.',
    'Received. Regrettably, the guestbook is not accepting entries at this time, or at any other time.',
    'Your entry was excellent. That is the problem.',
    'Declined. This is not a reflection on you. It is a reflection on the guestbook.',
  ],
};
// Lines that change when highlighted.
export const SWAPS = {
  occupation: 'Please stop highlighting this.',
  close: 'Highlighting this will not make it say more.',
};
export const FOOTER = {
  legal: 'All rights reserved. None exercised.',
  colophon: 'Set in serif type at no small expense.',
};
