import React from "react";
import { useStore } from "@storagemaxxing/store/useStore";
import { BOMTable } from "./bom/BOMTable";
import { computeAggregateBom } from "@storagemaxxing/assembly/bom";
import { ALL_BINS, findBinById } from "@storagemaxxing/catalog/lookup";
import { binId } from "@storagemaxxing/catalog/bin";

export const BOMPanel: React.FC = () => {
  const spaces = useStore((state) => state.spaces);
  const packingResultsBySpace = useStore(
    (state) => state.packingResultsBySpace,
  );

  const lookupBin = (id: string) => findBinById(ALL_BINS, binId(id));
  const aggregateBom = computeAggregateBom(
    spaces,
    packingResultsBySpace,
    lookupBin,
  );

  return (
    <div
      style={{
        padding: "1rem",
        height: "100%",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <BOMTable bom={aggregateBom} />
    </div>
  );
};
