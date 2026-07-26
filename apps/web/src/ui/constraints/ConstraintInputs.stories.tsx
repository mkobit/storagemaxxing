import type { Meta, StoryObj } from "@storybook/react-vite";
import { createSpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import { ALL_BINS } from "@storagemaxxing/catalog/lookup";
import { ConstraintInputs } from "./ConstraintInputs";

const [firstBin] = ALL_BINS;

const meta: Meta<typeof ConstraintInputs> = {
  component: ConstraintInputs,
  args: {
    constraint: createSpaceConstraint(firstBin.id, 0, 1, 5),
    onMinChange: () => {},
    onMaxChange: () => {},
  },
};
export default meta;

type Story = StoryObj<typeof ConstraintInputs>;

export const Soft: Story = {};

export const Hard: Story = {
  args: {
    constraint: createSpaceConstraint(firstBin.id, 2, 0, 5),
  },
};

export const AutoModeRendersNothing: Story = {
  args: {
    constraint: createSpaceConstraint(firstBin.id, 0, 0),
  },
};
