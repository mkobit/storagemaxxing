import { expect, test, describe } from "bun:test";
import { inches } from "@storagemaxxing/geometry/Inches";
import { createDimensions3D } from "@storagemaxxing/geometry/Dimensions3D";
import { binId, type BinSpec } from "./bin";
import type { InstallationRequirement } from "./installationRequirement";

const dims = createDimensions3D(inches(1), inches(1), inches(1));

const baseBin = {
  id: binId("test-bin"),
  name: "Test Bin",
  sku: "TEST-1",
  vendor: "Test Vendor",
  catalogSource: "builtin",
  nominal: dims,
  actual: dims,
  tolerance: createDimensions3D(inches(0), inches(0), inches(0)),
} as const;

describe("BinSpec installation field", () => {
  const variants: readonly InstallationRequirement[] = [
    { type: "drill", description: "Requires drilling into the wall" },
    { type: "rail", description: "Mounts to a rail system" },
    { type: "adhesive", description: "Mounts with adhesive strips" },
    { type: "freestanding", description: "Sits freestanding, no mounting" },
    { type: "stack-only", description: "Only stacks on other bins" },
  ];

  variants.forEach((installation) => {
    test(`accepts installation.type = "${installation.type}"`, () => {
      const bin: BinSpec = {
        ...baseBin,
        installation,
      };

      expect(bin.installation).toEqual(installation);
    });
  });

  test("omitting installation entirely still type-checks and behaves as before", () => {
    const bin: BinSpec = {
      ...baseBin,
    };

    expect(bin.installation).toBeUndefined();
  });
});
