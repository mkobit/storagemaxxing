import React from "react";
import { BOM } from "@storagemaxxing/assembly/BaseTypes.js";
import { BOMHeader } from "./BOMHeader";
import { BOMRow } from "./BOMRow";
import { BOMSummary } from "./BOMSummary";

export interface BOMTableProps {
  readonly bom: BOM;
}

export const BOMTable: React.FC<BOMTableProps> = ({ bom }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <BOMHeader bom={bom} />

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
            {bom.items.map((item) => (
              <BOMRow key={item.binId} item={item} />
            ))}
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

      <BOMSummary
        totalPrice={bom.totalPrice}
        isApproximatePrice={bom.isApproximatePrice}
        itemCount={bom.items.length}
      />
    </div>
  );
};
