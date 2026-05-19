import React from "react";
import { useStore } from "@storagemaxxing/store/useStore";
import { calculateOpenGrid } from "@storagemaxxing/geometry/OpenGrid";
import { GridVisualizer } from "./canvas/GridVisualizer";
import { mm } from "@storagemaxxing/geometry/Millimeters";
import { createSize } from "@storagemaxxing/geometry/Dimensions2D";

export const SpatialModelingPanel: React.FC = () => {
  const spatialInputs = useStore((state) => state.spatialInputs);
  const printerBedSize = useStore((state) => state.printerBedSize);
  const calculationMode = useStore((state) => state.calculationMode);
  const setSpatialInputs = useStore((state) => state.setSpatialInputs);
  const setPrinterBedSize = useStore((state) => state.setPrinterBedSize);
  const setCalculationMode = useStore((state) => state.setCalculationMode);

  const calculation = calculateOpenGrid(spatialInputs, calculationMode);

  return (
    <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem", height: "100%", overflowY: "auto" }}>
      <h2>Spatial Modeling</h2>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <h3>Container Size (mm)</h3>
          <label>
            Width: 
            <input 
              type="number" 
              value={spatialInputs.w} 
              onChange={(e) => setSpatialInputs(createSize(mm(Number(e.target.value)), spatialInputs.l))}
            />
          </label>
          <br />
          <label>
            Length: 
            <input 
              type="number" 
              value={spatialInputs.l} 
              onChange={(e) => setSpatialInputs(createSize(spatialInputs.w, mm(Number(e.target.value))))}
            />
          </label>
        </div>

        <div>
          <h3>Printer Bed (mm)</h3>
          <label>
            Width: 
            <input 
              type="number" 
              value={printerBedSize.w} 
              onChange={(e) => setPrinterBedSize(createSize(mm(Number(e.target.value)), printerBedSize.l))}
            />
          </label>
          <br />
          <label>
            Length: 
            <input 
              type="number" 
              value={printerBedSize.l} 
              onChange={(e) => setPrinterBedSize(createSize(printerBedSize.w, mm(Number(e.target.value))))}
            />
          </label>
        </div>
      </div>

      <div>
        <h3>Calculation Mode</h3>
        <select value={calculationMode} onChange={(e) => setCalculationMode(e.target.value as any)}>
          <option value="truncate">Truncate</option>
          <option value="round">Round</option>
          <option value="expand">Expand</option>
          <option value="center">Center</option>
        </select>
      </div>

      <div style={{ border: "1px solid #ddd", padding: "1rem", background: "#f9f9f9" }}>
        <h3>Results</h3>
        <p>Grid: {calculation.grid.cols} x {calculation.grid.rows} cells</p>
        <p>Coverage: {(calculation.coverage * 100).toFixed(2)}%</p>
        <p>Wasted: {calculation.wastedArea.w}mm x {calculation.wastedArea.l}mm</p>
      </div>

      <div style={{ flex: 1, minHeight: "400px" }}>
        <GridVisualizer 
          containerSize={spatialInputs}
          calculation={calculation}
          printerBedSize={printerBedSize}
        />
      </div>
    </div>
  );
};
