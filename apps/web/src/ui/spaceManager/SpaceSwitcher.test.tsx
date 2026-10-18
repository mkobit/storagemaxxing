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

  it("renders empty state when spaces list is empty", () => {
    useStore.setState({
      spaces: [],
      activeSpaceId: null,
      templatesById: {},
    });
    render(<SpaceSwitcher />);
    expect(screen.getByTestId("space-switcher")).toBeTruthy();
    expect(screen.getByText("No spaces yet")).toBeTruthy();
  });

  it("renders trigger button showing active space name and closed dropdown by default", () => {
    render(<SpaceSwitcher />);
    const trigger = screen.getByTestId("space-switcher-trigger");
    expect(trigger).toBeTruthy();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByText("First drawer")).toBeTruthy();
    expect(screen.queryByTestId("space-switcher-menu")).toBeNull();
  });

  it("opens dropdown menu showing all spaces on trigger click", () => {
    render(<SpaceSwitcher />);
    const trigger = screen.getByTestId("space-switcher-trigger");
    fireEvent.click(trigger);

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByTestId("space-switcher-menu")).toBeTruthy();
    expect(screen.getByTestId(`space-item-${spaceOneId}`)).toBeTruthy();
    expect(screen.getByTestId(`space-item-${spaceTwoId}`)).toBeTruthy();
  });

  it("marks exactly one entry active, matching state.activeSpaceId", () => {
    render(<SpaceSwitcher defaultOpen />);
    const activeItems = [spaceOneId, spaceTwoId].filter(
      (id) =>
        screen.getByTestId(`space-item-${id}`).getAttribute("aria-current") ===
        "true",
    );
    expect(activeItems).toEqual([spaceOneId]);
  });

  it("updates active space, updates trigger label, and closes dropdown when another space is selected", () => {
    render(<SpaceSwitcher defaultOpen />);
    expect(screen.getByTestId("space-switcher-menu")).toBeTruthy();

    fireEvent.click(screen.getByTestId(`space-item-${spaceTwoId}`));

    expect(useStore.getState().activeSpaceId).toEqual(spaceTwoId);
    expect(screen.queryByTestId("space-switcher-menu")).toBeNull();

    const trigger = screen.getByTestId("space-switcher-trigger");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.textContent).toContain("Second drawer");
  });

  it("closes dropdown when Escape key is pressed", () => {
    render(<SpaceSwitcher defaultOpen />);
    expect(screen.getByTestId("space-switcher-menu")).toBeTruthy();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByTestId("space-switcher-menu")).toBeNull();
    expect(
      screen
        .getByTestId("space-switcher-trigger")
        .getAttribute("aria-expanded"),
    ).toBe("false");
  });

  it("closes dropdown when clicking outside", () => {
    render(
      <div>
        <span data-testid="outside-element">Outside</span>
        <SpaceSwitcher defaultOpen />
      </div>,
    );
    expect(screen.getByTestId("space-switcher-menu")).toBeTruthy();

    fireEvent.mouseDown(screen.getByTestId("outside-element"));

    expect(screen.queryByTestId("space-switcher-menu")).toBeNull();
  });
});
