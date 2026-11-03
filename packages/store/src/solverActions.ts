import type { SpaceInstanceId } from "@storagemaxxing/assembly/SpaceInstance";
import {
  createConstraintFailure,
  createPackingMetrics,
  createPackingResult,
  type PackingResult,
} from "@storagemaxxing/assembly/PackingResult";
import type { AppState } from "./StoreTypes";

type SolverRunStatus = "idle" | "running" | "solved" | "error";

type SolverWorkerStatus =
  | "OPTIMAL"
  | "FEASIBLE"
  | "INFEASIBLE"
  | "MODEL_INVALID"
  | "UNKNOWN";

export type SolverWorkerEvent = {
  readonly type: "SOLVE_SPACE_RESULT";
  readonly requestId: string;
  readonly status: SolverWorkerStatus;
  readonly wallTimeMs: number;
  readonly packingResult?: PackingResult;
  readonly responseBuffer?: ArrayBuffer;
  readonly errorCode?: string;
  readonly errorMessage?: string;
};

export type SolverRunState = {
  readonly spaceId: SpaceInstanceId;
  readonly requestId: string;
  readonly status: SolverRunStatus;
  readonly solverStatus?: SolverWorkerStatus;
  readonly wallTimeMs?: number;
  readonly errorCode?: string;
  readonly errorMessage?: string;
  readonly result?: PackingResult;
};

const resolveTargetSpaceId = (
  state: AppState,
  event: SolverWorkerEvent,
  explicitSpaceId?: SpaceInstanceId,
): SpaceInstanceId | undefined => {
  if (explicitSpaceId !== undefined) return explicitSpaceId;
  const recorded = state.activeSolverRequests[event.requestId];
  if (recorded !== undefined) return recorded;
  const match = state.spaces.find(
    (s) => state.solverRunsBySpace[s.id]?.requestId === event.requestId,
  );
  return match?.id;
};

const createInfeasibleResult = (): PackingResult =>
  createPackingResult(
    [],
    createPackingMetrics({}, 0, [
      createConstraintFailure("infeasible", "hardMin", 1, 0),
    ]),
    "invalid",
  );

export const startSolverRunInState = (
  state: AppState,
  spaceId: SpaceInstanceId,
  requestId: string,
): AppState => {
  const run: SolverRunState = {
    spaceId,
    requestId,
    status: "running",
  };
  return {
    ...state,
    solverRunsBySpace: { ...state.solverRunsBySpace, [spaceId]: run },
    activeSolverRequests: {
      ...state.activeSolverRequests,
      [requestId]: spaceId,
    },
  };
};

const applyOptimalOrFeasible = (
  state: AppState,
  event: SolverWorkerEvent,
  target: SpaceInstanceId,
): AppState => {
  if (event.packingResult === undefined) return state;
  const run: SolverRunState = {
    spaceId: target,
    requestId: event.requestId,
    status: "solved",
    solverStatus: event.status,
    wallTimeMs: event.wallTimeMs,
    result: event.packingResult,
  };
  return {
    ...state,
    solverRunsBySpace: { ...state.solverRunsBySpace, [target]: run },
    solverResultsBySpace: {
      ...state.solverResultsBySpace,
      [target]: event.packingResult,
    },
  };
};

const applyInfeasible = (
  state: AppState,
  event: SolverWorkerEvent,
  target: SpaceInstanceId,
): AppState => {
  const result = event.packingResult ?? createInfeasibleResult();
  const run: SolverRunState = {
    spaceId: target,
    requestId: event.requestId,
    status: "solved",
    solverStatus: "INFEASIBLE",
    wallTimeMs: event.wallTimeMs,
    errorMessage: event.errorMessage,
    result,
  };
  return {
    ...state,
    solverRunsBySpace: { ...state.solverRunsBySpace, [target]: run },
    solverResultsBySpace: {
      ...state.solverResultsBySpace,
      [target]: result,
    },
  };
};

const applyError = (
  state: AppState,
  event: SolverWorkerEvent,
  target: SpaceInstanceId,
): AppState => {
  const run: SolverRunState = {
    spaceId: target,
    requestId: event.requestId,
    status: "error",
    solverStatus: event.status,
    wallTimeMs: event.wallTimeMs,
    errorCode: event.errorCode,
    errorMessage: event.errorMessage ?? event.errorCode,
  };
  const { [target]: _, ...remainingResults } = state.solverResultsBySpace;
  return {
    ...state,
    solverRunsBySpace: { ...state.solverRunsBySpace, [target]: run },
    solverResultsBySpace: remainingResults,
  };
};

export const applySolverEventInState = (
  state: AppState,
  event: SolverWorkerEvent,
  spaceId?: SpaceInstanceId,
): AppState => {
  const target = resolveTargetSpaceId(state, event, spaceId);
  if (target === undefined) return state;

  const currentRun = state.solverRunsBySpace[target];
  if (currentRun !== undefined && currentRun.requestId !== event.requestId) {
    return state;
  }

  if (event.status === "OPTIMAL" || event.status === "FEASIBLE") {
    return applyOptimalOrFeasible(state, event, target);
  }

  if (event.status === "INFEASIBLE") {
    return applyInfeasible(state, event, target);
  }

  return applyError(state, event, target);
};

export const clearSolverStateInState = (
  state: AppState,
  spaceId?: SpaceInstanceId,
): AppState => {
  if (spaceId === undefined) {
    return {
      ...state,
      solverRunsBySpace: {},
      solverResultsBySpace: {},
      activeSolverRequests: {},
    };
  }
  const { [spaceId]: _run, ...remainingRuns } = state.solverRunsBySpace;
  const { [spaceId]: _result, ...remainingResults } =
    state.solverResultsBySpace;
  return {
    ...state,
    solverRunsBySpace: remainingRuns,
    solverResultsBySpace: remainingResults,
  };
};

export const selectSolverRun = (
  state: AppState,
  spaceId?: SpaceInstanceId | null,
): SolverRunState | undefined => {
  if (spaceId === null || spaceId === undefined) return undefined;
  return state.solverRunsBySpace[spaceId];
};

export const selectActiveSolverRun = (
  state: AppState,
): SolverRunState | undefined => selectSolverRun(state, state.activeSpaceId);
