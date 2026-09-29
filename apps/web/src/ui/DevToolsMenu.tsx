import React from "react";
import { GoldenPathSetup } from "./GoldenPathSetup";

export const DevToolsMenu: React.FC = () => (
  <details className="relative" data-testid="dev-tools-menu">
    <summary className="cursor-pointer rounded-sm border border-border-default bg-surface-raised px-3 py-1 hover:bg-surface-hover">
      Dev Tools
    </summary>
    <div className="absolute left-0 top-full z-20 mt-2 rounded-sm border border-border-default bg-surface-raised p-3 shadow-lg">
      <GoldenPathSetup />
    </div>
  </details>
);
