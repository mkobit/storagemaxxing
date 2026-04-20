import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { ToolMode } from './ToolMode';
import { Sketch2D } from '../assembly/Sketch2D';
import { SketchElement } from '../assembly/SketchElement';
import { SketchId } from '../assembly/SketchId';

const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

export type AppState = {
  readonly _hasHydrated: boolean;
  readonly mode: ToolMode;
  readonly sketches: readonly Sketch2D[];
  readonly activeSketchId: SketchId | null;
};

export type AppActions = {
  readonly setHasHydrated: (state: boolean) => void;
  readonly setMode: (mode: ToolMode) => void;
  readonly setActiveSketchId: (id: SketchId | null) => void;
  readonly addSketch: (sketch: Sketch2D) => void;
  readonly addElementToActiveSketch: (element: SketchElement) => void;
};

export type StoreState = AppState & AppActions;

const initialState: AppState = {
  _hasHydrated: false,
  mode: 'select',
  sketches: [],
  activeSketchId: null,
};

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      ...initialState,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setMode: (mode) => set({ mode }),
      setActiveSketchId: (activeSketchId) => set({ activeSketchId }),
      addSketch: (sketch) =>
        set((state) => ({
          sketches: [...state.sketches, sketch],
          activeSketchId: state.activeSketchId || sketch.id,
        })),
      addElementToActiveSketch: (element) =>
        set((state) => {
          if (!state.activeSketchId) return state;
          return {
            sketches: state.sketches.map((sketch) => {
              if (sketch.id !== state.activeSketchId) return sketch;
              return {
                ...sketch,
                elements: [...sketch.elements, element],
              };
            }),
          };
        }),
    }),
    {
      name: 'storagemaxxing-db',
      storage: createJSONStorage(() => idbStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
