import { expect, test, describe } from "bun:test";
import { createPoint3D } from "./Point3D";
import { CABINET_PROJECTION, projectPoint } from "./ObliqueProjection";

describe("ObliqueProjection", () => {
  test("origin projects to origin", () => {
    const result = projectPoint(CABINET_PROJECTION, createPoint3D(0, 0, 0));
    expect(result[0]).toBeCloseTo(0);
    expect(result[1]).toBeCloseTo(0);
  });

  test("depth recedes at the configured angle and scale", () => {
    const d = 10;
    const input = createPoint3D(0, 0, d);
    const result = projectPoint(CABINET_PROJECTION, input);
    expect(result[0]).toBeCloseTo(d * 0.5 * Math.cos(Math.PI / 6));
    expect(result[1]).toBeCloseTo(d * 0.5 * Math.sin(Math.PI / 6));
    expect(input[0]).toBe(0);
    expect(input[1]).toBe(0);
    expect(input[2]).toBe(d);
  });

  test("width and height project true to scale in the front plane", () => {
    const result = projectPoint(CABINET_PROJECTION, createPoint3D(3, 7, 0));
    expect(result[0]).toBeCloseTo(3);
    expect(result[1]).toBeCloseTo(7);
  });
});
