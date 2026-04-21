export type SketchElementId = string & { readonly __brand: "SketchElementId" };

export const createSketchElementId = (id?: string): SketchElementId => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return (id || crypto.randomUUID()) as unknown as SketchElementId;
};
