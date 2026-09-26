import { describe, it, expect } from "bun:test";
import { SpaceTemplateSchema, createSpaceTemplate } from "./SpaceTemplate";
import { createDimensions3D } from "@storagemaxxing/geometry/Dimensions3D";

describe("SpaceTemplateSchema backClearance", () => {
  const baseValid = {
    id: "template-test-1",
    name: "Test Space",
    type: "drawer",
    accessFace: "top",
    w: 20,
    l: 12,
    h: 4,
    gridResolution: 0.5,
    packingModel: "2d",
    installationConstraints: [],
  };

  it("should parse a valid space template without backClearance", () => {
    const result = SpaceTemplateSchema.safeParse(baseValid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.backClearance).toBeUndefined();
    }
  });

  it("should parse a valid space template with positive backClearance", () => {
    const input = {
      ...baseValid,
      backClearance: 4.5,
    };
    const result = SpaceTemplateSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.backClearance).toBe(4.5);
    }
  });

  it("should parse a valid space template with zero backClearance", () => {
    const input = {
      ...baseValid,
      backClearance: 0,
    };
    const result = SpaceTemplateSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.backClearance).toBe(0);
    }
  });

  it("should reject a space template with negative backClearance", () => {
    const input = {
      ...baseValid,
      backClearance: -1,
    };
    const result = SpaceTemplateSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("createSpaceTemplate with backClearance option", () => {
  it("creates template without backClearance by default", () => {
    const dims = createDimensions3D(20, 12, 4);
    const template = createSpaceTemplate("template-1", dims, "top");
    expect(template.w).toBe(20);
    expect(template.l).toBe(12);
    expect(template.h).toBe(4);
    expect(template.backClearance).toBeUndefined();
  });

  it("creates template with backClearance when provided in options", () => {
    const dims = createDimensions3D(20, 12, 4);
    const template = createSpaceTemplate("template-2", dims, "top", {
      backClearance: 3.5,
    });
    expect(template.backClearance).toBe(3.5);
    const parseResult = SpaceTemplateSchema.safeParse(template);
    expect(parseResult.success).toBe(true);
  });
});
