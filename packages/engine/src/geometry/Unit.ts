export type Unit = number & { readonly __brand?: never }; // base generic brand signature

export type MeasurementUnit = 'mm' | 'inch' | 'grid';
