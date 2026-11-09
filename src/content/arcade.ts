// Arcade copy. Parody only: no real securities, tickers, indices, or money.
export const DISCLAIMER = 'Parody. Not investment advice. No real money involved.';
export const GAMES = [
  { slug: 'tax-man', id: 'taxman', title: 'Tax Man', art: 'title-taxman', genre: 'Maze chase',
    hook: 'Collect every receipt. Avoid the auditors.',
    blurb: 'You are a small accountant in a large filing system. Collect every receipt in the building. Four auditors would like a word. Deductions make them briefly reconsider.',
    controls: ['Arrows or WASD to move', 'Swipe on a phone', 'P to pause'], pad: 'dpad' },
  { slug: 'margin-invaders', id: 'invaders', title: 'Margin Invaders', art: 'title-invaders', genre: 'Fixed shooter',
    hook: 'Margin calls descend in rows.',
    blurb: 'The margin calls are arriving in formation. You have a calculator and a firm belief in yourself. The piggy banks will absorb some of it.',
    controls: ['Left and right to move', 'Space or Z to fire', 'P to pause'], pad: 'lr' },
  { slug: 'compound-interest', id: 'snake', title: 'Compound Interest', art: 'title-snake', genre: 'Snake',
    hook: 'Grows slowly, then all at once.',
    blurb: 'Collect coins. Each one adds a little more length than the last. For a while nothing happens. Then everything happens, and you are mostly snake.',
    controls: ['Arrows or WASD to steer', 'Swipe on a phone', 'P to pause'], pad: 'dpad' },
  { slug: 'break-the-market', id: 'breakout', title: 'Break the Market', art: 'title-breakout', genre: 'Brick breaker',
    hook: 'Smash the bricks.',
    blurb: 'The chart is made of bricks. Bricks are made to be broken. Catch the falling tokens for a wider paddle, a slower ball, or two balls at once.',
    controls: ['Left and right, or drag', 'Space to launch', 'P to pause'], pad: 'lr' },
] as const;
