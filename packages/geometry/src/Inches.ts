import { z } from "zod";
import { parseFraction, formatFraction } from "./Fraction.js";

export const InchesSchema = z.number().brand("inches");
export type Inches = z.infer<typeof InchesSchema>;

export const inches = (value: number): Inches => InchesSchema.parse(value);
export const createInches = inches;

export const parseDim = (input: string): Inches | null => {
  const value = parseFraction(input);
  if (value !== null) {
    return inches(value);
  }

  return null;
};

export const formatDim = (value: Inches): string => {
  return `${formatFraction(value)}″`;
};
