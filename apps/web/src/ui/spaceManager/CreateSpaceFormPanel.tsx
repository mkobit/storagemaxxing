import React, { useState } from "react";
import { CreateSpaceDialog } from "./CreateSpaceDialog";

export interface CreateSpaceFormPanelProps {
  readonly defaultOpen?: boolean;
}

const transition =
  "transition-colors duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)]";
const button = `rounded-sm border border-border-default bg-surface-raised px-3 py-1 hover:bg-surface-hover ${transition}`;

export const CreateSpaceFormPanel: React.FC<CreateSpaceFormPanelProps> = ({
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <>
      <button
        type="button"
        data-testid="create-space-open"
        onClick={() => setIsOpen(true)}
        className={button}
      >
        + New space
      </button>
      <CreateSpaceDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
