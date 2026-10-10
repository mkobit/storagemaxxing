import type { Meta, StoryObj } from "@storybook/react-vite";
import { BinSpecIdSchema } from "@storagemaxxing/assembly/BaseTypes";
import { createSpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import {
  SpaceInstanceSchema,
  SpaceInstanceIdSchema,
} from "@storagemaxxing/assembly/SpaceInstance";
import {
  createSpaceTemplate,
  SpaceTemplateIdSchema,
} from "@storagemaxxing/assembly/SpaceTemplate";
import { createDimensions3D } from "@storagemaxxing/geometry/Dimensions3D";
import { useStore } from "@storagemaxxing/store/useStore";
import { BOMPanel } from "./BOMPanel";

const templateOneId = SpaceTemplateIdSchema.parse("template-1");
const templateTwoId = SpaceTemplateIdSchema.parse("template-2");

const templateOne = createSpaceTemplate(
  templateOneId,
  createDimensions3D(12, 12, 4),
  "top",
);

const templateTwo = createSpaceTemplate(
  templateTwoId,
  createDimensions3D(8, 8, 4),
  "top",
);

const binOneId = BinSpecIdSchema.parse("gridfinity-1x1x2");
const binTwoId = BinSpecIdSchema.parse("gridfinity-1x2x2");
const accessoryId = BinSpecIdSchema.parse("gridfinity-hook-1x1");

const spaceOneId = SpaceInstanceIdSchema.parse("space-1");
const spaceTwoId = SpaceInstanceIdSchema.parse("space-2");

const mixedSpace = SpaceInstanceSchema.parse({
  id: spaceOneId,
  templateId: templateOneId,
  name: "Top drawer",
  count: 1,
  constraints: {
    [binOneId]: createSpaceConstraint(binOneId, 2, 0, 4),
    [accessoryId]: createSpaceConstraint(accessoryId, 1, 0, 2),
  },
});

const multiSpaceOne = SpaceInstanceSchema.parse({
  id: spaceOneId,
  templateId: templateOneId,
  name: "Top drawer",
  count: 1,
  constraints: {
    [binOneId]: createSpaceConstraint(binOneId, 2, 0, 4),
    [accessoryId]: createSpaceConstraint(accessoryId, 1, 0, 2),
  },
});

const multiSpaceTwo = SpaceInstanceSchema.parse({
  id: spaceTwoId,
  templateId: templateTwoId,
  name: "Bottom drawer",
  count: 2,
  constraints: {
    [binTwoId]: createSpaceConstraint(binTwoId, 1, 0, 2),
  },
});

const meta: Meta<typeof BOMPanel> = {
  component: BOMPanel,
};
export default meta;

type Story = StoryObj<typeof BOMPanel>;

export const Default: Story = {
  decorators: [
    (Story) => {
      useStore.setState({
        spaces: [mixedSpace],
        activeSpaceId: spaceOneId,
        templatesById: { [templateOneId]: templateOne },
      });
      return <Story />;
    },
  ],
};

export const Empty: Story = {
  decorators: [
    (Story) => {
      useStore.setState({
        spaces: [],
        activeSpaceId: null,
        templatesById: {},
      });
      return <Story />;
    },
  ],
};

export const MixedBinsAndAccessories: Story = {
  decorators: [
    (Story) => {
      useStore.setState({
        spaces: [mixedSpace],
        activeSpaceId: spaceOneId,
        templatesById: { [templateOneId]: templateOne },
      });
      return <Story />;
    },
  ],
};

export const MultiSpaceAggregate: Story = {
  decorators: [
    (Story) => {
      useStore.setState({
        spaces: [multiSpaceOne, multiSpaceTwo],
        activeSpaceId: spaceOneId,
        templatesById: {
          [templateOneId]: templateOne,
          [templateTwoId]: templateTwo,
        },
      });
      return <Story />;
    },
  ],
};
