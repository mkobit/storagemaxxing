import type { Meta, StoryObj } from "@storybook/react-vite";
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
import { SpaceManager } from "./SpaceManager";

const templateOneId = SpaceTemplateIdSchema.parse("template-1");
const templateTwoId = SpaceTemplateIdSchema.parse("template-2");
const templateThreeId = SpaceTemplateIdSchema.parse("template-3");

const templateOne = createSpaceTemplate(
  templateOneId,
  createDimensions3D(6, 6, 2),
  "top",
);
const templateTwo = createSpaceTemplate(
  templateTwoId,
  createDimensions3D(8, 4, 3),
  "top",
);
const templateThree = createSpaceTemplate(
  templateThreeId,
  createDimensions3D(4, 4, 2),
  "top",
);

const spaceOneId = SpaceInstanceIdSchema.parse("space-1");
const spaceTwoId = SpaceInstanceIdSchema.parse("space-2");
const spaceThreeId = SpaceInstanceIdSchema.parse("space-3");

const spaceOne = SpaceInstanceSchema.parse({
  id: spaceOneId,
  templateId: templateOneId,
  name: "First drawer",
  count: 1,
  constraints: {},
});

const spaceTwo = SpaceInstanceSchema.parse({
  id: spaceTwoId,
  templateId: templateTwoId,
  name: "Second drawer",
  count: 1,
  constraints: {},
});

const spaceThree = SpaceInstanceSchema.parse({
  id: spaceThreeId,
  templateId: templateThreeId,
  name: "Deep bin",
  count: 1,
  constraints: {},
});

const meta: Meta<typeof SpaceManager> = {
  component: SpaceManager,
};
export default meta;

type Story = StoryObj<typeof SpaceManager>;

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

export const SingleSpace: Story = {
  decorators: [
    (Story) => {
      useStore.setState({
        spaces: [spaceOne],
        activeSpaceId: spaceOneId,
        templatesById: { [templateOneId]: templateOne },
      });
      return <Story />;
    },
  ],
};

export const MultipleSpaces: Story = {
  decorators: [
    (Story) => {
      useStore.setState({
        spaces: [spaceOne, spaceTwo, spaceThree],
        activeSpaceId: spaceOneId,
        templatesById: {
          [templateOneId]: templateOne,
          [templateTwoId]: templateTwo,
          [templateThreeId]: templateThree,
        },
      });
      return <Story />;
    },
  ],
};
