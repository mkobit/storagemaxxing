import React, { useMemo } from "react";
import { useStore } from "@storagemaxxing/store/useStore";
import { selectPackingResultsBySpace } from "@storagemaxxing/store/layoutSelectors";
import { BOMTable } from "./bom/BOMTable";
import { computeAggregateBom } from "@storagemaxxing/assembly/bom";
import { PackingResult } from "@storagemaxxing/assembly/PackingResult";
import { ALL_BINS, findBinById } from "@storagemaxxing/catalog/lookup";
import { binId } from "@storagemaxxing/catalog/bin";

const lookupBin = (id: string) => findBinById(ALL_BINS, binId(id));

export const BOMPanel: React.FC = () => {
  const spaces = useStore((state) => state.spaces);
  const templatesById = useStore((state) => state.templatesById);

  const aggregateBom = useMemo(() => {
    const resolutionsBySpace = selectPackingResultsBySpace({
      spaces,
      templatesById,
    });
    const packingResultsBySpace = Object.entries(resolutionsBySpace).reduce<
      Readonly<Record<string, PackingResult>>
    >(
      (acc, [spaceId, resolution]) =>
        resolution.kind === "resolved"
          ? { ...acc, [spaceId]: resolution.result }
          : acc,
      {},
    );
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
