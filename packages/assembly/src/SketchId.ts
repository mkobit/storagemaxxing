import { z } from "zod";

export const SketchIdSchema = z.string().brand<"SketchId">();
export type SketchId = z.infer<typeof SketchIdSchema>;

export const createSketchId = (id?: string): SketchId => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return (id || crypto.randomUUID()) as unknown as SketchId;
};
