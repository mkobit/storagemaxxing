import { describe, it, expect, beforeEach, mock } from "bun:test";
mock.module("idb-keyval", () => ({
  get: async () => null,
  set: async () => {},
  del: async () => {},
}));

import { render, screen, fireEvent } from "@testing-library/react";
import { ConstraintEditorPanel } from "./ConstraintEditorPanel";
import { useStore } from "@storagemaxxing/store/useStore";
import { createSpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import { SpaceInstanceSchema } from "@storagemaxxing/assembly/SpaceInstance";
import { createSpaceTemplate } from "@storagemaxxing/assembly/SpaceTemplate";
import { createDimensions3D } from "@storagemaxxing/geometry/Dimensions3D";
import { BinSpecIdSchema } from "@storagemaxxing/assembly/BaseTypes";
import { SpaceInstanceIdSchema } from "@storagemaxxing/assembly/SpaceInstance";
import { SpaceTemplateIdSchema } from "@storagemaxxing/assembly/SpaceTemplate";

const spaceId = SpaceInstanceIdSchema.parse("space-1");
const templateId = SpaceTemplateIdSchema.parse("template-1");
const binSpecId = BinSpecIdSchema.parse("gridfinity-1x1x2");

const space = SpaceInstanceSchema.parse({
  id: spaceId,
  templateId: templateId,
  name: "Test space",
  count: 1,
  constraints: {
    [binSpecId]: createSpaceConstraint(binSpecId, 2, 0, 5),
  },
});

describe("ConstraintEditorPanel", () => {
  beforeEach(() => {
    useStore.setState({
      spaces: [space],
      activeSpaceId: spaceId,
      templatesById: {
        [templateId]: createSpaceTemplate(
          templateId,
          createDimensions3D(6, 6, 2),
          "top",
        ),
      },
    });
  });

  it("renders active constraints with correct details", () => {
    render(<ConstraintEditorPanel />);
    expect(screen.getByText("Constraints")).toBeTruthy();
    expect(screen.getByText("Gridfinity 1x1x2")).toBeTruthy();
  });

  it("triggers constraint deletion when delete button is clicked", () => {
    render(<ConstraintEditorPanel />);
    const deleteBtn = screen.getByTitle("Remove constraint");
    expect(deleteBtn).toBeTruthy();
    fireEvent.click(deleteBtn);

    const updatedSpace = useStore.getState().spaces.find((s) => s.id === spaceId);
    expect(updatedSpace?.constraints[binSpecId]).toBeUndefined();
  });
});
