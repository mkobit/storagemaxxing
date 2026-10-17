import React, { useEffect, useState } from "react";
import { useStore } from "@storagemaxxing/store/useStore";
import { StorageSystemSchema } from "@storagemaxxing/catalog/StorageSystem";
import { createSpaceTemplate } from "@storagemaxxing/assembly/SpaceTemplate";
import { SpaceInstanceSchema } from "@storagemaxxing/assembly/SpaceInstance";
import { createDimensions3D } from "@storagemaxxing/geometry/Dimensions3D";
import { CreateSpaceInputSchema } from "./CreateSpaceForm";

export interface CreateSpaceDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

const transition =
  "transition-colors duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)]";
const inputStyle =
  "rounded-sm border border-border-default bg-surface-sunken px-3 py-1.5 text-text-primary text-sm focus:border-border-strong focus:outline-none";
const cancelButton = `cursor-pointer rounded-sm border border-border-default bg-surface-raised px-4 py-1.5 text-sm text-text-secondary hover:bg-surface-hover ${transition}`;
const submitButton = `cursor-pointer rounded-sm border border-border-default bg-brand-primary px-4 py-1.5 text-sm font-semibold text-text-inverse hover:opacity-90 ${transition}`;

export const CreateSpaceDialog: React.FC<CreateSpaceDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const addTemplate = useStore((state) => state.addTemplate);
  const addSpace = useStore((state) => state.addSpace);
  const setActiveSpace = useStore((state) => state.setActiveSpace);

  const [name, setName] = useState("");
  const [system, setSystem] = useState("gridfinity");
  const [columns, setColumns] = useState("");
  const [rows, setRows] = useState("");
  const [depth, setDepth] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-space-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close modal backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-surface-sunken/80 cursor-default border-0"
      />
      <div className="relative z-10 w-full max-w-md rounded-md border border-border-default bg-surface-raised p-6 shadow-lg">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <h2
            id="create-space-title"
            className="text-base font-semibold text-text-primary"
          >
            Create space
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="cursor-pointer text-text-muted hover:text-text-primary"
          >
            ✕
          </button>
        </div>

        <form
          data-testid="create-space-form"
          onSubmit={handleSubmit}
          className="mt-4 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="create-space-name"
              className="text-sm font-medium text-text-primary"
            >
              Space name
            </label>
            <input
              id="create-space-name"
              type="text"
              placeholder="e.g. Workshop drawer"
              aria-label="Space name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="create-space-name"
              className={inputStyle}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="create-space-system"
              className="text-sm font-medium text-text-primary"
            >
              Storage system
            </label>
            <select
              id="create-space-system"
              value={system}
              aria-label="Storage system"
              onChange={(e) => setSystem(e.target.value)}
              data-testid="create-space-system"
              className={inputStyle}
            >
              {StorageSystemSchema.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="create-space-columns"
                className="text-sm font-medium text-text-primary"
              >
                Columns
              </label>
              <input
                id="create-space-columns"
                type="text"
                placeholder="Columns"
                aria-label="Columns"
                value={columns}
                onChange={(e) => setColumns(e.target.value)}
                data-testid="create-space-columns"
                className={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="create-space-rows"
                className="text-sm font-medium text-text-primary"
              >
                Rows
              </label>
              <input
                id="create-space-rows"
                type="text"
                placeholder="Rows"
                aria-label="Rows"
                value={rows}
                onChange={(e) => setRows(e.target.value)}
                data-testid="create-space-rows"
                className={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="create-space-depth"
                className="text-sm font-medium text-text-primary"
              >
                Depth
              </label>
              <input
                id="create-space-depth"
                type="text"
                placeholder="Depth"
                aria-label="Depth"
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
                data-testid="create-space-depth"
                className={inputStyle}
              />
            </div>
          </div>

          {error && (
            <span
              data-testid="create-space-error"
              role="alert"
              className="text-sm text-status-danger"
            >
              {error}
            </span>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={cancelButton}>
              Cancel
            </button>
            <button
              type="submit"
              data-testid="create-space-submit"
              className={submitButton}
            >
              Create space
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
