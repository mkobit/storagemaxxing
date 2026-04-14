import { BinSpec } from "./types";
import { SCHALLER_PART_0 } from "./schaller_data/part_0";
import { SCHALLER_PART_1 } from "./schaller_data/part_1";
import { SCHALLER_PART_2 } from "./schaller_data/part_2";
import { SCHALLER_PART_3 } from "./schaller_data/part_3";
import { SCHALLER_PART_4 } from "./schaller_data/part_4";
import { SCHALLER_PART_5 } from "./schaller_data/part_5";
import { SCHALLER_PART_6 } from "./schaller_data/part_6";
import { SCHALLER_PART_7 } from "./schaller_data/part_7";

export const SCHALLER_CATALOG: ReadonlyArray<BinSpec> = [
  ...SCHALLER_PART_0,
  ...SCHALLER_PART_1,
  ...SCHALLER_PART_2,
  ...SCHALLER_PART_3,
  ...SCHALLER_PART_4,
  ...SCHALLER_PART_5,
  ...SCHALLER_PART_6,
  ...SCHALLER_PART_7,
];
