import React from "react";
import { useStore } from "@storagemaxxing/store/useStore";

export type ToolbarProps = {
  readonly onZoomIn?: () => void;
  readonly onZoomOut?: () => void;
  readonly onFit?: () => void;
  readonly wireframeEnabled?: boolean;
  readonly onToggleWireframe?: () => void;
};

export const Toolbar: React.FC<ToolbarProps> = ({
  onZoomIn,
  onZoomOut,
  onFit,
  wireframeEnabled = false,
  onToggleWireframe,
}) => {
  const mode = useStore((state) => state.mode);
  const setMode = useStore((state) => state.setMode);

  const transition =
    "transition-colors duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)]";
  const inactiveButton = `rounded-sm border border-border-default bg-surface-raised px-3 py-1 hover:bg-surface-hover ${transition}`;
  const activeButton = `rounded-sm bg-brand-primary px-3 py-1 font-bold text-text-inverse ${transition}`;

  return (
    <div
      className="flex flex-wrap items-center gap-2 border-b border-border-default bg-surface-sunken p-2 text-text-primary"
      data-testid="toolbar"
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={mode === "select" ? activeButton : inactiveButton}
          onClick={() => setMode("select")}
          data-testid="mode-select"
        >
          Select
        </button>
        <button
          type="button"
          className={mode === "pan" ? activeButton : inactiveButton}
          onClick={() => setMode("pan")}
          data-testid="mode-pan"
        >
          Pan
        </button>
      </div>

      <div className="my-1 h-4 w-px bg-border-default" />

      <div className="flex items-center gap-1">
        <button
          type="button"
          className={inactiveButton}
          onClick={onZoomIn}
          data-testid="viewport-zoom-in"
          aria-label="Zoom in"
          title="Zoom in"
        >
          Zoom in
        </button>
        <button
          type="button"
          className={inactiveButton}
          onClick={onZoomOut}
          data-testid="viewport-zoom-out"
          aria-label="Zoom out"
          title="Zoom out"
        >
          Zoom out
        </button>
        <button
          type="button"
          className={inactiveButton}
          onClick={onFit}
          data-testid="viewport-fit"
          aria-label="Fit view"
          title="Fit view"
        >
          Fit
        </button>
      </div>

      <div className="my-1 h-4 w-px bg-border-default" />

      <button
        type="button"
        data-testid="wireframe-toggle"
        aria-pressed={wireframeEnabled}
        onClick={onToggleWireframe}
        className={wireframeEnabled ? activeButton : inactiveButton}
      >
        Wireframe preview
      </button>
    </div>
  );
};
