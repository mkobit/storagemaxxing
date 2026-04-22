/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-assertions, @typescript-eslint/ban-ts-comment, functional/no-let, functional/no-expression-statements, import/no-named-as-default, functional/no-try-statements */
import GLPK from "glpk.js";
import type { SolverRequest, SolverResult, LinearModel } from "./index.js";

const GLP_MAX = 2;
const GLP_LO = 2;
const GLP_UP = 3;
const GLP_DB = 4;
const GLP_FX = 5;

let glpkInstance: any = null;

const getGlpk = async () => {
  if (!glpkInstance) {
    // Try to import node version dynamically for tests in bun
    // to avoid web worker initialization crash in bun env.
    try {
      // @ts-ignore
      const nodeGLPK = await import("glpk.js/node");
      const factory = (nodeGLPK as any).default || nodeGLPK;
      glpkInstance = await factory();
    } catch {
      const factory = (GLPK as any).default || GLPK;
      glpkInstance = await factory();
    }
  }
  return glpkInstance;
};

// We use functional programming approach instead of letting mutable vars
export const checkFeasibility = async (
  request: SolverRequest,
): Promise<SolverResult> => {
  const glpk = await getGlpk();

  const { spaces, templates, bins, aggregateConstraints } = request;

  const templateMap = new Map(templates.map((t) => [t.id, t]));
  const binAreaMap = new Map(bins.map((b) => [b.id, b.w * b.l]));

  const varName = (spaceId: string, binId: string) => `c_${spaceId}_${binId}`;

  type Var = { readonly name: string; readonly coef: number };
  type Bnd = {
    readonly name: string;
    readonly type: number;
    readonly lb: number;
    readonly ub: number;
  };
  type SubjTo = {
    readonly name: string;
    readonly vars: readonly Var[];
    readonly bnds: {
      readonly type: number;
      readonly lb: number;
      readonly ub: number;
    };
  };

  const initialAcc = {
    vars: [] as readonly Var[],
    bounds: [] as readonly Bnd[],
    subjectTo: [] as readonly SubjTo[],
    generals: [] as readonly string[],
  };

  const spaceModelParts = spaces.reduce((acc, space) => {
    const template = templateMap.get(space.templateId);
    if (!template) return acc;

    const spaceArea = (template.w ?? 1000000) * (template.l ?? 1000000);

    const binModelParts = bins.reduce(
      (binAcc, bin) => {
        const vName = varName(space.id, bin.id);
        const binArea = binAreaMap.get(bin.id) ?? 1;

        const v = { name: vName, coef: binArea };

        const constraint = (space.constraints as any)[bin.id];
        const boundInfo = (() => {
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
        })();

        const bnd = {
          name: vName,
          type: boundInfo.type,
          lb: boundInfo.lb,
          ub: boundInfo.ub,
        };

        return {
          vars: [...binAcc.vars, v],
          bounds: [...binAcc.bounds, bnd],
          geomVars: [...binAcc.geomVars, v],
          generals: [...binAcc.generals, vName],
        };
      },
      {
        vars: [] as readonly Var[],
        bounds: [] as readonly Bnd[],
        geomVars: [] as readonly Var[],
        generals: [] as readonly string[],
      },
    );

    const geomConstraint = {
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
  }, initialAcc);

  const aggConstraints = aggregateConstraints
    .filter((ac) => ac.hard)
    .reduce(
      (acc, ac, i) => {
        const acVars = spaces.map((space) => ({
          name: varName(space.id, ac.binId),
          coef: 1,
        }));
        const type = ac.maxTotal !== null ? GLP_DB : GLP_LO;
        const ub = ac.maxTotal !== null ? ac.maxTotal : 0;

        const subjTo = {
          name: `agg_${i}`,
          vars: acVars,
          bnds: { type, lb: ac.minTotal, ub },
        };

        return [...acc, subjTo];
      },
      [] as readonly SubjTo[],
    );

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

  const result = await glpk.solve(model, glpk.GLP_MSG_OFF);

  const isFeasible =
    result.result.status === glpk.GLP_OPT ||
    result.result.status === glpk.GLP_FEAS;

  const suggestedCounts =
    isFeasible && result.result.vars
      ? spaces.reduce(
          (spaceAcc, space) => {
            const binCounts = bins.reduce(
              (binAcc, bin) => {
                const val = result.result.vars[varName(space.id, bin.id)];
                if (val !== undefined && val !== null) {
                  // ILP variables are integers, but it's safe to cast since solver might output floats very close to ints
                  return { ...binAcc, [bin.id]: Math.round(val as number) };
                }
                return binAcc;
              },
              {} as Record<string, number>,
            );
            return { ...spaceAcc, [space.id]: binCounts };
          },
          {} as Record<string, Record<string, number>>,
        )
      : {};

  return {
    feasible: isFeasible,
    conflicts: isFeasible ? [] : ["Infeasible constraints"],
    suggestedCounts,
  };
};
