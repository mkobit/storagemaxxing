import { describe, it, expect, beforeEach, mock } from "bun:test";
mock.module("idb-keyval", () => ({
  get: async () => null,
  set: async () => {},
  del: async () => {},
}));

import { render, screen, fireEvent } from "@testing-library/react";
import { SpaceSwitcher } from "./SpaceSwitcher";
import { useStore } from "@storagemaxxing/store/useStore";
import {
  SpaceInstanceSchema,
  SpaceInstanceIdSchema,
} from "@storagemaxxing/assembly/SpaceInstance";
import {
  createSpaceTemplate,
  SpaceTemplateIdSchema,
} from "@storagemaxxing/assembly/SpaceTemplate";
import { createDimensions3D } from "@storagemaxxing/geometry/Dimensions3D";

const templateId = SpaceTemplateIdSchema.parse("template-1");
const template = createSpaceTemplate(
  templateId,
  createDimensions3D(6, 6, 2),
  "top",
);

const spaceOneId = SpaceInstanceIdSchema.parse("space-1");
const spaceTwoId = SpaceInstanceIdSchema.parse("space-2");

const spaceOne = SpaceInstanceSchema.parse({
  id: spaceOneId,
  templateId,
  name: "First drawer",
  count: 1,
  constraints: {},
});

const spaceTwo = SpaceInstanceSchema.parse({
  id: spaceTwoId,
  templateId,
  name: "Second drawer",
  count: 1,
  constraints: {},
});

describe("SpaceSwitcher", () => {
  beforeEach(() => {
    useStore.setState({
      spaces: [spaceOne, spaceTwo],
      activeSpaceId: spaceOneId,
      templatesById: { [templateId]: template },
    });
  });

  it("renders every space in state.spaces", () => {
    render(<SpaceSwitcher />);
    expect(screen.getByText("First drawer")).toBeTruthy();
    expect(screen.getByText("Second drawer")).toBeTruthy();
  });

  it("marks exactly one entry active, matching state.activeSpaceId", () => {
    render(<SpaceSwitcher />);
    const activeItems = [spaceOneId, spaceTwoId].filter(
      (id) =>
        screen.getByTestId(`space-item-${id}`).getAttribute("aria-current") ===
        "true",
    );
    expect(activeItems).toEqual([spaceOneId]);
  });

  it("updates state.activeSpaceId and re-marks the active entry when a non-active space is clicked", () => {
    render(<SpaceSwitcher />);
    fireEvent.click(screen.getByTestId(`space-item-${spaceTwoId}`));

    expect(useStore.getState().activeSpaceId).toEqual(spaceTwoId);
    expect(
      screen
        .getByTestId(`space-item-${spaceTwoId}`)
        .getAttribute("aria-current"),
    ).toBe("true");
    expect(
      screen
        .getByTestId(`space-item-${spaceOneId}`)
        .getAttribute("aria-current"),
    ).toBe("false");
  });
});
