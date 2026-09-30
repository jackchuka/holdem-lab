import { CHIP, type ChipPose, type FingerPose, type Key, type Trick } from './types';

const PER_STACK = 4;
const STACK_X = 21;
const level = (n: number) => CHIP.thickness / 2 + n * CHIP.thickness;

// side -1 is the left stack (thumb side), +1 the right. Chips land alternately from the bottom: a0, b0, a1, b1, ...
function chipTrack(side: -1 | 1, i: number): Key<ChipPose>[] {
  const order = 2 * i + (side === -1 ? 0 : 1);
  const home: ChipPose = { pos: [side * STACK_X, level(i), 0], rot: [0, 0, 0] };
  const lifted: ChipPose = { pos: [side * (STACK_X - 2), level(i) + 5, 0], rot: [0, 0, -side * 12] };
  const landed: ChipPose = { pos: [side * 10, level(order), 0], rot: [0, 0, 0] };
  const squared: ChipPose = { pos: [0, level(order), 0], rot: [0, 0, 0] };
  const pulled: ChipPose = { pos: [side * STACK_X, level(order), 0], rot: [0, 0, 0] };
  return [
    { t: 0, ...home },
    { t: 0.6, ...home },
    { t: 1.15, ...lifted },
    { t: 1.2 + order * 0.1, ...lifted },
    { t: 1.3 + order * 0.1, ...landed },
    { t: 2.2, ...landed },
    { t: 2.8, ...squared },
    { t: 3.3, ...pulled },
    { t: 3.6, ...home },
  ];
}

// Thumb (left) and pinky (right) squeeze the outer sides; index (left) and ring (right) steady the far side of each stack.
const outer = (side: -1 | 1): Key<FingerPose>[] => [
  { t: 0, pos: [side * 44, 6, 8], press: false },
  { t: 0.6, pos: [side * 44, 6, 8], press: true },
  { t: 1.15, pos: [side * 42, 9, 8], press: true },
  { t: 2, pos: [side * 34, 6, 8], press: false },
  { t: 2.2, pos: [side * 34, 6, 8], press: true },
  { t: 2.8, pos: [side * 24, 6, 8], press: false },
  { t: 3.6, pos: [side * 44, 6, 8], press: false },
];

const back = (side: -1 | 1): Key<FingerPose>[] => [
  { t: 0, pos: [side * 24, 6, -22], press: false },
  { t: 2.2, pos: [side * 12, 6, -22], press: false },
  { t: 2.8, pos: [side * 6, 6, -22], press: false },
  { t: 3.6, pos: [side * 24, 6, -22], press: false },
];

const stacks = [
  { side: -1 as const, prefix: 'a', color: '#c0392b' },
  { side: 1 as const, prefix: 'b', color: '#2463b0' },
];
const chips = stacks.flatMap((s) =>
  Array.from({ length: PER_STACK }, (_, i) => ({ id: `${s.prefix}${i}`, color: s.color, track: chipTrack(s.side, i) })),
);

export const riffle: Trick = {
  id: 'riffle',
  name: { ja: 'リフル', en: 'Riffle' },
  duration: 3.6,
  floor: 0,
  focus: [0, 10, 0],
  chips: chips.map(({ id, color }) => ({ id, color })),
  fingers: ['thumb', 'index', 'middle', 'ring', 'pinky'],
  steps: [
    {
      from: 0,
      to: 0.6,
      text: {
        ja: '2つの山を横に並べ、左の山を親指と人差し指、右の山を薬指と小指で挟み、中指を2つの山の間に置く',
        en: 'Set two stacks side by side: thumb and index finger on the left stack, ring finger and pinky on the right, middle finger between them',
      },
    },
    { from: 0.6, to: 1.2, text: { ja: '中指で山の間を押し下げ、親指と小指で外側から寄せて、2つの山の内側の縁を持ち上げる', en: 'Press down between the stacks with your middle finger while thumb and pinky squeeze, so the inner edges lift' } },
    { from: 1.2, to: 2, text: { ja: '力を少しずつ抜き、下から交互に1枚ずつ落として重ねる', en: 'Ease off slowly so the chips drop one at a time, alternating from the bottom' } },
    { from: 2, to: 2.8, text: { ja: '中指を抜き、親指と小指で両側から寄せて1つの山にそろえる', en: 'Lift your middle finger out and push the halves together with thumb and pinky' } },
    { from: 2.8, to: 3.6, text: { ja: '山を2つに分けて最初の位置に戻す', en: 'Split the stack back into two to start again' } },
  ],
  tracks: {
    chips: Object.fromEntries(chips.map((c) => [c.id, c.track])),
    fingers: {
      thumb: outer(-1),
      index: back(-1),
      middle: [
        { t: 0, pos: [0, 10, -12], press: false },
        { t: 0.6, pos: [0, 10, -12], press: true },
        { t: 1.15, pos: [0, 6, -12], press: true },
        { t: 2, pos: [0, 10, -12], press: false },
        { t: 2.2, pos: [0, 34, -12], press: false },
        { t: 3.3, pos: [0, 34, -12], press: false },
        { t: 3.6, pos: [0, 10, -12], press: false },
      ],
      ring: back(1),
      pinky: outer(1),
    },
  },
};
