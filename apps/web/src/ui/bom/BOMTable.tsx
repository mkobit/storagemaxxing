import React from "react";
import { BOM } from "@storagemaxxing/assembly/BaseTypes";
import { BOMHeader } from "./BOMHeader";
import { BOMRow } from "./BOMRow";
import { BOMSummary } from "./BOMSummary";

interface BOMTableProps {
  readonly bom: BOM;
}

export const BOMTable: React.FC<BOMTableProps> = ({ bom }) => {
  return (
    <div className="flex h-full flex-col text-text-primary">
      <BOMHeader bom={bom} />

      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 bg-surface-sunken">
            <tr>
              <th className="border-b border-border-default p-2">SKU</th>
              <th className="border-b border-border-default p-2">Name</th>
              <th className="border-b border-border-default p-2 text-right">
                Quantity
              </th>
              <th className="border-b border-border-default p-2 text-right">
                Unit Price
              </th>
              <th className="border-b border-border-default p-2 text-right">
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
                <td colSpan={5} className="p-4 text-center text-text-muted">
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
