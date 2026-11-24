import { expect, test, type Page } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 800 } });

async function waitForStableRender(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
}

async function createGridfinityDrawer(page: Page): Promise<void> {
  await page.getByTestId("create-space-open").click();
  await page.getByTestId("create-space-name").fill("Workshop drawer");
  await page.getByTestId("create-space-system").selectOption("gridfinity");
  await page.getByTestId("create-space-columns").fill("14");
  await page.getByTestId("create-space-rows").fill("10");
  await page.getByTestId("create-space-depth").fill("2");
  await page.getByTestId("create-space-submit").click();
}

test("default workspace matches visual baseline in light and dark themes", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("toolbar")).toBeVisible();
  await waitForStableRender(page);

  await expect(page).toHaveScreenshot("workspace-default-light.png", {
    animations: "disabled",
  });

  await page.getByTestId("theme-toggle").click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await waitForStableRender(page);

  await expect(page).toHaveScreenshot("workspace-default-dark.png", {
    animations: "disabled",
  });
});

test("packed Gridfinity drawer workspace matches visual baseline", async ({
  page,
}) => {
  await page.goto("/");
  await createGridfinityDrawer(page);

  await page.getByTestId("add-bin-gridfinity-2x2x2").click();
  await page.getByTestId("add-bin-gridfinity-1x1x2").click();

  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByTestId("layout-validity-badge")).toHaveText("valid");
  await waitForStableRender(page);

  await expect(page).toHaveScreenshot("workspace-packed-gridfinity.png", {
    animations: "disabled",
  });
});

test("Options Mode comparison cards match visual baseline", async ({
  page,
}) => {
  await page.goto("/");
  await createGridfinityDrawer(page);

  await page.getByText("Options", { exact: true }).click();
  await expect(page.getByTestId("strategy-card-gridfinity")).toBeVisible();
  await expect(page.getByTestId("strategy-card-schaller")).toBeVisible();
  await waitForStableRender(page);

  await expect(page).toHaveScreenshot("options-mode.png", {
    animations: "disabled",
  });
});

test("BOM panel matches visual baseline", async ({ page }) => {
  await page.goto("/");
  await createGridfinityDrawer(page);
  await page.getByTestId("add-bin-gridfinity-2x2x2").click();
  await expect(page.getByTestId("layout-validity-badge")).toHaveText("valid");

  await page.getByRole("button", { name: "BOM" }).click();
  await expect(page.getByTestId("bom-panel")).toBeVisible();
  await waitForStableRender(page);

  await expect(page).toHaveScreenshot("bom-panel.png", {
    animations: "disabled",
  });
});
