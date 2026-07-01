import React, { useState } from "react";
import { useStore } from "@storagemaxxing/store/useStore";
import { ConstraintRow } from "./constraints/ConstraintRow";
import { ALL_BINS, findBinById } from "@storagemaxxing/catalog/lookup";
import { binId } from "@storagemaxxing/catalog/bin";
import { BinSpecIdSchema } from "@storagemaxxing/assembly/BaseTypes";
import { SpaceConstraint, createSpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";

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

  const [searchQuery, setSearchQuery] = useState("");

  if (!activeSpace) {
    return (
      <div style={{ padding: "1rem", color: "#666" }}>
        No active space selected
      </div>
    );
  }

  const constraints = Object.values(activeSpace.constraints);

  const detectedSystem = (() => {
    if (constraints.length > 0) {
      const binDef = findBinById(ALL_BINS, binId(constraints[0].binId));
      if (binDef) return binDef.system;
    }
    if (activeSpace.templateId.toLowerCase().includes("akromils") || activeSpace.name.toLowerCase().includes("akromils")) {
      return "akromils";
    }
    if (activeSpace.templateId.toLowerCase().includes("schaller") || activeSpace.name.toLowerCase().includes("schaller")) {
      return "schaller";
    }
    return "gridfinity";
  })();

  const compatibleBins = ALL_BINS.filter((bin) => bin.system === detectedSystem);

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
    const constraint = createSpaceConstraint(id, 1, 0);
    updateConstraintForSpace(activeSpace.templateId, constraint);
  };

  return (
    <div
      style={{
        width: "320px",
        borderRight: "1px solid #ccc",
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        overflowY: "auto",
        background: "#fafafa",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <h3>Constraints</h3>
        {constraints.length === 0 ? (
          <div style={{ color: "#888", fontSize: "0.9rem" }}>
            No constraints added. Add bins from the catalog below.
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

      <hr style={{ border: "none", borderTop: "1px solid #ddd", margin: 0 }} />

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <h3>Add Bins</h3>
        <input
          type="text"
          placeholder="Search catalog..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: "0.4rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "0.9rem",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            maxHeight: "300px",
            overflowY: "auto",
            border: "1px solid #eee",
            borderRadius: "4px",
            padding: "0.5rem",
            background: "#fff",
          }}
        >
          {filteredBins.length === 0 ? (
            <div style={{ color: "#888", fontSize: "0.85rem", textAlign: "center", padding: "1rem 0" }}>
              No matching bins found
            </div>
          ) : (
            filteredBins.map((bin) => {
              const binSpecId = BinSpecIdSchema.parse(bin.id);
              const isAdded = activeSpace.constraints[binSpecId] !== undefined;
              return (
                <div
                  key={bin.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.25rem 0",
                    borderBottom: "1px solid #f9f9f9",
                    fontSize: "0.85rem",
                  }}
                >
                  <span title={bin.name} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }}>
                    {bin.name}
                  </span>
                  <button
                    onClick={() => handleAddBinConstraint(bin.id)}
                    disabled={isAdded}
                    style={{
                      padding: "0.2rem 0.5rem",
                      fontSize: "0.8rem",
                      cursor: isAdded ? "default" : "pointer",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      background: isAdded ? "#e6f7ff" : "#fff",
                      color: isAdded ? "#1890ff" : "#333",
                    }}
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
