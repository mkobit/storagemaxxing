import React from "react";
import { BOM } from "@storagemaxxing/assembly/BaseTypes.js";
import { ALL_BINS } from "@storagemaxxing/catalog/lookup.js";
import { exportBOMToCSV } from "./exportCSV";

export interface BOMHeaderProps {
  readonly bom: BOM;
}

export const BOMHeader: React.FC<BOMHeaderProps> = ({ bom }) => {
  const handleDownload = () => {
    const csvContent = exportBOMToCSV(bom, ALL_BINS);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    // eslint-disable-next-line functional/immutable-data
    link.href = url;
    link.setAttribute("download", "storagemaxxing_bom.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1rem",
      }}
    >
      <h3>Bill of Materials</h3>
      <button
        onClick={handleDownload}
        disabled={bom.items.length === 0}
        style={{
          padding: "0.5rem 1rem",
          cursor: bom.items.length === 0 ? "not-allowed" : "pointer",
        }}
      >
        Download CSV
      </button>
    </div>
  );
};
