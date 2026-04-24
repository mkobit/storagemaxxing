const parseFractionInternal = (input: string): number | null => {
  const match = input.match(/^(\d+)\/(\d+)$/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  const den = parseInt(match[2], 10);
  return den !== 0 ? num / den : null;
};

const parseMixedNumberInternal = (input: string): number | null => {
  const match = input.match(/^(\d+)[ -]+(\d+)\/(\d+)$/);
  if (!match) return null;
  const whole = parseInt(match[1], 10);
  const num = parseInt(match[2], 10);
  const den = parseInt(match[3], 10);
  return den !== 0 ? whole + num / den : null;
};

export const parseFraction = (input: string): number | null => {
  const trimmed = input.trim();
  if (trimmed === "") return null;

  const asNumber = Number(trimmed);
  if (!isNaN(asNumber)) {
    return asNumber;
  }

  const isNegative = trimmed.startsWith("-");
  const absoluteInput = isNegative ? trimmed.substring(1).trim() : trimmed;

  const fractionValue = parseFractionInternal(absoluteInput);
  if (fractionValue !== null) {
    return isNegative ? -fractionValue : fractionValue;
  }

  const mixedValue = parseMixedNumberInternal(absoluteInput);
  if (mixedValue !== null) {
    return isNegative ? -mixedValue : mixedValue;
  }

  return null;
};

const FRACTION_MAP: Record<string, string> = {
  "1/2": "½",
  "1/4": "¼",
  "3/4": "¾",
  "1/8": "⅛",
  "3/8": "⅜",
  "5/8": "⅝",
  "7/8": "⅞",
};

const DENOMINATORS = [2, 4, 8, 16, 32];

const getMatchingDenominator = (fractionPart: number): number | undefined =>
  DENOMINATORS.find(
    (den) =>
      Math.abs(Math.round(fractionPart * den) / den - fractionPart) < 0.001,
  );

const formatFractionalPart = (
  num: number,
  matchingDenom: number,
  wholePart: number,
  isNegative: boolean,
): string | null => {
  if (num === 0) return isNegative ? `-${wholePart}` : `${wholePart}`;
  if (num === matchingDenom)
    return isNegative ? `-${wholePart + 1}` : `${wholePart + 1}`;

  const fractionStr = `${num}/${matchingDenom}`;
  const displayFrac = FRACTION_MAP[fractionStr] || fractionStr;

  const prefix = isNegative ? "-" : "";

  return wholePart === 0
    ? `${prefix}${displayFrac}`
    : `${prefix}${wholePart} ${displayFrac}`;
};

export const formatFraction = (value: number): string => {
  const isNegative = value < 0;
  const absValue = Math.abs(value);
  const wholePart = Math.floor(absValue);
  const fractionPart = absValue - wholePart;

  if (fractionPart === 0) {
    return isNegative ? `-${wholePart}` : `${wholePart}`;
  }

  const matchingDenom = getMatchingDenominator(fractionPart);

  if (matchingDenom !== undefined) {
    const num = Math.round(fractionPart * matchingDenom);
    const formatted = formatFractionalPart(
      num,
      matchingDenom,
      wholePart,
      isNegative,
    );
    if (formatted !== null) return formatted;
  }

  return `${value}`;
};
