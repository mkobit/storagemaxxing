import { z } from "zod";
import { Point2D } from "../geometry/Point2D.js";
import {
  SpaceTypeIdSchema,
  InstallationConstraintSchema,
  DividerSchema,
  ObstacleSchema,
} from "./BaseTypes.js";

export const SpaceTemplateIdSchema = z.string().brand<"SpaceTemplateId">();
export type SpaceTemplateId = z.infer<typeof SpaceTemplateIdSchema>;

export const AccessFaceSchema = z.enum([
  "top",
  "front",
  "top+front",
  "all-sides",
]);
export type AccessFace = z.infer<typeof AccessFaceSchema>;

export const Point2DSchema = z.custom<Point2D>((val) => {
  return val instanceof Float32Array && val.length === 2;
});

export const SpaceTemplateSchema = z
  .object({
    id: SpaceTemplateIdSchema,
    name: z.string(),
    type: SpaceTypeIdSchema,
    accessFace: AccessFaceSchema,

    w: z.number().optional(),
    l: z.number().optional(),
    h: z.number().optional(),

    footprint: z.array(Point2DSchema).readonly().optional(),

    gridResolution: z.number().default(0.5),
    packingModel: z.enum(["2d", "2.5d", "3d"]),

    installationConstraints: z.array(InstallationConstraintSchema).readonly(),

    dividers: z.array(DividerSchema).readonly().optional(),
    obstacles: z.array(ObstacleSchema).readonly().optional(),
  })
  .readonly()
  .refine(
    (data) =>
      (data.w !== undefined && data.l !== undefined && data.h !== undefined) ||
      data.footprint !== undefined,
    {
      message: "Either w/l/h or footprint must be defined",
    },
  );

export type SpaceTemplate = z.infer<typeof SpaceTemplateSchema>;

export const createSpaceTemplate = (
  id: string,
  dimensions: { readonly width: number; readonly height: number; readonly depth: number },
  accessFace: AccessFace,
): SpaceTemplate => ({
  id: id as SpaceTemplateId,
  name: id,
  type: 'drawer',
  accessFace,
  w: dimensions.width,
  h: dimensions.height,
  l: dimensions.depth,
  packingModel: '2d',
  installationConstraints: [],
  gridResolution: 0.5,
});
