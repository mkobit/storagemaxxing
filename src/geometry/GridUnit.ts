export type GridUnit = number & { readonly __brand: 'GridUnit' };

export const createGridUnit = (value: number): GridUnit => value as GridUnit;
