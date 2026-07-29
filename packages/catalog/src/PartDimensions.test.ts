import { expect, test } from "bun:test";
import { InchesSchema, inches } from "@storagemaxxing/geometry/Inches";
import { createPartDimensionsSchema } from "./PartDimensions";

test("createPartDimensionsSchema parses width, height, and depth with the given unit schema", () => {
  const schema = createPartDimensionsSchema(InchesSchema);

  const result = schema.parse({ width: 3, height: 4, depth: 5 });

  expect(result).toEqual({
    width: inches(3),
    height: inches(4),
    depth: inches(5),
  });
});

test("createPartDimensionsSchema rejects a missing dimension", () => {
  const schema = createPartDimensionsSchema(InchesSchema);

  expect(() => schema.parse({ width: 3, height: 4 })).toThrow();
});

test("createPartDimensionsSchema rejects a dimension that fails the unit schema", () => {
  const schema = createPartDimensionsSchema(InchesSchema);

  expect(() =>
    schema.parse({ width: "not-a-number", height: 4, depth: 5 }),
  ).toThrow();
});
