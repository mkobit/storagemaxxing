import { describe, it, expect } from "bun:test";
import { packSpace } from "./packer";
import { createPackInput, createPackInputBasic } from "./PackInput";
import {
  createSpaceTemplate,
  SpaceTemplate,
  SpaceTemplateId,
} from "@storagemaxxing/assembly/SpaceTemplate";
import { createSpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import { createDimensions3D } from "@storagemaxxing/geometry/Dimensions3D";

describe("Packer Engine", () => {
  it("basic fill of a 24x24 drawer", () => {
    const space = createSpaceTemplate(
      "drawer",
      createDimensions3D(24, 24, 6),
      "top",
    );
    const bin1 = createPackInputBasic("bin1", 6, 6, 4);
    const constraint = createSpaceConstraint("bin1", 0, 0);

    const result = packSpace(space, [bin1], [constraint]);

    expect(result.validity).toBe("valid");
    expect(result.metrics.placedCounts["bin1"]).toBe(16);
    expect(result.placedBins.length).toBe(16);
    expect(result.metrics.areaUtilization).toBe(1);
  });

  it("hard min violation producing invalid state", () => {
    const space = createSpaceTemplate(
      "drawer",
      createDimensions3D(10, 10, 6),
      "top",
    );
    const bin1 = createPackInputBasic("bin1", 6, 6, 4);
    const constraint = createSpaceConstraint("bin1", 4, 4);

    const result = packSpace(space, [bin1], [constraint]);

    expect(result.validity).toBe("invalid");
    expect(result.metrics.placedCounts["bin1"]).toBe(1);
    expect(result.metrics.failures.length).toBe(1);
    expect(result.metrics.failures[0].reason).toBe("hardMin");
  });

  it("soft min shortfall producing partial state", () => {
    const space = createSpaceTemplate(
      "drawer",
      createDimensions3D(10, 10, 6),
      "top",
    );
    const bin1 = createPackInputBasic("bin1", 6, 6, 4);
    const constraint = createSpaceConstraint("bin1", 1, 4);

    const result = packSpace(space, [bin1], [constraint]);

    expect(result.validity).toBe("partial");
    expect(result.metrics.placedCounts["bin1"]).toBe(1);
    expect(result.metrics.failures.length).toBe(1);
    expect(result.metrics.failures[0].reason).toBe("softMin");
  });

  it("front-access depth clamping", () => {
    const space = createSpaceTemplate(
      "shelf",
      createDimensions3D(24, 24, 6),
      "front",
    );
    const bin1 = createPackInputBasic("bin1", 6, 6, 4);
    const constraint = createSpaceConstraint("bin1", 0, 0);

    const result = packSpace(space, [bin1], [constraint]);

    expect(result.validity).toBe("valid");
    expect(result.metrics.placedCounts["bin1"]).toBe(4);
    expect(result.placedBins.length).toBe(4);
  });

  it("tolerance reducing bin count", () => {
    const space = createSpaceTemplate(
      "drawer",
      createDimensions3D(24, 24, 6),
      "top",
    );
    const bin1 = createPackInput({
      id: "bin1",
      w: 6,
      l: 6,
      h: 4,
      toleranceW: 0.5,
      toleranceL: 0.5,
      toleranceH: 0,
    });
    const constraint = createSpaceConstraint("bin1", 0, 0);

    const result = packSpace(space, [bin1], [constraint]);

    expect(result.validity).toBe("valid");
    expect(result.metrics.placedCounts["bin1"]).toBe(9);
    expect(result.placedBins.length).toBe(9);
  });

  it("a bin taller than the space is excluded from placement entirely", () => {
    const space = createSpaceTemplate(
      "drawer",
      createDimensions3D(10, 10, 2),
      "top",
    );
    const tooTall = createPackInputBasic("tooTall", 4, 4, 3);
    // auto mode (no positive minimum): exclusion alone must not fail the pack.
    const constraint = createSpaceConstraint("tooTall", 0, 0);

    const result = packSpace(space, [tooTall], [constraint]);

    expect(result.placedBins.length).toBe(0);
    expect(result.metrics.placedCounts["tooTall"]).toBeUndefined();
    expect(result.validity).toBe("valid");
  });

  it("a too-tall bin does not widen the front-access depth cap for eligible bins", () => {
    const space = createSpaceTemplate(
      "shelf",
      createDimensions3D(24, 24, 6),
      "front",
    );
    const tooTall = createPackInputBasic("tooTall", 6, 20, 8);
    const eligible = createPackInputBasic("eligible", 6, 6, 4);
    const constraints = [
      createSpaceConstraint("tooTall", 0, 0),
      createSpaceConstraint("eligible", 0, 0),
    ];

    const result = packSpace(space, [tooTall, eligible], constraints);

    // If the too-tall bin's l=20 leaked into getMaxBinDepth, the front-access
    // depth cap would widen from 6 (eligible's l) to 20, changing the count.
    expect(result.metrics.placedCounts["eligible"]).toBe(4);
  });

  it("sm-csu4 repro: a hard-constrained too-tall bin invalidates the pack with a heightOverflow failure", () => {
    const space = createSpaceTemplate(
      "drawer",
      createDimensions3D(12, 12, 2),
      "top",
    );
    const tooTall = createPackInputBasic("tooTall", 4, 4, 3);
    const constraint = createSpaceConstraint("tooTall", 1, 0);

    const result = packSpace(space, [tooTall], [constraint]);

    expect(result.validity).toBe("invalid");
    expect(result.placedBins.length).toBe(0);
    expect(result.metrics.failures).toEqual([
      {
        binId: "tooTall",
        reason: "heightOverflow",
        binHeight: 3,
        spaceHeight: 2,
      },
    ]);
  });

  it("a soft-constrained too-tall bin yields a partial result with a heightOverflow failure", () => {
    const space = createSpaceTemplate(
      "drawer",
      createDimensions3D(12, 12, 2),
      "top",
    );
    const tooTall = createPackInputBasic("tooTall", 4, 4, 3);
    const constraint = createSpaceConstraint("tooTall", 0, 1);

    const result = packSpace(space, [tooTall], [constraint]);

    expect(result.validity).toBe("partial");
    expect(result.placedBins.length).toBe(0);
    expect(result.metrics.failures).toEqual([
      {
        binId: "tooTall",
        reason: "heightOverflow",
        binHeight: 3,
        spaceHeight: 2,
      },
    ]);
  });

  it("a space with undefined height is height-unconstrained", () => {
    const space: SpaceTemplate = {
      id: "undefined-height" as SpaceTemplateId,
      name: "undefined-height",
      type: "drawer",
      accessFace: "top",
      w: 12,
      l: 12,
      packingModel: "2d",
      installationConstraints: [],
      gridResolution: 0.5,
    };
    const tall = createPackInputBasic("tall", 4, 4, 1000);
    const constraint = createSpaceConstraint("tall", 1, 0, 1);

    const result = packSpace(space, [tall], [constraint]);

    expect(result.validity).toBe("valid");
    expect(result.placedBins.length).toBe(1);
    expect(result.metrics.failures.length).toBe(0);
  });
});
