import React from "react";
import { BOMItem } from "@storagemaxxing/assembly/BaseTypes";
import { ALL_BINS, findBinById } from "@storagemaxxing/catalog/lookup";
import { binId } from "@storagemaxxing/catalog/bin";

interface BOMRowProps {
  readonly item: BOMItem;
}

interface RowData {
  readonly sku: string;
  readonly name: string;
  readonly price: number;
  readonly total: number;
  readonly kind: string;
  readonly isAccessory: boolean;
}

const resolveRowData = (item: BOMItem): RowData => {
  const spec = findBinById(ALL_BINS, binId(item.binId));
  if (!spec) {
    return {
      sku: item.binId,
      name: "Unknown Item",
      price: 0,
      total: 0,
      kind: "unknown",
      isAccessory: false,
    };
  }

  const price = spec.price ?? 0;
  return {
    sku: spec.sku,
    name: spec.name,
    price,
    total: price * item.quantity,
    kind: spec.kind,
    isAccessory: spec.kind === "accessory",
  };
};

export const BOMRow: React.FC<BOMRowProps> = ({ item }) => {
  const data = resolveRowData(item);

  return (
    <tr
      key={item.binId}
      className="border-b border-border-subtle"
      data-testid={`bom-row-${item.binId}`}
      data-item-kind={data.kind}
    >
      <td className="p-2">{data.sku}</td>
      <td className="p-2">
        <div className="flex items-center gap-2">
          <span>{data.name}</span>
          {data.isAccessory && (
            <span
              data-testid="accessory-badge"
              className="rounded-xs border border-border-default bg-surface-raised px-1.5 py-0.5 text-xs text-text-muted"
            >
              Accessory
            </span>
          )}
        </div>
      </td>
      <td className="p-2 text-right">{item.quantity}</td>
      <td className="p-2 text-right">${data.price.toFixed(2)}</td>
      <td className="p-2 text-right">${data.total.toFixed(2)}</td>
    </tr>
  );
};
