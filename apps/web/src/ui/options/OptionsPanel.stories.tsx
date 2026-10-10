import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
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
import { OptionsPanel } from "./OptionsPanel";

const templateId = SpaceTemplateIdSchema.parse("template-options");
const spaceId = SpaceInstanceIdSchema.parse("space-options");

const spaceTemplate = createSpaceTemplate(
  templateId,
  createDimensions3D(18, 12, 10),
  "front",
);

const unappliedSpace = SpaceInstanceSchema.parse({
  id: spaceId,
  templateId,
  name: "Parts cabinet",
  count: 1,
  constraints: {},
});

const topAccessTemplateId = SpaceTemplateIdSchema.parse("template-drawer");
const topAccessSpaceId = SpaceInstanceIdSchema.parse("space-drawer");

const topAccessTemplate = createSpaceTemplate(
  topAccessTemplateId,
  createDimensions3D(16, 12, 3),
  "top",
);

const topAccessSpace = SpaceInstanceSchema.parse({
  id: topAccessSpaceId,
  templateId: topAccessTemplateId,
  name: "Shallow drawer",
  count: 1,
  constraints: {},
});

const meta: Meta<typeof OptionsPanel> = {
  component: OptionsPanel,
  args: {
    onStrategyApplied: fn(),
  },
};
export default meta;

type Story = StoryObj<typeof OptionsPanel>;

export const NoActiveSpace: Story = {
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

export const StrategyComparisonCards: Story = {
  decorators: [
    (Story) => {
      useStore.setState({
        spaces: [unappliedSpace],
        activeSpaceId: spaceId,
        templatesById: { [templateId]: spaceTemplate },
        constraintsBySpace: {},
      });
      return <Story />;
    },
  ],
};

export const AppliedGridfinityStrategy: Story = {
  decorators: [
    (Story) => {
      useStore.setState({
        spaces: [unappliedSpace],
        activeSpaceId: spaceId,
        templatesById: { [templateId]: spaceTemplate },
        constraintsBySpace: {},
      });
      useStore.getState().applySpaceStrategy(spaceId, "gridfinity");
      return <Story />;
    },
  ],
};

export const AppliedSchallerStrategy: Story = {
  decorators: [
    (Story) => {
      useStore.setState({
        spaces: [unappliedSpace],
        activeSpaceId: spaceId,
        templatesById: { [templateId]: spaceTemplate },
        constraintsBySpace: {},
      });
      useStore.getState().applySpaceStrategy(spaceId, "schaller");
      return <Story />;
    },
  ],
};

export const TopAccessDrawer: Story = {
  decorators: [
    (Story) => {
      useStore.setState({
        spaces: [topAccessSpace],
        activeSpaceId: topAccessSpaceId,
        templatesById: { [topAccessTemplateId]: topAccessTemplate },
        constraintsBySpace: {},
      });
      return <Story />;
    },
  ],
};
