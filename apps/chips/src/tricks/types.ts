export type Vec3 = [number, number, number];
export type Euler = [number, number, number];
export type Quat = [number, number, number, number];
export type Ease = 'linear' | 'in' | 'out' | 'inOut';
export type L10n = { ja: string; en: string };

export const FINGER_IDS = ['thumb', 'index', 'middle', 'ring', 'pinky'] as const;
export type FingerId = (typeof FINGER_IDS)[number];

export const TRICK_IDS = ['riffle', 'thumb-flip', 'chip-twist', 'knuckle-roll'] as const;
export type TrickId = (typeof TRICK_IDS)[number];

// A key applies from its own time; `ease` shapes the segment that ends at this key.
export type Key<P> = { t: number; ease?: Ease } & P;
export type ChipPose = { pos: Vec3; rot: Euler };
export type FingerPose = { pos: Vec3; press: boolean };
export type Step = { from: number; to: number; text: L10n };

export type Trick = {
  id: TrickId;
  name: L10n;
  duration: number;
  floor: number;
  focus: Vec3;
  chips: { id: string; color: string }[];
  fingers: FingerId[];
  steps: Step[];
  tracks: {
    chips: Record<string, Key<ChipPose>[]>;
    fingers: Partial<Record<FingerId, Key<FingerPose>[]>>;
  };
};

export const CHIP = { radius: 19.5, thickness: 3.3 };
