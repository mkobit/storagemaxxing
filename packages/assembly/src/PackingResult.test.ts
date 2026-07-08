import { describe, it, expect } from "bun:test";
import {
  createConstraintFailure,
  createHeightOverflowFailure,
} from "./PackingResult";

describe("ConstraintFailure factories", () => {
  it("createConstraintFailure produces a count-based hardMin/softMin failure", () => {
    const failure = createConstraintFailure("bin-1", "hardMin", 2, 1);
    expect(failure).toEqual({
      binId: "bin-1",
      reason: "hardMin",
      required: 2,
      placed: 1,
    });
  });

  it("createHeightOverflowFailure produces a heightOverflow failure with binHeight/spaceHeight", () => {
    const failure = createHeightOverflowFailure("bin-1", 3, 2);
    expect(failure).toEqual({
      binId: "bin-1",
      reason: "heightOverflow",
      binHeight: 3,
      spaceHeight: 2,
    });
  });
});
