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

export type AppState = {
  readonly _hasHydrated: boolean;
  readonly mode: ToolMode;

  readonly spaces: readonly SpaceInstance[];
  readonly activeSpaceId: SpaceInstanceId | null;
  readonly templatesById: Readonly<Record<SpaceTemplateId, SpaceTemplate>>;
  readonly constraintsBySpace: Readonly<
    Record<SpaceTemplateId, readonly SpaceConstraint[]>
  >;
};

export type AppActions = {
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
};

export type StoreState = AppState & AppActions;

export const initialState: AppState = {
  _hasHydrated: false,
  mode: "select",
  spaces: [],
  activeSpaceId: null,
  templatesById: {},
  constraintsBySpace: {},
};
