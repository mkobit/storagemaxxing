import { describe, it, expect } from "bun:test";
import { CreateSpaceInputSchema } from "./CreateSpaceForm";

describe("CreateSpaceInputSchema", () => {
  it("parses valid input into positive numbers for columns/rows/depth", () => {
    const result = CreateSpaceInputSchema.parse({
      name: "My drawer",
      system: "gridfinity",
      columns: "5",
      rows: "4",
      depth: "2",
    });

    expect(result).toEqual({
      name: "My drawer",
      system: "gridfinity",
      columns: 5,
      rows: 4,
      depth: 2,
    });
  });

  it("throws when columns is non-numeric", () => {
    expect(() =>
      CreateSpaceInputSchema.parse({
        name: "My drawer",
        system: "gridfinity",
        columns: "abc",
        rows: "4",
        depth: "2",
      }),
    ).toThrow();
  });

  it("throws when rows is non-positive", () => {
    expect(() =>
      CreateSpaceInputSchema.parse({
        name: "My drawer",
        system: "gridfinity",
        columns: "5",
        rows: "0",
        depth: "2",
      }),
    ).toThrow();
  });

  it("throws when depth is non-positive", () => {
    expect(() =>
      CreateSpaceInputSchema.parse({
        name: "My drawer",
        system: "gridfinity",
        columns: "5",
        rows: "4",
        depth: "-1",
      }),
    ).toThrow();
  });

  it("throws when name is empty", () => {
    expect(() =>
      CreateSpaceInputSchema.parse({
        name: "",
        system: "gridfinity",
        columns: "5",
        rows: "4",
        depth: "2",
      }),
    ).toThrow();
  });

  it("throws when system is not a known StorageSystem", () => {
    expect(() =>
      CreateSpaceInputSchema.parse({
        name: "My drawer",
        system: "not-a-system",
        columns: "5",
        rows: "4",
        depth: "2",
      }),
    ).toThrow();
  });
});
