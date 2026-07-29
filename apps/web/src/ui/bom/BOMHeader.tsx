import React from "react";
import { BOM } from "@storagemaxxing/assembly/BaseTypes";
import { ALL_BINS } from "@storagemaxxing/catalog/lookup";
import { exportBOMToCSV } from "./exportCSV";

interface BOMHeaderProps {
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
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-text-primary">Bill of Materials</h3>
      <button
        onClick={handleDownload}
        disabled={bom.items.length === 0}
        className="cursor-pointer px-4 py-2 disabled:cursor-not-allowed"
      >
        Download CSV
      </button>
    </div>
  );
};
