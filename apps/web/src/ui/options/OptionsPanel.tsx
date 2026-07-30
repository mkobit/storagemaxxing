import React, { useMemo } from "react";
import { useStore } from "@storagemaxxing/store/useStore";
import {
  selectOptionsModeStrategies,
  ComparableStorageSystem,
} from "@storagemaxxing/store/layoutSelectors";
import { LayoutResolution } from "@storagemaxxing/store/layoutSelectors";
import { StrategyCard } from "./StrategyCard";
import { toCardMetrics } from "./toCardMetrics";

const SYSTEMS: readonly ComparableStorageSystem[] = [
  "schaller",
  "gridfinity",
  "akromils",
  "opengrid",
];

const toCardMetricsOrZero = (
  resolution: LayoutResolution,
): ReturnType<typeof toCardMetrics> =>
  resolution.kind === "resolved"
    ? toCardMetrics(resolution.result)
    : { utilizationPct: 0, binCount: 0, skuCount: 0 };

type OptionsPanelProps = {
  readonly onStrategyApplied?: () => void;
};

export const OptionsPanel: React.FC<OptionsPanelProps> = ({
  onStrategyApplied,
}) => {
  const activeSpace = useStore((state) =>
    state.spaces.find((s) => s.id === state.activeSpaceId),
  );
  const templatesById = useStore((state) => state.templatesById);
  const applySpaceStrategy = useStore((state) => state.applySpaceStrategy);

  const activeTemplate = activeSpace
    ? templatesById[activeSpace.templateId]
    : undefined;

  const strategies = useMemo(
    () =>
      activeTemplate ? selectOptionsModeStrategies(activeTemplate) : undefined,
    [activeTemplate],
  );

  if (!activeSpace || !strategies) {
    return (
      <div
        data-testid="options-panel"
        className="glass-panel w-full p-4 text-text-secondary"
      >
        No active space selected
      </div>
    );
  }

  const cardMetricsBySystem: Readonly<
    Record<ComparableStorageSystem, ReturnType<typeof toCardMetrics>>
  > = {
    schaller: toCardMetricsOrZero(strategies.schaller),
    gridfinity: toCardMetricsOrZero(strategies.gridfinity),
    akromils: toCardMetricsOrZero(strategies.akromils),
    opengrid: toCardMetricsOrZero(strategies.opengrid),
  };
  const allMetrics = SYSTEMS.map((system) => cardMetricsBySystem[system]);
  const bestUtilization = Math.max(...allMetrics.map((m) => m.utilizationPct));
  const bestBinCount = Math.max(...allMetrics.map((m) => m.binCount));
  const bestSkuCount = Math.max(...allMetrics.map((m) => m.skuCount));

  return (
    <div
      data-testid="options-panel"
      className="grid w-full grid-cols-1 gap-4 overflow-y-auto p-4 md:grid-cols-4"
    >
      {SYSTEMS.map((system) => (
        <StrategyCard
          key={system}
          system={system}
          resolution={strategies[system]}
          isBestUtilization={
            cardMetricsBySystem[system].utilizationPct === bestUtilization
          }
          isBestBinCount={cardMetricsBySystem[system].binCount === bestBinCount}
          isBestSkuCount={cardMetricsBySystem[system].skuCount === bestSkuCount}
          onSelectAndCustomize={() => {
            applySpaceStrategy(activeSpace.id, system);
            onStrategyApplied?.();
          }}
        />
      ))}
    </div>
  );
};
