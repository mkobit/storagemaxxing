import { expect, test, describe } from "bun:test";
import { calculateOpenGrid, OPENGRID_PITCH_MM } from "./OpenGrid";
import { mm } from "./Millimeters";
import { createSize } from "./Dimensions2D";

describe("calculateOpenGrid", () => {
  test("exact fit 2x2", () => {
    const size = createSize(mm(84), mm(84));
    const result = calculateOpenGrid(size, "truncate");
    
    expect(result.grid.cols).toBe(2);
    expect(result.grid.rows).toBe(2);
    expect(result.usedArea.w).toBe(mm(84));
    expect(result.coverage).toBe(1);
  });

  test("truncate 100mm to 84mm (2x2)", () => {
    const size = createSize(mm(100), mm(100));
    const result = calculateOpenGrid(size, "truncate");
    
    expect(result.grid.cols).toBe(2);
    expect(result.grid.rows).toBe(2);
    expect(result.usedArea.w).toBe(mm(84));
    expect(result.wastedArea.w).toBe(mm(16));
    expect(result.coverage).toBeCloseTo(0.7056, 4); // (84*84)/(100*100) = 7056/10000
  });

  test("expand 100mm to 126mm (3x3)", () => {
    const size = createSize(mm(100), mm(100));
    const result = calculateOpenGrid(size, "expand");
    
    expect(result.grid.cols).toBe(3);
    expect(result.grid.rows).toBe(3);
    expect(result.usedArea.w).toBe(mm(126));
  });

  test("round 100mm to 84mm (2x2)", () => {
    // 100 / 42 = 2.38 -> rounds to 2
    const size = createSize(mm(100), mm(100));
    const result = calculateOpenGrid(size, "round");
    expect(result.grid.cols).toBe(2);
  });

  test("round 110mm to 126mm (3x3)", () => {
    // 110 / 42 = 2.61 -> rounds to 3
    const size = createSize(mm(110), mm(110));
    const result = calculateOpenGrid(size, "round");
    expect(result.grid.cols).toBe(3);
  });

  test("center 100mm (2x2 with 8mm offset)", () => {
    const size = createSize(mm(100), mm(100));
    const result = calculateOpenGrid(size, "center");
    
    expect(result.grid.cols).toBe(2);
    expect(result.offset[0]).toBe(8); // (100 - 84) / 2
    expect(result.offset[1]).toBe(8);
  });
});
