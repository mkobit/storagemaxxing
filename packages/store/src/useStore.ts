import { create } from "zustand";
import { persist, StateStorage, createJSONStorage } from "zustand/middleware";
import { get, set, del } from "idb-keyval";
import { ToolMode } from "./ToolMode.js";
import { Sketch2D } from "@storagemaxxing/assembly/Sketch2D.js";
import { SketchElement } from "@storagemaxxing/assembly/SketchElement.js";
import { SketchId } from "@storagemaxxing/assembly/SketchId.js";
import { Feature, FeatureId } from "@storagemaxxing/assembly/Feature.js";
import { SpaceInstance, SpaceInstanceId } from "@storagemaxxing/assembly/SpaceInstance.js";
import { SpaceTemplateId } from "@storagemaxxing/assembly/SpaceTemplate.js";
import { SpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint.js";
import { PackingResult } from "@storagemaxxing/packer/types.js";

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

  readonly spaces: readonly SpaceInstance[];
  readonly activeSpaceId: SpaceInstanceId | null;
  readonly constraintsBySpace: Readonly<Record<SpaceTemplateId, readonly SpaceConstraint[]>>;
  readonly packingResultsBySpace: Readonly<Record<SpaceInstanceId, PackingResult>>;
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

  readonly addSpace: (space: SpaceInstance) => void;
  readonly removeSpace: (id: SpaceInstanceId) => void;
  readonly setActiveSpace: (id: SpaceInstanceId | null) => void;
  readonly setConstraintForSpace: (templateId: SpaceTemplateId, constraint: SpaceConstraint) => void;
  readonly updateConstraintForSpace: (templateId: SpaceTemplateId, constraint: SpaceConstraint) => void;
  readonly clearConstraintsForSpace: (templateId: SpaceTemplateId) => void;
  readonly setPackingResultsForSpace: (spaceId: SpaceInstanceId, result: PackingResult) => void;
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
  spaces: [],
  activeSpaceId: null,
  constraintsBySpace: {},
  packingResultsBySpace: {},
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

      addSpace: (space) => set((state) => ({ spaces: [...state.spaces, space] })),
      removeSpace: (id) => set((state) => ({ spaces: state.spaces.filter((s) => s.id !== id) })),
      setActiveSpace: (activeSpaceId) => set({ activeSpaceId }),
      setConstraintForSpace: (templateId, constraint) =>
        set((state) => {
          const existing = state.constraintsBySpace[templateId] || [];
          const filtered = existing.filter((c) => c.binId !== constraint.binId);
          return {
            constraintsBySpace: {
              ...state.constraintsBySpace,
              [templateId]: [...filtered, constraint],
            },
          };
        }),
      updateConstraintForSpace: (templateId, constraint) =>
        set((state) => {
          const existing = state.constraintsBySpace[templateId] || [];
          const filtered = existing.filter((c) => c.binId !== constraint.binId);
          return {
            constraintsBySpace: {
              ...state.constraintsBySpace,
              [templateId]: [...filtered, constraint],
            },
          };
        }),
      clearConstraintsForSpace: (templateId) =>
        set((state) => {
          const newConstraints = { ...state.constraintsBySpace };
          // eslint-disable-next-line functional/immutable-data
          delete newConstraints[templateId];
          return { constraintsBySpace: newConstraints };
        }),
      setPackingResultsForSpace: (spaceId, result) =>
        set((state) => ({
          packingResultsBySpace: {
            ...state.packingResultsBySpace,
            [spaceId]: result,
          },
        })),
    }),
    {
      name: "storagemaxxing-db",
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => {
        // Exclude ephemeral data (packingResultsBySpace) from persistence.
        return {
          _hasHydrated: state._hasHydrated,
          mode: state.mode,
          sketches: state.sketches,
          timeline: state.timeline,
          activeSketchId: state.activeSketchId,
          activeFeatureId: state.activeFeatureId,
          pan: state.pan,
          spaces: state.spaces,
          activeSpaceId: state.activeSpaceId,
          constraintsBySpace: state.constraintsBySpace,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
