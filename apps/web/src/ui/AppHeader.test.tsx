import { describe, it, expect, beforeEach, mock, spyOn } from "bun:test";
mock.module("idb-keyval", () => ({
  get: async () => null,
  set: async () => {},
  del: async () => {},
}));

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AppHeader } from "./AppHeader";
import { ThemeProvider } from "./theme/ThemeProvider";
import { useStore } from "@storagemaxxing/store/useStore";
import { initialState } from "@storagemaxxing/store/StoreTypes";
import { serializeSketch } from "@storagemaxxing/store/SketchSerialization";
import { createSpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import { SpaceInstanceSchema } from "@storagemaxxing/assembly/SpaceInstance";
import { createSpaceTemplate } from "@storagemaxxing/assembly/SpaceTemplate";
import { createDimensions3D } from "@storagemaxxing/geometry/Dimensions3D";

const renderAppHeader = () => render(<AppHeader />, { wrapper: ThemeProvider });

const uploadFile = (input: HTMLElement, contents: string) => {
  const file = new File([contents], "sketch.json", {
    type: "application/json",
  });
  fireEvent.change(input, { target: { files: [file] } });
};

describe("AppHeader", () => {
  beforeEach(() => {
    useStore.setState(initialState);
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("renders a semantic header with Storagemaxxing branding and space manager", () => {
    renderAppHeader();
    const header = screen.getByTestId("app-header");
    expect(header.tagName).toBe("HEADER");
    expect(
      screen.getByRole("heading", { name: "Storagemaxxing" }),
    ).toBeTruthy();
    expect(document.body.contains(screen.getByTestId("space-manager"))).toBe(
      true,
    );
  });

  it("renders DevToolsMenu collapsed by default and opens it to run starter fixtures", () => {
    renderAppHeader();
    const menu = screen.getByTestId("dev-tools-menu");
    expect(menu.hasAttribute("open")).toBe(false);

    fireEvent.click(screen.getByText("Dev Tools"));
    expect(menu.hasAttribute("open")).toBe(true);

    const starterBtn = screen.getByTestId("add-starter-bins");
    fireEvent.click(starterBtn);
    expect(useStore.getState().spaces.length).toBe(1);
  });

  it("toggles the theme when the theme toggle is clicked", () => {
    renderAppHeader();
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    fireEvent.click(screen.getByTestId("theme-toggle"));

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("exports the current sketch as a JSON download when export is clicked", () => {
    const createObjectUrlSpy = spyOn(URL, "createObjectURL").mockReturnValue(
      "blob:storagemaxxing-test",
    );
    const revokeObjectUrlSpy = spyOn(URL, "revokeObjectURL").mockImplementation(
      () => {},
    );

    renderAppHeader();
    fireEvent.click(screen.getByTestId("export-sketch"));

    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith("blob:storagemaxxing-test");

    createObjectUrlSpy.mockRestore();
    revokeObjectUrlSpy.mockRestore();
  });

  it("triggers the hidden file input when the import button is clicked", () => {
    renderAppHeader();
    const fileInput = screen.getByTestId("import-sketch-input");
    const clickSpy = spyOn(fileInput, "click");

    fireEvent.click(screen.getByTestId("import-sketch"));

    expect(clickSpy).toHaveBeenCalledTimes(1);
    clickSpy.mockRestore();
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

    renderAppHeader();
    uploadFile(screen.getByTestId("import-sketch-input"), sketchJson);

    await waitFor(() =>
      expect(useStore.getState().spaces.map((s) => s.id)).toEqual([space.id]),
    );
    expect(useStore.getState().activeSpaceId).toEqual(space.id);
  });

  it("shows an error when importing an invalid sketch file", async () => {
    renderAppHeader();
    uploadFile(
      screen.getByTestId("import-sketch-input"),
      JSON.stringify({ nonsense: true }),
    );

    await waitFor(() =>
      expect(screen.getByText("Invalid sketch file")).toBeTruthy(),
    );
  });
});
