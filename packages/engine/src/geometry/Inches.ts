import { z } from 'zod';

export const InchesSchema = z.number().brand('inches');
export type Inches = z.infer<typeof InchesSchema>;

export const inches = (value: number): Inches => InchesSchema.parse(value);
export const createInches = inches;

const parseFraction = (input: string): number | null => {
  const match = input.match(/^(\d+)\/(\d+)$/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  const den = parseInt(match[2], 10);
  return den !== 0 ? num / den : null;
};

const parseMixedNumber = (input: string): number | null => {
  const match = input.match(/^(\d+)[ -]+(\d+)\/(\d+)$/);
  if (!match) return null;
  const whole = parseInt(match[1], 10);
  const num = parseInt(match[2], 10);
  const den = parseInt(match[3], 10);
  return den !== 0 ? whole + num / den : null;
};

export const parseDim = (input: string): Inches | null => {
  const trimmed = input.trim();
  if (trimmed === '') return null;

  const asNumber = Number(trimmed);
  if (!isNaN(asNumber)) {
    return inches(asNumber);
  }

  const isNegative = trimmed.startsWith('-');
  const absoluteInput = isNegative ? trimmed.substring(1).trim() : trimmed;

  const fractionValue = parseFraction(absoluteInput);
  if (fractionValue !== null) {
    return inches(isNegative ? -fractionValue : fractionValue);
  }

  const mixedValue = parseMixedNumber(absoluteInput);
  if (mixedValue !== null) {
    return inches(isNegative ? -mixedValue : mixedValue);
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
