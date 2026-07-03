import React from "react";
import { BOMItem } from "@storagemaxxing/assembly/BaseTypes";
import { ALL_BINS, findBinById } from "@storagemaxxing/catalog/lookup";
import { binId } from "@storagemaxxing/catalog/bin";

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
    <tr key={item.binId} className="border-b border-border-subtle">
      <td className="p-2">{sku}</td>
      <td className="p-2">{name}</td>
      <td className="p-2 text-right">{item.quantity}</td>
      <td className="p-2 text-right">${price.toFixed(2)}</td>
      <td className="p-2 text-right">${total.toFixed(2)}</td>
    </tr>
  );
};
