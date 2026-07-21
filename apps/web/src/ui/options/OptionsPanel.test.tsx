import { describe, it, expect, beforeEach, mock } from "bun:test";
mock.module("idb-keyval", () => ({
  get: async () => null,
  set: async () => {},
  del: async () => {},
}));

import { render, screen, fireEvent } from "@testing-library/react";
import { OptionsPanel } from "./OptionsPanel";
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

const templateId = SpaceTemplateIdSchema.parse("options-template");
const template = createSpaceTemplate(
  templateId,
  createDimensions3D(12, 12, 2),
  "top",
);

const spaceId = SpaceInstanceIdSchema.parse("options-space");
const space = SpaceInstanceSchema.parse({
  id: spaceId,
  templateId,
  name: "Options space",
  count: 1,
  constraints: {},
});

describe("OptionsPanel", () => {
  describe("with no active space", () => {
    beforeEach(() => {
      useStore.setState({
        spaces: [],
        activeSpaceId: null,
        templatesById: {},
      });
    });

    it("renders an empty state instead of throwing", () => {
      render(<OptionsPanel />);
      expect(screen.getByTestId("options-panel")).toBeTruthy();
      expect(screen.getByText("No active space selected")).toBeTruthy();
    });
  });

  describe("with an active space", () => {
    beforeEach(() => {
      useStore.setState({
        spaces: [space],
        activeSpaceId: spaceId,
        templatesById: { [templateId]: template },
      });
    });

    it("renders exactly one card per comparable system, with no overall-ranking label", () => {
      render(<OptionsPanel />);
      expect(screen.getByTestId("strategy-card-schaller")).toBeTruthy();
      expect(screen.getByTestId("strategy-card-gridfinity")).toBeTruthy();
      expect(screen.getByTestId("strategy-card-akromils")).toBeTruthy();
      expect(screen.getByTestId("strategy-card-opengrid")).toBeTruthy();
      expect(screen.queryByText(/best overall/i)).toBeNull();
      expect(screen.queryByText(/winner/i)).toBeNull();
    });

    it("commits the clicked system via applySpaceStrategy and invokes onStrategyApplied", () => {
      const onStrategyApplied = mock(() => {});
      render(<OptionsPanel onStrategyApplied={onStrategyApplied} />);

      const card = screen.getByTestId("strategy-card-gridfinity");
      const selectButton = card.querySelector(
        '[data-testid="select-and-customize"]',
      );
      expect(selectButton).toBeTruthy();
      if (!selectButton) return;
      fireEvent.click(selectButton);

      const updatedSpace = useStore
        .getState()
        .spaces.find((s) => s.id === spaceId);
      expect(updatedSpace?.system).toBe("gridfinity");
      expect(onStrategyApplied).toHaveBeenCalledTimes(1);
    });
  });
});
