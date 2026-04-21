import { z } from "zod";

export const SketchElementIdSchema = z.string().brand<"SketchElementId">();
export type SketchElementId = z.infer<typeof SketchElementIdSchema>;

export const createSketchElementId = (id?: string): SketchElementId => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return (id || crypto.randomUUID()) as unknown as SketchElementId;
};
