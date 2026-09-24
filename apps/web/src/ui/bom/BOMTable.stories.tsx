import type { Meta, StoryObj } from "@storybook/react-vite";
import { BinSpecIdSchema, type BOM } from "@storagemaxxing/assembly/BaseTypes";
import { BOMTable } from "./BOMTable";

const emptyBOM: BOM = {
  items: [],
  totalPrice: 0,
  isApproximatePrice: false,
};

const mixedBinsAndAccessoriesBOM: BOM = {
  items: [
    {
      binId: BinSpecIdSchema.parse("gridfinity-1x1x2"),
      quantity: 4,
    },
    {
      binId: BinSpecIdSchema.parse("gridfinity-hook-1x1"),
      quantity: 2,
    },
  ],
  totalPrice: 6.0,
  isApproximatePrice: false,
};

const multiSpaceAggregateBOM: BOM = {
  items: [
    {
      binId: BinSpecIdSchema.parse("gridfinity-1x1x2"),
      quantity: 8,
    },
    {
      binId: BinSpecIdSchema.parse("gridfinity-1x2x2"),
      quantity: 4,
    },
    {
      binId: BinSpecIdSchema.parse("gridfinity-hook-1x1"),
      quantity: 3,
    },
  ],
  totalPrice: 18.5,
  isApproximatePrice: false,
};

const approximatePriceBOM: BOM = {
  items: [
    {
      binId: BinSpecIdSchema.parse("gridfinity-1x1x2"),
      quantity: 2,
    },
    {
      binId: BinSpecIdSchema.parse("custom-unknown-spec"),
      quantity: 1,
    },
  ],
  totalPrice: 3.0,
  isApproximatePrice: true,
};

const meta: Meta<typeof BOMTable> = {
  component: BOMTable,
  args: {
    bom: mixedBinsAndAccessoriesBOM,
  },
};
export default meta;

type Story = StoryObj<typeof BOMTable>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    bom: emptyBOM,
  },
};

export const MixedBinsAndAccessories: Story = {
  args: {
    bom: mixedBinsAndAccessoriesBOM,
  },
};

export const MultiSpaceAggregate: Story = {
  args: {
    bom: multiSpaceAggregateBOM,
  },
};

export const ApproximatePrice: Story = {
  args: {
    bom: approximatePriceBOM,
  },
};
