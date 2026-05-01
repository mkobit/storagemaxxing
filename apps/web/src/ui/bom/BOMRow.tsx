import React from "react";
import { BOMItem } from "@storagemaxxing/assembly/BaseTypes.js";
import { ALL_BINS, findBinById } from "@storagemaxxing/catalog/lookup.js";
import { binId } from "@storagemaxxing/catalog/bin.js";

export interface BOMRowProps {
  readonly item: BOMItem;
}

export const BOMRow: React.FC<BOMRowProps> = ({ item }) => {
  const spec = findBinById(ALL_BINS, binId(item.binId));
  const sku = spec?.sku || item.binId;
  const name = spec?.name || "Unknown Item";
  const price = spec?.price || 0;
  const total = price * item.quantity;

  return (
    <tr key={item.binId} style={{ borderBottom: "1px solid #eee" }}>
      <td style={{ padding: "0.5rem" }}>{sku}</td>
      <td style={{ padding: "0.5rem" }}>{name}</td>
      <td style={{ padding: "0.5rem", textAlign: "right" }}>{item.quantity}</td>
      <td style={{ padding: "0.5rem", textAlign: "right" }}>
        ${price.toFixed(2)}
      </td>
      <td style={{ padding: "0.5rem", textAlign: "right" }}>
        ${total.toFixed(2)}
      </td>
    </tr>
  );
};
