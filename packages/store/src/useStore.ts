import { create } from "zustand";
import { persist, StateStorage, createJSONStorage } from "zustand/middleware";
import { get, set, del } from "idb-keyval";
import { ToolMode } from "./ToolMode";
import { Sketch2D } from "@storagemaxxing/assembly/Sketch2D";
import { SketchElement } from "@storagemaxxing/assembly/SketchElement";
import { SketchId } from "@storagemaxxing/assembly/SketchId";
import { Feature, FeatureId } from "@storagemaxxing/assembly/Feature";

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
  readonly timeline: readonly Feature[];
  readonly activeSketchId: SketchId | null;
  readonly activeFeatureId: FeatureId | null;
  readonly pan: { readonly x: number; readonly y: number };
};

export type AppActions = {
  readonly setHasHydrated: (state: boolean) => void;
  readonly setMode: (mode: ToolMode) => void;
  readonly setActiveSketchId: (id: SketchId | null) => void;
  readonly setActiveFeatureId: (id: FeatureId | null) => void;
  readonly addSketch: (sketch: Sketch2D) => void;
  readonly addFeature: (feature: Feature) => void;
  readonly addElementToActiveSketch: (element: SketchElement) => void;
  readonly setPan: (pan: { readonly x: number; readonly y: number }) => void;
};

export type StoreState = AppState & AppActions;

const initialState: AppState = {
  _hasHydrated: false,
  mode: "select",
  sketches: [],
  timeline: [],
  activeSketchId: null,
  activeFeatureId: null,
  pan: { x: 0, y: 0 },
};

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      ...initialState,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setMode: (mode) => set({ mode }),
      setActiveSketchId: (activeSketchId) => set({ activeSketchId }),
      setActiveFeatureId: (activeFeatureId) => set({ activeFeatureId }),
      addSketch: (sketch) =>
        set((state) => ({
          sketches: [...state.sketches, sketch],
        })),
      addFeature: (feature) =>
        set((state) => ({
          timeline: [...state.timeline, feature],
          activeFeatureId: feature.id,
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
      setPan: (pan) => set({ pan }),
    }),
    {
      name: "storagemaxxing-db",
      storage: createJSONStorage(() => idbStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
