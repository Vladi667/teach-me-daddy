/**
 * The programme corpus: the hand-checked seed followed by the generated range.
 *
 * Kept hand-written on purpose. The generator used to parse its own previous
 * output to carry the seed forward, and one rebuild silently dropped days 1-5,
 * leaving day 1 with nothing to issue. Two generated files and a merge here
 * cannot fail that way.
 */

import type { Line } from "./programme.ts";
import { SEED } from "./lines.seed.ts";
import { GENERATED, LAST_GENERATED_DAY } from "./lines.gen.ts";

export const LINES: Line[] = [...SEED, ...GENERATED];

export const linesForDay = (day: number) => LINES.filter((l) => l.day === day);

export const LAST_SEEDED_DAY = LAST_GENERATED_DAY;
