import { z } from "zod";

export const StorageSystemSchema = z.enum([
  "schaller",
  "gridfinity",
  "akromils",
  "opengrid",
  "custom",
]);

export type StorageSystem = z.infer<typeof StorageSystemSchema>;
