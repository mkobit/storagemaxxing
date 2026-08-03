import { z } from "zod";
import { StorageSystemSchema } from "@storagemaxxing/catalog/StorageSystem";

export const CreateSpaceInputSchema = z.object({
  name: z.string().min(1),
  system: StorageSystemSchema,
  columns: z.coerce.number().int().positive(),
  rows: z.coerce.number().int().positive(),
  depth: z.coerce.number().positive(),
});
