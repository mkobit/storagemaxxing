import { BinSpec } from "./types";
import { SCHALLER_1IN } from "./schaller_data/schaller_1in";
import { SCHALLER_2IN } from "./schaller_data/schaller_2in";
import { SCHALLER_3IN } from "./schaller_data/schaller_3in";

export const SCHALLER_CATALOG: ReadonlyArray<BinSpec> = [
  ...SCHALLER_1IN,
  ...SCHALLER_2IN,
  ...SCHALLER_3IN,
];
