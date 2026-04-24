import type { SolverRequest, SolverResult, WorkerRequest, WorkerResponse } from "./index.js";

export type SolverWorkerStatus = "idle" | "running" | "success" | "error";

export type SolverWorkerState = {
  readonly status: SolverWorkerStatus;
  readonly result: SolverResult | null;
  readonly error: string | null;
};

export const initialSolverWorkerState: SolverWorkerState = {
  status: "idle",
  result: null,
  error: null,
};

export type SolverWorkerAction =
  | { readonly type: "START" }
  | { readonly type: "SUCCESS"; readonly payload: SolverResult }
  | { readonly type: "ERROR"; readonly payload: string }
  | { readonly type: "RESET" };

export const solverWorkerReducer = (
  state: SolverWorkerState,
  action: SolverWorkerAction
): SolverWorkerState => {
  if (action.type === "START") {
    return {
      status: "running",
      result: null,
      error: null,
    };
  }

  if (action.type === "SUCCESS") {
    return {
      status: "success",
      result: action.payload,
      error: null,
    };
  }

  if (action.type === "ERROR") {
    return {
      status: "error",
      result: null,
      error: action.payload,
    };
  }

  if (action.type === "RESET") {
    return initialSolverWorkerState;
  }

  return state;
};

export const createWorkerRequest = (data: SolverRequest): WorkerRequest => ({
  type: "check_feasibility",
  data,
});

export const handleWorkerResponse = (
  response: WorkerResponse
): SolverWorkerAction => {
  if (response.type === "feasibility_result") {
    return {
      type: "SUCCESS",
      payload: response.result,
    };
  }

  return {
    type: "ERROR",
    payload: "Unknown worker response type",
  };
};
