import { expect, test, describe } from "bun:test";
import { createPoint3D } from "@storagemaxxing/geometry/Point3D";
import {
  CABINET_PROJECTION,
  projectPoint,
} from "@storagemaxxing/geometry/ObliqueProjection";
import { createDimensions3D } from "@storagemaxxing/geometry/Dimensions3D";
import {
  createPackingResult,
  createPackingMetrics,
} from "@storagemaxxing/assembly/PackingResult";
import { createPlacedBin } from "@storagemaxxing/assembly/PlacedBin";
import { createSpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import { binId, BinSpec } from "@storagemaxxing/catalog/bin";
import { buildWireframeScene } from "./wireframeScene";

const testBin = (id: string, w: number, l: number, h: number): BinSpec => ({
  id: binId(id),
  name: id,
  sku: id,
  vendor: "test",
  catalogSource: "user_defined",
  nominal: createDimensions3D(w, l, h),
  actual: createDimensions3D(w, l, h),
  tolerance: createDimensions3D(0, 0, 0),
});

describe("buildWireframeScene", () => {
  test("placed bin yields three faces at projected coordinates with constraint color on top", () => {
    const bin = testBin("bin-a", 2, 3, 4);
    const origin = createPoint3D(1, 0, 5);
    const result = createPackingResult(
      [createPlacedBin("bin-a", origin)],
      createPackingMetrics({}, 1, []),
      "valid",
    );
    const constraint = createSpaceConstraint("bin-a", 1, 1);
    const constraintWithColor = { ...constraint, color: "#ff00ff" };

    const scene = buildWireframeScene(
      result,
      null,
      [constraintWithColor],
      (id) => (id === "bin-a" ? bin : undefined),
    );

    expect(scene).toHaveLength(3);

    const [x0, y0, z0] = [origin[0], origin[1], origin[2]];
    const x1 = x0 + bin.nominal.w;
    const y1 = y0 + bin.nominal.h;
    const z1 = z0 + bin.nominal.l;
    const project = (x: number, y: number, z: number) =>
      projectPoint(CABINET_PROJECTION, createPoint3D(x, y, z));

    const [top, front, right] = scene;

    expect(top.points).toEqual([
      project(x0, y1, z0),
      project(x1, y1, z0),
      project(x1, y1, z1),
      project(x0, y1, z1),
    ]);
    expect(top.fillColor).toBe("#ff00ff");

    expect(front.points).toEqual([
      project(x0, y0, z0),
      project(x1, y0, z0),
      project(x1, y1, z0),
      project(x0, y1, z0),
    ]);

    expect(right.points).toEqual([
      project(x1, y0, z0),
      project(x1, y0, z1),
      project(x1, y1, z1),
      project(x1, y1, z0),
    ]);
  });

  test("unresolved bin yields no polygons", () => {
    const bin = testBin("bin-a", 2, 3, 4);
    const origin = createPoint3D(0, 0, 0);
    const result = createPackingResult(
      [
        createPlacedBin("bin-a", origin),
        createPlacedBin("bin-missing", origin),
      ],
      createPackingMetrics({}, 1, []),
      "valid",
    );

    const scene = buildWireframeScene(result, null, [], (id) =>
      id === "bin-a" ? bin : undefined,
    );

    expect(scene).toHaveLength(3);
  });
});
