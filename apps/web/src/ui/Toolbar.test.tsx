import { describe, it, expect, beforeEach, mock } from "bun:test";
mock.module("idb-keyval", () => ({
  get: async () => null,
  set: async () => {},
  del: async () => {},
}));

import { render, screen, fireEvent } from "@testing-library/react";
import { Toolbar } from "./Toolbar";
import { ThemeProvider } from "./theme/ThemeProvider";
import { useStore } from "@storagemaxxing/store/useStore";
import { initialState } from "@storagemaxxing/store/StoreTypes";

const renderToolbar = () => render(<Toolbar />, { wrapper: ThemeProvider });

describe("Toolbar", () => {
  beforeEach(() => {
    useStore.setState(initialState);
  });

  it("renders the toolbar", () => {
    renderToolbar();
    expect(document.body.contains(screen.getByTestId("toolbar"))).toBe(true);
  });

  it("shows select mode as active by default", () => {
    renderToolbar();
    const selectBtn = screen.getByTestId("mode-select");
    expect(selectBtn.classList.contains("bg-brand-primary")).toBe(true);
  });

  it("switches between select and pan modes", () => {
    renderToolbar();
    const selectBtn = screen.getByTestId("mode-select");
    const panBtn = screen.getByTestId("mode-pan");

    fireEvent.click(panBtn);
    expect(useStore.getState().mode).toBe("pan");
    expect(panBtn.classList.contains("bg-brand-primary")).toBe(true);
    expect(selectBtn.classList.contains("bg-brand-primary")).toBe(false);

    fireEvent.click(selectBtn);
    expect(useStore.getState().mode).toBe("select");
    expect(selectBtn.classList.contains("bg-brand-primary")).toBe(true);
  });

  it("does not duplicate global controls hosted in AppHeader", () => {
    renderToolbar();
    expect(screen.queryByTestId("space-manager")).toBeNull();
    expect(screen.queryByTestId("export-sketch")).toBeNull();
    expect(screen.queryByTestId("import-sketch")).toBeNull();
    expect(screen.queryByTestId("dev-tools-menu")).toBeNull();
    expect(screen.queryByTestId("theme-toggle")).toBeNull();
  });
});
