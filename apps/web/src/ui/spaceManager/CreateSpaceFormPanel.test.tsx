import { describe, it, expect, beforeEach, mock } from "bun:test";
mock.module("idb-keyval", () => ({
  get: async () => null,
  set: async () => {},
  del: async () => {},
}));

import { render, screen, fireEvent } from "@testing-library/react";
import { CreateSpaceFormPanel } from "./CreateSpaceFormPanel";
import { useStore } from "@storagemaxxing/store/useStore";

const openDialog = () => {
  const trigger = screen.queryByTestId("create-space-open");
  if (trigger) {
    fireEvent.click(trigger);
  }
};

const fillAndSubmit = (fields: {
  readonly name?: string;
  readonly system?: string;
  readonly columns?: string;
  readonly rows?: string;
  readonly depth?: string;
}) => {
  openDialog();
  if (fields.name !== undefined) {
    fireEvent.change(screen.getByTestId("create-space-name"), {
      target: { value: fields.name },
    });
  }
  if (fields.system !== undefined) {
    fireEvent.change(screen.getByTestId("create-space-system"), {
      target: { value: fields.system },
    });
  }
  if (fields.columns !== undefined) {
    fireEvent.change(screen.getByTestId("create-space-columns"), {
      target: { value: fields.columns },
    });
  }
  if (fields.rows !== undefined) {
    fireEvent.change(screen.getByTestId("create-space-rows"), {
      target: { value: fields.rows },
    });
  }
  if (fields.depth !== undefined) {
    fireEvent.change(screen.getByTestId("create-space-depth"), {
      target: { value: fields.depth },
    });
  }
  fireEvent.click(screen.getByTestId("create-space-submit"));
};

describe("CreateSpaceFormPanel", () => {
  beforeEach(() => {
    useStore.setState({
      spaces: [],
      activeSpaceId: null,
      templatesById: {},
      constraintsBySpace: {},
    });
  });

  it("creates a template and space sized to the entered dimensions, makes it active, and closes the dialog", () => {
    render(<CreateSpaceFormPanel />);

    fillAndSubmit({
      name: "My drawer",
      system: "gridfinity",
      columns: "5",
      rows: "4",
      depth: "2",
    });

    const { spaces, activeSpaceId, templatesById } = useStore.getState();
    expect(spaces.length).toBe(1);
    expect(activeSpaceId).toEqual(spaces[0].id);
    const template = templatesById[spaces[0].templateId];
    expect(template.w).toBe(5);
    expect(template.l).toBe(4);
    expect(template.h).toBe(2);
    expect(spaces[0].constraints).toEqual({});

    expect(screen.queryByTestId("create-space-form")).toBeNull();
  });

  it("shows an inline error and adds nothing to the store when rows is non-numeric", () => {
    render(<CreateSpaceFormPanel />);

    fillAndSubmit({
      name: "My drawer",
      system: "gridfinity",
      columns: "5",
      rows: "abc",
      depth: "2",
    });

    expect(useStore.getState().spaces.length).toBe(0);
    expect(useStore.getState().activeSpaceId).toBeNull();
    expect(screen.getByTestId("create-space-error")).toBeTruthy();
    expect(screen.getByTestId("create-space-form")).toBeTruthy();
  });

  it("shows an inline error and adds nothing to the store when name is blank", () => {
    render(<CreateSpaceFormPanel />);

    fillAndSubmit({
      name: "",
      system: "gridfinity",
      columns: "5",
      rows: "4",
      depth: "2",
    });

    expect(useStore.getState().spaces.length).toBe(0);
    expect(screen.getByTestId("create-space-error")).toBeTruthy();
    expect(screen.getByTestId("create-space-form")).toBeTruthy();
  });

  it("closes the dialog when Cancel is clicked", () => {
    render(<CreateSpaceFormPanel />);
    openDialog();
    expect(screen.getByTestId("create-space-form")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByTestId("create-space-form")).toBeNull();
  });

  it("closes the dialog when Escape is pressed", () => {
    render(<CreateSpaceFormPanel />);
    openDialog();
    expect(screen.getByTestId("create-space-form")).toBeTruthy();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByTestId("create-space-form")).toBeNull();
  });

  it("closes the dialog when close button is clicked", () => {
    render(<CreateSpaceFormPanel />);
    openDialog();
    expect(screen.getByTestId("create-space-form")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(screen.queryByTestId("create-space-form")).toBeNull();
  });

  it("renders accessible modal dialog with labels and aria attributes", () => {
    render(<CreateSpaceFormPanel />);
    openDialog();

    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-labelledby")).toBe("create-space-title");
    expect(screen.getByLabelText("Space name")).toBeTruthy();
    expect(screen.getByLabelText("Storage system")).toBeTruthy();
    expect(screen.getByLabelText("Columns")).toBeTruthy();
    expect(screen.getByLabelText("Rows")).toBeTruthy();
    expect(screen.getByLabelText("Depth")).toBeTruthy();
  });
});
