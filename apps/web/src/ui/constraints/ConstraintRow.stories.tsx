import type { Meta, StoryObj } from "@storybook/react-vite";
import { createSpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import { ALL_BINS } from "@storagemaxxing/catalog/lookup";
import { ConstraintRow } from "./ConstraintRow";

const [firstBin] = ALL_BINS;

const autoConstraint = createSpaceConstraint(firstBin.id, 0, 0);
const softConstraint = createSpaceConstraint(firstBin.id, 0, 1, 5);
const hardConstraint = createSpaceConstraint(firstBin.id, 2, 0, 5);
const offConstraint = {
  ...autoConstraint,
  mode: "off",
  lo: 0,
  hi: 0,
} as const;

const meta: Meta<typeof ConstraintRow> = {
  component: ConstraintRow,
  args: {
    binName: firstBin.name,
    constraint: autoConstraint,
    onChange: () => {},
  },
};
export default meta;

type Story = StoryObj<typeof ConstraintRow>;

export const Auto: Story = {};

export const Off: Story = {
  args: {
    constraint: offConstraint,
  },
};

export const Soft: Story = {
  args: {
    constraint: softConstraint,
  },
};

export const Hard: Story = {
  args: {
    constraint: hardConstraint,
  },
};

export const WithDelete: Story = {
  args: {
    constraint: softConstraint,
    onDelete: () => {},
  },
};
