export type Millimeters = number & { readonly __brand: 'Millimeters' }

export const createMillimeters = (value: number): Millimeters => value as Millimeters
