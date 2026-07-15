import React, { useState } from "react";
import { useStore } from "@storagemaxxing/store/useStore";
import { StorageSystemSchema } from "@storagemaxxing/catalog/StorageSystem";
import { createSpaceTemplate } from "@storagemaxxing/assembly/SpaceTemplate";
import { SpaceInstanceSchema } from "@storagemaxxing/assembly/SpaceInstance";
import { createDimensions3D } from "@storagemaxxing/geometry/Dimensions3D";
import { CreateSpaceInputSchema } from "./CreateSpaceForm";

const button =
  "rounded-sm border border-border-default bg-surface-raised px-3 py-1 hover:bg-surface-hover transition-colors duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)]";
const input =
  "w-20 rounded-sm border border-border-default bg-surface-raised px-2 py-1";

export const CreateSpaceFormPanel: React.FC = () => {
  const addTemplate = useStore((state) => state.addTemplate);
  const addSpace = useStore((state) => state.addSpace);
  const setActiveSpace = useStore((state) => state.setActiveSpace);

  const [name, setName] = useState("");
  const [system, setSystem] = useState("gridfinity");
  const [columns, setColumns] = useState("");
  const [rows, setRows] = useState("");
  const [depth, setDepth] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = CreateSpaceInputSchema.safeParse({
      name,
      system,
      columns,
      rows,
      depth,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    const template = createSpaceTemplate(
      crypto.randomUUID(),
      createDimensions3D(
        parsed.data.columns,
        parsed.data.rows,
        parsed.data.depth,
      ),
      "top",
    );
    const space = SpaceInstanceSchema.parse({
      id: crypto.randomUUID(),
      templateId: template.id,
      name: parsed.data.name,
      count: 1,
      constraints: {},
      system: parsed.data.system,
    });
    addTemplate(template);
    addSpace(space);
    setActiveSpace(space.id);

    setError(null);
    setName("");
    setColumns("");
    setRows("");
    setDepth("");
  };

  return (
    <form
      data-testid="create-space-form"
      onSubmit={handleSubmit}
      className="flex items-center gap-2"
    >
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        data-testid="create-space-name"
        className={input}
      />
      <select
        value={system}
        onChange={(e) => setSystem(e.target.value)}
        data-testid="create-space-system"
        className={input}
      >
        {StorageSystemSchema.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Columns"
        value={columns}
        onChange={(e) => setColumns(e.target.value)}
        data-testid="create-space-columns"
        className={input}
      />
      <input
        type="text"
        placeholder="Rows"
        value={rows}
        onChange={(e) => setRows(e.target.value)}
        data-testid="create-space-rows"
        className={input}
      />
      <input
        type="text"
        placeholder="Depth"
        value={depth}
        onChange={(e) => setDepth(e.target.value)}
        data-testid="create-space-depth"
        className={input}
      />
      <button type="submit" data-testid="create-space-submit" className={button}>
        Create space
      </button>
      {error && (
        <span data-testid="create-space-error" className="text-sm text-red-600">
          {error}
        </span>
      )}
    </form>
  );
};
