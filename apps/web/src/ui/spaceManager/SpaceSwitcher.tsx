import React from "react";
import { useStore } from "@storagemaxxing/store/useStore";

const transition =
  "transition-colors duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)]";
const activeButton = `rounded-sm bg-brand-primary px-3 py-1 font-bold text-text-inverse ${transition}`;
const inactiveButton = `rounded-sm border border-border-default bg-surface-raised px-3 py-1 hover:bg-surface-hover ${transition}`;

export const SpaceSwitcher: React.FC = () => {
  const spaces = useStore((state) => state.spaces);
  const activeSpaceId = useStore((state) => state.activeSpaceId);
  const setActiveSpace = useStore((state) => state.setActiveSpace);

  if (spaces.length === 0) {
    return (
      <div data-testid="space-switcher" className="text-sm text-text-muted">
        No spaces yet
      </div>
    );
  }

  return (
    <div data-testid="space-switcher" className="flex items-center gap-2">
      {spaces.map((space) => {
        const isActive = space.id === activeSpaceId;
        return (
          <button
            key={space.id}
            data-testid={`space-item-${space.id}`}
            aria-current={isActive}
            onClick={() => setActiveSpace(space.id)}
            className={isActive ? activeButton : inactiveButton}
          >
            {space.name}
          </button>
        );
      })}
    </div>
  );
};
