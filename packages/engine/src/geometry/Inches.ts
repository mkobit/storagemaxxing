import { z } from 'zod';

export const InchesSchema = z.number().nonnegative().brand('inches');
export type Inches = z.infer<typeof InchesSchema>;

export const inches = (value: number): Inches => InchesSchema.parse(value);
export const createInches = inches;

export const parseDim = (input: string): Inches | null => {
  const trimmed = input.trim();
  if (trimmed === '') return null;

  const asNumber = Number(trimmed);
  if (!isNaN(asNumber) && asNumber >= 0) {
    return inches(asNumber);
  }

  const fractionMatch = trimmed.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1], 10);
    const den = parseInt(fractionMatch[2], 10);
    if (den !== 0) return inches(num / den);
  }

  const mixedMatch = trimmed.match(/^(\d+)[ -]+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const wholePart = parseInt(mixedMatch[1], 10);
    const num = parseInt(mixedMatch[2], 10);
    const den = parseInt(mixedMatch[3], 10);
    if (den !== 0) return inches(wholePart + num / den);
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
    '1/2': '½',
    '1/4': '¼',
    '3/4': '¾',
    '1/8': '⅛',
    '3/8': '⅜',
    '5/8': '⅝',
    '7/8': '⅞',
  };

  const denominators = [2, 4, 8, 16, 32];

  const matchingDenom = denominators.find(
    (den) => Math.abs(Math.round(fractionPart * den) / den - fractionPart) < 0.001,
  );

  if (matchingDenom !== undefined) {
    const num = Math.round(fractionPart * matchingDenom);
    if (num === 0) return `${wholePart}″`;
    if (num === matchingDenom) return `${wholePart + 1}″`;

    const fractionStr = `${num}/${matchingDenom}`;
    const displayFrac = fractionMap[fractionStr] || fractionStr;

    return wholePart === 0 ? `${displayFrac}″` : `${wholePart} ${displayFrac}″`;
  }

  return `${value}″`;
};
