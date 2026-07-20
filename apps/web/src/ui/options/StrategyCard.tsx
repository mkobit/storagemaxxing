import React, { useState } from "react";
import {
  LayoutResolution,
  ComparableStorageSystem,
} from "@storagemaxxing/store/layoutSelectors";
import { toCardMetrics } from "./toCardMetrics";

export type StrategyCardProps = {
  readonly system: ComparableStorageSystem;
  readonly resolution: LayoutResolution;
  readonly isBestUtilization: boolean;
  readonly isBestBinCount: boolean;
  readonly isBestSkuCount: boolean;
  readonly onSelectAndCustomize: () => void;
};

const SYSTEM_LABELS: Readonly<Record<ComparableStorageSystem, string>> = {
  schaller: "Schaller",
  gridfinity: "Gridfinity",
  akromils: "Akro-Mils",
};

export const StrategyCard: React.FC<StrategyCardProps> = ({
  system,
  resolution,
  isBestUtilization,
  isBestBinCount,
  isBestSkuCount,
  onSelectAndCustomize,
}) => {
  const [expanded, setExpanded] = useState(false);

  const metrics =
    resolution.kind === "resolved"
      ? toCardMetrics(resolution.result)
      : { utilizationPct: 0, binCount: 0, skuCount: 0 };

  const placedCounts =
    resolution.kind === "resolved" ? resolution.result.metrics.placedCounts : {};

  return (
    <div
      data-testid={`strategy-card-${system}`}
      className="glass-panel flex flex-col gap-3 p-4"
    >
      <h3 className="text-text-primary">{SYSTEM_LABELS[system]}</h3>
      <dl className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <dt className="text-text-muted">Utilization</dt>
          <dd
            className={
              isBestUtilization
                ? "font-bold text-brand-primary"
                : "text-text-primary"
            }
          >
            {metrics.utilizationPct.toFixed(0)}%
          </dd>
        </div>
        <div>
          <dt className="text-text-muted">Bins</dt>
          <dd
            className={
              isBestBinCount
                ? "font-bold text-brand-primary"
                : "text-text-primary"
            }
          >
            {metrics.binCount}
          </dd>
        </div>
        <div>
          <dt className="text-text-muted">SKUs</dt>
          <dd
            className={
              isBestSkuCount
                ? "font-bold text-brand-primary"
                : "text-text-primary"
            }
          >
            {metrics.skuCount}
          </dd>
        </div>
      </dl>

      <div className="flex gap-2">
        <button
          type="button"
          data-testid="view-layout"
          onClick={() => setExpanded((prev) => !prev)}
          className="cursor-pointer rounded-sm border border-border-default bg-surface-raised px-2 py-1 text-xs text-text-primary"
        >
          {expanded ? "Hide layout" : "View Layout"}
        </button>
        <button
          type="button"
          data-testid="select-and-customize"
          onClick={onSelectAndCustomize}
          className="cursor-pointer rounded-sm border border-border-default bg-brand-primary px-2 py-1 text-xs text-white"
        >
          Select & Customize
        </button>
      </div>

      {expanded && (
        <ul className="flex flex-col gap-1 text-xs text-text-secondary">
          {Object.entries(placedCounts)
            .filter(([, count]) => count > 0)
            .map(([binId, count]) => (
              <li key={binId}>
                {binId} × {count}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
};
