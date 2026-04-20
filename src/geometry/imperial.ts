import { z } from "zod";

export const InchesSchema = z.number().brand("inches");
export type Inches = z.infer<typeof InchesSchema>;

export const inches = (value: number): Inches => InchesSchema.parse(value);

export const parseDim = (input: string): Inches | null => {
  const trimmed = input.trim();
  if (trimmed === "") return null;

  const asNumber = Number(trimmed);
  if (!isNaN(asNumber)) {
    return inches(asNumber);
  }

  const isNegative = trimmed.startsWith("-");
  const absoluteInput = isNegative ? trimmed.substring(1).trim() : trimmed;

  const fractionMatch = absoluteInput.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1], 10);
    const den = parseInt(fractionMatch[2], 10);
    if (den !== 0) {
      const val = num / den;
      return inches(isNegative ? -val : val);
    }
  }

  const mixedMatch = absoluteInput.match(/^(\d+)[ -]+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const wholePart = parseInt(mixedMatch[1], 10);
    const num = parseInt(mixedMatch[2], 10);
    const den = parseInt(mixedMatch[3], 10);
    if (den !== 0) {
      const val = wholePart + num / den;
      return inches(isNegative ? -val : val);
    }
  }

  return null;
};

export const formatDim = (value: Inches): string => {
  const wholePart = Math.floor(value);
  const fractionPart = value - wholePart;

  if (fractionPart === 0) {
    return `${wholePart}″`;
  }

  const fractionMap: Record<string, string> = {
    "1/2": "½", "1/4": "¼", "3/4": "¾",
    "1/8": "⅛", "3/8": "⅜", "5/8": "⅝", "7/8": "⅞"
  };

  const denominators = [2, 4, 8, 16, 32];

  const foundFraction = denominators.map(den => {
    const num = Math.round(fractionPart * den);
    if (Math.abs(num / den - fractionPart) < 0.001) {
      if (num === 0) return `${wholePart}″`;
      if (num === den) return `${wholePart + 1}″`;

      const fractionStr = `${num}/${den}`;
      const displayFrac = fractionMap[fractionStr] || fractionStr;

      return wholePart === 0 ? `${displayFrac}″` : `${wholePart} ${displayFrac}″`;
    }
    return null;
  }).find(res => res !== null);

  return foundFraction ?? `${value}″`;
};
