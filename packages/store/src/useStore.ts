import { create } from "zustand";
import { persist, StateStorage, createJSONStorage } from "zustand/middleware";
import { get, set, del } from "idb-keyval";
import { StoreState, initialState } from "./StoreTypes";
import {
  updateConstraintInState,
  removeConstraintFromState,
  setTemplateDrillableInState,
  applyStrategyInState,
} from "./StoreHelpers";
import { ALL_BINS } from "@storagemaxxing/catalog/lookup";

const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> =>
    (await get(name)) || null,
  setItem: async (name: string, value: string): Promise<void> => {
    // eslint-disable-next-line functional/no-expression-statements -- StateStorage.setItem must return Promise<void>; persisting to IndexedDB is inherently a side effect with no value to route through a return
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    // eslint-disable-next-line functional/no-expression-statements -- StateStorage.removeItem must return Promise<void>; deleting from IndexedDB is inherently a side effect with no value to route through a return
    await del(name);
  },
};

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
        set((state) => ({ spaces: state.spaces.filter((s) => s.id !== id) })),
      setActiveSpace: (activeSpaceId) => set({ activeSpaceId }),
      setConstraintForSpace: (templateId, constraint) =>
        set((state) => updateConstraintInState(state, templateId, constraint)),
      updateConstraintForSpace: (templateId, constraint) =>
        set((state) => updateConstraintInState(state, templateId, constraint)),
      removeConstraintForSpace: (templateId, binId) =>
        set((state) => removeConstraintFromState(state, templateId, binId)),
      setSpaceDrillable: (templateId, drillable) =>
        set((state) =>
          setTemplateDrillableInState(state, templateId, drillable),
        ),
      applySpaceStrategy: (spaceId, system) =>
        set((state) => applyStrategyInState(state, spaceId, system, ALL_BINS)),
      clearConstraintsForSpace: (templateId) =>
        set((state) => {
          const { [templateId]: _, ...newConstraints } =
            state.constraintsBySpace;
          return {
            constraintsBySpace: newConstraints,
            spaces: state.spaces.map((s) =>
              s.templateId === templateId ? { ...s, constraints: {} } : s,
            ),
          };
        }),
      loadSketch: (sketch) =>
        set({
          spaces: sketch.spaces,
          activeSpaceId: sketch.activeSpaceId,
          templatesById: sketch.templatesById,
          constraintsBySpace: sketch.constraintsBySpace,
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
