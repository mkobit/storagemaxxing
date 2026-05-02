import { test, expect } from '@playwright/test';

test.describe('Major User Stories', () => {
  test('New User: should see the initial scaffold and be able to start', async ({ page }) => {
    await page.goto('/');
    
    // Check for title or specific starting element
    await expect(page).toHaveTitle(/StorageMaxxing/);
    
    // Check for the timeline
    await expect(page.getByText('Timeline / Features')).toBeVisible();
    
    // Check for the canvas (or the message if empty)
    await expect(page.getByText('Select or create a sketch, or select a space to view.')).toBeVisible();
  });

  test('User Story: Create a simple Sketch and Fill Space', async ({ page }) => {
    await page.goto('/');

    // 1. Create a Sketch
    await page.getByRole('button', { name: '+ Sketch' }).click();
    await expect(page.getByText('Sketch Feature 1')).toBeVisible();

    // 2. Create a Fill Space from that sketch
    await page.getByRole('button', { name: '+ Fill Space' }).click();
    await expect(page.getByText('Fill Space 1')).toBeVisible();

    // 3. Verify Constraint Editor appears
    await expect(page.getByText('Space Constraints')).toBeVisible();
  });
});
