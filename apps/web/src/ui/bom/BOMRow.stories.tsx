import type { Meta, StoryObj } from "@storybook/react-vite";
import { BinSpecIdSchema } from "@storagemaxxing/assembly/BaseTypes";
import { ALL_BINS } from "@storagemaxxing/catalog/lookup";
import { BOMRow } from "./BOMRow";

const [firstBin] = ALL_BINS;

const meta: Meta<typeof BOMRow> = {
  component: BOMRow,
  decorators: [
    (Story) => (
      <table>
        <tbody>
          <Story />
        </tbody>
      </table>
    ),
  ],
  args: {
    item: { binId: BinSpecIdSchema.parse(firstBin.id), quantity: 3 },
  },
};
export default meta;

type Story = StoryObj<typeof BOMRow>;

export const Default: Story = {};

export const UnknownBin: Story = {
  args: {
    item: {
      binId: BinSpecIdSchema.parse("does-not-exist-in-catalog"),
      quantity: 1,
    },
  },
};
