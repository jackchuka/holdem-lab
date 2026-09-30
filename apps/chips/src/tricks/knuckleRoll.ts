import type { Trick } from './types';

// Palm down, fingers pointing away (-Z). Knuckles sit in a row along X; the chip stands in the gaps and lies flat on top of each knuckle.
export const knuckleRoll: Trick = {
  id: 'knuckle-roll',
  name: { ja: 'ナックルロール', en: 'Knuckle roll' },
  duration: 3,
  floor: -70,
  focus: [0, 0, 0],
  chips: [{ id: 'chip', color: '#c9a23a' }],
  fingers: ['thumb', 'index', 'middle', 'ring', 'pinky'],
  steps: [
    { from: 0, to: 0.5, text: { ja: '親指と人差し指の間にチップを立てて挟む', en: 'Stand the chip between your thumb and index finger' } },
    { from: 0.5, to: 1, text: { ja: '人差し指を持ち上げ、チップを中指との間へ転がす', en: 'Lift your index finger to roll the chip over into the gap by your middle finger' } },
    { from: 1, to: 1.5, text: { ja: '中指を持ち上げ、薬指との間へ転がす', en: 'Lift your middle finger to roll it on to your ring finger' } },
    { from: 1.5, to: 2, text: { ja: '薬指を持ち上げ、小指との間へ転がす', en: 'Lift your ring finger to roll it on to your pinky' } },
    { from: 2, to: 3, text: { ja: '小指で下へ押し出し、親指で手の下をくぐらせて最初の位置に戻す', en: 'Push it down with your pinky and bring it back under your hand with your thumb' } },
  ],
  tracks: {
    chips: {
      chip: [
        { t: 0, pos: [-40, 0, 0], rot: [0, 0, 90] },
        { t: 0.5, pos: [-40, 0, 0], rot: [0, 0, 90] },
        { t: 0.75, pos: [-30, 20, 0], rot: [0, 0, 0] },
        { t: 1, pos: [-20, 0, 0], rot: [0, 0, -90] },
        { t: 1.25, pos: [-10, 20, 0], rot: [0, 0, -180] },
        { t: 1.5, pos: [0, 0, 0], rot: [0, 0, -270] },
        { t: 1.75, pos: [10, 20, 0], rot: [0, 0, -360] },
        { t: 2, pos: [20, 0, 0], rot: [0, 0, -450] },
        { t: 2.3, pos: [20, -24, 0], rot: [0, 0, -450] },
        { t: 2.7, pos: [-40, -24, 0], rot: [0, 0, -450] },
        { t: 3, pos: [-40, 0, 0], rot: [0, 0, -450] },
      ],
    },
    fingers: {
      thumb: [
        { t: 0, pos: [-46, 0, 0], press: true },
        { t: 0.5, pos: [-46, 0, 0], press: false },
        { t: 2.1, pos: [14, -24, 0], press: false },
        { t: 2.3, pos: [14, -24, 0], press: true },
        { t: 2.7, pos: [-46, -24, 0], press: true },
        { t: 3, pos: [-46, 0, 0], press: true },
      ],
      index: [
        { t: 0, pos: [-30, 14, 0], press: false },
        { t: 0.5, pos: [-30, 14, 0], press: true },
        { t: 1, pos: [-30, 14, 0], press: false },
        { t: 3, pos: [-30, 14, 0], press: false },
      ],
      middle: [
        { t: 0, pos: [-10, 14, 0], press: false },
        { t: 1, pos: [-10, 14, 0], press: true },
        { t: 1.5, pos: [-10, 14, 0], press: false },
        { t: 3, pos: [-10, 14, 0], press: false },
      ],
      ring: [
        { t: 0, pos: [10, 14, 0], press: false },
        { t: 1.5, pos: [10, 14, 0], press: true },
        { t: 2, pos: [10, 14, 0], press: false },
        { t: 3, pos: [10, 14, 0], press: false },
      ],
      pinky: [
        { t: 0, pos: [30, 14, 0], press: false },
        { t: 2, pos: [30, 14, 0], press: true },
        { t: 2.3, pos: [30, 14, 0], press: false },
        { t: 3, pos: [30, 14, 0], press: false },
      ],
    },
  },
};
