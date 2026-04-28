export type GridDimensions = {
  readonly cols: number;
  readonly rows: number;
  readonly depth?: number;
};

export interface GridCoord {
  readonly col: number;
  readonly row: number;
}

export const createGridDimensions = ({
  cols,
  rows,
  depth,
}: {
  readonly cols: number;
  readonly rows: number;
  readonly depth?: number;
}): GridDimensions => ({
  cols,
  rows,
  ...(depth !== undefined ? { depth } : {}),
});
