import React from "react";

interface BOMSummaryProps {
  readonly totalPrice: number;
  readonly isApproximatePrice: boolean;
  readonly itemCount: number;
}

export const BOMSummary: React.FC<BOMSummaryProps> = ({
  totalPrice,
  isApproximatePrice,
  itemCount,
}) => {
  if (itemCount === 0) {
    return null;
  }

  return (
    <>
      <div className="mt-4 flex items-center justify-end border-t border-border-default bg-surface-sunken p-4">
        <span className="mr-4 font-bold">Total Estimated Cost:</span>
        <span className="text-lg font-bold">
          ${totalPrice.toFixed(2)} {isApproximatePrice ? "*" : ""}
        </span>
      </div>
      {isApproximatePrice && (
        <div className="mt-2 text-right text-sm text-text-secondary">
          * Contains items with approximate or missing prices (e.g., 3D
          printed).
        </div>
      )}
    </>
  );
};
