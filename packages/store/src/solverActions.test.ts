import { describe, expect, test } from "bun:test";
import { AppState, initialState } from "./StoreTypes";
import {
  applySolverEventInState,
  clearSolverStateInState,
  selectActiveSolverRun,
  selectSolverRun,
  startSolverRunInState,
  type SolverWorkerEvent,
} from "./solverActions";
import { selectPackedLayout } from "./layoutSelectors";
import { useStore } from "./useStore";
import {
  SpaceInstanceSchema,
  type SpaceInstanceId,
} from "@storagemaxxing/assembly/SpaceInstance";
import {
  createSpaceTemplate,
  type SpaceTemplateId,
} from "@storagemaxxing/assembly/SpaceTemplate";
import { createDimensions3D } from "@storagemaxxing/geometry/Dimensions3D";
import {
  createPackingMetrics,
  createPackingResult,
  type PackingResult,
} from "@storagemaxxing/assembly/PackingResult";
import { createPoint3D } from "@storagemaxxing/geometry/Point3D";
import { createPlacedBin } from "@storagemaxxing/assembly/PlacedBin";
import { createSpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import { BinSpecId } from "@storagemaxxing/assembly/BaseTypes";

const TEMPLATE_ID = "template-test" as SpaceTemplateId;
const SPACE_ID = "space-test" as SpaceInstanceId;

const template = createSpaceTemplate(
  TEMPLATE_ID,
  createDimensions3D(12, 10, 4),
  "top",
);

const space = SpaceInstanceSchema.parse({
  id: SPACE_ID,
  templateId: TEMPLATE_ID,
  name: "Test Space",
  count: 1,
  constraints: {},
});

const baseState: AppState = {
  ...initialState,
  templatesById: { [TEMPLATE_ID]: template },
  spaces: [space],
  activeSpaceId: SPACE_ID,
};

const dummyOptimalResult: PackingResult = createPackingResult(
  [createPlacedBin("bin-a", createPoint3D(0, 0, 0))],
  createPackingMetrics({ "bin-a": 1 }, 0.65, []),
  "valid",
);

describe("solverActions: state transitions and selectors", () => {
  test("startSolverRunInState marks solver status as running for target space", () => {
    const updated = startSolverRunInState(baseState, SPACE_ID, "req-1");
    const run = selectSolverRun(updated, SPACE_ID);

    expect(run).toBeDefined();
    expect(run?.spaceId).toBe(SPACE_ID);
    expect(run?.requestId).toBe("req-1");
    expect(run?.status).toBe("running");
  });

  test("applySolverEventInState applies optimal solve result to layout state and validity metrics", () => {
    const started = startSolverRunInState(baseState, SPACE_ID, "req-1");
    const event: SolverWorkerEvent = {
      type: "SOLVE_SPACE_RESULT",
      requestId: "req-1",
      status: "OPTIMAL",
      wallTimeMs: 142,
      packingResult: dummyOptimalResult,
    };

    const solved = applySolverEventInState(started, event);
    const run = selectSolverRun(solved, SPACE_ID);

    expect(run?.status).toBe("solved");
    expect(run?.solverStatus).toBe("OPTIMAL");
    expect(run?.wallTimeMs).toBe(142);
    expect(run?.result).toEqual(dummyOptimalResult);

    const layout = selectPackedLayout(solved);
    expect(layout.kind).toBe("resolved");
    if (layout.kind === "resolved") {
      expect(layout.result.validity).toBe("valid");
      expect(layout.result.metrics.placedCounts["bin-a"]).toBe(1);
      expect(layout.result.metrics.areaUtilization).toBe(0.65);
      expect(layout.result.metrics.failures).toHaveLength(0);
      expect(layout.result.placedBins).toHaveLength(1);
    }
  });

  test("applySolverEventInState handles infeasible status with invalid validity metric", () => {
    const started = startSolverRunInState(baseState, SPACE_ID, "req-2");
    const event: SolverWorkerEvent = {
      type: "SOLVE_SPACE_RESULT",
      requestId: "req-2",
      status: "INFEASIBLE",
      wallTimeMs: 38,
      errorMessage: "No feasible solution within constraints",
    };

    const solved = applySolverEventInState(started, event);
    const run = selectSolverRun(solved, SPACE_ID);

    expect(run?.status).toBe("solved");
    expect(run?.solverStatus).toBe("INFEASIBLE");

    const layout = selectPackedLayout(solved);
    expect(layout.kind).toBe("resolved");
    if (layout.kind === "resolved") {
      expect(layout.result.validity).toBe("invalid");
      expect(layout.result.metrics.failures.length).toBeGreaterThan(0);
    }
  });

  test("applySolverEventInState handles solver error", () => {
    const started = startSolverRunInState(baseState, SPACE_ID, "req-3");
    const event: SolverWorkerEvent = {
      type: "SOLVE_SPACE_RESULT",
      requestId: "req-3",
      status: "MODEL_INVALID",
      wallTimeMs: 5,
      errorCode: "LOAD_FAILED",
      errorMessage: "WASM compilation failed",
    };

    const solved = applySolverEventInState(started, event);
    const run = selectSolverRun(solved, SPACE_ID);

    expect(run?.status).toBe("error");
    expect(run?.solverStatus).toBe("MODEL_INVALID");
    expect(run?.errorMessage).toBe("WASM compilation failed");
  });

  test("superseded request results are discarded when a newer solve is active", () => {
    const first = startSolverRunInState(baseState, SPACE_ID, "req-first");
    const second = startSolverRunInState(first, SPACE_ID, "req-second");

    const staleEvent: SolverWorkerEvent = {
      type: "SOLVE_SPACE_RESULT",
      requestId: "req-first",
      status: "OPTIMAL",
      wallTimeMs: 200,
      packingResult: dummyOptimalResult,
    };

    const afterStale = applySolverEventInState(second, staleEvent);
    const run = selectSolverRun(afterStale, SPACE_ID);

    expect(run?.requestId).toBe("req-second");
    expect(run?.status).toBe("running");
  });

  test("clearSolverStateInState clears solver results and falls back to Layer 1 layout", () => {
    const started = startSolverRunInState(baseState, SPACE_ID, "req-1");
    const solved = applySolverEventInState(started, {
      type: "SOLVE_SPACE_RESULT",
      requestId: "req-1",
      status: "OPTIMAL",
      wallTimeMs: 100,
      packingResult: dummyOptimalResult,
    });

    const cleared = clearSolverStateInState(solved, SPACE_ID);
    expect(selectSolverRun(cleared, SPACE_ID)).toBeUndefined();
    expect(selectActiveSolverRun(cleared)).toBeUndefined();
  });
});

describe("solverActions: store integration", () => {
  test("useStore runs solver actions and updates active layout state", () => {
    useStore.setState({
      ...baseState,
      spaces: [space],
      activeSpaceId: SPACE_ID,
      templatesById: { [TEMPLATE_ID]: template },
    });

    useStore.getState().startSolverRun(SPACE_ID, "store-req-1");
    expect(useStore.getState().solverRunsBySpace[SPACE_ID]?.status).toBe(
      "running",
    );

    useStore.getState().handleSolverEvent({
      type: "SOLVE_SPACE_RESULT",
      requestId: "store-req-1",
      status: "OPTIMAL",
      wallTimeMs: 90,
      packingResult: dummyOptimalResult,
    });

    const currentState = useStore.getState();
    expect(currentState.solverRunsBySpace[SPACE_ID]?.status).toBe("solved");
    expect(currentState.solverResultsBySpace[SPACE_ID]).toEqual(
      dummyOptimalResult,
    );

    const layout = selectPackedLayout(currentState);
    expect(layout.kind).toBe("resolved");
    if (layout.kind === "resolved") {
      expect(layout.result.validity).toBe("valid");
    }

    // Constraint change invalidates previous solver results
    useStore
      .getState()
      .setConstraintForSpace(
        TEMPLATE_ID,
        createSpaceConstraint("bin-x" as BinSpecId, 1, 0, 1),
      );
    const updatedState = useStore.getState();
    expect(updatedState.solverResultsBySpace[SPACE_ID]).toBeUndefined();
  });
});
