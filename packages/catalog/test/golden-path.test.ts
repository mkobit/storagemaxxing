import { describe, expect, test } from "bun:test";
import { ALL_BINS, findBinById } from "../src/lookup";
import {
  GOLDEN_PATH_SYSTEM,
  GOLDEN_PATH_STARTER_BIN_IDS,
} from "../src/goldenPath";
import { StorageSystemSchema } from "../src/StorageSystem";

describe("storage-layout: Catalog Golden-Path Systems", () => {
  test("resolves a storage system and its starter bins by id", () => {
    expect(StorageSystemSchema.parse(GOLDEN_PATH_SYSTEM)).toBe(
      GOLDEN_PATH_SYSTEM,
    );
    expect(GOLDEN_PATH_STARTER_BIN_IDS.length).toBeGreaterThan(0);

    GOLDEN_PATH_STARTER_BIN_IDS.forEach((id) => {
      const bin = findBinById(ALL_BINS, id);
      expect(bin).toBeDefined();
      expect(bin?.system).toBe(GOLDEN_PATH_SYSTEM);
      expect(bin?.nominal.w).toBeGreaterThan(0);
      expect(bin?.nominal.l).toBeGreaterThan(0);
      expect(bin?.nominal.h).toBeGreaterThan(0);
      expect(bin?.actual.w).toBeGreaterThan(0);
      expect(bin?.actual.l).toBeGreaterThan(0);
    });
  });
});
