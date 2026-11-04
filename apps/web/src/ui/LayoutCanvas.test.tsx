import { describe, it, expect, beforeEach, mock } from "bun:test";
mock.module("idb-keyval", () => ({
  get: async () => null,
  set: async () => {},
  del: async () => {},
}));

import { act, render, screen, fireEvent } from "@testing-library/react";
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
import { createPoint3D } from "@storagemaxxing/geometry/Point3D";
import { createPlacedBin } from "@storagemaxxing/assembly/PlacedBin";
import {
  createPackingMetrics,
  createPackingResult,
} from "@storagemaxxing/assembly/PackingResult";

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

  const setUpSolverSpace = () => {
    const spaceId = SpaceInstanceIdSchema.parse("solver-space");
    const templateId = SpaceTemplateIdSchema.parse("solver-template");
    useStore.setState({
      activeSpaceId: spaceId,
      spaces: [
        SpaceInstanceSchema.parse({
          id: spaceId,
          templateId,
          name: "Solver space",
          count: 1,
          constraints: {},
        }),
      ],
      templatesById: {
        [templateId]: createSpaceTemplate(
          templateId,
          createDimensions3D(10, 10, 4),
          "top",
        ),
      },
    });
    return spaceId;
  };

  it("announces solver progress while retaining the preview and viewport controls", async () => {
    const spaceId = setUpSolverSpace();
    renderLayoutCanvas();

    await act(() => useStore.getState().startSolverRun(spaceId, "pending"));

    expect(screen.getByRole("status").textContent).toContain("Solving layout");
    expect(
      screen.getByTestId("layout-viewport").getAttribute("aria-busy"),
    ).toBe("true");
    expect(screen.getByTestId("layout-validity-badge").textContent).toBe(
      "valid",
    );
    fireEvent.click(screen.getByTestId("viewport-zoom-in"));
    expect(activeContext.clearRect).toHaveBeenCalled();
  });

  it.each(["OPTIMAL", "FEASIBLE"] as const)(
    "draws asynchronous %s placements and restores the preview when cleared",
    async (status) => {
      const spaceId = setUpSolverSpace();
      renderLayoutCanvas();
      await act(() =>
        useStore.getState().startSolverRun(spaceId, "async-result"),
      );
      expect(activeContext.fillRect).not.toHaveBeenCalled();

      await act(async () => {
        await Promise.resolve();
        useStore.getState().handleSolverEvent({
          type: "SOLVE_SPACE_RESULT",
          requestId: "async-result",
          status,
          wallTimeMs: 42,
          packingResult: createPackingResult(
            [createPlacedBin("gridfinity-1x1x1", createPoint3D(2, 0, 3))],
            createPackingMetrics({ "gridfinity-1x1x1": 1 }, 0.03, []),
            "partial",
          ),
        });
      });

      expect(screen.getByRole("status").textContent).toContain(
        status === "OPTIMAL" ? "Layout solved" : "Feasible layout found",
      );
      expect(screen.getByRole("status").textContent).toContain("42 ms");
      expect(
        screen.getByTestId("layout-viewport").getAttribute("aria-busy"),
      ).toBe("false");
      expect(screen.getByTestId("layout-validity-badge").textContent).toBe(
        "partial",
      );
      // A 10in square fits at 56px/in with offsets (120, 20).
      expect(
        activeContext.fillRect.mock.calls.some(
          (call: readonly unknown[]) => call[0] === 232 && call[1] === 188,
        ),
      ).toBe(true);

      activeContext.fillRect.mockClear();
      fireEvent.click(screen.getByRole("button", { name: "Use preview" }));
      expect(useStore.getState().solverRunsBySpace[spaceId]).toBeUndefined();
      expect(screen.getByTestId("layout-validity-badge").textContent).toBe(
        "valid",
      );
      expect(activeContext.fillRect).not.toHaveBeenCalled();
      expect(screen.queryByRole("status")).toBeNull();
    },
  );

  it("renders infeasible results as invalid with an explanation", async () => {
    const spaceId = setUpSolverSpace();
    renderLayoutCanvas();
    await act(() => useStore.getState().startSolverRun(spaceId, "infeasible"));

    await act(async () => {
      useStore.getState().handleSolverEvent({
        type: "SOLVE_SPACE_RESULT",
        requestId: "infeasible",
        status: "INFEASIBLE",
        wallTimeMs: 8,
      });
    });

    expect(screen.getByRole("status").textContent).toContain(
      "No feasible layout found",
    );
    expect(screen.getByTestId("layout-validity-badge").textContent).toBe(
      "invalid",
    );
    expect(
      screen.getByTestId("layout-viewport").getAttribute("aria-busy"),
    ).toBe("false");
  });

  it("announces solver failures and dismisses them through the store action", async () => {
    const spaceId = setUpSolverSpace();
    renderLayoutCanvas();
    await act(() => useStore.getState().startSolverRun(spaceId, "failed"));

    await act(async () => {
      useStore.getState().handleSolverEvent({
        type: "SOLVE_SPACE_RESULT",
        requestId: "failed",
        status: "UNKNOWN",
        wallTimeMs: 5,
        errorMessage: "Solver timed out",
      });
    });

    expect(screen.getByRole("alert").textContent).toContain("Solver timed out");
    expect(screen.getByTestId("layout-validity-badge").textContent).toBe(
      "valid",
    );
    expect(
      screen.getByTestId("layout-viewport").getAttribute("aria-busy"),
    ).toBe("false");
    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss solver error" }),
    );
    expect(useStore.getState().solverRunsBySpace[spaceId]).toBeUndefined();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("keeps progress scoped to the active space and ignores superseded responses", async () => {
    const spaceId = setUpSolverSpace();
    renderLayoutCanvas();
    await act(() => {
      useStore.getState().startSolverRun(spaceId, "old");
      useStore.getState().startSolverRun(spaceId, "new");
      useStore.getState().handleSolverEvent({
        type: "SOLVE_SPACE_RESULT",
        requestId: "old",
        status: "INFEASIBLE",
        wallTimeMs: 8,
      });
    });
    expect(screen.getByRole("status").textContent).toContain("Solving layout");
    expect(screen.getByTestId("layout-validity-badge").textContent).toBe(
      "valid",
    );

    await act(() => useStore.getState().setActiveSpace(null));
    expect(screen.queryByRole("status")).toBeNull();
    await act(() => useStore.getState().setActiveSpace(spaceId));
    expect(screen.getByRole("status").textContent).toContain("Solving layout");
  });

  it("removes completed solver feedback when edited constraints invalidate the result", async () => {
    const spaceId = setUpSolverSpace();
    const templateId = useStore.getState().spaces[0].templateId;
    renderLayoutCanvas();
    await act(() => {
      useStore.getState().startSolverRun(spaceId, "edited");
      useStore.getState().handleSolverEvent({
        type: "SOLVE_SPACE_RESULT",
        requestId: "edited",
        status: "INFEASIBLE",
        wallTimeMs: 8,
      });
    });
    expect(screen.getByTestId("layout-validity-badge").textContent).toBe(
      "invalid",
    );

    await act(() =>
      useStore
        .getState()
        .setConstraintForSpace(
          templateId,
          createSpaceConstraint("gridfinity-1x1x1", 1, 0),
        ),
    );

    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByTestId("layout-validity-badge").textContent).toBe(
      "valid",
    );
    expect(activeContext.fillRect).toHaveBeenCalled();
  });

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

  it("renders dedicated viewport controls in the layout container", () => {
    renderLayoutCanvas();
    expect(screen.getByTestId("layout-canvas-container")).toBeTruthy();
    expect(screen.getByTestId("toolbar")).toBeTruthy();
    expect(screen.getByTestId("mode-select")).toBeTruthy();
    expect(screen.getByTestId("mode-pan")).toBeTruthy();
    expect(screen.getByTestId("viewport-zoom-in")).toBeTruthy();
    expect(screen.getByTestId("viewport-zoom-out")).toBeTruthy();
    expect(screen.getByTestId("viewport-fit")).toBeTruthy();
    expect(screen.getByTestId("wireframe-toggle")).toBeTruthy();
  });

  it("toggles wireframe preview mode and updates aria-pressed", () => {
    const spaceId = SpaceInstanceIdSchema.parse("grid-space");
    const templateId = SpaceTemplateIdSchema.parse("grid-template");
    const template = createSpaceTemplate(
      templateId,
      createDimensions3D(6, 6, 2),
      "top",
    );
    useStore.setState({
      activeSpaceId: spaceId,
      spaces: [
        SpaceInstanceSchema.parse({
          id: spaceId,
          templateId,
          name: "Test Space",
          count: 1,
          constraints: {},
        }),
      ],
      templatesById: { [templateId]: template },
    });

    renderLayoutCanvas();
    const toggle = screen.getByTestId("wireframe-toggle");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
  });

  it("handles zoom and fit controls interaction", () => {
    const spaceId = SpaceInstanceIdSchema.parse("grid-space");
    const templateId = SpaceTemplateIdSchema.parse("grid-template");
    const template = createSpaceTemplate(
      templateId,
      createDimensions3D(6, 6, 2),
      "top",
    );
    useStore.setState({
      activeSpaceId: spaceId,
      spaces: [
        SpaceInstanceSchema.parse({
          id: spaceId,
          templateId,
          name: "Test Space",
          count: 1,
          constraints: {},
        }),
      ],
      templatesById: { [templateId]: template },
    });

    renderLayoutCanvas();
    const zoomIn = screen.getByTestId("viewport-zoom-in");
    const zoomOut = screen.getByTestId("viewport-zoom-out");
    const fit = screen.getByTestId("viewport-fit");

    fireEvent.click(zoomIn);
    fireEvent.click(zoomOut);
    fireEvent.click(fit);
    expect(screen.getByTestId("toolbar")).toBeTruthy();
    expect(activeContext.clearRect).toHaveBeenCalled();
  });

  it("supports pan dragging when pan mode is active", () => {
    const spaceId = SpaceInstanceIdSchema.parse("grid-space");
    const templateId = SpaceTemplateIdSchema.parse("grid-template");
    const template = createSpaceTemplate(
      templateId,
      createDimensions3D(6, 6, 2),
      "top",
    );
    useStore.setState({
      activeSpaceId: spaceId,
      mode: "pan",
      spaces: [
        SpaceInstanceSchema.parse({
          id: spaceId,
          templateId,
          name: "Test Space",
          count: 1,
          constraints: {},
        }),
      ],
      templatesById: { [templateId]: template },
    });

    const { container } = renderLayoutCanvas();
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
    if (!canvas) return;

    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(canvas, { clientX: 120, clientY: 130 });
    fireEvent.mouseUp(canvas);
  });
});
