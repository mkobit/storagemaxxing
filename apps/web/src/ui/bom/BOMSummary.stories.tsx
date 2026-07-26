import type { Meta, StoryObj } from "@storybook/react-vite";
import { BOMSummary } from "./BOMSummary";

const meta: Meta<typeof BOMSummary> = {
  component: BOMSummary,
  args: {
    totalPrice: 42.5,
    isApproximatePrice: false,
    itemCount: 3,
  },
};
export default meta;

type Story = StoryObj<typeof BOMSummary>;

export const Default: Story = {};

export const ApproximatePrice: Story = {
  args: {
    isApproximatePrice: true,
  },
};

export const EmptyRendersNothing: Story = {
  args: {
    itemCount: 0,
  },
};
