import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

test.use({ viewport: { width: 390, height: 844 } });

test("mobile viewport has zero WCAG violations across empty and packed workspace tabs", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("toolbar")).toBeVisible();

  const emptyResults = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .analyze();
  expect(emptyResults.violations).toEqual([]);

  await page.getByTestId("empty-state-try-sample").click();
  await expect(page.locator("canvas")).toBeVisible();

  for (const tab of ["Layout", "BOM", "Options"] as const) {
    await page.getByRole("button", { name: tab, exact: true }).click();
    const results = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .analyze();
    expect(results.violations, `WCAG violations on mobile ${tab} tab`).toEqual(
      [],
    );
  }
});
