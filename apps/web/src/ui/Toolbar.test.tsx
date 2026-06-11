import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { Toolbar } from "./Toolbar";

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
});
