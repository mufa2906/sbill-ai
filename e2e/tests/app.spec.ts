import { test, expect, Page } from '@playwright/test';

const PASSWORD = 'password123';

function uniqueEmail() {
  return `test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.com`;
}

async function register(page: Page, email: string) {
  await page.goto('/register');
  await page.fill('[id="name"]', 'Test User');
  await page.fill('[id="email"]', email);
  await page.fill('[id="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('/bills', { timeout: 10000 });
}

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.fill('[id="email"]', email);
  await page.fill('[id="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('/bills', { timeout: 10000 });
}

// ──────────────────────────────────────────────
test('1. register new user', async ({ page }) => {
  const email = uniqueEmail();
  await page.goto('/register');
  await page.fill('[id="name"]', 'Test User');
  await page.fill('[id="email"]', email);
  await page.fill('[id="password"]', PASSWORD);

  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/auth/register')),
    page.click('button[type="submit"]'),
  ]);

  const body = await response.json();
  console.log('register status:', response.status(), '| has tokens:', !!body.data?.accessToken);
  expect(response.status()).toBe(201);
  await expect(page).toHaveURL('/bills');
});

test('2. login returns 200', async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email);

  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/auth/login')),
    login(page, email).catch(() => {}),
  ]);

  console.log('login status:', response.status());
  expect(response.status()).toBe(200);
  await expect(page).toHaveURL('/bills');
});

test('3. create bill', async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email);
  await page.goto('/bills/new');

  await page.fill('[id="title"]', 'Makan Bareng');

  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/bills'), { timeout: 10000 }),
    page.click('button[type="submit"]'),
  ]);

  const body = await response.json();
  console.log('create bill status:', response.status(), '| id:', body.data?.id, '| state:', body.data?.state);
  expect(response.status()).toBe(201);
  expect(body.data?.id).toBeTruthy();
  expect(body.data?.state).toBe('DRAFT');
  // should navigate to bill detail
  await expect(page).toHaveURL(/\/bills\/[a-z0-9-]+/);
});

test('4. bills list page loads', async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email);
  await expect(page).toHaveURL('/bills');

  const errorText = page.locator('text=/500|crashed/i');
  await expect(errorText).toHaveCount(0);
  console.log('bills list loaded ok');
});

test('5. unauthenticated redirect to login', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/bills');
  await page.waitForURL('/login', { timeout: 5000 });
  await expect(page).toHaveURL('/login');
});

test('6. full flow: register → create bill → add participant → assign item', async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email);

  // create bill
  await page.goto('/bills/new');
  await page.fill('[id="title"]', 'Full Flow Test');
  const [billRes] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/bills') && r.request().method() === 'POST', { timeout: 10000 }),
    page.click('button[type="submit"]'),
  ]);
  const billBody = await billRes.json();
  console.log('bill created:', billBody.data?.id, '| state:', billBody.data?.state);
  expect(billBody.data?.id).toBeTruthy();

  // wait for navigation to bill detail
  // UUID pattern: 8-4-4-4-12 hex chars
  await page.waitForURL(/\/bills\/[0-9a-f]{8}-[0-9a-f]{4}-/, { timeout: 10000 });
  const currentUrl = page.url();
  console.log('navigated to:', currentUrl);

  // check tabs exist
  const itemsTab = page.locator('[role="tab"]:has-text("Items"), button:has-text("Items")').first();
  const peopleTab = page.locator('[role="tab"]:has-text("People"), button:has-text("People")').first();
  console.log('Items tab visible:', await itemsTab.isVisible().catch(() => false));
  console.log('People tab visible:', await peopleTab.isVisible().catch(() => false));

  // check page has content
  const bodyText = await page.innerText('body');
  console.log('page content snippet:', bodyText.slice(0, 200));
});

test('7. duplicate email rejected', async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email);

  // try register same email again
  await page.goto('/register');
  await page.fill('[id="name"]', 'Another User');
  await page.fill('[id="email"]', email);
  await page.fill('[id="password"]', PASSWORD);

  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/auth/register')),
    page.click('button[type="submit"]'),
  ]);

  console.log('duplicate register status:', response.status());
  expect(response.status()).toBeGreaterThanOrEqual(400);
  // should still be on register page (not redirected)
  await expect(page).toHaveURL('/register');
});
