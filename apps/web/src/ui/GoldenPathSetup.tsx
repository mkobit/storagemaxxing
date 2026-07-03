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

  const loadLayout = (
    templateId: string,
    spaceSize: number,
    spaceId: string,
    spaceName: string,
  ) => {
    const template = createSpaceTemplate(
      templateId,
      createDimensions3D(spaceSize, spaceSize, 2),
      "top",
    );
    const constraints = GOLDEN_PATH_STARTER_BIN_IDS.map((id, i) => ({
      ...createSpaceConstraint(id, 1, 0, 1),
      color: STARTER_COLORS[i % STARTER_COLORS.length],
    }));
    const space = SpaceInstanceSchema.parse({
      id: spaceId,
      templateId: template.id,
      name: spaceName,
      count: 1,
      constraints: Object.fromEntries(constraints.map((c) => [c.binId, c])),
    });
    addTemplate(template);
    addSpace(space);
    setActiveSpace(space.id);
  };

  const loadStarterLayout = () =>
    loadLayout(
      "golden-path-space",
      12,
      "golden-path-instance",
      "Starter drawer",
    );

  const loadTinyStarterLayout = () =>
    loadLayout(
      "golden-path-tiny-space",
      2,
      "golden-path-tiny-instance",
      "Tiny drawer",
    );

  const loadPartialStarterLayout = () => {
    const template = createSpaceTemplate(
      "golden-path-partial-space",
      createDimensions3D(2, 2, 2),
      "top",
    );
    const constraints = GOLDEN_PATH_STARTER_BIN_IDS.map((id, i) => {
      if (i === 0) {
        return {
          ...createSpaceConstraint(id, 1, 6),
          color: STARTER_COLORS[i % STARTER_COLORS.length],
        };
      }
      return {
        ...createSpaceConstraint(id, 0, 0),
        color: STARTER_COLORS[i % STARTER_COLORS.length],
      };
    });
    const space = SpaceInstanceSchema.parse({
      id: "golden-path-partial-instance",
      templateId: template.id,
      name: "Partial drawer",
      count: 1,
      constraints: Object.fromEntries(constraints.map((c) => [c.binId, c])),
    });
    addTemplate(template);
    addSpace(space);
    setActiveSpace(space.id);
  };

  const loadUnresolvedStarterLayout = () => {
    const template = createSpaceTemplate(
      "golden-path-unresolved-space",
      createDimensions3D(6, 6, 2),
      "top",
    );
    const constraints = [
      {
        ...createSpaceConstraint("gridfinity-unknown-bin-id", 1, 0, 1),
        color: STARTER_COLORS[0],
      },
    ];
    const space = SpaceInstanceSchema.parse({
      id: "golden-path-unresolved-instance",
      templateId: template.id,
      name: "Unresolved drawer",
      count: 1,
      constraints: Object.fromEntries(constraints.map((c) => [c.binId, c])),
    });
    addTemplate(template);
    addSpace(space);
    setActiveSpace(space.id);
  };

  const transition =
    "transition-colors duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)]";
  const button = `rounded-sm border border-border-default bg-surface-raised px-3 py-1 hover:bg-surface-hover ${transition}`;

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="system-select" className="text-sm">
        System
      </label>
      <select
        id="system-select"
        data-testid="system-select"
        className="rounded-sm border border-border-default bg-surface-raised px-2 py-1"
        value={system}
        onChange={(e) =>
          setSystem(e.target.value === "gridfinity" ? "gridfinity" : system)
        }
      >
        <option value="gridfinity">Gridfinity</option>
      </select>
      <button
        className={button}
        onClick={loadStarterLayout}
        data-testid="add-starter-bins"
      >
        Add starter bins
      </button>
      <button
        className={button}
        onClick={loadTinyStarterLayout}
        data-testid="add-tiny-starter-bins"
      >
        Add starter bins (tiny space)
      </button>
      <button
        className={button}
        onClick={loadPartialStarterLayout}
        data-testid="add-partial-starter-bins"
      >
        Add starter bins (partial space)
      </button>
      <button
        className={button}
        onClick={loadUnresolvedStarterLayout}
        data-testid="add-unresolved-starter-bins"
      >
        Add starter bins (unresolved bin)
      </button>
    </div>
  );
};
