import { expect, test } from '@playwright/test';

test('getting started: renders, sorts, filters and supports keyboard navigation', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await page.goto('/');
  const grid = page.getByRole('grid', { name: 'Users' });
  await expect(grid).toBeVisible();
  await expect(grid.getByRole('row')).toHaveCount(7);

  const name = grid.getByRole('columnheader', { name: /Name/ });
  await name.click();
  await expect(name).toHaveAttribute('aria-sort', 'ascending');
  await expect(grid.getByRole('row').nth(1)).toContainText('Kai Ito');

  await page.getByLabel('Search users').fill('priya');
  await expect(grid.getByRole('row')).toHaveCount(2);
  await page.getByLabel('Search users').fill('');

  await name.focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator(':focus')).toHaveAttribute('data-tk-cell', '1:1');
  await expect(page.locator(':focus')).toHaveCSS('box-shadow', /rgb/); // visible focus ring

  expect(errors).toEqual([]);
});

test('100K rows: virtualizes, keeps aria-rowindex correct and pins columns', async ({ page }) => {
  await page.goto('/#/examples/100k');
  const grid = page.getByRole('grid', { name: 'People (100K rows)' });
  await expect(grid).toHaveAttribute('aria-rowcount', '100001');
  const domRows = await grid.getByRole('row').count();
  expect(domRows).toBeLessThan(40);

  await grid.evaluate((el) => (el.scrollTop = 36 * 60_000));
  // Row 60,000 is at the top; 5 overscan rows render above it -> first DOM row is index 59,995.
  await expect(grid.getByRole('row').nth(1)).toHaveAttribute('aria-rowindex', String(59_995 + 2));
  await expect(grid.getByRole('row').nth(6)).toHaveAttribute('aria-rowindex', String(60_000 + 2));

  // Horizontal scroll: pinned "Name" column stays at the same x position.
  const nameCell = grid.getByRole('row').nth(1).getByRole('gridcell').nth(1);
  const before = await nameCell.boundingBox();
  await grid.evaluate((el) => (el.scrollLeft = 400));
  await page.waitForTimeout(50);
  const after = await nameCell.boundingBox();
  expect(Math.round(after!.x)).toBe(Math.round(before!.x));

  // Keyboard to the very end
  await grid.getByRole('columnheader').first().focus();
  await page.keyboard.press('Control+End');
  await expect(page.locator(':focus')).toHaveAttribute('data-tk-cell', '100000:8');
  await expect(page.locator(':focus').locator('xpath=..')).toHaveAttribute(
    'aria-rowindex',
    '100001',
  );
  await expect(page.locator(':focus')).toBeInViewport();
});

test('column resize by dragging the header edge', async ({ page }) => {
  await page.goto('/');
  const header = page
    .getByRole('grid', { name: 'Users' })
    .getByRole('columnheader', { name: /Email/ });
  const box = (await header.boundingBox())!;
  await page.mouse.move(box.x + box.width - 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width + 80, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();
  const after = (await header.boundingBox())!;
  expect(Math.round(after.width)).toBe(Math.round(box.width + 82));
  await expect(header).not.toHaveAttribute('aria-sort');
});

test('selection: shift-click range and select all', async ({ page }) => {
  await page.goto('/#/examples/selection');
  const grid = page.getByRole('grid', { name: 'People with selection' });
  await grid.getByLabel('Select row 2').click();
  await grid.getByLabel('Select row 6').click({ modifiers: ['Shift'] });
  await expect(grid.locator('[aria-selected=true]')).toHaveCount(5);
  await expect(page.getByText(/5 selected/)).toBeVisible();
  await grid.getByLabel('Select all rows').click();
  await expect(page.getByText(/1000 selected/)).toBeVisible();
});

test('server-side example loads pages and re-sorts via callbacks', async ({ page }) => {
  await page.goto('/#/examples/server');
  const grid = page.getByRole('grid', { name: 'People (server-side)' });
  await expect(page.getByText('5,000 matches')).toBeVisible();
  await expect(grid).not.toHaveAttribute('aria-busy');
  await grid.getByRole('columnheader', { name: /Age/ }).click();
  await expect(page.getByRole('status')).toBeVisible();
  await expect(grid).not.toHaveAttribute('aria-busy');
  await expect(grid.getByRole('row').nth(1).getByRole('gridcell').nth(3)).toHaveText('21');
  await page.getByRole('button', { name: /Next/ }).click();
  await expect(page.getByText('Page 2 of 100')).toBeVisible();
});

test('theming and benchmarks pages render', async ({ page }) => {
  await page.goto('/#/examples/theming');
  const root = page.getByRole('grid', { name: 'Themed table' }).locator('xpath=..');
  await expect(root).toHaveCSS('background-color', 'rgb(13, 17, 23)');
  await page.goto('/#/benchmarks');
  await expect(page.getByRole('button', { name: 'Run benchmarks' })).toBeVisible();
});
