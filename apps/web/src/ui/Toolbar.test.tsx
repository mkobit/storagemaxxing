import { describe, it, expect, mock } from "bun:test";
mock.module("idb-keyval", () => ({
  get: async () => null,
  set: async () => {},
  del: async () => {},
}));

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Toolbar } from "./Toolbar";
import { useStore } from "@storagemaxxing/store/useStore";
import { serializeSketch } from "@storagemaxxing/store/SketchSerialization";
import { createSpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import { SpaceInstanceSchema } from "@storagemaxxing/assembly/SpaceInstance";
import { createSpaceTemplate } from "@storagemaxxing/assembly/SpaceTemplate";
import { createDimensions3D } from "@storagemaxxing/geometry/Dimensions3D";

const uploadFile = (input: HTMLElement, contents: string) => {
  const file = new File([contents], "sketch.json", {
    type: "application/json",
  });
  fireEvent.change(input, { target: { files: [file] } });
};

describe("Toolbar", () => {
  it("renders the toolbar", () => {
    render(<Toolbar />);
    expect(document.body.contains(screen.getByTestId("toolbar"))).toBe(true);
  });

  it("shows select mode as active by default", () => {
    render(<Toolbar />);
    const selectBtn = screen.getByTestId("mode-select");
    expect(selectBtn.classList.contains("bg-brand-primary")).toBe(true);
  });

  it("imports a valid sketch file and loads it into the store", async () => {
    const template = createSpaceTemplate(
      "template-1",
      createDimensions3D(6, 6, 2),
      "top",
    );
    const constraint = createSpaceConstraint("gridfinity-1x1x2", 2, 3, 5);
    const space = SpaceInstanceSchema.parse({
      id: "space-1",
      templateId: template.id,
      name: "Imported space",
      count: 1,
      constraints: { "gridfinity-1x1x2": constraint },
    });
    const sketchJson = serializeSketch({
      spaces: [space],
      activeSpaceId: space.id,
      templatesById: { [template.id]: template },
      constraintsBySpace: { [template.id]: [constraint] },
    });

    render(<Toolbar />);
    uploadFile(screen.getByTestId("import-sketch-input"), sketchJson);

    await waitFor(() =>
      expect(useStore.getState().spaces.map((s) => s.id)).toEqual([space.id]),
    );
    expect(useStore.getState().activeSpaceId).toEqual(space.id);
  });

  it("shows an error when importing an invalid sketch file", async () => {
    render(<Toolbar />);
    uploadFile(
      screen.getByTestId("import-sketch-input"),
      JSON.stringify({ nonsense: true }),
    );

    await waitFor(() =>
      expect(screen.getByText("Invalid sketch file")).toBeTruthy(),
    );
  });
});
