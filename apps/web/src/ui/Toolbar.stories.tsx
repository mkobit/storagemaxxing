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
import { Toolbar } from "./Toolbar";

const templateId = SpaceTemplateIdSchema.parse("template-1");
const spaceId = SpaceInstanceIdSchema.parse("space-1");

const sampleTemplate = createSpaceTemplate(
  templateId,
  createDimensions3D(6, 6, 2),
  "top",
);

const sampleSpace = SpaceInstanceSchema.parse({
  id: spaceId,
  templateId,
  name: "Tool drawer",
  count: 1,
  constraints: {},
});

const meta: Meta<typeof Toolbar> = {
  component: Toolbar,
};
export default meta;

type Story = StoryObj<typeof Toolbar>;

export const Default: Story = {
  decorators: [
    (Story) => {
      useStore.setState({
        mode: "select",
        spaces: [],
        activeSpaceId: null,
        templatesById: {},
      });
      return <Story />;
    },
  ],
};

export const PanMode: Story = {
  decorators: [
    (Story) => {
      useStore.setState({
        mode: "pan",
        spaces: [],
        activeSpaceId: null,
        templatesById: {},
      });
      return <Story />;
    },
  ],
};

export const WithActiveSpace: Story = {
  decorators: [
    (Story) => {
      useStore.setState({
        mode: "select",
        spaces: [sampleSpace],
        activeSpaceId: spaceId,
        templatesById: { [templateId]: sampleTemplate },
      });
      return <Story />;
    },
  ],
};

export const DarkTheme: Story = {
  globals: {
    theme: "dark",
  },
  decorators: [
    (Story) => {
      useStore.setState({
        mode: "select",
        spaces: [sampleSpace],
        activeSpaceId: spaceId,
        templatesById: { [templateId]: sampleTemplate },
      });
      return <Story />;
    },
  ],
};
