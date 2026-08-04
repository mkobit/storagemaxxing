import { z } from "zod";
import { Point2D } from "@storagemaxxing/geometry/Point2D";
import { Dimensions3D } from "@storagemaxxing/geometry/Dimensions3D";
import {
  SpaceTypeIdSchema,
  InstallationConstraintSchema,
  DividerSchema,
  ObstacleSchema,
} from "./BaseTypes";

export const SpaceTemplateIdSchema = z.string().brand<"SpaceTemplateId">();
export type SpaceTemplateId = z.infer<typeof SpaceTemplateIdSchema>;

const AccessFaceSchema = z.enum(["top", "front", "top+front", "all-sides"]);
export type AccessFace = z.infer<typeof AccessFaceSchema>;

const Point2DSchema = z.custom<Point2D>((val) => {
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
  dimensions: Dimensions3D,
  accessFace: AccessFace,
): SpaceTemplate => ({
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- id is a branded Zod type; this factory takes a plain string param and constructs the branded value without re-running SpaceTemplateIdSchema.parse()
  id: id as SpaceTemplateId,
  name: id,
  type: "drawer",
  accessFace,
  w: dimensions.w,
  h: dimensions.h,
  l: dimensions.l,
  packingModel: "2d",
  installationConstraints: [],
  gridResolution: 0.5,
});
