import React from "react";

export interface BOMSummaryProps {
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
          ${totalPrice.toFixed(2)} {isApproximatePrice ? "*" : ""}
        </span>
      </div>
      {isApproximatePrice && (
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
    </>
  );
};
