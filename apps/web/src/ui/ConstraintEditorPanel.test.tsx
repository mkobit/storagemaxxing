import { describe, it, expect, beforeEach, mock } from "bun:test";
mock.module("idb-keyval", () => ({
  get: async () => null,
  set: async () => {},
  del: async () => {},
}));

import {
  ALL_BINS as REAL_ALL_BINS,
  findBinById,
} from "@storagemaxxing/catalog/lookup";
import { binId, type BinSpec as CatalogBinSpec } from "@storagemaxxing/catalog/bin";
import { createDimensions3D as createBinDimensions3D } from "@storagemaxxing/geometry/Dimensions3D";

const binDims = createBinDimensions3D(2, 2, 1);
const zeroTolerance = createBinDimensions3D(0, 0, 0);

// No real catalog bin currently declares `installation.type === "drill"`
// (see sm-5xj6), so a synthetic one is merged into the catalog used by the
// component under test via `mock.module`. `findBinById` is re-exported
// unchanged so every other lookup in the panel behaves exactly as it does
// against the real catalog.
const drillBin: CatalogBinSpec = {
  id: binId("test-drill-bin"),
  name: "Test Drill Bin",
  sku: "TEST-DRILL-1",
  vendor: "Test Vendor",
  system: "gridfinity",
  catalogSource: "builtin",
  nominal: binDims,
  actual: binDims,
  tolerance: zeroTolerance,
  installation: { type: "drill", description: "Requires drilling" },
};

const ALL_BINS: readonly CatalogBinSpec[] = [...REAL_ALL_BINS, drillBin];

mock.module("@storagemaxxing/catalog/lookup", () => ({
  ALL_BINS,
  findBinById,
  binsForDepth: (catalog: readonly CatalogBinSpec[], maxDepth: number) =>
    catalog.filter((bin) => bin.nominal.h <= maxDepth),
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
    expect(screen.getAllByText("Gridfinity 1x1x2").length).toBeGreaterThan(0);
  });

  it("triggers constraint deletion when delete button is clicked", () => {
    render(<ConstraintEditorPanel />);
    const deleteBtn = screen.getByTitle("Remove constraint");
    expect(deleteBtn).toBeTruthy();
    fireEvent.click(deleteBtn);

    const updatedSpace = useStore.getState().spaces.find((s) => s.id === spaceId);
    expect(updatedSpace?.constraints[binSpecId]).toBeUndefined();
  });

  it("renders compatible catalog bins", () => {
    render(<ConstraintEditorPanel />);
    expect(screen.getByText("Gridfinity 1x1x3")).toBeTruthy();
  });

  it("adds a new constraint when clicking + Add button", () => {
    render(<ConstraintEditorPanel />);
    const binRow = screen.getByText("Gridfinity 1x1x3").parentElement;
    expect(binRow).toBeTruthy();
    if (!binRow) return;
    const addButton = binRow.querySelector("button");
    expect(addButton).toBeTruthy();
    if (!addButton) return;
    fireEvent.click(addButton);

    const updatedSpace = useStore.getState().spaces.find((s) => s.id === spaceId);
    const expectedId = BinSpecIdSchema.parse("gridfinity-1x1x3");
    expect(updatedSpace?.constraints[expectedId]).toBeTruthy();
  });

  it("shows the explicitly selected system's catalog even with no constraints and a non-matching name", () => {
    const schallerSpaceId = SpaceInstanceIdSchema.parse("space-2");
    const schallerTemplateId = SpaceTemplateIdSchema.parse("template-2");
    const schallerSpace = SpaceInstanceSchema.parse({
      id: schallerSpaceId,
      templateId: schallerTemplateId,
      name: "Kitchen drawer",
      count: 1,
      constraints: {},
      system: "schaller",
    });
    useStore.setState({
      spaces: [schallerSpace],
      activeSpaceId: schallerSpaceId,
      templatesById: {
        [schallerTemplateId]: createSpaceTemplate(
          schallerTemplateId,
          createDimensions3D(6, 6, 2),
          "top",
        ),
      },
    });

    render(<ConstraintEditorPanel />);
    expect(screen.getByText("Schaller 2x3 - 2 inch depth")).toBeTruthy();
    expect(screen.queryByText("Gridfinity 1x1x2")).toBeNull();
  });

  it("assigns distinct, non-black colors to bins added via the catalog", () => {
    const addBin = (binName: string) => {
      render(<ConstraintEditorPanel />);
      const binRow = screen.getAllByText(binName).at(-1)?.parentElement;
      expect(binRow).toBeTruthy();
      if (!binRow) return;
      const addButton = binRow.querySelector("button");
      expect(addButton).toBeTruthy();
      if (!addButton) return;
      fireEvent.click(addButton);
    };

    addBin("Gridfinity 1x1x3");
    addBin("Gridfinity 1x1x4");

    const updatedSpace = useStore.getState().spaces.find((s) => s.id === spaceId);
    const firstColor =
      updatedSpace?.constraints[BinSpecIdSchema.parse("gridfinity-1x1x3")]?.color;
    const secondColor =
      updatedSpace?.constraints[BinSpecIdSchema.parse("gridfinity-1x1x4")]?.color;

    expect(firstColor).toBeTruthy();
    expect(secondColor).toBeTruthy();
    expect(firstColor).not.toBe("#000000");
    expect(secondColor).not.toBe("#000000");
    expect(firstColor).not.toBe(secondColor);
  });

  describe("drillable toggle", () => {
    it("calls setSpaceDrillable with the template id and false when toggled off", () => {
      render(<ConstraintEditorPanel />);
      const toggle = screen.getByLabelText("Can I drill into this space?");
      expect((toggle as HTMLInputElement).checked).toBe(true);

      fireEvent.click(toggle);

      const updatedTemplate = useStore.getState().templatesById[templateId];
      expect(
        updatedTemplate?.installationConstraints.some(
          (c) => c.type === "noDrill",
        ),
      ).toBe(true);
    });

    it("calls setSpaceDrillable with true when toggled back on", () => {
      useStore.setState({
        templatesById: {
          [templateId]: {
            ...createSpaceTemplate(
              templateId,
              createDimensions3D(6, 6, 2),
              "top",
            ),
            installationConstraints: [{ type: "noDrill" }],
          },
        },
      });

      render(<ConstraintEditorPanel />);
      const toggle = screen.getByLabelText("Can I drill into this space?");
      expect((toggle as HTMLInputElement).checked).toBe(false);

      fireEvent.click(toggle);

      const updatedTemplate = useStore.getState().templatesById[templateId];
      expect(
        updatedTemplate?.installationConstraints.some(
          (c) => c.type === "noDrill",
        ),
      ).toBe(false);
    });

    it("enables a drill-requiring bin in Add Bins by default (noDrill unset)", () => {
      render(<ConstraintEditorPanel />);
      const addButton = screen.getByTestId(`add-bin-${drillBin.id}`);
      expect((addButton as HTMLButtonElement).disabled).toBe(false);
    });

    it("greys/disables a drill-requiring bin in Add Bins when noDrill is set", () => {
      useStore.setState({
        templatesById: {
          [templateId]: {
            ...createSpaceTemplate(
              templateId,
              createDimensions3D(6, 6, 2),
              "top",
            ),
            installationConstraints: [{ type: "noDrill" }],
          },
        },
      });

      render(<ConstraintEditorPanel />);
      const addButton = screen.getByTestId(`add-bin-${drillBin.id}`);
      expect((addButton as HTMLButtonElement).disabled).toBe(true);
      expect(addButton.title.length).toBeGreaterThan(0);
      expect(addButton.title.toLowerCase()).toContain("drill");
    });

    it("keeps an existing constraint row for a drill bin visible when noDrill is toggled on", () => {
      const drillConstraint = createSpaceConstraint(drillBin.id, 1, 0);
      const spaceWithDrillConstraint = SpaceInstanceSchema.parse({
        id: spaceId,
        templateId,
        name: "Test space",
        count: 1,
        constraints: {
          [binSpecId]: createSpaceConstraint(binSpecId, 2, 0, 5),
          [drillBin.id]: drillConstraint,
        },
      });
      useStore.setState({
        spaces: [spaceWithDrillConstraint],
        activeSpaceId: spaceId,
        templatesById: {
          [templateId]: {
            ...createSpaceTemplate(
              templateId,
              createDimensions3D(6, 6, 2),
              "top",
            ),
            installationConstraints: [{ type: "noDrill" }],
          },
        },
      });

      render(<ConstraintEditorPanel />);
      expect(
        screen.getByTestId(`constraint-row-${drillBin.id}`),
      ).toBeTruthy();

      const toggle = screen.getByLabelText("Can I drill into this space?");
      fireEvent.click(toggle);

      expect(
        screen.getByTestId(`constraint-row-${drillBin.id}`),
      ).toBeTruthy();
    });
  });
});
