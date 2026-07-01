import { describe, expect, test } from "bun:test";
import { serializeSketch, parseSketch } from "../src/SketchSerialization";
import { AppState, initialState } from "../src/StoreTypes";
import { createSpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import { SpaceInstanceSchema } from "@storagemaxxing/assembly/SpaceInstance";
import { createSpaceTemplate } from "@storagemaxxing/assembly/SpaceTemplate";
import { createDimensions3D } from "@storagemaxxing/geometry/Dimensions3D";

const template = createSpaceTemplate(
  "template-1",
  createDimensions3D(6, 6, 2),
  "top",
);

// hardMin=2, softMin=3, max=5 keeps every optional field defined so the
// JSON round-trip can be compared with a plain deep-equality check.
const constraint = createSpaceConstraint("gridfinity-1x1x2", 2, 3, 5);

const space = SpaceInstanceSchema.parse({
  id: "space-1",
  templateId: template.id,
  name: "Test space",
  count: 1,
  constraints: { "gridfinity-1x1x2": constraint },
});

const state: AppState = {
  ...initialState,
  spaces: [space],
  activeSpaceId: space.id,
  templatesById: { [template.id]: template },
  constraintsBySpace: { [template.id]: [constraint] },
};

describe("SketchSerialization", () => {
  test("round-trips a sketch through JSON", () => {
    const json = serializeSketch(state);
    const sketch = parseSketch(json);

    expect(sketch.spaces).toEqual(state.spaces);
    expect(sketch.activeSpaceId).toEqual(state.activeSpaceId);
    expect(sketch.templatesById).toEqual(state.templatesById);
    expect(sketch.constraintsBySpace).toEqual(state.constraintsBySpace);
  });

  test("rejects malformed sketch JSON", () => {
    expect(() => parseSketch(JSON.stringify({ nonsense: true }))).toThrow();
  });

  test("rejects invalid JSON syntax", () => {
    expect(() => parseSketch("{not json")).toThrow();
  });
});
