import { describe, expect, it } from "bun:test";
import {
  createSpaceTemplate,
  type SpaceTemplate,
} from "@storagemaxxing/assembly/SpaceTemplate";
import { createSpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import {
  ObstacleSchema,
  DividerSchema,
} from "@storagemaxxing/assembly/BaseTypes";
import { createDimensions3D } from "@storagemaxxing/geometry/Dimensions3D";
import { packSpace } from "./packer";
import {
  createPackInput,
  createPackInputBasic,
  type PackInput,
} from "./PackInput";

// Research assumptions and physical expectations are in docs/research/physical-fit.md.
// These assertions describe current behavior, including physical limitations.
const space = createSpaceTemplate("probe", createDimensions3D(4, 8, 4), "top");
const squareSpace = { ...space, w: 4, l: 4 } satisfies SpaceTemplate;
const shallow = createPackInputBasic("shallow", 2, 2, 1);
const deep = createPackInputBasic("deep", 2, 6, 1);
const square = createPackInputBasic("square", 4, 4, 1);
const mixedConstraints = [
  createSpaceConstraint("deep", 1, 0, 1),
  createSpaceConstraint("shallow", 3, 0, 3),
];

const fixtures = [
  {
    id: "rotation-required",
    space: { ...space, l: 6 },
    bins: [createPackInputBasic("wide", 6, 4, 1)],
    constraints: [createSpaceConstraint("wide", 1, 0, 1)],
  },
  {
    id: "rotation-transposed-control",
    space: { ...space, l: 6 },
    bins: [createPackInputBasic("wide", 4, 6, 1)],
    constraints: [createSpaceConstraint("wide", 1, 0, 1)],
  },
  {
    id: "front-uniform",
    space: { ...space, accessFace: "front" },
    bins: [shallow],
    constraints: [createSpaceConstraint("shallow", 4, 0, 4)],
  },
  {
    id: "front-mixed",
    space: { ...space, accessFace: "front" },
    bins: [deep, shallow],
    constraints: mixedConstraints,
  },
  {
    id: "top-mixed-control",
    space,
    bins: [deep, shallow],
    constraints: mixedConstraints,
  },
  {
    id: "front-unrequested-depth",
    space: { ...space, accessFace: "front" },
    bins: [shallow, createPackInputBasic("unrequested", 4, 8, 1)],
    constraints: [createSpaceConstraint("shallow", 4, 0, 4)],
  },
  {
    id: "grid-coarse",
    space: { ...space, w: 5, l: 2, gridResolution: 2 },
    bins: [createPackInputBasic("fractional", 2.5, 2, 1)],
    constraints: [createSpaceConstraint("fractional", 2, 0, 2)],
  },
  {
    id: "grid-fine-control",
    space: { ...space, w: 5, l: 2, gridResolution: 0.5 },
    bins: [createPackInputBasic("fractional", 2.5, 2, 1)],
    constraints: [createSpaceConstraint("fractional", 2, 0, 2)],
  },
  {
    id: "obstacle",
    space: {
      ...squareSpace,
      obstacles: [
        ObstacleSchema.parse({
          x: 1,
          y: 0,
          z: 1,
          w: 1,
          l: 1,
          h: 2,
          label: "fixed post",
          permanent: true,
        }),
      ],
    },
    bins: [square],
    constraints: [createSpaceConstraint("square", 1, 0, 1)],
  },
  {
    id: "divider",
    space: {
      ...squareSpace,
      dividers: [
        DividerSchema.parse({ axis: "x", position: 2, thickness: 0.5 }),
      ],
    },
    bins: [square],
    constraints: [createSpaceConstraint("square", 1, 0, 1)],
  },
  {
    id: "clearance",
    space: { ...squareSpace, backClearance: 2 },
    bins: [square],
    constraints: [createSpaceConstraint("square", 1, 0, 1)],
  },
  {
    id: "clearance-zero-control",
    space: { ...squareSpace, backClearance: 0 },
    bins: [square],
    constraints: [createSpaceConstraint("square", 1, 0, 1)],
  },
  {
    id: "tolerance-zero-control",
    space: squareSpace,
    bins: [shallow],
    constraints: [createSpaceConstraint("shallow", 4, 0, 4)],
  },
  {
    id: "tolerance-positive",
    space: squareSpace,
    bins: [createPackInput({ ...shallow, toleranceW: 0.25, toleranceL: 0.25 })],
    constraints: [createSpaceConstraint("shallow", 4, 0, 4)],
  },
] as const satisfies readonly {
  readonly id: string;
  readonly space: SpaceTemplate;
  readonly bins: readonly PackInput[];
  readonly constraints: readonly ReturnType<typeof createSpaceConstraint>[];
}[];

type Fixture = (typeof fixtures)[number];
const run = (fixture: Fixture) =>
  packSpace(fixture.space, fixture.bins, fixture.constraints);
type ProbeSummary = {
  readonly validity: ReturnType<typeof packSpace>["validity"];
  readonly placements: readonly {
    readonly id: string;
    readonly origin: readonly number[];
  }[];
  readonly counts: ReturnType<typeof packSpace>["metrics"]["placedCounts"];
  readonly areaUtilization: number;
  readonly failures: ReturnType<typeof packSpace>["metrics"]["failures"];
};
const summarize = (result: ReturnType<typeof packSpace>): ProbeSummary => ({
  validity: result.validity,
  placements: result.placedBins.map((bin) => ({
    id: bin.binId,
    origin: Array.from(bin.origin),
  })),
  counts: result.metrics.placedCounts,
  areaUtilization: result.metrics.areaUtilization,
  failures: result.metrics.failures,
});

const expected = {
  "rotation-required": {
    validity: "invalid",
    placements: [],
    counts: {},
    areaUtilization: 0,
    failures: [
      {
        binId: "wide",
        reason: "hardMin",
        required: 1,
        placed: 0,
      },
    ],
  },
  "rotation-transposed-control": {
    validity: "valid",
    placements: [
      {
        id: "wide",
        origin: [0, 0, 0],
      },
    ],
    counts: {
      wide: 1,
    },
    areaUtilization: 1,
    failures: [],
  },
  "front-uniform": {
    validity: "invalid",
    placements: [
      {
        id: "shallow",
        origin: [0, 0, 0],
      },
      {
        id: "shallow",
        origin: [2, 0, 0],
      },
    ],
    counts: {
      shallow: 2,
    },
    areaUtilization: 1,
    failures: [
      {
        binId: "shallow",
        reason: "hardMin",
        required: 4,
        placed: 2,
      },
    ],
  },
  "front-mixed": {
    validity: "valid",
    placements: [
      {
        id: "deep",
        origin: [0, 0, 0],
      },
      {
        id: "shallow",
        origin: [2, 0, 0],
      },
      {
        id: "shallow",
        origin: [2, 0, 2],
      },
      {
        id: "shallow",
        origin: [2, 0, 4],
      },
    ],
    counts: {
      deep: 1,
      shallow: 3,
    },
    areaUtilization: 1,
    failures: [],
  },
  "top-mixed-control": {
    validity: "valid",
    placements: [
      {
        id: "deep",
        origin: [0, 0, 0],
      },
      {
        id: "shallow",
        origin: [2, 0, 0],
      },
      {
        id: "shallow",
        origin: [2, 0, 2],
      },
      {
        id: "shallow",
        origin: [2, 0, 4],
      },
    ],
    counts: {
      deep: 1,
      shallow: 3,
    },
    areaUtilization: 0.75,
    failures: [],
  },
  "front-unrequested-depth": {
    validity: "valid",
    placements: [
      {
        id: "shallow",
        origin: [0, 0, 0],
      },
      {
        id: "shallow",
        origin: [2, 0, 0],
      },
      {
        id: "shallow",
        origin: [0, 0, 2],
      },
      {
        id: "shallow",
        origin: [2, 0, 2],
      },
    ],
    counts: {
      shallow: 4,
    },
    areaUtilization: 0.5,
    failures: [],
  },
  "grid-coarse": {
    validity: "valid",
    placements: [
      {
        id: "fractional",
        origin: [0, 0, 0],
      },
      {
        id: "fractional",
        origin: [2.5, 0, 0],
      },
    ],
    counts: {
      fractional: 2,
    },
    areaUtilization: 1,
    failures: [],
  },
  "grid-fine-control": {
    validity: "valid",
    placements: [
      {
        id: "fractional",
        origin: [0, 0, 0],
      },
      {
        id: "fractional",
        origin: [2.5, 0, 0],
      },
    ],
    counts: {
      fractional: 2,
    },
    areaUtilization: 1,
    failures: [],
  },
  obstacle: {
    validity: "valid",
    placements: [
      {
        id: "square",
        origin: [0, 0, 0],
      },
    ],
    counts: {
      square: 1,
    },
    areaUtilization: 1,
    failures: [],
  },
  divider: {
    validity: "valid",
    placements: [
      {
        id: "square",
        origin: [0, 0, 0],
      },
    ],
    counts: {
      square: 1,
    },
    areaUtilization: 1,
    failures: [],
  },
  clearance: {
    validity: "valid",
    placements: [
      {
        id: "square",
        origin: [0, 0, 0],
      },
    ],
    counts: {
      square: 1,
    },
    areaUtilization: 1,
    failures: [],
  },
  "clearance-zero-control": {
    validity: "valid",
    placements: [
      {
        id: "square",
        origin: [0, 0, 0],
      },
    ],
    counts: {
      square: 1,
    },
    areaUtilization: 1,
    failures: [],
  },
  "tolerance-zero-control": {
    validity: "valid",
    placements: [
      {
        id: "shallow",
        origin: [0, 0, 0],
      },
      {
        id: "shallow",
        origin: [2, 0, 0],
      },
      {
        id: "shallow",
        origin: [0, 0, 2],
      },
      {
        id: "shallow",
        origin: [2, 0, 2],
      },
    ],
    counts: {
      shallow: 4,
    },
    areaUtilization: 1,
    failures: [],
  },
  "tolerance-positive": {
    validity: "invalid",
    placements: [
      {
        id: "shallow",
        origin: [0, 0, 0],
      },
    ],
    counts: {
      shallow: 1,
    },
    areaUtilization: 0.31640625,
    failures: [
      {
        binId: "shallow",
        reason: "hardMin",
        required: 4,
        placed: 1,
      },
    ],
  },
} as const;

describe("Physical fit research probe", () => {
  it.each(fixtures)("$id records deterministic current output", (fixture) => {
    const result = summarize(run(fixture));
    console.info(JSON.stringify({ id: fixture.id, ...result }));
    expect(result).toEqual(expected[fixture.id]);
    expect(summarize(run(fixture))).toEqual(result);
  });

  it("confirms two shallow bins have blocked straight front extraction paths", () => {
    const result = run(fixtures[3]);
    const shallowOrigins = result.placedBins
      .filter((bin) => bin.binId === "shallow")
      .map((bin) => Array.from(bin.origin));
    expect(shallowOrigins).toEqual([
      [2, 0, 0],
      [2, 0, 2],
      [2, 0, 4],
    ]);
    // All three occupy x=[2,4]; the two rear paths cross the first footprint.
    expect(shallowOrigins.filter((origin) => origin[2] > 0)).toHaveLength(2);
    expect(run(fixtures[2]).validity).toBe("invalid");
    expect(run(fixtures[5]).validity).toBe("valid");
  });

  it("confirms the coarse grid has one origin outside its lattice", () => {
    const result = run(fixtures[6]);
    expect(
      result.placedBins.filter((bin) => bin.origin[0] % 2 !== 0),
    ).toHaveLength(1);
    expect(summarize(run(fixtures[7]))).toEqual(summarize(result));
  });

  it("confirms a full-space bin intersects the post and divider", () => {
    const post = fixtures[8].space.obstacles[0];
    const divider = fixtures[9].space.dividers[0];
    expect(post.x).toBeGreaterThan(0);
    expect(post.x + post.w).toBeLessThan(square.w);
    expect(post.z).toBeGreaterThan(0);
    expect(post.z + post.l).toBeLessThan(square.l);
    expect(post.y).toBeLessThan(square.h);
    expect(divider.position).toBeGreaterThan(0);
    expect(divider.position + divider.thickness).toBeLessThan(square.w);
    expect(summarize(run(fixtures[8]))).toEqual(summarize(run(fixtures[9])));
    expect(run(fixtures[8]).placedBins[0].origin).toEqual(
      new Float32Array([0, 0, 0]),
    );
  });

  it("confirms informational clearance leaves two depth units occupied", () => {
    const fixture = fixtures[10];
    const result = run(fixture);
    const usableDepth = fixture.space.l - fixture.space.backClearance;
    expect(result.placedBins[0].origin[2] + square.l - usableDepth).toBe(2);
    expect(summarize(result)).toEqual(summarize(run(fixtures[11])));
  });

  it("reports local synchronous runtime without a timing threshold", () => {
    const timings = fixtures.map((fixture) => {
      Array.from({ length: 10 }, () => run(fixture));
      const samples = Array.from({ length: 100 }, () => {
        const start = performance.now();
        run(fixture);
        return performance.now() - start;
      }).toSorted((a, b) => a - b);
      return {
        id: fixture.id,
        samples: samples.length,
        minMs: samples[0],
        medianMs: (samples[49] + samples[50]) / 2,
        p95Ms: samples[94],
      };
    });
    console.info(
      JSON.stringify({ runtime: "performance.now", warmups: 10, timings }),
    );
    expect(timings.every((timing) => timing.samples === 100)).toBe(true);
  });
});
