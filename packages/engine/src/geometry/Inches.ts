export type Inches = number & { readonly __brand: "Inches" };

export const createInches = (value: number): Inches => value as Inches;
