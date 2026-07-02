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

  return (
    <div
      className="flex gap-4 p-4 bg-gray-100 border-b border-gray-300"
      data-testid="toolbar"
    >
      <button
        className={`px-3 py-1 rounded transition-colors ${
          mode === "select"
            ? "bg-brand-primary text-white font-bold"
            : "bg-white border border-gray-300 hover:bg-gray-50"
        }`}
        onClick={() => setMode("select")}
        data-testid="mode-select"
      >
        Select
      </button>
      <button
        className={`px-3 py-1 rounded transition-colors ${
          mode === "pan"
            ? "bg-brand-primary text-white font-bold"
            : "bg-white border border-gray-300 hover:bg-gray-50"
        }`}
        onClick={() => setMode("pan")}
        data-testid="mode-pan"
      >
        Pan
      </button>
      <div className="w-px bg-gray-300 my-1 mx-2" />
      <button
        className="px-3 py-1 rounded bg-white border border-gray-300 hover:bg-gray-50"
        onClick={handleExport}
        data-testid="export-sketch"
      >
        Export
      </button>
      <button
        className="px-3 py-1 rounded bg-white border border-gray-300 hover:bg-gray-50"
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
        <span className="text-red-600 text-sm self-center">{importError}</span>
      )}
      <div className="w-px bg-gray-300 my-1 mx-2" />
      <GoldenPathSetup />
      <div className="w-px bg-gray-300 my-1 mx-2" />
      <ThemeToggle />
    </div>
  );
};
