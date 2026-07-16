import { PackingResult } from "@storagemaxxing/assembly/PackingResult";

export type StrategyCardMetrics = {
  readonly utilizationPct: number;
  readonly binCount: number;
  readonly skuCount: number;
};

export const toCardMetrics = (result: PackingResult): StrategyCardMetrics => ({
  utilizationPct: result.metrics.areaUtilization * 100,
  binCount: Object.values(result.metrics.placedCounts).reduce(
    (sum, n) => sum + n,
    0,
  ),
  skuCount: Object.values(result.metrics.placedCounts).filter((n) => n > 0)
    .length,
});
