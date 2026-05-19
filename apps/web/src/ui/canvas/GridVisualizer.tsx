import React from "react";
import { GridCalculationResult, OPENGRID_PITCH_MM } from "@storagemaxxing/geometry/OpenGrid";
import { Size } from "@storagemaxxing/geometry/Dimensions2D";
import { Millimeters } from "@storagemaxxing/geometry/Millimeters";

interface GridVisualizerProps {
  containerSize: Size<Millimeters>;
  calculation: GridCalculationResult;
  printerBedSize?: Size<Millimeters>;
}

export const GridVisualizer: React.FC<GridVisualizerProps> = ({
  containerSize,
  calculation,
  printerBedSize,
}) => {
  const { grid, offset } = calculation;
  const padding = 20;
  
  const viewBoxW = containerSize.w + padding * 2;
  const viewBoxL = containerSize.l + padding * 2;

  return (
    <svg
      viewBox={`-${padding} -${padding} ${viewBoxW} ${viewBoxL}`}
      style={{ width: "100%", height: "auto", border: "1px solid #ccc" }}
    >
      {/* Container Boundary */}
      <rect
        x={0}
        y={0}
        width={containerSize.w}
        height={containerSize.l}
        fill="none"
        stroke="#666"
        strokeWidth={1}
        strokeDasharray="4 2"
      />

      {/* Grid Cells */}
      <g transform={`translate(${offset[0]}, ${offset[1]})`}>
        {Array.from({ length: grid.rows }).map((_, row) =>
          Array.from({ length: grid.cols }).map((_, col) => (
            <rect
              key={`${row}-${col}`}
              x={col * OPENGRID_PITCH_MM}
              y={row * OPENGRID_PITCH_MM}
              width={OPENGRID_PITCH_MM}
              height={OPENGRID_PITCH_MM}
              fill="#e0e0e0"
              stroke="#999"
              strokeWidth={0.5}
            />
          ))
        )}
      </g>

      {/* Printer Bed Constraint (if provided) */}
      {printerBedSize && (
        <rect
          x={0}
          y={0}
          width={printerBedSize.w}
          height={printerBedSize.l}
          fill="none"
          stroke="red"
          strokeWidth={2}
          opacity={0.3}
          pointerEvents="none"
        />
      )}
    </svg>
  );
};
