import React, { useMemo } from "react";
import { useStore } from "@storagemaxxing/store/useStore";
import { selectPackingResultsBySpace } from "@storagemaxxing/store/layoutSelectors";
import { BOMTable } from "./bom/BOMTable";
import { computeAggregateBom } from "@storagemaxxing/assembly/bom";
import { ALL_BINS, findBinById } from "@storagemaxxing/catalog/lookup";
import { binId } from "@storagemaxxing/catalog/bin";

const lookupBin = (id: string) => findBinById(ALL_BINS, binId(id));

export const BOMPanel: React.FC = () => {
  const spaces = useStore((state) => state.spaces);
  const templatesById = useStore((state) => state.templatesById);

  const aggregateBom = useMemo(() => {
    const packingResultsBySpace = selectPackingResultsBySpace({
      spaces,
      templatesById,
    });
    return computeAggregateBom(spaces, packingResultsBySpace, lookupBin);
  }, [spaces, templatesById]);

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
