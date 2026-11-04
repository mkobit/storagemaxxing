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
import { createSpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import { useStore } from "@storagemaxxing/store/useStore";
import { initialState } from "@storagemaxxing/store/StoreTypes";
import {
  startSolverRunInState,
  applySolverEventInState,
  type SolverWorkerEvent,
} from "@storagemaxxing/store/solverActions";
import {
  createPackingMetrics,
  createPackingResult,
} from "@storagemaxxing/assembly/PackingResult";
import { createPlacedBin } from "@storagemaxxing/assembly/PlacedBin";
import { createPoint3D } from "@storagemaxxing/geometry/Point3D";
import { LayoutCanvas } from "./LayoutCanvas";
import { binColorForIndex } from "./binColorPalette";

const templateId = SpaceTemplateIdSchema.parse("layout-story-template");
const spaceId = SpaceInstanceIdSchema.parse("layout-story-space");

const sampleTemplate = createSpaceTemplate(
  templateId,
  createDimensions3D(8, 8, 3),
  "top",
  { backClearance: 1.5 },
);

const sampleSpace = SpaceInstanceSchema.parse({
  id: spaceId,
  templateId,
  name: "Workspace drawer",
  count: 1,
  constraints: {
    "gridfinity-1x1x1": {
      ...createSpaceConstraint("gridfinity-1x1x1", 2, 0),
      color: binColorForIndex(0),
    },
    "gridfinity-hook-1x1": {
      ...createSpaceConstraint("gridfinity-hook-1x1", 1, 0),
      color: binColorForIndex(1),
    },
  },
});

const meta: Meta<typeof LayoutCanvas> = {
  component: LayoutCanvas,
};
export default meta;

type Story = StoryObj<typeof LayoutCanvas>;

export const Empty: Story = {
  decorators: [
    (Story) => {
      useStore.setState({
        ...initialState,
        mode: "select",
        spaces: [],
        activeSpaceId: null,
        templatesById: {},
      });
      return <Story />;
    },
  ],
};

export const Default: Story = {
  decorators: [
    (Story) => {
      useStore.setState({
        ...initialState,
        mode: "select",
        spaces: [sampleSpace],
        activeSpaceId: spaceId,
        templatesById: { [templateId]: sampleTemplate },
      });
      return <Story />;
    },
  ],
};

export const PanMode: Story = {
  decorators: [
    (Story) => {
      useStore.setState({
        ...initialState,
        mode: "pan",
        spaces: [sampleSpace],
        activeSpaceId: spaceId,
        templatesById: { [templateId]: sampleTemplate },
      });
      return <Story />;
    },
  ],
};

export const MissingTemplate: Story = {
  decorators: [
    (Story) => {
      useStore.setState({
        ...initialState,
        mode: "select",
        spaces: [
          SpaceInstanceSchema.parse({
            id: spaceId,
            templateId: SpaceTemplateIdSchema.parse("missing-template-id"),
            name: "Broken Space",
            count: 1,
            constraints: {},
          }),
        ],
        activeSpaceId: spaceId,
        templatesById: {},
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
        ...initialState,
        mode: "select",
        spaces: [sampleSpace],
        activeSpaceId: spaceId,
        templatesById: { [templateId]: sampleTemplate },
      });
      return <Story />;
    },
  ],
};

const solverRequestId = "layout-story-solve";

const solverStory = (event?: SolverWorkerEvent): Story => ({
  decorators: [
    (Story) => {
      const running = startSolverRunInState(
        {
          ...initialState,
          spaces: [sampleSpace],
          activeSpaceId: spaceId,
          templatesById: { [templateId]: sampleTemplate },
        },
        spaceId,
        solverRequestId,
      );
      useStore.setState(
        event ? applySolverEventInState(running, event) : running,
      );
      return <Story />;
    },
  ],
});

export const Solving = solverStory();

export const SolverResult = solverStory({
  type: "SOLVE_SPACE_RESULT",
  requestId: solverRequestId,
  status: "OPTIMAL",
  wallTimeMs: 42,
  packingResult: createPackingResult(
    [
      createPlacedBin("gridfinity-1x1x1", createPoint3D(1, 0, 1)),
      createPlacedBin("gridfinity-1x1x1", createPoint3D(3, 0, 1)),
      createPlacedBin("gridfinity-hook-1x1", createPoint3D(1, 0, 3)),
    ],
    createPackingMetrics(
      { "gridfinity-1x1x1": 2, "gridfinity-hook-1x1": 1 },
      0.15,
      [],
    ),
    "valid",
  ),
});

export const Infeasible = solverStory({
  type: "SOLVE_SPACE_RESULT",
  requestId: solverRequestId,
  status: "INFEASIBLE",
  wallTimeMs: 12,
});

export const SolverError = solverStory({
  type: "SOLVE_SPACE_RESULT",
  requestId: solverRequestId,
  status: "UNKNOWN",
  wallTimeMs: 6000,
  errorMessage: "Solver timed out. The preview is still available.",
});
