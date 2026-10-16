import React from "react";
import { useStore } from "@storagemaxxing/store/useStore";

export const Toolbar: React.FC = () => {
  const mode = useStore((state) => state.mode);
  const setMode = useStore((state) => state.setMode);

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
    </div>
  );
};
