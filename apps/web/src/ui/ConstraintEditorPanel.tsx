import React from "react";
import { useStore } from "@storagemaxxing/store/useStore";
import { ConstraintRow } from "./constraints/ConstraintRow";
import { ALL_BINS, findBinById } from "@storagemaxxing/catalog/lookup";
import { binId } from "@storagemaxxing/catalog/bin";
import { BinSpecIdSchema } from "@storagemaxxing/assembly/BaseTypes";
import { SpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";

export const ConstraintEditorPanel: React.FC = () => {
  const activeSpace = useStore((state) =>
    state.spaces.find((s) => s.id === state.activeSpaceId),
  );

  const updateConstraintForSpace = useStore(
    (state) => state.updateConstraintForSpace,
  );
  const removeConstraintForSpace = useStore(
    (state) => state.removeConstraintForSpace,
  );

  if (!activeSpace) {
    return (
      <div style={{ padding: "1rem", color: "#666" }}>
        No active space selected
      </div>
    );
  }

  const constraints = Object.values(activeSpace.constraints);

  const handleConstraintChange = (newConstraint: SpaceConstraint) => {
    updateConstraintForSpace(activeSpace.templateId, newConstraint);
  };

  const handleConstraintDelete = (id: string) => {
    removeConstraintForSpace(activeSpace.templateId, BinSpecIdSchema.parse(id));
  };

  return (
    <div
      style={{
        width: "320px",
        borderRight: "1px solid #ccc",
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        overflowY: "auto",
        background: "#fafafa",
      }}
    >
      <h3>Constraints</h3>
      {constraints.length === 0 ? (
        <div style={{ color: "#888", fontSize: "0.9rem" }}>
          No constraints added. Add bins from the catalog.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {constraints.map((c) => {
            const binDef = findBinById(ALL_BINS, binId(c.binId));
            const binName = binDef ? binDef.name : c.binId;
            return (
              <div
                key={c.binId}
                style={{
                  border: "1px solid #eee",
                  borderRadius: "4px",
                  padding: "0.5rem",
                  background: "#fff",
                  position: "relative",
                }}
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
  );
};
