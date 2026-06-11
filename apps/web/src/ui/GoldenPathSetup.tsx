import React, { useState } from "react";
import { useStore } from "@storagemaxxing/store/useStore";
import {
  GOLDEN_PATH_SYSTEM,
  GOLDEN_PATH_STARTER_BIN_IDS,
} from "@storagemaxxing/catalog/goldenPath";
import { StorageSystem } from "@storagemaxxing/catalog/StorageSystem";
import { createSpaceTemplate } from "@storagemaxxing/assembly/SpaceTemplate";
import { createSpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import { SpaceInstanceSchema } from "@storagemaxxing/assembly/SpaceInstance";
import { createDimensions3D } from "@storagemaxxing/geometry/Dimensions3D";

const STARTER_COLORS = [
  "#4e79a7",
  "#f28e2b",
  "#59a14f",
  "#e15759",
  "#b07aa1",
  "#76b7b2",
] as const;

export const GoldenPathSetup: React.FC = () => {
  const [system, setSystem] = useState<StorageSystem>(GOLDEN_PATH_SYSTEM);
  const addTemplate = useStore((state) => state.addTemplate);
  const addSpace = useStore((state) => state.addSpace);
  const setActiveSpace = useStore((state) => state.setActiveSpace);

  const loadStarterLayout = () => {
    const template = createSpaceTemplate(
      "golden-path-space",
      createDimensions3D(12, 12, 2),
      "top",
    );
    const constraints = GOLDEN_PATH_STARTER_BIN_IDS.map((id, i) => ({
      ...createSpaceConstraint(id, 1, 0, 1),
      color: STARTER_COLORS[i % STARTER_COLORS.length],
    }));
    const space = SpaceInstanceSchema.parse({
      id: "golden-path-instance",
      templateId: template.id,
      name: "Starter drawer",
      count: 1,
      constraints: Object.fromEntries(constraints.map((c) => [c.binId, c])),
    });
    addTemplate(template);
    addSpace(space);
    setActiveSpace(space.id);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="system-select" className="text-sm">
        System
      </label>
      <select
        id="system-select"
        data-testid="system-select"
        className="px-2 py-1 rounded border border-gray-300 bg-white"
        value={system}
        onChange={(e) =>
          setSystem(e.target.value === "gridfinity" ? "gridfinity" : system)
        }
      >
        <option value="gridfinity">Gridfinity</option>
      </select>
      <button
        className="px-3 py-1 rounded bg-white border border-gray-300 hover:bg-gray-50"
        onClick={loadStarterLayout}
        data-testid="add-starter-bins"
      >
        Add starter bins
      </button>
    </div>
  );
};
