import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
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
import { AppHeader } from "./AppHeader";

const templateOneId = SpaceTemplateIdSchema.parse("template-1");
const templateTwoId = SpaceTemplateIdSchema.parse("template-2");

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

const spaceOneId = SpaceInstanceIdSchema.parse("space-1");
const spaceTwoId = SpaceInstanceIdSchema.parse("space-2");

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

const meta: Meta<typeof AppHeader> = {
  component: AppHeader,
};
export default meta;

type Story = StoryObj<typeof AppHeader>;

export const Default: Story = {
  decorators: [
    (Story) => {
      useStore.setState({
        spaces: [],
        activeSpaceId: null,
        templatesById: {},
        constraintsBySpace: {},
      });
      return <Story />;
    },
  ],
};

export const WithSpaces: Story = {
  decorators: [
    (Story) => {
      useStore.setState({
        spaces: [spaceOne, spaceTwo],
        activeSpaceId: spaceOneId,
        templatesById: {
          [templateOneId]: templateOne,
          [templateTwoId]: templateTwo,
        },
        constraintsBySpace: {},
      });
      return <Story />;
    },
  ],
};

export const DevToolsOpen: Story = {
  decorators: [
    (Story) => {
      useStore.setState({
        spaces: [spaceOne],
        activeSpaceId: spaceOneId,
        templatesById: { [templateOneId]: templateOne },
        constraintsBySpace: {},
      });
      return (
        <div className="min-h-32">
          <Story />
        </div>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText("Dev Tools"));
    await expect(canvas.getByTestId("dev-tools-menu")).toHaveAttribute("open");
    await expect(canvas.getByTestId("add-starter-bins")).toBeVisible();
  },
};

export const SwitchingActiveSpace: Story = {
  decorators: [
    (Story) => {
      useStore.setState({
        spaces: [spaceOne, spaceTwo],
        activeSpaceId: spaceOneId,
        templatesById: {
          [templateOneId]: templateOne,
          [templateTwoId]: templateTwo,
        },
        constraintsBySpace: {},
      });
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId(`space-item-${spaceTwoId}`));
    await expect(
      canvas.getByTestId(`space-item-${spaceTwoId}`),
    ).toHaveAttribute("aria-current", "true");
  },
};
