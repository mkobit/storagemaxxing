import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import type React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "./ThemeProvider";
import { useTheme } from "./useTheme";
import { THEME_STORAGE_KEY } from "./ThemePreference";

const ThemeProbe: React.FC = () => {
  const { preference, resolvedTheme, setPreference } = useTheme();
  return (
    <div>
      <span data-testid="preference">{preference}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button data-testid="pin-dark" onClick={() => setPreference("dark")}>
        pin dark
      </button>
      <button data-testid="pin-light" onClick={() => setPreference("light")}>
        pin light
      </button>
    </div>
  );
};

const renderProbe = () =>
  render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  );

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.classList.remove("dark");
});

afterEach(() => {
  window.localStorage.clear();
  document.documentElement.classList.remove("dark");
});

describe("ThemeProvider", () => {
  it("defaults to system preference when nothing is stored", () => {
    renderProbe();
    expect(screen.getByTestId("preference").textContent).toBe("system");
    expect(screen.getByTestId("resolved").textContent).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("pins an explicit override and applies the .dark class immediately", () => {
    renderProbe();
    fireEvent.click(screen.getByTestId("pin-dark"));

    expect(screen.getByTestId("preference").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("persists the explicit override to localStorage", () => {
    renderProbe();
    fireEvent.click(screen.getByTestId("pin-dark"));

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("reads a previously persisted override on mount", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    renderProbe();

    expect(screen.getByTestId("preference").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("degrades a corrupted stored value to system default", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "not-a-real-theme");
    renderProbe();

    expect(screen.getByTestId("preference").textContent).toBe("system");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("switches back to light after pinning dark then light", () => {
    renderProbe();
    fireEvent.click(screen.getByTestId("pin-dark"));
    fireEvent.click(screen.getByTestId("pin-light"));

    expect(screen.getByTestId("preference").textContent).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
