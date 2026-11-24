import { GOLDEN_PATH_STARTER_BIN_IDS } from "@storagemaxxing/catalog/goldenPath";
import {
  createSpaceTemplate,
  type SpaceTemplate,
} from "@storagemaxxing/assembly/SpaceTemplate";
import { createSpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import {
  SpaceInstanceSchema,
  type SpaceInstance,
} from "@storagemaxxing/assembly/SpaceInstance";
import { createDimensions3D } from "@storagemaxxing/geometry/Dimensions3D";
import { binColorForIndex } from "./binColorPalette";

export type StarterDrawerParams = {
  readonly templateId: string;
  readonly spaceSize: number;
  readonly spaceId: string;
  readonly spaceName: string;
};

export const DEFAULT_STARTER_DRAWER: StarterDrawerParams = {
  templateId: "golden-path-space",
  spaceSize: 12,
  spaceId: "golden-path-instance",
  spaceName: "Starter drawer",
};

/**
 * Builds a pre-configured Gridfinity drawer template and space instance with
 * starter bin constraints so the layout renders a valid packed canvas.
 */
export const buildStarterDrawer = ({
  templateId,
  spaceSize,
  spaceId,
  spaceName,
}: StarterDrawerParams): {
  readonly template: SpaceTemplate;
  readonly space: SpaceInstance;
} => {
  const template = createSpaceTemplate(
    templateId,
    createDimensions3D(spaceSize, spaceSize, 2),
    "top",
  );
  const constraints = GOLDEN_PATH_STARTER_BIN_IDS.map((id, i) => ({
    ...createSpaceConstraint(id, 1, 0, 1),
    color: binColorForIndex(i),
  }));
  const space = SpaceInstanceSchema.parse({
    id: spaceId,
    templateId: template.id,
    name: spaceName,
    count: 1,
    constraints: Object.fromEntries(constraints.map((c) => [c.binId, c])),
  });
  return { template, space };
};
