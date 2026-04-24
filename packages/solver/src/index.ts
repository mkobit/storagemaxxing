import type {
  SpaceInstance,
  SpaceTemplate,
  AggregateConstraint,
  BinSpec,
} from "@storagemaxxing/assembly/index.js";

export type SolverRequest = {
  readonly spaces: readonly SpaceInstance[];
  readonly templates: readonly SpaceTemplate[];
  readonly bins: readonly BinSpec[];
  readonly aggregateConstraints: readonly AggregateConstraint[];
};

export type SolverResult = {
  readonly feasible: boolean;
  readonly conflicts: readonly string[];
  readonly suggestedCounts: ReadonlyRecord<
    string,
    ReadonlyRecord<string, number>
  >;
};

export type LinearModel = {
  readonly name: string;
  readonly objective: {
    readonly direction: number;
    readonly name: string;
    readonly vars: readonly { readonly name: string; readonly coef: number }[];
  };
  readonly subjectTo: readonly {
    readonly name: string;
    readonly vars: readonly { readonly name: string; readonly coef: number }[];
    readonly bnds: {
      readonly type: number;
      readonly ub: number;
      readonly lb: number;
    };
  }[];
  readonly bounds?: readonly {
    readonly name: string;
    readonly type: number;
    readonly ub: number;
    readonly lb: number;
  }[];
  readonly binaries?: readonly string[];
  readonly generals?: readonly string[];
};

export type WorkerRequest = {
  readonly type: "check_feasibility";
  readonly data: SolverRequest;
};

export type WorkerResponse = {
  readonly type: "feasibility_result";
  readonly result: SolverResult;
};

// Re-export feasibility function once created
export * from "./feasibility.js";
export * from "./useSolverWorker.js";

type ReadonlyRecord<K extends string | number | symbol, T> = {
  readonly [P in K]: T;
};
