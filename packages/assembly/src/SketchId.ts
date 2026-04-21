export type SketchId = string & { readonly __brand: "SketchId" };

export const createSketchId = (id?: string): SketchId => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return (id || crypto.randomUUID()) as unknown as SketchId;
};
