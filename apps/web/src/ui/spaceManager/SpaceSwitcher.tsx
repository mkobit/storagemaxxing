import React, { useEffect, useRef, useState } from "react";
import { useStore } from "@storagemaxxing/store/useStore";

export interface SpaceSwitcherProps {
  readonly defaultOpen?: boolean;
}

const transition =
  "transition-colors duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)]";
const triggerStyle = `flex items-center gap-1.5 rounded-sm border border-border-default bg-surface-raised px-3 py-1 text-sm font-medium text-text-primary hover:bg-surface-hover ${transition}`;
const activeItemStyle = `flex items-center justify-between rounded-sm bg-brand-primary px-3 py-1.5 text-left text-sm font-bold text-text-inverse ${transition}`;
const inactiveItemStyle = `flex items-center justify-between rounded-sm px-3 py-1.5 text-left text-sm text-text-primary hover:bg-surface-hover ${transition}`;

export const SpaceSwitcher: React.FC<SpaceSwitcherProps> = ({
  defaultOpen = false,
}) => {
  const spaces = useStore((state) => state.spaces);
  const activeSpaceId = useStore((state) => state.activeSpaceId);
  const setActiveSpace = useStore((state) => state.setActiveSpace);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleMouseDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, [isOpen]);

  if (spaces.length === 0) {
    return (
      <div data-testid="space-switcher" className="text-sm text-text-secondary">
        No spaces yet
      </div>
    );
  }

  const activeSpace = spaces.find((s) => s.id === activeSpaceId) ?? spaces[0];

  return (
    <div ref={containerRef} data-testid="space-switcher" className="relative">
      <button
        type="button"
        data-testid="space-switcher-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={triggerStyle}
      >
        <span className="max-w-48 truncate">{activeSpace?.name}</span>
        <span aria-hidden="true" className="text-xs text-text-muted">
          ▾
        </span>
      </button>

      {isOpen && (
        <div
          aria-label="Spaces"
          data-testid="space-switcher-menu"
          className="absolute left-0 top-full z-30 mt-1 flex max-h-60 min-w-48 max-w-xs flex-col gap-0.5 overflow-y-auto rounded-sm border border-border-default bg-surface-raised p-1 shadow-lg"
        >
          {spaces.map((space) => {
            const isActive = space.id === activeSpaceId;
            return (
              <button
                key={space.id}
                type="button"
                aria-current={isActive}
                data-testid={`space-item-${space.id}`}
                onClick={() => {
                  setActiveSpace(space.id);
                  setIsOpen(false);
                }}
                className={isActive ? activeItemStyle : inactiveItemStyle}
              >
                <span className="truncate">{space.name}</span>
                {isActive && (
                  <span aria-hidden="true" className="ml-2 font-bold">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
