import { CHIP, type ChipPose, type FingerPose, type Key, type Trick } from './types';

// Four chips stand in a row, faces toward the thumb (-X), pinched by their edges: fingers on top, thumb below.
// Each pass lifts the outermost chip, rolls it end over end across the top and drops it in behind the far chip,
// then the row slides back toward the thumb. After four passes every chip is home again, so the loop is seamless.
const COUNT = 4;
const PASS = 1.2;
const T = CHIP.thickness;
const slotX = (slot: number) => (slot - (COUNT - 1) / 2) * T;
const ABOVE = 2 * CHIP.radius + 2;
const BEHIND = slotX(COUNT);
const STAND = 90;

function chipTrack(start: number): Key<ChipPose>[] {
  let slot = start;
  let spin = STAND;
  const keys: Key<ChipPose>[] = [{ t: 0, pos: [slotX(slot), 0, 0], rot: [0, 0, spin] }];
  for (let pass = 0; pass < COUNT; pass++) {
    const t0 = pass * PASS;
    if (slot === 0) {
      keys.push({ t: t0 + 0.3, pos: [slotX(0), ABOVE, 0], rot: [0, 0, spin] });
      spin -= 180;
      keys.push({ t: t0 + 0.6, pos: [BEHIND, ABOVE, 0], rot: [0, 0, spin] });
      keys.push({ t: t0 + 0.9, pos: [BEHIND, 0, 0], rot: [0, 0, spin] });
      slot = COUNT - 1;
    } else {
      keys.push({ t: t0 + 0.9, pos: [slotX(slot), 0, 0], rot: [0, 0, spin] });
      slot -= 1;
    }
    keys.push({ t: t0 + PASS, pos: [slotX(slot), 0, 0], rot: [0, 0, spin] });
  }
  return keys;
}

// The thumb stays on the travelling chip: on its lower rim while lifting, on its trailing rim while rolling it over,
// then lets go above the far end and drops back to the new outermost chip.
// The thumb pushes on the chip's lower near rim (45° down toward the player), never its face.
const RIM = (CHIP.radius + 4) * Math.SQRT1_2;
const LOW: FingerPose['pos'] = [slotX(0), -RIM, RIM];
const LIFTED: FingerPose['pos'] = [slotX(0), ABOVE - RIM, RIM];
const MID_ROLL: FingerPose['pos'] = [(slotX(0) + BEHIND) / 2 - CHIP.radius - 4, ABOVE, 0];
const RELEASE: FingerPose['pos'] = [BEHIND, ABOVE - RIM, RIM];
const thumb: Key<FingerPose>[] = [{ t: 0, pos: LOW, press: true }];
for (let pass = 0; pass < COUNT; pass++) {
  const t0 = pass * PASS;
  thumb.push(
    { t: t0 + 0.3, pos: LIFTED, press: true },
    { t: t0 + 0.45, pos: MID_ROLL, press: true },
    { t: t0 + 0.6, pos: RELEASE, press: false },
    { t: t0 + PASS, pos: LOW, press: true },
  );
}
// Index, middle and ring fingertips hold the stack down by its upper far rim, spread along the row.
// The travelling chip passes well above them.
const holder = (x: number): Key<FingerPose>[] => [
  { t: 0, pos: [x, RIM, -RIM], press: true },
  { t: COUNT * PASS, pos: [x, RIM, -RIM], press: true },
];

const colors = ['#c0392b', '#c9a23a', '#2463b0', '#2e9d5b'];

export const thumbFlip: Trick = {
  id: 'thumb-flip',
  name: { ja: 'サムフリップ', en: 'Thumb flip' },
  duration: COUNT * PASS,
  floor: -40,
  focus: [0, 12, 0],
  chips: colors.map((color, i) => ({ id: `c${i}`, color })),
  fingers: ['thumb', 'index', 'middle', 'ring'],
  steps: [
    { from: 0, to: 0.3, text: { ja: '4枚を立てて重ね、上の奥の縁を人差し指・中指・薬指、下の手前の縁を親指で挟み、いちばん外側の1枚を親指で押し上げる', en: 'Hold four chips on edge, fingertips on the upper far rim and thumb on the lower near rim, and push the outermost chip up with your thumb' } },
    { from: 0.3, to: 0.9, text: { ja: 'そのチップを残りの上を越えさせ、いちばん奥のチップの後ろへ滑らせる', en: 'Carry it over the others and slide it in behind the far chip' } },
    { from: 0.9, to: PASS, text: { ja: '並びを親指側へ寄せる', en: 'Let the row slide back toward your thumb' } },
    { from: PASS, to: COUNT * PASS, text: { ja: '同じ動きを繰り返し、4枚が1周して元の並びに戻る', en: 'Repeat until all four chips have gone round and the row is back where it started' } },
  ],
  tracks: {
    chips: Object.fromEntries(colors.map((_, i) => [`c${i}`, chipTrack(i)])),
    fingers: { thumb, index: holder(slotX(0)), middle: holder(slotX(1.5)), ring: holder(slotX(3)) },
  },
};
