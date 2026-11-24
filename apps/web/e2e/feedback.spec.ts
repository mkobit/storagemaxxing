import { expect, test } from "@playwright/test";

test("Feedback popover copies repro JSON, links to GitHub issues, and closes on Escape or outside click", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");

  await page.getByTestId("feedback-trigger").click();
  await expect(page.getByTestId("feedback-popover")).toBeVisible();

  const issueLink = page.getByTestId("open-github-issue");
  await expect(issueLink).toHaveAttribute(
    "href",
    /^https:\/\/github\.com\/mkobit\/storagemaxxing\/issues\/new\?/,
  );

  await page.getByTestId("copy-repro-json").click();
  await expect(page.getByTestId("copy-repro-json")).toHaveText("Copied");

  const clipboardText = await page.evaluate(() =>
    navigator.clipboard.readText(),
  );
  const parsed = JSON.parse(clipboardText) as {
    spacesCount: number;
    activeSpace: unknown;
    viewport: { width: number; height: number };
    url: string;
    userAgent: string;
  };
  expect(typeof parsed.spacesCount).toBe("number");
  expect(parsed.viewport.width).toBeGreaterThan(0);
  expect(parsed.viewport.height).toBeGreaterThan(0);
  expect(parsed.url).toContain("http");
  expect(parsed.userAgent.length).toBeGreaterThan(0);

  await page.keyboard.press("Escape");
  await expect(page.getByTestId("feedback-popover")).toBeHidden();

  await page.getByTestId("feedback-trigger").click();
  await expect(page.getByTestId("feedback-popover")).toBeVisible();

  await page.getByRole("heading", { name: "Storagemaxxing" }).click();
  await expect(page.getByTestId("feedback-popover")).toBeHidden();
});
