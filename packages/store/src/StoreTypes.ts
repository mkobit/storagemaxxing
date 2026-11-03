import { ToolMode } from "./ToolMode";
import {
  SpaceInstance,
  SpaceInstanceId,
} from "@storagemaxxing/assembly/SpaceInstance";
import {
  SpaceTemplate,
  SpaceTemplateId,
} from "@storagemaxxing/assembly/SpaceTemplate";
import { SpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import { BinSpecId } from "@storagemaxxing/assembly/BaseTypes";
import type { PackingResult } from "@storagemaxxing/assembly/PackingResult";
import type { ComparableStorageSystem } from "./layoutSelectors";
import type { SolverRunState, SolverWorkerEvent } from "./solverActions";

export type AppState = {
  readonly _hasHydrated: boolean;
  readonly mode: ToolMode;

  readonly spaces: readonly SpaceInstance[];
  readonly activeSpaceId: SpaceInstanceId | null;
  readonly templatesById: Readonly<Record<SpaceTemplateId, SpaceTemplate>>;
  readonly constraintsBySpace: Readonly<
    Record<SpaceTemplateId, readonly SpaceConstraint[]>
  >;
  readonly solverRunsBySpace: Readonly<Record<SpaceInstanceId, SolverRunState>>;
  readonly solverResultsBySpace: Readonly<
    Record<SpaceInstanceId, PackingResult>
  >;
  readonly activeSolverRequests: Readonly<Record<string, SpaceInstanceId>>;
};

type AppActions = {
  readonly setHasHydrated: (state: boolean) => void;
  readonly setMode: (mode: ToolMode) => void;

  readonly addSpace: (space: SpaceInstance) => void;
  readonly addTemplate: (template: SpaceTemplate) => void;
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
  readonly removeConstraintForSpace: (
    templateId: SpaceTemplateId,
    binId: BinSpecId,
  ) => void;
  readonly clearConstraintsForSpace: (templateId: SpaceTemplateId) => void;
  readonly setSpaceDrillable: (
    templateId: SpaceTemplateId,
    drillable: boolean,
  ) => void;
  readonly setSpaceRailPresent: (
    templateId: SpaceTemplateId,
    railPresent: boolean,
  ) => void;
  readonly setSpaceMaxWeightLbs: (
    templateId: SpaceTemplateId,
    maxWeightLbs: number | undefined,
  ) => void;
  readonly applySpaceStrategy: (
    spaceId: SpaceInstanceId,
    system: ComparableStorageSystem,
  ) => void;
  readonly startSolverRun: (
    spaceId: SpaceInstanceId,
    requestId: string,
  ) => void;
  readonly handleSolverEvent: (
    event: SolverWorkerEvent,
    spaceId?: SpaceInstanceId,
  ) => void;
  readonly clearSolverState: (spaceId?: SpaceInstanceId) => void;
  readonly loadSketch: (
    sketch: Pick<
      AppState,
      "spaces" | "activeSpaceId" | "templatesById" | "constraintsBySpace"
    >,
  ) => void;
};

export type StoreState = AppState & AppActions;

export const initialState: AppState = {
  _hasHydrated: false,
  mode: "select",
  spaces: [],
  activeSpaceId: null,
  templatesById: {},
  constraintsBySpace: {},
  solverRunsBySpace: {},
  solverResultsBySpace: {},
  activeSolverRequests: {},
};
