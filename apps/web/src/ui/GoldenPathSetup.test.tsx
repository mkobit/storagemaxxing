import { describe, it, expect, beforeEach, mock } from "bun:test";
mock.module("idb-keyval", () => ({
  get: async () => null,
  set: async () => {},
  del: async () => {},
}));

import { render, screen, fireEvent } from "@testing-library/react";
import { GoldenPathSetup } from "./GoldenPathSetup";
import { useStore } from "@storagemaxxing/store/useStore";
import { initialState } from "@storagemaxxing/store/StoreTypes";
import { GOLDEN_PATH_STARTER_BIN_IDS } from "@storagemaxxing/catalog/goldenPath";
import { SpaceInstanceIdSchema } from "@storagemaxxing/assembly/SpaceInstance";
import { SpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";

const constraintModes = (
  constraints: Readonly<Record<string, SpaceConstraint>>,
): Readonly<Record<string, SpaceConstraint["mode"]>> =>
  Object.fromEntries(
    Object.entries(constraints).map(([binId, c]) => [binId, c.mode]),
  );

describe("GoldenPathSetup", () => {
  beforeEach(() => {
    useStore.setState(initialState);
  });

  it("loads the starter layout", () => {
    render(<GoldenPathSetup />);

    fireEvent.click(screen.getByTestId("add-starter-bins"));

    const state = useStore.getState();
    expect(state.spaces.map((s) => s.id)).toEqual([
      SpaceInstanceIdSchema.parse("golden-path-instance"),
    ]);
    expect(state.activeSpaceId).toBe(
      SpaceInstanceIdSchema.parse("golden-path-instance"),
    );
    const space = state.spaces[0]!;
    expect(Object.keys(space.constraints)).toEqual([
      ...GOLDEN_PATH_STARTER_BIN_IDS,
    ]);
    const template = state.templatesById[space.templateId]!;
    expect([template.w, template.l, template.h]).toEqual([12, 12, 2]);
  });

  it("loads the tiny starter layout", () => {
    render(<GoldenPathSetup />);

    fireEvent.click(screen.getByTestId("add-tiny-starter-bins"));

    const state = useStore.getState();
    expect(state.spaces.map((s) => s.id)).toEqual([
      SpaceInstanceIdSchema.parse("golden-path-tiny-instance"),
    ]);
    expect(state.activeSpaceId).toBe(
      SpaceInstanceIdSchema.parse("golden-path-tiny-instance"),
    );
    const space = state.spaces[0]!;
    const template = state.templatesById[space.templateId]!;
    expect([template.w, template.l, template.h]).toEqual([2, 2, 2]);
  });

  it("loads the partial starter layout with a mix of hard and auto constraints", () => {
    render(<GoldenPathSetup />);

    fireEvent.click(screen.getByTestId("add-partial-starter-bins"));

    const state = useStore.getState();
    expect(state.spaces.map((s) => s.id)).toEqual([
      SpaceInstanceIdSchema.parse("golden-path-partial-instance"),
    ]);
    expect(state.activeSpaceId).toBe(
      SpaceInstanceIdSchema.parse("golden-path-partial-instance"),
    );
    const space = state.spaces[0]!;
    const [firstBinId, secondBinId] = GOLDEN_PATH_STARTER_BIN_IDS;
    const modes = constraintModes(space.constraints);
    expect(modes[firstBinId!]).toBe("hard");
    expect(modes[secondBinId!]).toBe("auto");
  });

  it("loads the unresolved starter layout with a bin id absent from the catalog", () => {
    render(<GoldenPathSetup />);

    fireEvent.click(screen.getByTestId("add-unresolved-starter-bins"));

    const state = useStore.getState();
    expect(state.spaces.map((s) => s.id)).toEqual([
      SpaceInstanceIdSchema.parse("golden-path-unresolved-instance"),
    ]);
    expect(state.activeSpaceId).toBe(
      SpaceInstanceIdSchema.parse("golden-path-unresolved-instance"),
    );
    const space = state.spaces[0]!;
    expect(Object.keys(space.constraints)).toEqual([
      "gridfinity-unknown-bin-id",
    ]);
  });
});
