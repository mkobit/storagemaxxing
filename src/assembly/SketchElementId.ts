export type SketchElementId = string & { readonly __brand: "SketchElementId" };

export const createSketchElementId = (id?: string): SketchElementId => {
  return (id || crypto.randomUUID()) as SketchElementId;
};
