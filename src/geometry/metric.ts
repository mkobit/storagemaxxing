import { Inches, inches } from "./imperial";

export type Millimeters = number & { readonly _brand: "mm" };

/* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
export const mm = (value: number): Millimeters => value as Millimeters;

export const mmToIn = (m: Millimeters): Inches => inches(m / 25.4);
export const inToMm = (inch: Inches): Millimeters => mm(inch * 25.4);
