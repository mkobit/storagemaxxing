import React from "react";
import { BOM } from "@storagemaxxing/assembly/BaseTypes.js";
import { ALL_BINS, findBinById } from "@storagemaxxing/catalog/lookup.js";
import { binId } from "@storagemaxxing/catalog/bin.js";
import { exportBOMToCSV } from "./exportCSV.js";

export interface BOMTableProps {
  readonly bom: BOM;
}

export const BOMTable: React.FC<BOMTableProps> = ({ bom }) => {
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
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
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

      <div style={{ overflowY: "auto", flex: 1 }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
          }}
        >
          <thead style={{ position: "sticky", top: 0, background: "#eee" }}>
            <tr>
              <th style={{ padding: "0.5rem", borderBottom: "1px solid #ccc" }}>
                SKU
              </th>
              <th style={{ padding: "0.5rem", borderBottom: "1px solid #ccc" }}>
                Name
              </th>
              <th
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid #ccc",
                  textAlign: "right",
                }}
              >
                Quantity
              </th>
              <th
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid #ccc",
                  textAlign: "right",
                }}
              >
                Unit Price
              </th>
              <th
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid #ccc",
                  textAlign: "right",
                }}
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {bom.items.map((item) => {
              const spec = findBinById(ALL_BINS, binId(item.binId));
              const sku = spec?.sku || item.binId;
              const name = spec?.name || "Unknown Item";
              const price = spec?.price || 0;
              const total = price * item.quantity;
              return (
                <tr key={item.binId} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "0.5rem" }}>{sku}</td>
                  <td style={{ padding: "0.5rem" }}>{name}</td>
                  <td style={{ padding: "0.5rem", textAlign: "right" }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: "0.5rem", textAlign: "right" }}>
                    ${price.toFixed(2)}
                  </td>
                  <td style={{ padding: "0.5rem", textAlign: "right" }}>
                    ${total.toFixed(2)}
                  </td>
                </tr>
              );
            })}
            {bom.items.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: "1rem",
                    textAlign: "center",
                    color: "#888",
                  }}
                >
                  No items in BOM. Add and pack spaces to see materials.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {bom.items.length > 0 && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            background: "#f9f9f9",
            borderTop: "1px solid #ccc",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <span style={{ fontWeight: "bold", marginRight: "1rem" }}>
            Total Estimated Cost:
          </span>
          <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
            ${bom.totalPrice.toFixed(2)} {bom.isApproximatePrice ? "*" : ""}
          </span>
        </div>
      )}
      {bom.isApproximatePrice && (
        <div
          style={{
            fontSize: "0.8rem",
            color: "#666",
            textAlign: "right",
            marginTop: "0.5rem",
          }}
        >
          * Contains items with approximate or missing prices (e.g., 3D
          printed).
        </div>
      )}
    </div>
  );
};
