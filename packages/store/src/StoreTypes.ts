import { ToolMode } from "./ToolMode";
import { Sketch2D } from "@storagemaxxing/assembly/Sketch2D";
import { SketchElement } from "@storagemaxxing/assembly/SketchElement";
import { SketchId } from "@storagemaxxing/assembly/SketchId";
import { Feature, FeatureId } from "@storagemaxxing/assembly/Feature";
import {
  SpaceInstance,
  SpaceInstanceId,
} from "@storagemaxxing/assembly/SpaceInstance";
import { SpaceTemplateId } from "@storagemaxxing/assembly/SpaceTemplate";
import { SpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import { PackingResult } from "@storagemaxxing/assembly/PackingResult";
import { Millimeters, mm } from "@storagemaxxing/geometry/Millimeters";
import { Size, createSize } from "@storagemaxxing/geometry/Dimensions2D";
import { GridCalculationMode } from "@storagemaxxing/geometry/OpenGrid";

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
  readonly constraintsBySpace: Readonly<
    Record<SpaceTemplateId, readonly SpaceConstraint[]>
  >;
  readonly packingResultsBySpace: Readonly<
    Record<SpaceInstanceId, PackingResult>
  >;

  readonly solverFeasibility: boolean;
  readonly solverConflicts: readonly string[];
  readonly solverSuggestedCounts: Readonly<Record<string, number>>;

  // Spatial Modeling
  readonly spatialInputs: Size<Millimeters>;
  readonly printerBedSize: Size<Millimeters>;
  readonly calculationMode: GridCalculationMode;
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
  readonly setConstraintForSpace: (
    templateId: SpaceTemplateId,
    constraint: SpaceConstraint,
  ) => void;
  readonly updateConstraintForSpace: (
    templateId: SpaceTemplateId,
    constraint: SpaceConstraint,
  ) => void;
  readonly clearConstraintsForSpace: (templateId: SpaceTemplateId) => void;
  readonly setPackingResultsForSpace: (
    spaceId: SpaceInstanceId,
    result: PackingResult,
  ) => void;

  readonly setSolverFeasibility: (feasibility: boolean) => void;
  readonly setSolverConflicts: (conflicts: readonly string[]) => void;
  readonly setSolverSuggestedCounts: (
    counts: Readonly<Record<string, number>>,
  ) => void;

  readonly setSpatialInputs: (inputs: Size<Millimeters>) => void;
  readonly setPrinterBedSize: (size: Size<Millimeters>) => void;
  readonly setCalculationMode: (mode: GridCalculationMode) => void;
};

export type StoreState = AppState & AppActions;

export const initialState: AppState = {
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
  solverFeasibility: true,
  solverConflicts: [],
  solverSuggestedCounts: {},

  spatialInputs: createSize(mm(300), mm(300)),
  printerBedSize: createSize(mm(256), mm(256)),
  calculationMode: "truncate",
};
