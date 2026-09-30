import { CHIP, type ChipPose, type FingerPose, type Key, type Trick, type Vec3 } from './types';

// Like the other tricks, the chips stand facing the thumb (-X), three side by side, pinched at their edges by the
// thumb (near) and index finger (far). The thumb swings the outer two up a quarter turn about the index finger, which
// stays put as the pivot, while the middle chip drops onto the middle finger. The middle finger is then the vertical
// axis and the ring finger spins the chip by sweeping its far edge round to the front.
const R = CHIP.radius;
const RIM = R + 4;
const DROP = 16;
const PIVOT: Vec3 = [0, 0, -R];

// Swing about the index-finger pivot: 0 is upright, -90 has the near edge on top.
const swing = (deg: number, dist: number): Vec3 => {
  const a = (deg * Math.PI) / 180;
  return [0, PIVOT[1] - dist * Math.sin(a), PIVOT[2] + dist * Math.cos(a)];
};
const LIFT_ANGLES = [0, -30, -60, -90];
const up = (from: number, to: number) => LIFT_ANGLES.map((deg, i) => ({ t: from + ((to - from) * i) / (LIFT_ANGLES.length - 1), deg }));
const down = (from: number, to: number) => up(from, to).map(({ t }, i) => ({ t, deg: LIFT_ANGLES[LIFT_ANGLES.length - 1 - i] }));
const swingPath = [...up(0.5, 1), ...down(1.8, 2.4)];

const outer = (x: number): Key<ChipPose>[] => [
  { t: 0, pos: [x, 0, 0], rot: [0, 0, 90] },
  ...swingPath.map(({ t, deg }) => {
    const [, y, z] = swing(deg, R);
    return { t, pos: [x, y, z] as Vec3, rot: [deg, 0, 90] as Vec3, ease: 'linear' as const };
  }),
  { t: 3, pos: [x, 0, 0], rot: [0, 0, 90] },
];
const thumb: Key<FingerPose>[] = [
  { t: 0, pos: swing(0, 2 * R + 4), press: true },
  ...swingPath.map(({ t, deg }) => ({ t, pos: swing(deg, 2 * R + 4), press: true, ease: 'linear' as const })),
  { t: 3, pos: swing(0, 2 * R + 4), press: true },
];

// The spin is linear from 1s to 1.8s; the ring finger rides the far edge the whole half turn.
const SPIN_START = 1;
const SPIN_TIME = 0.8;
const SWEEP_STEPS = 8;
const sweep: Key<FingerPose>[] = Array.from({ length: SWEEP_STEPS + 1 }, (_, i) => {
  const a = -Math.PI * (i / SWEEP_STEPS);
  const r = R + 3;
  return { t: SPIN_START + SPIN_TIME * (i / SWEEP_STEPS), pos: [-r * Math.sin(a), -DROP, -r * Math.cos(a)], press: i < SWEEP_STEPS, ease: 'linear' };
});

const FACE: ChipPose['rot'] = [0, 0, 90];
const SPUN: ChipPose['rot'] = [0, -180, 90];

export const chipTwist: Trick = {
  id: 'chip-twist',
  name: { ja: 'チップツイスト', en: 'Chip twist' },
  duration: 3,
  floor: -60,
  focus: [0, 4, -8],
  chips: [
    { id: 'left', color: '#c0392b' },
    { id: 'center', color: '#c9a23a' },
    { id: 'right', color: '#2463b0' },
  ],
  fingers: ['thumb', 'index', 'middle', 'ring'],
  steps: [
    { from: 0, to: 0.5, text: { ja: '3枚を立てて横に重ね、手前の縁を親指、奥の縁を人差し指でつまむ', en: 'Stand three chips side by side and pinch their edges: thumb on the near edge, index finger on the far edge' } },
    { from: 0.5, to: 1, text: { ja: '人差し指を軸に、親指で外側の2枚を持ち上げる。真ん中の1枚は落として中指で下から支える', en: 'Pivot on your index finger and raise the outer two with your thumb; the middle chip drops onto your middle finger' } },
    { from: 1, to: 1.8, text: { ja: '中指を上下の軸にして、薬指で奥の縁を手前へ回し 180° 回す', en: 'With your middle finger as the vertical axis, sweep the far edge round to the front with your ring finger to spin it 180°' } },
    { from: 1.8, to: 3, text: { ja: '親指で外側の2枚を下ろして真ん中の1枚を挟み直し、繰り返す', en: 'Lower the outer two with your thumb around the middle chip and repeat' } },
  ],
  tracks: {
    chips: {
      left: outer(-3.3),
      right: outer(3.3),
      center: [
        { t: 0, pos: [0, 0, 0], rot: FACE },
        { t: 0.5, pos: [0, 0, 0], rot: FACE },
        { t: 1, pos: [0, -DROP, 0], rot: FACE },
        { t: 1.8, pos: [0, -DROP, 0], rot: SPUN, ease: 'linear' },
        { t: 2.4, pos: [0, 0, 0], rot: SPUN },
        { t: 3, pos: [0, 0, 0], rot: SPUN },
      ],
    },
    fingers: {
      thumb,
      index: [
        { t: 0, pos: [0, 0, -RIM], press: true },
        { t: 3, pos: [0, 0, -RIM], press: true },
      ],
      middle: [
        { t: 0, pos: [0, -RIM - 4, 6], press: false },
        { t: 0.5, pos: [0, -RIM, 0], press: true },
        { t: 1, pos: [0, -DROP - RIM, 0], press: true },
        { t: 1.8, pos: [0, -DROP - RIM, 0], press: true },
        { t: 2.4, pos: [0, -RIM, 0], press: false },
        { t: 3, pos: [0, -RIM - 4, 6], press: false },
      ],
      ring: [{ t: 0, pos: [14, -12, -14], press: false }, ...sweep, { t: 2.4, pos: [14, -12, -14], press: false }, { t: 3, pos: [14, -12, -14], press: false }],
    },
  },
};
