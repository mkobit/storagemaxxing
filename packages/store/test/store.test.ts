import { describe, expect, test } from "bun:test";
import { AppState, initialState } from "../src/StoreTypes";
import {
  updateConstraintInState,
  removeConstraintFromState,
  setTemplateDrillableInState,
} from "../src/StoreHelpers";
import { createSpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import { SpaceInstanceSchema } from "@storagemaxxing/assembly/SpaceInstance";
import { BinSpecId } from "@storagemaxxing/assembly/BaseTypes";
import {
  SpaceTemplateId,
  createSpaceTemplate,
} from "@storagemaxxing/assembly/SpaceTemplate";
import { createDimensions3D } from "@storagemaxxing/geometry/Dimensions3D";

const TEMPLATE_ID = "template-1" as SpaceTemplateId;
const BIN_1 = "bin-1" as BinSpecId;
const BIN_2 = "bin-2" as BinSpecId;

const space = SpaceInstanceSchema.parse({
  id: "space-1",
  templateId: TEMPLATE_ID,
  name: "Test space",
  count: 1,
  constraints: {},
});

const state: AppState = {
  ...initialState,
  spaces: [space],
  activeSpaceId: space.id,
};

describe("storage-layout: Store Actions and Helpers", () => {
  test("adds a constraint to a space and updates constraintsBySpace", () => {
    const constraint = createSpaceConstraint(BIN_1, 2, 0, 1);
    const updated = updateConstraintInState(state, TEMPLATE_ID, constraint);

    expect(updated.constraintsBySpace[TEMPLATE_ID]).toEqual([constraint]);
    const updatedSpace = updated.spaces.find((s) => s.id === "space-1");
    expect(updatedSpace?.constraints[BIN_1]).toEqual(constraint);
  });

  test("removes a constraint from a space and updates constraintsBySpace", () => {
    const constraint1 = createSpaceConstraint(BIN_1, 2, 0, 1);
    const constraint2 = createSpaceConstraint(BIN_2, 3, 0, 1);

    // First add two constraints
    const stateWithConstraints = {
      ...state,
      constraintsBySpace: {
        [TEMPLATE_ID]: [constraint1, constraint2],
      },
      spaces: [
        {
          ...space,
          constraints: {
            [BIN_1]: constraint1,
            [BIN_2]: constraint2,
          },
        },
      ],
    };

    // Remove one constraint
    const updated = removeConstraintFromState(
      stateWithConstraints,
      TEMPLATE_ID,
      BIN_1,
    );

    expect(updated.constraintsBySpace[TEMPLATE_ID]).toEqual([constraint2]);
    const updatedSpace = updated.spaces.find((s) => s.id === "space-1");
    expect(updatedSpace?.constraints[BIN_1]).toBeUndefined();
    expect(updatedSpace?.constraints[BIN_2]).toEqual(constraint2);
  });
});

describe("installation-constraints: setTemplateDrillableInState", () => {
  const template = createSpaceTemplate(
    "template-drillable",
    createDimensions3D(12, 12, 2),
    "top",
  );

  const stateWithTemplate: AppState = {
    ...initialState,
    templatesById: { [template.id]: template },
  };

  test("drillable: false appends a single noDrill entry", () => {
    const updated = setTemplateDrillableInState(
      stateWithTemplate,
      template.id,
      false,
    );

    expect(updated.templatesById[template.id]?.installationConstraints).toEqual(
      [{ type: "noDrill" }],
    );
  });

  test("drillable: false is idempotent -- calling it twice does not duplicate the entry", () => {
    const once = setTemplateDrillableInState(
      stateWithTemplate,
      template.id,
      false,
    );
    const twice = setTemplateDrillableInState(
      { ...stateWithTemplate, templatesById: once.templatesById },
      template.id,
      false,
    );

    expect(twice.templatesById[template.id]?.installationConstraints).toEqual([
      { type: "noDrill" },
    ]);
  });

  test("drillable: true removes the noDrill entry", () => {
    const disallowed = setTemplateDrillableInState(
      stateWithTemplate,
      template.id,
      false,
    );
    const restored = setTemplateDrillableInState(
      { ...stateWithTemplate, templatesById: disallowed.templatesById },
      template.id,
      true,
    );

    expect(
      restored.templatesById[template.id]?.installationConstraints,
    ).toEqual([]);
  });

  test("toggle false -> true -> false leaves exactly one noDrill entry with no duplicates", () => {
    const step1 = setTemplateDrillableInState(
      stateWithTemplate,
      template.id,
      false,
    );
    const step2 = setTemplateDrillableInState(
      { ...stateWithTemplate, templatesById: step1.templatesById },
      template.id,
      true,
    );
    const step3 = setTemplateDrillableInState(
      { ...stateWithTemplate, templatesById: step2.templatesById },
      template.id,
      false,
    );

    expect(step3.templatesById[template.id]?.installationConstraints).toEqual([
      { type: "noDrill" },
    ]);
  });

  test("preserves other constraint types untouched when toggling noDrill", () => {
    const templateWithOtherConstraints = {
      ...template,
      installationConstraints: [
        { type: "noAdhesive" as const, notes: "sticky residue" },
        { type: "custom" as const, notes: "ask an adult" },
      ],
    };
    const stateWithOtherConstraints: AppState = {
      ...initialState,
      templatesById: {
        [templateWithOtherConstraints.id]: templateWithOtherConstraints,
      },
    };

    const withNoDrill = setTemplateDrillableInState(
      stateWithOtherConstraints,
      templateWithOtherConstraints.id,
      false,
    );

    expect(
      withNoDrill.templatesById[templateWithOtherConstraints.id]
        ?.installationConstraints,
    ).toEqual([
      { type: "noAdhesive", notes: "sticky residue" },
      { type: "custom", notes: "ask an adult" },
      { type: "noDrill" },
    ]);

    const withoutNoDrill = setTemplateDrillableInState(
      {
        ...stateWithOtherConstraints,
        templatesById: withNoDrill.templatesById,
      },
      templateWithOtherConstraints.id,
      true,
    );

    expect(
      withoutNoDrill.templatesById[templateWithOtherConstraints.id]
        ?.installationConstraints,
    ).toEqual([
      { type: "noAdhesive", notes: "sticky residue" },
      { type: "custom", notes: "ask an adult" },
    ]);
  });

  test("unknown templateId leaves templatesById untouched", () => {
    const unknownId = "template-does-not-exist" as SpaceTemplateId;
    const updated = setTemplateDrillableInState(
      stateWithTemplate,
      unknownId,
      false,
    );

    expect(updated.templatesById).toEqual(stateWithTemplate.templatesById);
  });
});
