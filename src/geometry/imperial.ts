// Core value types — branded to prevent unit confusion
export type Inches = number & { readonly _brand: "inches" };

export const inches = (value: number): Inches => value as Inches;

// parseDim("15 3/4") → 15.75 as Inches
// parseDim("16-1/8") → 16.125 as Inches
// parseDim("24") → 24 as Inches
// parseDim("3/4") → 0.75 as Inches
// parseDim("15.75") -> 15.75 as Inches
export const parseDim = (input: string): Inches | null => {
  const trimmed = input.trim();
  if (trimmed === "") return null;

  const asNumber = Number(trimmed);
  if (!isNaN(asNumber)) {
    return inches(asNumber);
  }

  // Handle purely fractions "3/4", "7/16", "1/32"
  const fractionMatch = trimmed.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1], 10);
    const den = parseInt(fractionMatch[2], 10);
    if (den !== 0) return inches(num / den);
  }

  // Handle mixed format: "15 3/4" or "15-3/4"
  const mixedMatch = trimmed.match(/^(\d+)[ -]+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const wholePart = parseInt(mixedMatch[1], 10);
    const num = parseInt(mixedMatch[2], 10);
    const den = parseInt(mixedMatch[3], 10);
    if (den !== 0) return inches(wholePart + num / den);
  }

  return null;
};

// Fractions mapping for formatting up to 32nds
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
