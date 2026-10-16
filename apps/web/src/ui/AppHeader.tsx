import React, { useRef, useState } from "react";
import { useStore } from "@storagemaxxing/store/useStore";
import {
  serializeSketch,
  parseSketch,
} from "@storagemaxxing/store/SketchSerialization";
import { DevToolsMenu } from "./DevToolsMenu";
import { SpaceManager } from "./spaceManager/SpaceManager";
import { ThemeToggle } from "./theme/ThemeToggle";

const SKETCH_FILE_NAME = "storagemaxxing-sketch.json";

const transition =
  "transition-colors duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)]";
const actionButton = `rounded-sm border border-border-default bg-surface-raised px-3 py-1 hover:bg-surface-hover ${transition}`;

export const AppHeader: React.FC = () => {
  const loadSketch = useStore((state) => state.loadSketch);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleExport = () => {
    const json = serializeSketch(useStore.getState());
    const url = URL.createObjectURL(
      new Blob([json], { type: "application/json" }),
    );
    const link = document.createElement("a");
    // eslint-disable-next-line functional/immutable-data -- HTMLAnchorElement is a native mutable browser object; there is no immutable alternative to setting href to trigger a file download
    link.href = url;
    // eslint-disable-next-line functional/immutable-data -- same as href above, setting download is the only way to name the downloaded file
    link.download = SKETCH_FILE_NAME;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = e.target.files?.[0];
    // eslint-disable-next-line functional/immutable-data -- resetting the native file input's value is the only way to let the same file be re-selected/re-imported later
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
    <header
      className="flex flex-wrap items-center justify-between gap-4 border-b border-border-default bg-surface-sunken px-4 py-3 text-text-primary"
      data-testid="app-header"
    >
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-lg font-bold tracking-tight text-text-primary">
          Storagemaxxing
        </h1>
        <div className="my-1 h-5 w-px bg-border-default" />
        <SpaceManager />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={actionButton}
          onClick={handleExport}
          data-testid="export-sketch"
        >
          Export
        </button>
        <button
          type="button"
          className={actionButton}
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
          <span className="self-center text-sm text-status-danger">
            {importError}
          </span>
        )}
        <div className="mx-1 my-1 h-5 w-px bg-border-default" />
        <DevToolsMenu />
        <div className="mx-1 my-1 h-5 w-px bg-border-default" />
        <ThemeToggle />
      </div>
    </header>
  );
};
