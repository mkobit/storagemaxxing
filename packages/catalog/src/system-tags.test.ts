import { expect, test } from "bun:test";
import { AKROMILS_CATALOG } from "./akromils";
import { SCHALLER_CATALOG } from "./schaller";

test("every AKROMILS_CATALOG entry is tagged system: akromils", () => {
  expect(AKROMILS_CATALOG.every((bin) => bin.system === "akromils")).toBe(
    true,
  );
});

test("every SCHALLER_CATALOG entry is tagged system: schaller", () => {
  expect(SCHALLER_CATALOG.every((bin) => bin.system === "schaller")).toBe(
    true,
  );
});
