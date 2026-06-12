import { z } from "zod";
import { StorageSystemSchema } from "./StorageSystem";
import { createPartDimensionsSchema } from "./PartDimensions";

export const PartIdSchema = z.string().brand<"PartId">();
export type PartId = z.infer<typeof PartIdSchema>;

export const createBasePartSchema = <T extends z.ZodTypeAny>(unitSchema: T) =>
  z.object({
    id: PartIdSchema,
    name: z.string(),
    system: StorageSystemSchema,
    boundingBox: createPartDimensionsSchema(unitSchema),
  });
