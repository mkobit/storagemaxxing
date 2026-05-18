import type { SpaceInstance } from "@storagemaxxing/assembly/SpaceInstance";
import type { SpaceTemplate } from "@storagemaxxing/assembly/SpaceTemplate";
import type { BinSpec } from "@storagemaxxing/assembly/BinSpec";
import type { AggregateConstraint } from "@storagemaxxing/assembly/BaseTypes";

export type SolverRequest = {
  readonly spaces: readonly SpaceInstance[];
  readonly templates: readonly SpaceTemplate[];
  readonly bins: readonly BinSpec[];
  readonly aggregateConstraints: readonly AggregateConstraint[];
};

export type ReadonlyRecord<K extends string | number | symbol, T> = {
  readonly [P in K]: T;
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
