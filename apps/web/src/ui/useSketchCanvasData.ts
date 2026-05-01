import { useStore } from "@storagemaxxing/store/useStore.js";
import { ALL_BINS, findBinById } from "@storagemaxxing/catalog/lookup.js";
import { binId } from "@storagemaxxing/catalog/bin.js";

export const useSketchCanvasData = () => {
  const activeSketchId = useStore((state) => state.activeSketchId);
  const sketches = useStore((state) => state.sketches);
  const activeSketch = sketches.find((s) => s.id === activeSketchId) || null;

  const activeSpaceId = useStore((state) => state.activeSpaceId);
  const spaces = useStore((state) => state.spaces);
  const packingResultsBySpace = useStore((state) => state.packingResultsBySpace);

  const activeSpace = activeSpaceId ? spaces.find((s) => s.id === activeSpaceId) || null : null;
  const constraints = activeSpace ? Object.values(activeSpace.constraints) : [];
  const packingResult = activeSpaceId ? packingResultsBySpace[activeSpaceId] || null : null;

  const lookupBin = (id: string) => findBinById(ALL_BINS, binId(id));

  return {
    activeSketch,
    activeSpace,
    constraints,
    packingResult,
    lookupBin,
  };
};
