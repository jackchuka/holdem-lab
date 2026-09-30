import { chipTwist } from './chipTwist';
import { knuckleRoll } from './knuckleRoll';
import { riffle } from './riffle';
import { thumbFlip } from './thumbFlip';
import type { Trick } from './types';

// Tab order.
export const TRICKS: Trick[] = [riffle, thumbFlip, chipTwist, knuckleRoll];
