import React, { useRef, useState } from "react";
import { useStore } from "@storagemaxxing/store/useStore";
import { serializeSketch, parseSketch } from "@storagemaxxing/store/SketchSerialization";
import { GoldenPathSetup } from "./GoldenPathSetup";
import { ThemeToggle } from "./theme/ThemeToggle";

const SKETCH_FILE_NAME = "storagemaxxing-sketch.json";

export const Toolbar: React.FC = () => {
  const mode = useStore((state) => state.mode);
  const setMode = useStore((state) => state.setMode);
  const loadSketch = useStore((state) => state.loadSketch);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleExport = () => {
    const json = serializeSketch(useStore.getState());
    const url = URL.createObjectURL(
      new Blob([json], { type: "application/json" }),
    );
    const link = document.createElement("a");
    // eslint-disable-next-line functional/immutable-data
    link.href = url;
    // eslint-disable-next-line functional/immutable-data
    link.download = SKETCH_FILE_NAME;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = e.target.files?.[0];
    // eslint-disable-next-line functional/immutable-data
    e.target.value = "";
    if (!file) return;
    try {
      loadSketch(parseSketch(await file.text()));
      setImportError(null);
    } catch {
      setImportError("Invalid sketch file");
    }
  };

  const transition =
    "transition-colors duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)]";
  const inactiveButton = `rounded-sm border border-border-default bg-surface-raised px-3 py-1 hover:bg-surface-hover ${transition}`;

  return (
    <div
      className="flex gap-4 border-b border-border-default bg-surface-sunken p-4 text-text-primary"
      data-testid="toolbar"
    >
      <button
        className={
          mode === "select"
            ? `rounded-sm bg-brand-primary px-3 py-1 font-bold text-text-inverse ${transition}`
            : inactiveButton
        }
        onClick={() => setMode("select")}
        data-testid="mode-select"
      >
        Select
      </button>
      <button
        className={
          mode === "pan"
            ? `rounded-sm bg-brand-primary px-3 py-1 font-bold text-text-inverse ${transition}`
            : inactiveButton
        }
        onClick={() => setMode("pan")}
        data-testid="mode-pan"
      >
        Pan
      </button>
      <div className="mx-2 my-1 w-px bg-border-default" />
      <button
        className={inactiveButton}
        onClick={handleExport}
        data-testid="export-sketch"
      >
        Export
      </button>
      <button
        className={inactiveButton}
        onClick={() => fileInputRef.current?.click()}
        data-testid="import-sketch"
      >
        Import
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        onChange={handleImportFile}
        data-testid="import-sketch-input"
        aria-hidden="true"
        className="hidden"
      />
      {importError && (
        <span className="self-center text-sm text-red-600">{importError}</span>
      )}
      <div className="mx-2 my-1 w-px bg-border-default" />
      <GoldenPathSetup />
      <div className="mx-2 my-1 w-px bg-border-default" />
      <ThemeToggle />
    </div>
  );
};
