import { test, expect } from "@playwright/test";

test("headings use Outfit and body text uses Inter", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "BOM" }).click();
  const heading = page.getByRole("heading", { name: "Bill of Materials" });
  await expect(heading).toBeVisible();
  await expect(heading).toHaveCSS("font-family", /Outfit/);

  const bodyText = page.getByTestId("mode-select");
  await expect(bodyText).toHaveCSS("font-family", /Inter/);
});
