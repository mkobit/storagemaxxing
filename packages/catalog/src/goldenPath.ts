import { binId, BinId } from "./bin.js";
import { StorageSystem } from "./StorageSystem.js";

export const GOLDEN_PATH_SYSTEM: StorageSystem = "gridfinity";

export const GOLDEN_PATH_STARTER_BIN_IDS: ReadonlyArray<BinId> = [
  binId("gridfinity-1x1x2"),
  binId("gridfinity-2x1x2"),
  binId("gridfinity-2x2x2"),
  binId("gridfinity-3x2x2"),
];
