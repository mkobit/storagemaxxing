import { expect, test } from "bun:test";
import { AKROMILS_CATALOG } from "./akromils";
import { SCHALLER_CATALOG } from "./schaller";
import { OPENGRID_CATALOG } from "./opengrid";

test("every AKROMILS_CATALOG entry is tagged system: akromils", () => {
  expect(AKROMILS_CATALOG.every((bin) => bin.system === "akromils")).toBe(
    true,
  );
});

test("every OPENGRID_CATALOG entry is tagged system: opengrid", () => {
  expect(OPENGRID_CATALOG.every((bin) => bin.system === "opengrid")).toBe(
    true,
  );
});

test("every SCHALLER_CATALOG entry is tagged system: schaller", () => {
  expect(SCHALLER_CATALOG.every((bin) => bin.system === "schaller")).toBe(
    true,
  );
});
