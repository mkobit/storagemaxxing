import { Inches } from "./types";

const EIGHTHS_MAP: Record<string, number> = {
  "1/8": 0.125,
  "1/4": 0.25,
  "3/8": 0.375,
  "1/2": 0.5,
  "5/8": 0.625,
  "3/4": 0.75,
  "7/8": 0.875,
};

const DECIMAL_TO_FRACTION: Record<number, string> = {
  0.125: "⅛",
  0.25: "¼",
  0.375: "⅜",
  0.5: "½",
  0.625: "⅝",
  0.75: "¾",
  0.875: "⅞",
};

// parseDim("15 3/4") → 15.75 as Inches
// parseDim("16-1/8") → 16.125 as Inches
// parseDim("24") → 24 as Inches
// parseDim("3/4") → 0.75 as Inches
// parseDim("15.75") -> 15.75 as Inches
export const parseDim = (input: string): Inches | null => {
  const trimmed = input.trim();
  if (trimmed === "") return null;

  // Check if it's purely a decimal number or integer
  const asNumber = Number(trimmed);
  if (!isNaN(asNumber)) {
    return asNumber as Inches;
  }

  // Handle fractions like "3/4"
  if (EIGHTHS_MAP[trimmed]) {
    return EIGHTHS_MAP[trimmed] as Inches;
  }

  // Handle mixed format: "15 3/4" or "15-3/4"
  const match = trimmed.match(/^(\d+)[ \-]+(\d\/\d)$/);
  if (match) {
    const wholePart = parseInt(match[1], 10);
    const fractionPart = match[2];
    if (EIGHTHS_MAP[fractionPart] !== undefined) {
      return (wholePart + EIGHTHS_MAP[fractionPart]) as Inches;
    }
  }

  return null;
};

// formatDim(15.75) → "15 ¾″"
// formatDim(16.0) → "16″"
export const formatDim = (value: Inches): string => {
  const wholePart = Math.floor(value);
  const fractionPart = value - wholePart;

  if (fractionPart === 0) {
    return `${wholePart}″`;
  }

  // Find closest eighth if applicable, though for this we strictly match
  const fractionStr = DECIMAL_TO_FRACTION[fractionPart];
  if (fractionStr) {
    return wholePart === 0 ? `${fractionStr}″` : `${wholePart} ${fractionStr}″`;
  }

  return `${value}″`;
};
