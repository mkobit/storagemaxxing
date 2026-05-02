# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: user-stories.spec.ts >> Major User Stories >> New User: should see the initial scaffold and be able to start
- Location: e2e/user-stories.spec.ts:4:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Timeline / Features')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Timeline / Features')

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
> 11 |     await expect(page.getByText('Timeline / Features')).toBeVisible();
     |                                                         ^ Error: expect(locator).toBeVisible() failed
  12 |     
  13 |     // Check for the canvas (or the message if empty)
  14 |     await expect(page.getByText('Select or create a sketch, or select a space to view.')).toBeVisible();
  15 |   });
  16 | 
  17 |   test('User Story: Create a simple Sketch and Fill Space', async ({ page }) => {
  18 |     await page.goto('/');
  19 | 
  20 |     // 1. Create a Sketch
  21 |     await page.getByRole('button', { name: '+ Sketch' }).click();
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