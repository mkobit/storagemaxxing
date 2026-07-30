import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  createPackingMetrics,
  createPackingResult,
} from "@storagemaxxing/assembly/PackingResult";
import type { LayoutResolution } from "@storagemaxxing/store/layoutSelectors";
import { StrategyCard } from "./StrategyCard";

const resolvedFixture: LayoutResolution = {
  kind: "resolved",
  result: createPackingResult(
    [],
    createPackingMetrics(
      { "gridfinity-2x2": 6, "gridfinity-1x2": 3 },
      0.82,
      [],
    ),
    "valid",
  ),
  unresolvedBinIds: [],
};

const meta: Meta<typeof StrategyCard> = {
  component: StrategyCard,
  args: {
    system: "gridfinity",
    resolution: resolvedFixture,
    isBestUtilization: false,
    isBestBinCount: false,
    isBestSkuCount: false,
    onSelectAndCustomize: () => {},
  },
};
export default meta;

type Story = StoryObj<typeof StrategyCard>;

export const Default: Story = {};

export const BestInEveryMetric: Story = {
  args: {
    isBestUtilization: true,
    isBestBinCount: true,
    isBestSkuCount: true,
  },
};

export const Empty: Story = {
  args: {
    resolution: {
      kind: "resolved",
      result: createPackingResult([], createPackingMetrics({}, 0, []), "valid"),
      unresolvedBinIds: [],
    },
  },
};
