import { expect, test } from "bun:test";
import { InchesSchema, inches } from "@storagemaxxing/geometry/Inches";
import { createBasePartSchema, PartIdSchema } from "./BasePart";

test("createBasePartSchema parses a part with id, name, system, and bounding box", () => {
  const schema = createBasePartSchema(InchesSchema);

  const result = schema.parse({
    id: "part-1",
    name: "Test bin",
    system: "gridfinity",
    boundingBox: { width: 1, height: 2, depth: 3 },
  });

  expect(result).toEqual({
    id: PartIdSchema.parse("part-1"),
    name: "Test bin",
    system: "gridfinity",
    boundingBox: {
      width: inches(1),
      height: inches(2),
      depth: inches(3),
    },
  });
});

test("createBasePartSchema rejects an unknown storage system", () => {
  const schema = createBasePartSchema(InchesSchema);

  expect(() =>
    schema.parse({
      id: "part-1",
      name: "Test bin",
      system: "not-a-system",
      boundingBox: { width: 1, height: 2, depth: 3 },
    }),
  ).toThrow();
});

test("createBasePartSchema rejects a bounding box that fails the unit schema", () => {
  const schema = createBasePartSchema(InchesSchema);

  expect(() =>
    schema.parse({
      id: "part-1",
      name: "Test bin",
      system: "gridfinity",
      boundingBox: { width: "not-a-number", height: 2, depth: 3 },
    }),
  ).toThrow();
});
