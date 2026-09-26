import { describe, it, expect, beforeEach, mock } from "bun:test";
mock.module("idb-keyval", () => ({
  get: async () => null,
  set: async () => {},
  del: async () => {},
}));

import { render, screen } from "@testing-library/react";
import { LayoutCanvas, drawSpaceBounds, LayoutTransform } from "./LayoutCanvas";
import { ThemeProvider } from "./theme/ThemeProvider";
import { useStore } from "@storagemaxxing/store/useStore";
import { initialState } from "@storagemaxxing/store/StoreTypes";
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
import { createRect2D } from "@storagemaxxing/geometry/Rect2D";
import { createPoint2D } from "@storagemaxxing/geometry/Point2D";
import { createDimensions2D } from "@storagemaxxing/geometry/Dimensions2D";

type MockCanvasContext = {
  readonly clearRect: ReturnType<typeof mock>;
  readonly fillRect: ReturnType<typeof mock>;
  readonly strokeRect: ReturnType<typeof mock>;
  readonly setLineDash: ReturnType<typeof mock>;
  readonly save: ReturnType<typeof mock>;
  readonly restore: ReturnType<typeof mock>;
  readonly beginPath: ReturnType<typeof mock>;
  readonly closePath: ReturnType<typeof mock>;
  readonly rect: ReturnType<typeof mock>;
  readonly clip: ReturnType<typeof mock>;
  readonly moveTo: ReturnType<typeof mock>;
  readonly lineTo: ReturnType<typeof mock>;
  readonly stroke: ReturnType<typeof mock>;
  readonly fillText: ReturnType<typeof mock>;
  readonly fillStyle: string;
  readonly strokeStyle: string;
  readonly lineWidth: number;
  readonly font: string;
  readonly textBaseline: string;
};

const createMockContext = (): MockCanvasContext => ({
  clearRect: mock(),
  fillRect: mock(),
  strokeRect: mock(),
  setLineDash: mock(),
  save: mock(),
  restore: mock(),
  beginPath: mock(),
  closePath: mock(),
  rect: mock(),
  clip: mock(),
  moveTo: mock(),
  lineTo: mock(),
  stroke: mock(),
  fillText: mock(),
  fillStyle: "",
  strokeStyle: "",
  lineWidth: 1,
  font: "",
  textBaseline: "",
});

describe("LayoutCanvas", () => {
  const activeContext = createMockContext();

  beforeEach(() => {
    useStore.setState(initialState);
    activeContext.clearRect.mockClear();
    activeContext.fillRect.mockClear();
    activeContext.strokeRect.mockClear();
    activeContext.setLineDash.mockClear();
    activeContext.save.mockClear();
    activeContext.restore.mockClear();
    activeContext.beginPath.mockClear();
    activeContext.closePath.mockClear();
    activeContext.rect.mockClear();
    activeContext.clip.mockClear();
    activeContext.moveTo.mockClear();
    activeContext.lineTo.mockClear();
    activeContext.stroke.mockClear();

    // eslint-disable-next-line functional/immutable-data -- mock getContext for Happy DOM canvas testing
    HTMLCanvasElement.prototype.getContext = mock((contextId: string) => {
      if (contextId === "2d") {
        return activeContext as unknown as CanvasRenderingContext2D;
      }
      return null;
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  });

  const renderLayoutCanvas = () =>
    render(<LayoutCanvas />, { wrapper: ThemeProvider });

  it("renders an empty state when no active space is selected", () => {
    renderLayoutCanvas();
    expect(
      screen.getByText("Select or add a space to view the layout."),
    ).toBeTruthy();
  });

  it("renders an error when active space references a missing template", () => {
    const spaceId = SpaceInstanceIdSchema.parse("test-space");
    const missingTemplateId = SpaceTemplateIdSchema.parse("missing-template");
    useStore.setState({
      activeSpaceId: spaceId,
      spaces: [
        SpaceInstanceSchema.parse({
          id: spaceId,
          templateId: missingTemplateId,
          name: "Test Space",
          count: 1,
          constraints: {},
        }),
      ],
      templatesById: {},
    });

    renderLayoutCanvas();
    expect(screen.getByTestId("layout-error-missing-template")).toBeTruthy();
  });

  it("visually distinguishes accessory footprints from bin footprints when both are placed", () => {
    const templateId = SpaceTemplateIdSchema.parse("grid-template");
    const spaceId = SpaceInstanceIdSchema.parse("grid-space");
    const template = createSpaceTemplate(
      templateId,
      createDimensions3D(6, 6, 2),
      "top",
    );

    // One bin constraint and one accessory constraint
    const binConstraint = {
      ...createSpaceConstraint("gridfinity-1x1x1", 1, 0),
      color: "#2563eb",
    };
    const accessoryConstraint = {
      ...createSpaceConstraint("gridfinity-hook-1x1", 1, 0),
      color: "#d97706",
    };

    const space = SpaceInstanceSchema.parse({
      id: spaceId,
      templateId,
      name: "Mixed space",
      count: 1,
      constraints: {
        "gridfinity-1x1x1": binConstraint,
        "gridfinity-hook-1x1": accessoryConstraint,
      },
    });

    useStore.setState({
      activeSpaceId: spaceId,
      spaces: [space],
      templatesById: { [templateId]: template },
    });

    renderLayoutCanvas();

    // Space bounds uses setLineDash([4, 2]) and resets with setLineDash([])
    // Placed accessory uses setLineDash([4, 2]) and resets with setLineDash([])
    // Standard bins use solid stroke without setting dashed border
    const dashCalls = activeContext.setLineDash.mock.calls;
    const accessoryDashes = dashCalls.filter(
      (call: readonly unknown[]) =>
        Array.isArray(call[0]) &&
        call[0].length === 2 &&
        call[0][0] === 4 &&
        call[0][1] === 2,
    );
    // At least 2 dashed stroke configurations: 1 for space bounds, 1 for accessory
    expect(accessoryDashes.length).toBeGreaterThanOrEqual(2);

    // Accessory clipping and diagonal hatch lines are drawn
    expect(activeContext.clip.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(activeContext.moveTo.mock.calls.length).toBeGreaterThan(0);
    expect(activeContext.lineTo.mock.calls.length).toBeGreaterThan(0);

    // Both bin and accessory footprints are filled and stroked
    expect(activeContext.fillRect.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(activeContext.strokeRect.mock.calls.length).toBeGreaterThanOrEqual(
      2,
    );
  });

  it("draws reach clearance shaded band, dashed divider, and label when backClearance is defined", () => {
    const template = createSpaceTemplate(
      "test-template",
      createDimensions3D(10, 20, 4),
      "top",
      { backClearance: 4 },
    );
    const transform: LayoutTransform = {
      fit: {
        scale: 10,
        offsetX: 20,
        offsetY: 20,
      },
      bounds: createRect2D(createPoint2D(0, 0), createDimensions2D(10, 20)),
    };

    drawSpaceBounds(
      activeContext as unknown as CanvasRenderingContext2D,
      template,
      transform,
    );

    // Total space outline is stroked with dashed line
    expect(activeContext.strokeRect).toHaveBeenCalledWith(20, 20, 100, 200);

    // Reach clearance shaded band is filled at usable depth (16 * 10 + 20 = 180)
    expect(activeContext.fillRect).toHaveBeenCalledWith(20, 180, 100, 40);

    // Divider line is drawn
    expect(activeContext.moveTo).toHaveBeenCalledWith(20, 180);
    expect(activeContext.lineTo).toHaveBeenCalledWith(120, 180);

    // Label with clearance and usable depth is rendered
    expect(activeContext.fillText).toHaveBeenCalledWith(
      "4.0in reach clearance (usable depth 16.0in)",
      28,
      200,
    );
  });
});
