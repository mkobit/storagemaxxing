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
import {
  SpaceTemplate,
  createSpaceTemplate,
} from "@storagemaxxing/assembly/SpaceTemplate";
import { binId, BinSpec } from "@storagemaxxing/catalog/bin";
import { buildWireframeScene } from "./wireframeScene";

const testBin = (id: string, w: number, l: number, h: number): BinSpec => ({
  id: binId(id),
  name: id,
  sku: id,
  vendor: "test",
  catalogSource: "user_defined",
  kind: "bin",
  nominal: createDimensions3D(w, l, h),
  actual: createDimensions3D(w, l, h),
  tolerance: createDimensions3D(0, 0, 0),
});

const project = (x: number, y: number, z: number) =>
  projectPoint(CABINET_PROJECTION, createPoint3D(x, y, z));

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

    expect(scene.polygons).toHaveLength(3);

    const [x0, y0, z0] = [origin[0], origin[1], origin[2]];
    const x1 = x0 + bin.nominal.w;
    const y1 = y0 + bin.nominal.h;
    const z1 = z0 + bin.nominal.l;

    const [top, front, right] = scene.polygons;

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

    expect(scene.polygons).toHaveLength(3);
  });

  test("space contributes floor, top, and vertical edges when w/l/h are defined", () => {
    const template = createSpaceTemplate(
      "space-1",
      createDimensions3D(10, 8, 6),
      "top",
    );
    const result = createPackingResult(
      [],
      createPackingMetrics({}, 1, []),
      "valid",
    );

    const scene = buildWireframeScene(result, template, [], () => undefined);

    expect(scene.polygons).toHaveLength(6);
    const [floor, top, v1, v2, v3, v4] = scene.polygons;

    expect(floor.points).toEqual([
      project(0, 0, 0),
      project(10, 0, 0),
      project(10, 0, 8),
      project(0, 0, 8),
    ]);
    expect(top.points).toEqual([
      project(0, 6, 0),
      project(10, 6, 0),
      project(10, 6, 8),
      project(0, 6, 8),
    ]);
    expect(v1.points).toEqual([project(0, 0, 0), project(0, 6, 0)]);
    expect(v2.points).toEqual([project(10, 0, 0), project(10, 6, 0)]);
    expect(v3.points).toEqual([project(10, 0, 8), project(10, 6, 8)]);
    expect(v4.points).toEqual([project(0, 0, 8), project(0, 6, 8)]);
  });

  test("space degrades to a floor-only outline when template.h is undefined", () => {
    const base = createSpaceTemplate(
      "space-1",
      createDimensions3D(10, 8, 6),
      "top",
    );
    const template: SpaceTemplate = { ...base, h: undefined };
    const result = createPackingResult(
      [],
      createPackingMetrics({}, 1, []),
      "valid",
    );

    const scene = buildWireframeScene(result, template, [], () => undefined);

    expect(scene.polygons).toHaveLength(1);
    expect(scene.polygons[0].points).toEqual([
      project(0, 0, 0),
      project(10, 0, 0),
      project(10, 0, 8),
      project(0, 0, 8),
    ]);
  });

  test("null template yields no space edges, bins still render", () => {
    const bin = testBin("bin-a", 2, 3, 4);
    const result = createPackingResult(
      [createPlacedBin("bin-a", createPoint3D(0, 0, 0))],
      createPackingMetrics({}, 1, []),
      "valid",
    );

    const scene = buildWireframeScene(result, null, [], (id) =>
      id === "bin-a" ? bin : undefined,
    );

    expect(scene.polygons).toHaveLength(3);
  });

  test("painter ordering is deterministic back-to-front across repeated invocations", () => {
    const bin = testBin("bin-shape", 1, 1, 1);
    const result = createPackingResult(
      [
        createPlacedBin("bin-near", createPoint3D(0, 0, 2)),
        createPlacedBin("bin-far", createPoint3D(0, 0, 10)),
      ],
      createPackingMetrics({}, 1, []),
      "valid",
    );
    const farConstraint = {
      ...createSpaceConstraint("bin-far", 1, 1),
      color: "#111111",
    };
    const nearConstraint = {
      ...createSpaceConstraint("bin-near", 1, 1),
      color: "#222222",
    };
    const lookup = () => bin;

    const scene = buildWireframeScene(
      result,
      null,
      [farConstraint, nearConstraint],
      lookup,
    );

    expect(scene.polygons).toHaveLength(6);
    // The deeper bin (origin[2]=10) must precede the nearer one (origin[2]=2).
    expect(scene.polygons[0].fillColor).toBe("#111111");
    expect(scene.polygons[3].fillColor).toBe("#222222");

    const repeat = buildWireframeScene(
      result,
      null,
      [farConstraint, nearConstraint],
      lookup,
    );
    expect(repeat.polygons.map((p) => p.fillColor)).toEqual(
      scene.polygons.map((p) => p.fillColor),
    );
  });

  test("same-depth bins order ascending on origin[0]", () => {
    const bin = testBin("bin-shape", 1, 1, 1);
    const result = createPackingResult(
      [
        createPlacedBin("bin-right", createPoint3D(5, 0, 0)),
        createPlacedBin("bin-left", createPoint3D(0, 0, 0)),
      ],
      createPackingMetrics({}, 1, []),
      "valid",
    );
    const leftConstraint = {
      ...createSpaceConstraint("bin-left", 1, 1),
      color: "#111111",
    };
    const rightConstraint = {
      ...createSpaceConstraint("bin-right", 1, 1),
      color: "#222222",
    };

    const scene = buildWireframeScene(
      result,
      null,
      [leftConstraint, rightConstraint],
      () => bin,
    );

    expect(scene.polygons[0].fillColor).toBe("#111111");
    expect(scene.polygons[3].fillColor).toBe("#222222");
  });

  test("bin taller than the space extends above the space's top plane at its own depth", () => {
    const template = createSpaceTemplate(
      "space-1",
      createDimensions3D(10, 8, 4),
      "top",
    );
    const tallBin = testBin("tall-bin", 2, 2, 7);
    const origin = createPoint3D(1, 0, 3);
    const result = createPackingResult(
      [createPlacedBin("tall-bin", origin)],
      createPackingMetrics({}, 1, []),
      "valid",
    );

    const scene = buildWireframeScene(result, template, [], (id) =>
      id === "tall-bin" ? tallBin : undefined,
    );

    const frontFace = scene.polygons.at(-2);
    if (!frontFace) throw new Error("expected a front face polygon");
    const frontTopEdgeY = frontFace.points[2][1];

    // template.h is defined per createSpaceTemplate above.
    const spaceHeight = template.h ?? 0;
    const spaceTopAtBinDepth = project(0, spaceHeight, origin[2])[1];

    expect(frontTopEdgeY).toBeGreaterThan(spaceTopAtBinDepth);
  });

  test("a bin with a non-finite origin does not poison the bounding box", () => {
    const bin = testBin("bin-a", 2, 3, 4);
    const badBin = testBin("bin-bad", 2, 3, 4);
    const goodOnly = createPackingResult(
      [createPlacedBin("bin-a", createPoint3D(1, 0, 1))],
      createPackingMetrics({}, 1, []),
      "valid",
    );
    const withBad = createPackingResult(
      [
        createPlacedBin("bin-a", createPoint3D(1, 0, 1)),
        // Simulates an upstream packer defect (sm-65ad): a bin "placed" with
        // a NaN origin because its footprint could not actually fit anywhere.
        createPlacedBin("bin-bad", createPoint3D(NaN, 0, NaN)),
      ],
      createPackingMetrics({}, 1, []),
      "valid",
    );
    const lookupBin = (id: string) =>
      id === "bin-a" ? bin : id === "bin-bad" ? badBin : undefined;

    const expected = buildWireframeScene(goodOnly, null, [], lookupBin);
    const scene = buildWireframeScene(withBad, null, [], lookupBin);

    expect(scene.polygons).toHaveLength(6);
    expect(Number.isFinite(scene.boundingBox.origin[0])).toBe(true);
    expect(Number.isFinite(scene.boundingBox.origin[1])).toBe(true);
    expect(Number.isFinite(scene.boundingBox.dimensions.w)).toBe(true);
    expect(Number.isFinite(scene.boundingBox.dimensions.l)).toBe(true);
    expect(scene.boundingBox).toEqual(expected.boundingBox);
  });
});
