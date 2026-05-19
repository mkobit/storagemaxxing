import { Size, createSize } from "./Dimensions2D";
import { Millimeters, mm } from "./Millimeters";
import { GridDimensions, createGridDimensions } from "./GridDimensions";
import { Point2D, createPoint2D } from "./Point2D";

export const OPENGRID_PITCH_MM = 42;

/**
 * Modes for handling fractional cells at the boundaries.
 * - truncate: Only include full cells that fit entirely within the container.
 * - round: Include a cell if more than 50% of its pitch fits.
 * - expand: Include any cell that partially overlaps the container.
 * - center: Same as truncate, but calculates an offset to center the cells.
 */
export type GridCalculationMode = "truncate" | "round" | "expand" | "center";

export interface GridCalculationResult {
  readonly grid: GridDimensions;
  readonly usedArea: Size<Millimeters>;
  readonly wastedArea: Size<Millimeters>;
  readonly coverage: number;
  readonly offset: Point2D;
}

/**
 * Calculates a 2D grid of OpenGrid cells (42mm pitch) for a given container size.
 */
export const calculateOpenGrid = (
  container: Size<Millimeters>,
  mode: GridCalculationMode = "truncate"
): GridCalculationResult => {
  const { w, l } = container;

  const calculateCount = (dim: number): number => {
    const raw = dim / OPENGRID_PITCH_MM;
    switch (mode) {
      case "truncate":
      case "center":
        return Math.floor(raw);
      case "round":
        return Math.round(raw);
      case "expand":
        return Math.ceil(raw);
      default:
        return Math.floor(raw);
    }
  };

  const cols = calculateCount(w);
  const rows = calculateCount(l);

  const usedW = mm(cols * OPENGRID_PITCH_MM);
  const usedL = mm(rows * OPENGRID_PITCH_MM);

  const usedArea = createSize(usedW, usedL);
  const wastedArea = createSize(mm(Math.max(0, w - usedW)), mm(Math.max(0, l - usedL)));
  
  const containerArea = w * l;
  const coverage = containerArea > 0 ? (usedW * usedL) / containerArea : 0;

  const offsetW = mode === "center" ? (w - usedW) / 2 : 0;
  const offsetL = mode === "center" ? (l - usedL) / 2 : 0;
  const offset = createPoint2D(offsetW, offsetL);

  return {
    grid: createGridDimensions({ cols, rows }),
    usedArea,
    wastedArea,
    coverage,
    offset,
  };
};
