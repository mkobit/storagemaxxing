import { BOM, BOMItem, BinSpecIdSchema } from "./BaseTypes.js";
import type { PackingResult } from "@storagemaxxing/packer/types.js";
import type { BinSpec } from "@storagemaxxing/catalog/bin.js";

export type LookupBinFunction = (id: string) => BinSpec | undefined;

const isPackingResult = (
  result: PackingResult | Readonly<Record<string, number>>,
): result is PackingResult => {
  return (
    typeof result === "object" &&
    result !== null &&
    "metrics" in result &&
    "placedBins" in result
  );
};

const getCounts = (
  result: PackingResult | Readonly<Record<string, number>>,
): Readonly<Record<string, number>> => {
  if (isPackingResult(result)) {
    return result.metrics.placedCounts;
  }
  return result;
};

const hasNumberProperty = (
  obj: object,
  prop: string,
): obj is Readonly<Record<string, unknown>> & {
  readonly [K in typeof prop]: number;
} => {
  return (
    prop in obj &&
    typeof Object.getOwnPropertyDescriptor(obj, prop)?.value === "number"
  );
};

const getPrice = (spec: unknown): number => {
  if (
    typeof spec === "object" &&
    spec !== null &&
    hasNumberProperty(spec, "price")
  ) {
    const value = Object.getOwnPropertyDescriptor(spec, "price")?.value;
    return typeof value === "number" ? value : 0;
  }
  return 0;
};

const hasBooleanProperty = (
  obj: object,
  prop: string,
): obj is Readonly<Record<string, unknown>> & {
  readonly [K in typeof prop]: boolean;
} => {
  return (
    prop in obj &&
    typeof Object.getOwnPropertyDescriptor(obj, prop)?.value === "boolean"
  );
};

const isPriceApproximate = (spec: unknown): boolean => {
  if (
    typeof spec === "object" &&
    spec !== null &&
    hasBooleanProperty(spec, "priceApproximate")
  ) {
    const value = Object.getOwnPropertyDescriptor(
      spec,
      "priceApproximate",
    )?.value;
    return typeof value === "boolean" ? value : false;
  }
  return false;
};

export const computeBom = (
  result: PackingResult | Readonly<Record<string, number>>,
  lookupBin: LookupBinFunction,
): BOM => {
  const metricsCounts = getCounts(result);

  const entries: readonly (readonly [string, number])[] = Object.entries(
    metricsCounts,
  ).filter(([, quantity]) => typeof quantity === "number" && quantity > 0);

  const items: readonly BOMItem[] = entries.map(([binId, quantity]) => ({
    binId: BinSpecIdSchema.parse(binId),
    quantity,
  }));

  const totalPrice = entries.reduce((acc, [binId, quantity]) => {
    const spec = lookupBin(binId);
    const price = spec !== undefined ? getPrice(spec) : 0;
    return acc + price * quantity;
  }, 0);

  const isApproximatePrice = entries.some(([binId]) => {
    const spec = lookupBin(binId);
    return (
      spec === undefined || getPrice(spec) === 0 || isPriceApproximate(spec)
    );
  });

  return {
    items,
    totalPrice,
    isApproximatePrice,
  };
};

export const computeAggregateBom = (
  results: ReadonlyArray<PackingResult | Readonly<Record<string, number>>>,
  lookupBin: LookupBinFunction,
): BOM => {
  const aggregatedCounts = results.reduce<Readonly<Record<string, number>>>(
    (acc, result) => {
      const counts = getCounts(result);
      return Object.entries(counts).reduce<Readonly<Record<string, number>>>(
        (innerAcc, [binId, quantity]) => {
          const existing = innerAcc[binId] || 0;
          return {
            ...innerAcc,
            [binId]: existing + quantity,
          };
        },
        acc,
      );
    },
    {},
  );

  return computeBom(aggregatedCounts, lookupBin);
};
