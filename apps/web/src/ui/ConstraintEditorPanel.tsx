import React, { useState } from "react";
import { useStore } from "@storagemaxxing/store/useStore";
import { ConstraintRow } from "./constraints/ConstraintRow";
import { ALL_BINS, findBinById } from "@storagemaxxing/catalog/lookup";
import { binId } from "@storagemaxxing/catalog/bin";
import { BinSpecIdSchema } from "@storagemaxxing/assembly/BaseTypes";
import {
  SpaceConstraint,
  createSpaceConstraint,
} from "@storagemaxxing/assembly/SpaceConstraint";
import { binColorForIndex } from "./binColorPalette";
import { isBinInstallationAllowed } from "@storagemaxxing/store/layoutSelectors";

export const ConstraintEditorPanel: React.FC = () => {
  const activeSpace = useStore((state) =>
    state.spaces.find((s) => s.id === state.activeSpaceId),
  );
  const templatesById = useStore((state) => state.templatesById);

  const updateConstraintForSpace = useStore(
    (state) => state.updateConstraintForSpace,
  );
  const removeConstraintForSpace = useStore(
    (state) => state.removeConstraintForSpace,
  );
  const setSpaceDrillable = useStore((state) => state.setSpaceDrillable);

  const [searchQuery, setSearchQuery] = useState("");

  if (!activeSpace) {
    return (
      <div
        data-testid="constraint-editor-panel"
        className="glass-panel w-80 p-4 text-text-secondary"
      >
        No active space selected
      </div>
    );
  }

  const constraints = Object.values(activeSpace.constraints);
  const activeTemplate = templatesById[activeSpace.templateId];
  const installationConstraints = activeTemplate?.installationConstraints ?? [];
  const drillable = !installationConstraints.some((c) => c.type === "noDrill");

  const detectedSystem = (() => {
    if (activeSpace.system) return activeSpace.system;
    if (constraints.length > 0) {
      const binDef = findBinById(ALL_BINS, binId(constraints[0].binId));
      if (binDef) return binDef.system;
    }
    if (
      activeSpace.templateId.toLowerCase().includes("akromils") ||
      activeSpace.name.toLowerCase().includes("akromils")
    ) {
      return "akromils";
    }
    if (
      activeSpace.templateId.toLowerCase().includes("schaller") ||
      activeSpace.name.toLowerCase().includes("schaller")
    ) {
      return "schaller";
    }
    return "gridfinity";
  })();

  const compatibleBins = ALL_BINS.filter(
    (bin) => bin.system === detectedSystem,
  );

  const filteredBins = compatibleBins.filter((bin) =>
    bin.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleConstraintChange = (newConstraint: SpaceConstraint) => {
    updateConstraintForSpace(activeSpace.templateId, newConstraint);
  };

  const handleConstraintDelete = (id: string) => {
    removeConstraintForSpace(activeSpace.templateId, BinSpecIdSchema.parse(id));
  };

  const handleAddBinConstraint = (id: string) => {
    const constraint = {
      ...createSpaceConstraint(id, 1, 0),
      color: binColorForIndex(constraints.length),
    };
    updateConstraintForSpace(activeSpace.templateId, constraint);
  };

  const handleDrillableChange = (nextDrillable: boolean) => {
    setSpaceDrillable(activeSpace.templateId, nextDrillable);
  };

  return (
    <div
      data-testid="constraint-editor-panel"
      className="glass-panel flex w-80 flex-col gap-6 overflow-y-auto p-4"
    >
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input
            type="checkbox"
            data-testid="drillable-toggle"
            checked={drillable}
            onChange={(e) => handleDrillableChange(e.target.checked)}
          />
          Can I drill into this space?
        </label>
      </div>

      <hr className="m-0 border-border-default" />

      <div className="flex flex-col gap-3">
        <h3 className="text-text-primary">Constraints</h3>
        {constraints.length === 0 ? (
          <div className="text-sm text-text-muted">
            No constraints added. Add bins from the catalog below.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {constraints.map((c) => {
              const binDef = findBinById(ALL_BINS, binId(c.binId));
              const binName = binDef ? binDef.name : c.binId;
              return (
                <div
                  key={c.binId}
                  data-testid={`constraint-row-${c.binId}`}
                  className="relative rounded-sm border border-border-subtle bg-surface-raised p-2"
                >
                  <ConstraintRow
                    constraint={c}
                    binName={binName}
                    onChange={handleConstraintChange}
                    onDelete={() => handleConstraintDelete(c.binId)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <hr className="m-0 border-border-default" />

      <div className="flex flex-col gap-3">
        <h3 className="text-text-primary">Add Bins</h3>
        <input
          type="text"
          placeholder="Search catalog..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-sm border border-border-default p-2 text-sm"
        />
        <div className="flex max-h-75 flex-col gap-2 overflow-y-auto rounded-sm border border-border-subtle bg-surface-raised p-2">
          {filteredBins.length === 0 ? (
            <div className="py-4 text-center text-sm text-text-muted">
              No matching bins found
            </div>
          ) : (
            filteredBins.map((bin) => {
              const binSpecId = BinSpecIdSchema.parse(bin.id);
              const isAdded = activeSpace.constraints[binSpecId] !== undefined;
              const installationAllowed = isBinInstallationAllowed(
                bin,
                installationConstraints,
              );
              const disabled = isAdded || !installationAllowed;
              const title = !installationAllowed
                ? "requires drilling — not allowed for this space"
                : bin.name;
              return (
                <div
                  key={bin.id}
                  className={`flex items-center justify-between border-b border-border-subtle py-1 text-sm ${
                    !installationAllowed ? "opacity-50" : ""
                  }`}
                >
                  <span title={title} className="max-w-40 truncate">
                    {bin.name}
                  </span>
                  <button
                    onClick={() => handleAddBinConstraint(bin.id)}
                    disabled={disabled}
                    title={title}
                    data-testid={`add-bin-${bin.id}`}
                    className="cursor-pointer rounded-sm border border-border-default bg-surface-raised px-2 py-1 text-xs text-text-primary disabled:cursor-default disabled:bg-brand-primary/10 disabled:text-brand-primary"
                  >
                    {isAdded ? "Added" : "+ Add"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
