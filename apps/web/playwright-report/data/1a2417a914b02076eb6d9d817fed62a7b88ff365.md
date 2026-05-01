# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: user-stories.spec.ts >> Major User Stories >> User Story: Create a simple Sketch and Fill Space
- Location: e2e/user-stories.spec.ts:17:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: '+ Sketch' })

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Major User Stories', () => {
  4  |   test('New User: should see the initial scaffold and be able to start', async ({ page }) => {
  5  |     await page.goto('/');
  6  |     
  7  |     // Check for title or specific starting element
  8  |     await expect(page).toHaveTitle(/StorageMaxxing/);
  9  |     
  10 |     // Check for the timeline
  11 |     await expect(page.getByText('Timeline / Features')).toBeVisible();
  12 |     
  13 |     // Check for the canvas (or the message if empty)
  14 |     await expect(page.getByText('Select or create a sketch, or select a space to view.')).toBeVisible();
  15 |   });
  16 | 
  17 |   test('User Story: Create a simple Sketch and Fill Space', async ({ page }) => {
  18 |     await page.goto('/');
  19 | 
  20 |     // 1. Create a Sketch
> 21 |     await page.getByRole('button', { name: '+ Sketch' }).click();
     |                                                          ^ Error: locator.click: Test timeout of 30000ms exceeded.
  22 |     await expect(page.getByText('Sketch Feature 1')).toBeVisible();
  23 | 
  24 |     // 2. Create a Fill Space from that sketch
  25 |     await page.getByRole('button', { name: '+ Fill Space' }).click();
  26 |     await expect(page.getByText('Fill Space 1')).toBeVisible();
  27 | 
  28 |     // 3. Verify Constraint Editor appears
  29 |     await expect(page.getByText('Space Constraints')).toBeVisible();
  30 |   });
  31 | });
  32 | 
```