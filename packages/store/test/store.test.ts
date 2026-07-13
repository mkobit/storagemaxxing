import { describe, expect, test } from "bun:test";
import { AppState, initialState } from "../src/StoreTypes";
import { updateConstraintInState, removeConstraintFromState } from "../src/StoreHelpers";
import { createSpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import { SpaceInstanceSchema } from "@storagemaxxing/assembly/SpaceInstance";
import { BinSpecId } from "@storagemaxxing/assembly/BaseTypes";
import { SpaceTemplateId } from "@storagemaxxing/assembly/SpaceTemplate";

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
