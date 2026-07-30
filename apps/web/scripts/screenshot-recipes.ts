import type { Page } from "@playwright/test";

const createGoldenPathSpace = async (page: Page): Promise<void> => {
  await page.getByTestId("create-space-name").fill("Screenshot recipe space");
  await page.getByTestId("create-space-system").selectOption("schaller");
  await page.getByTestId("create-space-columns").fill("24");
  await page.getByTestId("create-space-rows").fill("24");
  await page.getByTestId("create-space-depth").fill("3");
  await page.getByTestId("create-space-submit").click();
};

export const SCREENSHOT_RECIPES: Readonly<
  Record<string, (page: Page) => Promise<void>>
> = {
  "constraint-row": async (page) => {
    await createGoldenPathSpace(page);
    await page.getByTestId("add-bin-schaller-1x1x2").click();
    await page.waitForSelector('[data-testid="constraint-row-schaller-1x1x2"]');
  },
  "options-mode": async (page) => {
    await createGoldenPathSpace(page);
    await page.getByText("Options", { exact: true }).click();
    await page.waitForSelector('[data-testid="strategy-card-schaller"]');
  },
};
