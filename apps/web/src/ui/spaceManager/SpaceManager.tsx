import React from "react";
import { CreateSpaceFormPanel } from "./CreateSpaceFormPanel";
import { SpaceSwitcher } from "./SpaceSwitcher";

export const SpaceManager: React.FC = () => (
  <div data-testid="space-manager" className="flex items-center gap-2">
    <CreateSpaceFormPanel />
    <SpaceSwitcher />
  </div>
);
