/* eslint-disable functional/no-let, functional/no-expression-statements, functional/no-try-statements, functional/prefer-readonly-type */
import GLPK from "glpk.js";
import {
  SolverRequest,
  SolverResult,
  LinearModel,
} from "./index.js";
import {
  SpaceInstance,
  BinSpec,
  SpaceTemplate,
  SpaceConstraint,
} from "@storagemaxxing/assembly/index.js";

export const GLP_MAX = 2;
export const GLP_LO = 2;
export const GLP_UP = 3;
export const GLP_DB = 4;
export const GLP_FX = 5;

// Define minimal types for GLPK since we don't have @types/glpk.js
export interface GLPKResult {
  readonly result: {
    readonly status: number;
    readonly vars?: Record<string, number>;
  };
}

export interface GLPKInstance {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly solve: (model: any, msgLevel: number) => GLPKResult;
  readonly GLP_MSG_OFF: number;
  readonly GLP_OPT: number;
  readonly GLP_FEAS: number;
}

let glpkInstance: GLPKInstance | null = null;

export const getGlpk = async (): Promise<GLPKInstance> => {
  if (glpkInstance) {
    return glpkInstance;
  }
  try {
    const nodeGLPK = await import("glpk.js/node");
    const factory = nodeGLPK.default || nodeGLPK;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const instance = (await factory()) as GLPKInstance;
    glpkInstance = instance;
    return instance;
  } catch {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any
    const factory = (GLPK as any).default || GLPK;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const instance = (await factory()) as GLPKInstance;
    glpkInstance = instance;
    return instance;
  }
};

export type GLPKVar = { readonly name: string; readonly coef: number };
export type GLPKBnd = {
  readonly name: string;
  readonly type: number;
  readonly lb: number;
  readonly ub: number;
};
export type GLPKSubjTo = {
  readonly name: string;
  readonly vars: readonly GLPKVar[];
  readonly bnds: {
    readonly type: number;
    readonly lb: number;
    readonly ub: number;
  };
};

export const getVarName = (spaceId: string, binId: string) => `c_${spaceId}_${binId}`;

export const getBinBoundInfo = (constraint: SpaceConstraint | undefined) => {
  if (!constraint) return { lb: 0, ub: 0, type: GLP_LO };
  if (constraint.mode === "hard") {
    if (constraint.hi !== null)
      return { lb: constraint.lo, ub: constraint.hi, type: GLP_DB };
    return { lb: constraint.lo, ub: 0, type: GLP_LO };
  }
  if (constraint.mode === "soft") {
    if (constraint.hi !== null)
      return { lb: 0, ub: constraint.hi, type: GLP_DB };
    return { lb: 0, ub: 0, type: GLP_LO };
  }
  if (constraint.mode === "off") return { lb: 0, ub: 0, type: GLP_FX };
  return { lb: 0, ub: 0, type: GLP_LO };
};

type BinModelParts = {
  readonly vars: readonly GLPKVar[];
  readonly bounds: readonly GLPKBnd[];
  readonly geomVars: readonly GLPKVar[];
  readonly generals: readonly string[];
};

type SpaceModelParts = {
  readonly vars: readonly GLPKVar[];
  readonly bounds: readonly GLPKBnd[];
  readonly subjectTo: readonly GLPKSubjTo[];
  readonly generals: readonly string[];
};

export const buildSpaceModelParts = (
  spaces: readonly SpaceInstance[],
  bins: readonly BinSpec[],
  templateMap: Map<string, SpaceTemplate>,
  binAreaMap: Map<string, number>,
): SpaceModelParts => {
  const emptyVars: readonly GLPKVar[] = [];
  const emptyBounds: readonly GLPKBnd[] = [];
  const emptySubj: readonly GLPKSubjTo[] = [];
  const emptyGenerals: readonly string[] = [];

  return spaces.reduce<SpaceModelParts>((acc, space) => {
    const template = templateMap.get(space.templateId);
    if (!template) return acc;

    const spaceArea = (template.w ?? 1000000) * (template.l ?? 1000000);

    const initialBinModelParts: Readonly<BinModelParts> = {
      vars: emptyVars,
      bounds: emptyBounds,
      geomVars: emptyVars,
      generals: emptyGenerals,
    };

    const binModelParts = bins.reduce<Readonly<BinModelParts>>(
      (binAcc, bin) => {
        const vName = getVarName(space.id, bin.id);
        const binArea = binAreaMap.get(bin.id) ?? 1;
        const v: GLPKVar = { name: vName, coef: binArea };
        const constraints: Record<string, SpaceConstraint> = space.constraints;
        const constraint = constraints[bin.id];
        const boundInfo = getBinBoundInfo(constraint);

        return {
          vars: [...binAcc.vars, v],
          bounds: [...binAcc.bounds, { name: vName, type: boundInfo.type, lb: boundInfo.lb, ub: boundInfo.ub }],
          geomVars: [...binAcc.geomVars, v],
          generals: [...binAcc.generals, vName],
        };
      },
      initialBinModelParts,
    );

    const geomConstraint: GLPKSubjTo = {
      name: `geom_cap_${space.id}`,
      vars: binModelParts.geomVars,
      bnds: { type: GLP_UP, lb: 0, ub: spaceArea },
    };

    return {
      vars: [...acc.vars, ...binModelParts.vars],
      bounds: [...acc.bounds, ...binModelParts.bounds],
      subjectTo: [...acc.subjectTo, geomConstraint],
      generals: [...acc.generals, ...binModelParts.generals],
    };
  }, {
    vars: emptyVars,
    bounds: emptyBounds,
    subjectTo: emptySubj,
    generals: emptyGenerals,
  });
};

export const buildAggregateConstraints = (
  aggregateConstraints: SolverRequest["aggregateConstraints"],
  spaces: readonly SpaceInstance[],
): readonly GLPKSubjTo[] => {
  return aggregateConstraints
    .filter((ac) => ac.hard)
    .map((ac, i) => {
      const acVars = spaces.map((space) => ({
        name: getVarName(space.id, ac.binId),
        coef: 1,
      }));
      const type = ac.maxTotal !== null ? GLP_DB : GLP_LO;
      const ub = ac.maxTotal !== null ? ac.maxTotal : 0;

      return {
        name: `agg_${i}`,
        vars: acVars,
        bnds: { type, lb: ac.minTotal, ub },
      };
    });
};

export const extractSuggestedCounts = (
  vars: Record<string, number>,
  spaces: readonly SpaceInstance[],
  bins: readonly BinSpec[],
): Record<string, Record<string, number>> => {
  const initialSpaceAcc: Record<string, Record<string, number>> = {};
  return spaces.reduce(
    (spaceAcc, space) => {
      const initialBinAcc: Record<string, number> = {};
      const binCounts = bins.reduce(
        (binAcc, bin) => {
          const val = vars[getVarName(space.id, bin.id)];
          if (typeof val === "number") {
            return { ...binAcc, [bin.id]: Math.round(val) };
          }
          return binAcc;
        },
        initialBinAcc,
      );
      return { ...spaceAcc, [space.id]: binCounts };
    },
    initialSpaceAcc,
  );
};

export const checkFeasibility = async (
  request: SolverRequest,
): Promise<SolverResult> => {
  const glpk = await getGlpk();
  const { spaces, templates, bins, aggregateConstraints } = request;

  const templateMap = new Map(templates.map((t) => [t.id, t]));
  const binAreaMap = new Map(bins.map((b) => [b.id, b.w * b.l]));

  const spaceModelParts = buildSpaceModelParts(spaces, bins, templateMap, binAreaMap);
  const aggConstraints = buildAggregateConstraints(aggregateConstraints, spaces);

  const model: LinearModel = {
    name: "Feasibility",
    objective: {
      direction: GLP_MAX,
      name: "obj",
      vars: spaceModelParts.vars,
    },
    subjectTo: [...spaceModelParts.subjectTo, ...aggConstraints],
    bounds: spaceModelParts.bounds,
    generals: spaceModelParts.generals,
  };

  const result = glpk.solve(model, glpk.GLP_MSG_OFF);
  const isFeasible = result.result.status === glpk.GLP_OPT || result.result.status === glpk.GLP_FEAS;

  return {
    feasible: isFeasible,
    conflicts: isFeasible ? [] : ["Infeasible constraints"],
    suggestedCounts: isFeasible && result.result.vars ? extractSuggestedCounts(result.result.vars, spaces, bins) : {},
  };
};
