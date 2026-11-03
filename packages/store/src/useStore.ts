import { create } from "zustand";
import { persist, StateStorage, createJSONStorage } from "zustand/middleware";
import { get, set, del } from "idb-keyval";
import { AppState, StoreState, initialState } from "./StoreTypes";
import {
  updateConstraintInState,
  removeConstraintFromState,
  setTemplateDrillableInState,
  setTemplateRailPresentInState,
  setTemplateMaxWeightLbsInState,
  applyStrategyInState,
} from "./StoreHelpers";
import {
  applySolverEventInState,
  clearSolverStateInState,
  startSolverRunInState,
} from "./solverActions";
import { SpaceTemplateId } from "@storagemaxxing/assembly/SpaceTemplate";
import { ALL_BINS } from "@storagemaxxing/catalog/lookup";

const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof indexedDB === "undefined") return null;
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof indexedDB === "undefined") return;
    return void (await set(name, value));
  },
  removeItem: async (name: string): Promise<void> => {
    if (typeof indexedDB === "undefined") return;
    return void (await del(name));
  },
};

const invalidateSolverResultsForTemplate = (
  state: AppState,
  templateId: SpaceTemplateId,
): AppState["solverResultsBySpace"] =>
  state.spaces.reduce<AppState["solverResultsBySpace"]>((acc, space) => {
    if (space.templateId === templateId) return acc;
    const existing = state.solverResultsBySpace[space.id];
    return existing !== undefined ? { ...acc, [space.id]: existing } : acc;
  }, {});

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      ...initialState,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setMode: (mode) => set({ mode }),
      addSpace: (space) =>
        set((state) => {
          const globalConstraints =
            state.constraintsBySpace[space.templateId] || [];
          const constraintsRecord = Object.fromEntries(
            globalConstraints.map((c) => [c.binId, c]),
          );
          return {
            spaces: [
              ...state.spaces,
              {
                ...space,
                constraints: { ...space.constraints, ...constraintsRecord },
              },
            ],
          };
        }),
      addTemplate: (template) =>
        set((state) => ({
          templatesById: { ...state.templatesById, [template.id]: template },
        })),
      removeSpace: (id) =>
        set((state) => {
          const { [id]: _run, ...solverRunsBySpace } = state.solverRunsBySpace;
          const { [id]: _res, ...solverResultsBySpace } =
            state.solverResultsBySpace;
          return {
            spaces: state.spaces.filter((s) => s.id !== id),
            solverRunsBySpace,
            solverResultsBySpace,
          };
        }),
      setActiveSpace: (activeSpaceId) => set({ activeSpaceId }),
      setConstraintForSpace: (templateId, constraint) =>
        set((state) => ({
          ...updateConstraintInState(state, templateId, constraint),
          solverResultsBySpace: invalidateSolverResultsForTemplate(
            state,
            templateId,
          ),
        })),
      updateConstraintForSpace: (templateId, constraint) =>
        set((state) => ({
          ...updateConstraintInState(state, templateId, constraint),
          solverResultsBySpace: invalidateSolverResultsForTemplate(
            state,
            templateId,
          ),
        })),
      removeConstraintForSpace: (templateId, binId) =>
        set((state) => ({
          ...removeConstraintFromState(state, templateId, binId),
          solverResultsBySpace: invalidateSolverResultsForTemplate(
            state,
            templateId,
          ),
        })),
      setSpaceDrillable: (templateId, drillable) =>
        set((state) => ({
          ...setTemplateDrillableInState(state, templateId, drillable),
          solverResultsBySpace: invalidateSolverResultsForTemplate(
            state,
            templateId,
          ),
        })),
      setSpaceRailPresent: (templateId, railPresent) =>
        set((state) => ({
          ...setTemplateRailPresentInState(state, templateId, railPresent),
          solverResultsBySpace: invalidateSolverResultsForTemplate(
            state,
            templateId,
          ),
        })),
      setSpaceMaxWeightLbs: (templateId, maxWeightLbs) =>
        set((state) => ({
          ...setTemplateMaxWeightLbsInState(state, templateId, maxWeightLbs),
          solverResultsBySpace: invalidateSolverResultsForTemplate(
            state,
            templateId,
          ),
        })),
      applySpaceStrategy: (spaceId, system) =>
        set((state) => {
          const space = state.spaces.find((s) => s.id === spaceId);
          const templateId = space?.templateId;
          const solverResultsBySpace = templateId
            ? invalidateSolverResultsForTemplate(state, templateId)
            : state.solverResultsBySpace;
          return {
            ...applyStrategyInState(state, spaceId, system, ALL_BINS),
            solverResultsBySpace,
          };
        }),
      clearConstraintsForSpace: (templateId) =>
        set((state) => {
          const { [templateId]: _, ...newConstraints } =
            state.constraintsBySpace;
          return {
            constraintsBySpace: newConstraints,
            spaces: state.spaces.map((s) =>
              s.templateId === templateId ? { ...s, constraints: {} } : s,
            ),
            solverResultsBySpace: invalidateSolverResultsForTemplate(
              state,
              templateId,
            ),
          };
        }),
      startSolverRun: (spaceId, requestId) =>
        set((state) => startSolverRunInState(state, spaceId, requestId)),
      handleSolverEvent: (event, spaceId) =>
        set((state) => applySolverEventInState(state, event, spaceId)),
      clearSolverState: (spaceId) =>
        set((state) => clearSolverStateInState(state, spaceId)),
      loadSketch: (sketch) =>
        set({
          spaces: sketch.spaces,
          activeSpaceId: sketch.activeSpaceId,
          templatesById: sketch.templatesById,
          constraintsBySpace: sketch.constraintsBySpace,
          solverRunsBySpace: {},
          solverResultsBySpace: {},
          activeSolverRequests: {},
        }),
    }),
    {
      name: "storagemaxxing-db",
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        _hasHydrated: state._hasHydrated,
        mode: state.mode,
        spaces: state.spaces,
        activeSpaceId: state.activeSpaceId,
        templatesById: state.templatesById,
        constraintsBySpace: state.constraintsBySpace,
      }),
      onRehydrateStorage: () => (state) => {
        // eslint-disable-next-line functional/no-expression-statements -- zustand's onRehydrateStorage callback must return void; flagging hydration complete is inherently a side effect with no value to route through a return
        state?.setHasHydrated(true);
      },
    },
  ),
);
