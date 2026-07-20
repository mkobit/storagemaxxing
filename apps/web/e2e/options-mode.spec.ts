import { test, expect } from "@playwright/test";

test("no active space shows an empty state instead of strategy cards", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByText("Options", { exact: true }).click();

  await expect(page.getByTestId("options-panel")).toHaveText(
    "No active space selected",
  );
});

test("viewing Options Mode renders one card per comparable system with per-metric best-value highlighting, no overall ranking", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByTestId("create-space-name").fill("Options mode drawer");
  await page.getByTestId("create-space-system").selectOption("schaller");
  await page.getByTestId("create-space-columns").fill("24");
  await page.getByTestId("create-space-rows").fill("24");
  await page.getByTestId("create-space-depth").fill("3");
  await page.getByTestId("create-space-submit").click();

  await page.getByText("Options", { exact: true }).click();

  await expect(page.getByTestId("strategy-card-schaller")).toBeVisible();
  await expect(page.getByTestId("strategy-card-gridfinity")).toBeVisible();
  await expect(page.getByTestId("strategy-card-akromils")).toBeVisible();

  await expect(page.getByTestId("options-panel")).not.toContainText(
    /best overall|recommended/i,
  );
});

test("selecting a strategy commits its system and auto-fill constraints, then hands off to Configure Mode", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByTestId("create-space-name").fill("Options mode drawer");
  await page.getByTestId("create-space-system").selectOption("schaller");
  await page.getByTestId("create-space-columns").fill("24");
  await page.getByTestId("create-space-rows").fill("24");
  await page.getByTestId("create-space-depth").fill("3");
  await page.getByTestId("create-space-submit").click();

  await page.getByText("Options", { exact: true }).click();

  const gridfinityCard = page.getByTestId("strategy-card-gridfinity");
  await gridfinityCard.getByTestId("select-and-customize").click();

  // Hands off to Configure Mode (the existing constraint-editing view).
  await expect(page.getByTestId("constraint-editor-panel")).toBeVisible();

  // The committed system's bins appear as auto-fill constraint rows...
  const gridfinityRows = page.locator(
    '[data-testid^="constraint-row-gridfinity-"]',
  );
  await expect(gridfinityRows.first()).toBeVisible();
  const firstRow = await gridfinityRows.first().getAttribute("data-testid");
  const firstBinId = firstRow?.replace("constraint-row-", "");
  await expect(
    page.getByTestId(`constraint-mode-${firstBinId}`),
  ).toHaveValue("auto");

  // ...and the previously-selected schaller system's bins are gone.
  await expect(
    page.locator('[data-testid^="constraint-row-schaller-"]'),
  ).toHaveCount(0);
});
