import React, { useLayoutEffect } from "react";
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
import type { StoreState } from "@storagemaxxing/store/StoreTypes";
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

const StoreDecorator: React.FC<{
  readonly state: Partial<StoreState>;
  readonly children: React.ReactNode;
}> = ({ state, children }) => {
  useLayoutEffect(() => {
    useStore.setState(state);
  }, [state]);

  return <>{children}</>;
};

export const Default: Story = {
  decorators: [
    (Story) => (
      <StoreDecorator
        state={{
          spaces: [],
          activeSpaceId: null,
          templatesById: {},
          constraintsBySpace: {},
        }}
      >
        <Story />
      </StoreDecorator>
    ),
  ],
};

export const WithSpaces: Story = {
  decorators: [
    (Story) => (
      <StoreDecorator
        state={{
          spaces: [spaceOne, spaceTwo],
          activeSpaceId: spaceOneId,
          templatesById: {
            [templateOneId]: templateOne,
            [templateTwoId]: templateTwo,
          },
          constraintsBySpace: {},
        }}
      >
        <Story />
      </StoreDecorator>
    ),
  ],
};

export const DevToolsOpen: Story = {
  decorators: [
    (Story) => (
      <StoreDecorator
        state={{
          spaces: [spaceOne],
          activeSpaceId: spaceOneId,
          templatesById: { [templateOneId]: templateOne },
          constraintsBySpace: {},
        }}
      >
        <div className="min-h-32">
          <Story />
        </div>
      </StoreDecorator>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const summary = await canvas.findByText("Dev Tools");
    await userEvent.click(summary);
    await expect(await canvas.findByTestId("dev-tools-menu")).toHaveAttribute(
      "open",
    );
    await expect(await canvas.findByTestId("add-starter-bins")).toBeVisible();
  },
};

export const SwitchingActiveSpace: Story = {
  decorators: [
    (Story) => (
      <StoreDecorator
        state={{
          spaces: [spaceOne, spaceTwo],
          activeSpaceId: spaceOneId,
          templatesById: {
            [templateOneId]: templateOne,
            [templateTwoId]: templateTwo,
          },
          constraintsBySpace: {},
        }}
      >
        <Story />
      </StoreDecorator>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = await canvas.findByTestId("space-switcher-trigger");
    await userEvent.click(trigger);
    const item = await canvas.findByTestId(`space-item-${spaceTwoId}`);
    await userEvent.click(item);
    await expect(trigger).toHaveTextContent("Second drawer");
  },
};
