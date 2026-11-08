import { expect, type Locator, type Page } from '@playwright/test';

export const destinations = [
  ['workspace', 'Workspace', 'Put a model to the test.'],
  ['model-switch', 'Model switch', 'Model switch'],
  ['results', 'Results', 'Results'],
  ['trace', 'Request trace', 'Request trace'],
  ['capabilities', 'Otari capabilities', 'Otari capabilities'],
  ['guide', 'Guide', 'Guide'],
] as const;

export async function navigateView(page: Page, name: string) {
  const nav = page.getByRole('navigation', { name: 'Workbench views' });
  const toggle = nav.getByRole('button', { name: /^Views:/ });
  if (await toggle.isVisible()) await toggle.click();
  await nav.getByRole('link', { name, exact: true }).click();
}

export async function fitsViewport(control: Locator) {
  await expect(control).toBeVisible();
  const bounds = await control.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      width: document.documentElement.clientWidth,
      height: rect.height,
    };
  });
  expect(bounds.left).toBeGreaterThanOrEqual(0);
  expect(bounds.right).toBeLessThanOrEqual(bounds.width);
  expect(bounds.height).toBeGreaterThanOrEqual(44);
}

export async function noPageOverflow(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  // Disable the pre-existing Hallmark clipping so this detects broken components,
  // even when the root would otherwise conceal them. Data containers may scroll.
  const overflow = await page.evaluate(() => {
    const roots = [document.documentElement, document.body];
    const previous = roots.map((root) => root.style.overflowX);
    roots.forEach((root) => (root.style.overflowX = 'visible'));
    const width = document.documentElement.clientWidth;
    const scrollWidth = Math.max(...roots.map((root) => root.scrollWidth));
    const clippedControls = [...document.querySelectorAll('a, button, select, input')]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          !element.closest('.table-scroll') &&
          (rect.left < -1 || rect.right > width + 1)
        );
      })
      .map((element) => element.textContent?.trim() || element.getAttribute('aria-label'));
    roots.forEach((root, index) => (root.style.overflowX = previous[index]));
    return { scrollWidth, width, clippedControls };
  });
  expect(overflow.clippedControls).toEqual([]);
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.width);
}
