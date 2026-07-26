import type { Meta, StoryObj } from "@storybook/react-vite";
import { BinSpecIdSchema, type BOM } from "@storagemaxxing/assembly/BaseTypes";
import { ALL_BINS } from "@storagemaxxing/catalog/lookup";
import { BOMHeader } from "./BOMHeader";

const [firstBin] = ALL_BINS;

const withItems: BOM = {
  items: [{ binId: BinSpecIdSchema.parse(firstBin.id), quantity: 2 }],
  totalPrice: (firstBin.price ?? 0) * 2,
  isApproximatePrice: false,
};

const empty: BOM = {
  items: [],
  totalPrice: 0,
  isApproximatePrice: false,
};

const meta: Meta<typeof BOMHeader> = {
  component: BOMHeader,
  args: {
    bom: withItems,
  },
};
export default meta;

type Story = StoryObj<typeof BOMHeader>;

export const Default: Story = {};

export const EmptyDownloadDisabled: Story = {
  args: {
    bom: empty,
  },
};
