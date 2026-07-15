export const BIN_COLOR_PALETTE = [
  "#4e79a7",
  "#f28e2b",
  "#59a14f",
  "#e15759",
  "#b07aa1",
  "#76b7b2",
] as const;

export const binColorForIndex = (index: number): string =>
  BIN_COLOR_PALETTE[index % BIN_COLOR_PALETTE.length];
