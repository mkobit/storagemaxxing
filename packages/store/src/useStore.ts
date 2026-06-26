import { create } from "zustand";
import { persist, StateStorage, createJSONStorage } from "zustand/middleware";
import { get, set, del } from "idb-keyval";
import { StoreState, initialState } from "./StoreTypes";
import { updateConstraintInState } from "./StoreHelpers";

const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> =>
    (await get(name)) || null,
  setItem: async (name: string, value: string): Promise<void> => {
    // eslint-disable-next-line functional/no-expression-statements
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    // eslint-disable-next-line functional/no-expression-statements
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
      clearConstraintsForSpace: (templateId) =>
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [templateId]: _, ...newConstraints } =
            state.constraintsBySpace;
          return {
            constraintsBySpace: newConstraints,
            spaces: state.spaces.map((s) =>
              s.templateId === templateId ? { ...s, constraints: {} } : s,
            ),
          };
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
        // eslint-disable-next-line functional/no-expression-statements
        state?.setHasHydrated(true);
      },
    },
  ),
);
