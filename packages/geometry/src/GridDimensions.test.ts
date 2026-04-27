import { expect, test, describe } from "bun:test";
import { createGridDimensions } from "./GridDimensions.js";

describe("createGridDimensions", () => {
  test("creates dimensions with only cols and rows", () => {
    const result = createGridDimensions(2, 3);
    expect(result).toEqual({
      cols: 2,
      rows: 3,
    });
    expect(result).not.toHaveProperty("depth");
  });

  test("creates dimensions with cols, rows, and depth", () => {
    const result = createGridDimensions(4, 5, 6);
    expect(result).toEqual({
      cols: 4,
      rows: 5,
      depth: 6,
    });
    expect(result.depth).toBe(6);
  });
});
