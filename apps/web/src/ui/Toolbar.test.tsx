import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Toolbar } from "./Toolbar";

// Mock the store
vi.mock("@storagemaxxing/store/useStore", () => ({
  useStore: (selector: (state: unknown) => unknown) =>
    selector({ mode: "select", setMode: vi.fn() }),
}));

describe("Toolbar", () => {
  it("renders the toolbar", () => {
    render(<Toolbar />);
    expect(screen.getByTestId("toolbar")).toBeInTheDocument();
  });

  it("shows select mode as active by default in our mock", () => {
    render(<Toolbar />);
    const selectBtn = screen.getByTestId("mode-select");
    expect(selectBtn).toHaveClass("bg-brand-primary");
  });
});
