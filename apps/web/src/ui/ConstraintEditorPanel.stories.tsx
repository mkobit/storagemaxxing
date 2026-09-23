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
import { ConstraintEditorPanel } from "./ConstraintEditorPanel";
import { binColorForIndex } from "./binColorPalette";

const templateId = SpaceTemplateIdSchema.parse("template-1");
const spaceId = SpaceInstanceIdSchema.parse("space-1");

const baseTemplate = createSpaceTemplate(
  templateId,
  createDimensions3D(6, 6, 2),
  "top",
);

const binOneId = BinSpecIdSchema.parse("gridfinity-1x1x2");
const binTwoId = BinSpecIdSchema.parse("gridfinity-1x2x2");
const accessoryId = BinSpecIdSchema.parse("gridfinity-hook-1x1");

const emptyConstraintsSpace = SpaceInstanceSchema.parse({
  id: spaceId,
  templateId,
  name: "Tool drawer",
  count: 1,
  constraints: {},
});

const multipleConstraintsSpace = SpaceInstanceSchema.parse({
  id: spaceId,
  templateId,
  name: "Tool drawer",
  count: 1,
  constraints: {
    [binOneId]: {
      ...createSpaceConstraint(binOneId, 2, 0, 4),
      color: binColorForIndex(0),
    },
    [binTwoId]: {
      ...createSpaceConstraint(binTwoId, 1, 0, 2),
      color: binColorForIndex(1),
    },
    [accessoryId]: {
      ...createSpaceConstraint(accessoryId, 1, 0),
      color: binColorForIndex(2),
    },
  },
});

const meta: Meta<typeof ConstraintEditorPanel> = {
  component: ConstraintEditorPanel,
};
export default meta;

type Story = StoryObj<typeof ConstraintEditorPanel>;

export const EmptyConstraints: Story = {
  decorators: [
    (Story) => {
      useStore.setState({
        spaces: [emptyConstraintsSpace],
        activeSpaceId: spaceId,
        templatesById: { [templateId]: baseTemplate },
      });
      return <Story />;
    },
  ],
};

export const MultipleConstraints: Story = {
  decorators: [
    (Story) => {
      useStore.setState({
        spaces: [multipleConstraintsSpace],
        activeSpaceId: spaceId,
        templatesById: { [templateId]: baseTemplate },
      });
      return <Story />;
    },
  ],
};

export const InstallationConstraints: Story = {
  decorators: [
    (Story) => {
      useStore.setState({
        spaces: [emptyConstraintsSpace],
        activeSpaceId: spaceId,
        templatesById: {
          [templateId]: {
            ...baseTemplate,
            installationConstraints: [
              { type: "noDrill" },
              { type: "railPresent" },
            ],
          },
        },
      });
      return <Story />;
    },
  ],
};

export const WithMaxWeight: Story = {
  decorators: [
    (Story) => {
      useStore.setState({
        spaces: [emptyConstraintsSpace],
        activeSpaceId: spaceId,
        templatesById: {
          [templateId]: {
            ...baseTemplate,
            installationConstraints: [{ type: "maxWeightLbs", value: 50 }],
          },
        },
      });
      return <Story />;
    },
  ],
};

export const NoActiveSpace: Story = {
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
