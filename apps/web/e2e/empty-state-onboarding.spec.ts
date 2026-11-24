import { expect, test } from "@playwright/test";

test("first-visit empty state loads a valid packed canvas in 1 click via Try sample drawer", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByTestId("empty-state-onboarding")).toBeVisible();
  await expect(page.getByTestId("empty-state-create-space")).toHaveText(
    "+ Create your first space",
  );
  await expect(page.getByTestId("empty-state-try-sample")).toHaveText(
    "Try sample drawer",
  );

  await page.getByTestId("empty-state-try-sample").click();

  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByTestId("layout-validity-badge")).toHaveText("valid");
});

test("first-visit empty state opens Create space dialog from + Create your first space", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByTestId("empty-state-create-space").click();

  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByTestId("create-space-form")).toBeVisible();
});
