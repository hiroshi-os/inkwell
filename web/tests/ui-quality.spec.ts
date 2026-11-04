import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const API = 'http://127.0.0.1:18080';
const baseline = process.env.AUDIT_BASELINE === '1';
const phase = baseline ? 'before' : 'after';
const widths = [320, 390, 768, 1280];
let story: any;
let session: any;
let routes: { name: string; path: string; heading: string; auth?: boolean }[];

test.beforeAll(async ({ request }) => {
  const login = await request.post(`${API}/api/auth/login`, { data: { username: 'iris', password: 'password123' } });
  expect(login.ok()).toBeTruthy();
  session = await login.json();
  const listing = await request.get(`${API}/api/users/${session.user.id}/stories`);
  const stories = (await listing.json()).stories;
  const response = await request.get(`${API}/api/stories/${stories[0].id}`);
  story = await response.json();
  const chapter = story.chapters.find((c: any) => c.published);
  routes = [
    { name: 'browse', path: '/', heading: 'Stories that linger after the lamp is out.' },
    { name: 'login', path: '/login', heading: 'Log in' },
    { name: 'register', path: '/register', heading: 'Create an account' },
    { name: 'story', path: `/stories/${story.id}`, heading: story.title },
    { name: 'reader', path: `/stories/${story.id}/read/${chapter.id}`, heading: chapter.title },
    { name: 'desk', path: '/write', heading: 'Your desk', auth: true },
    { name: 'editor', path: `/write/${story.id}`, heading: '', auth: true },
    { name: 'profile', path: '/me', heading: 'Profile', auth: true },
  ];
});

async function open(page: Page, name: string) {
  const route = routes.find((r) => r.name === name)!;
  if (route.auth) await page.addInitScript((s) => {
    localStorage.setItem('inkwell.token', s.token);
    localStorage.setItem('inkwell.user', JSON.stringify(s.user));
  }, session);
  await page.goto(route.path);
  if (route.heading) await expect(page.getByRole('heading', { name: route.heading, exact: true })).toBeVisible();
  else await expect(page.getByRole('button', { name: 'Save details', exact: true })).toBeVisible();
  if (name === 'browse') await expect(page.locator('.story-card').first()).toBeVisible();
  if (route.auth) await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

for (const width of widths) {
  for (const name of ['browse', 'login', 'register', 'story', 'reader', 'desk', 'editor', 'profile']) {
    test(`${name} at ${width}px: accessibility and reflow`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page, name);
      const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const overflow = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth,
      }));
      const report = { route: name, width, violations: scan.violations, incomplete: scan.incomplete, overflow,
        browser: page.context().browser()?.version(), testedAt: new Date().toISOString() };
      mkdirSync(`.test-artifacts/${phase}`, { recursive: true });
      writeFileSync(`.test-artifacts/${phase}/${name}-${width}.json`, JSON.stringify(report, null, 2));
      if (width === 320 || width === 1280) await page.screenshot({ path: `.test-artifacts/${phase}/${name}-${width}.png`, fullPage: true });
      if (!baseline) {
        expect(scan.violations.map(({ id, impact, nodes }) => ({ id, impact, elements: nodes.map((n) => n.target) }))).toEqual([]);
        expect(overflow.content).toBeLessThanOrEqual(overflow.viewport + 1);
      }
    });
  }
}

test('keyboard bypass reaches the main content and search controls', async ({ page }) => {
  test.skip(baseline, 'Behavior assertions run after the diagnostic baseline.');
  await open(page, 'browse');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('searchbox', { name: 'Search stories' })).toBeFocused();
  expect(await page.getByRole('searchbox', { name: 'Search stories' }).evaluate((e) => getComputedStyle(e).outlineWidth)).toBe('3px');
});

test('long author names and unbroken story text reflow at 320px', async ({ page, request }) => {
  const headers = { Authorization: `Bearer ${session.token}` };
  let id: string | undefined;
  try {
    const profile = await request.patch(`${API}/api/me`, { headers, data: { displayName: 'Reader'.repeat(20), bio: session.user.bio } });
    const user = await profile.json();
    const created = await request.post(`${API}/api/stories`, { headers, data: { title: 'LongTitle'.repeat(20), synopsis: 'Synopsis'.repeat(40), genre: 'Fantasy', status: 'published' } });
    expect(created.ok()).toBeTruthy();
    id = (await created.json()).id;
    const response = await request.post(`${API}/api/stories/${id}/chapters`, { headers, data: { title: 'Chapter'.repeat(20), body: 'UnbrokenText'.repeat(80), published: true } });
    const chapter = await response.json();
    await page.addInitScript((s) => {
      localStorage.setItem('inkwell.token', s.token);
      localStorage.setItem('inkwell.user', JSON.stringify(s.user));
    }, { ...session, user });
    await page.setViewportSize({ width: 320, height: 900 });
    const measurements = [];
    for (const path of [`/stories/${id}`, `/stories/${id}/read/${chapter.id}`]) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const sizes = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
      measurements.push({ path, ...sizes });
      if (!baseline) expect(sizes.content).toBeLessThanOrEqual(sizes.viewport + 1);
    }
    mkdirSync(`.test-artifacts/${phase}`, { recursive: true });
    writeFileSync(`.test-artifacts/${phase}/long-content.json`, JSON.stringify(measurements, null, 2));
  } finally {
    if (id) await request.delete(`${API}/api/stories/${id}`, { headers });
    await request.patch(`${API}/api/me`, { headers, data: { displayName: session.user.displayName, bio: session.user.bio } });
  }
});

test('search, genre selection and no-results state use real API data', async ({ page }) => {
  test.skip(baseline);
  await open(page, 'browse');
  const search = page.getByRole('searchbox', { name: 'Search stories' });
  await search.fill(story.title);
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.locator('.story-card')).toHaveCount(1);
  await expect(page.locator('.story-card')).toContainText(story.title);
  await search.fill('no-such-story-974835');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('0 published stories');
  await expect(page.getByText('No stories match your search. Try another title or genre.')).toBeVisible();
  await search.fill('');
  await page.getByRole('button', { name: 'Fantasy', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Fantasy', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.story-card').first()).toBeVisible();
});

test('login error is announced and the form works using labels and keyboard', async ({ page }) => {
  test.skip(baseline);
  await open(page, 'login');
  await page.getByLabel('Username or email').fill('iris');
  await page.getByLabel('Password', { exact: true }).fill('incorrect-password');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Log in', exact: true })).toBeEnabled();
  await page.getByLabel('Password', { exact: true }).fill('password123');
  await page.getByLabel('Password', { exact: true }).press('Enter');
  await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
});

test('author can create, save and reopen a chapter through the UI and database', async ({ page, request }) => {
  test.skip(baseline);
  const title = `UI audit ${Date.now()}`;
  let createdId: string | undefined;
  try {
    await open(page, 'desk');
    await page.getByLabel('Title', { exact: true }).fill(title);
    await page.getByLabel('Synopsis', { exact: true }).fill('A real browser-to-API-to-SQLite verification.');
    await page.getByRole('button', { name: 'Start story' }).click();
    await expect(page.getByRole('button', { name: 'Save details', exact: true })).toBeVisible();
    createdId = page.url().split('/').pop();
    await page.getByRole('button', { name: '+ Chapter', exact: true }).click();
    await page.getByLabel('Chapter title', { exact: true }).fill('Keyboard chapter');
    await page.getByLabel('Body', { exact: true }).fill('Saved through the browser and the real Go API.');
    await page.getByRole('button', { name: 'Save chapter', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText('Chapter saved.');
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations).toEqual([]);
    await page.reload();
    await page.getByRole('button', { name: /Keyboard chapter/ }).click();
    await expect(page.getByLabel('Body', { exact: true })).toHaveValue('Saved through the browser and the real Go API.');
    const response = await request.get(`${API}/api/stories/${createdId}`);
    expect((await response.json()).chapters[0].title).toBe('Keyboard chapter');
  } finally {
    if (createdId) await request.delete(`${API}/api/stories/${createdId}`, { headers: { Authorization: `Bearer ${session.token}` } });
  }
});

test('registration and profile edits persist through the real API', async ({ page }) => {
  test.skip(baseline);
  const username = `audit${Date.now()}`;
  await open(page, 'register');
  await page.getByLabel('Username', { exact: true }).fill(username);
  await page.getByLabel('Email', { exact: true }).fill(`${username}@example.test`);
  await page.getByLabel('Display name', { exact: true }).fill('UI audit reader');
  await page.getByLabel('Password', { exact: true }).fill('local-test-password');
  await page.getByRole('button', { name: 'Join Inkwell' }).click();
  await expect(page.getByRole('heading', { name: 'Your desk' })).toBeVisible();
  await page.getByRole('link', { name: 'UI audit reader', exact: true }).click();
  await page.getByLabel('Display name', { exact: true }).fill('Updated reader');
  await page.getByLabel('Bio', { exact: true }).fill('Saved during the browser verification.');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Profile saved.');
  await page.reload();
  await expect(page.getByLabel('Display name', { exact: true })).toHaveValue('Updated reader');
  await expect(page.getByLabel('Bio', { exact: true })).toHaveValue('Saved during the browser verification.');
});
