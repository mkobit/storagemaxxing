import { useMemo } from "react";
import { useStore } from "@storagemaxxing/store/useStore";
import { selectPackedLayout } from "@storagemaxxing/store/layoutSelectors";
import { ALL_BINS, findBinById } from "@storagemaxxing/catalog/lookup";
import { binId } from "@storagemaxxing/catalog/bin";

export const useSketchCanvasData = () => {
  const activeSketchId = useStore((state) => state.activeSketchId);
  const sketches = useStore((state) => state.sketches);
  const activeSketch = sketches.find((s) => s.id === activeSketchId) || null;

  const activeSpaceId = useStore((state) => state.activeSpaceId);
  const spaces = useStore((state) => state.spaces);
  const templatesById = useStore((state) => state.templatesById);

  const activeSpace = activeSpaceId
    ? spaces.find((s) => s.id === activeSpaceId) || null
    : null;
  const activeTemplate = activeSpace
    ? templatesById[activeSpace.templateId] || null
    : null;
  const constraints = activeSpace ? Object.values(activeSpace.constraints) : [];

  const packingResult = useMemo(
    () => selectPackedLayout({ spaces, activeSpaceId, templatesById }),
    [spaces, activeSpaceId, templatesById],
  );

  const lookupBin = (id: string) => findBinById(ALL_BINS, binId(id));

  return {
    activeSketch,
    activeSpace,
    activeTemplate,
    constraints,
    packingResult,
    lookupBin,
  };
};
