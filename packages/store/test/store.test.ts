import { describe, expect, test } from "bun:test";
import { AppState, initialState } from "../src/StoreTypes";
import { updateConstraintInState, removeConstraintFromState } from "../src/StoreHelpers";
import { createSpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import { SpaceInstanceSchema } from "@storagemaxxing/assembly/SpaceInstance";
import { BinSpecId } from "@storagemaxxing/assembly/BaseTypes";

const space = SpaceInstanceSchema.parse({
  id: "space-1",
  templateId: "template-1",
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
    const constraint = createSpaceConstraint("bin-1", 2, 0, 1);
    const updated = updateConstraintInState(state, "template-1", constraint);

    expect(updated.constraintsBySpace["template-1"]).toEqual([constraint]);
    const updatedSpace = updated.spaces.find((s) => s.id === "space-1");
    expect(updatedSpace?.constraints["bin-1"]).toEqual(constraint);
  });

  test("removes a constraint from a space and updates constraintsBySpace", () => {
    const constraint1 = createSpaceConstraint("bin-1", 2, 0, 1);
    const constraint2 = createSpaceConstraint("bin-2", 3, 0, 1);

    // First add two constraints
    const stateWithConstraints = {
      ...state,
      constraintsBySpace: {
        "template-1": [constraint1, constraint2],
      },
      spaces: [
        {
          ...space,
          constraints: {
            "bin-1": constraint1,
            "bin-2": constraint2,
          },
        },
      ],
    };

    // Remove one constraint
    const updated = removeConstraintFromState(
      stateWithConstraints,
      "template-1",
      "bin-1" as BinSpecId,
    );

    expect(updated.constraintsBySpace["template-1"]).toEqual([constraint2]);
    const updatedSpace = updated.spaces.find((s) => s.id === "space-1");
    expect(updatedSpace?.constraints["bin-1"]).toBeUndefined();
    expect(updatedSpace?.constraints["bin-2"]).toEqual(constraint2);
  });
});
