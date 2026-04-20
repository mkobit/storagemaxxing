export type SketchId = string & { readonly __brand: 'SketchId' }

export const createSketchId = (id?: string): SketchId => {
  return (id || crypto.randomUUID()) as SketchId
}
