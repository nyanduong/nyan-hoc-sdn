const path = require('path');
const fs = require('fs');
const root = process.cwd();
const { chromium, expect } = require(path.join(root, 'tmp/browser-tools/node_modules/@playwright/test'));
const backend = path.resolve(root, '../Assignment3/assignment3_nhandtce190741');
const mongoose = require(path.join(backend, 'node_modules/mongoose'));
require(path.join(backend, 'node_modules/dotenv')).config({ path: path.join(backend, '.env'), quiet: true });
const User = require(path.join(backend, 'src/models/User'));
const Report = require(path.join(backend, 'src/models/Report'));
const suffix = Date.now();
const emails = [`a4.qa.user.${suffix}@example.com`, `a4.qa.admin.${suffix}@example.com`, `a4.qa.other.${suffix}@example.com`];
const password = `QA-${suffix}-aB9!`;
const title = `QA ${suffix}: Checkout button does not respond`;
const screenshots = path.join(root, 'tmp/simple-screenshots');
fs.mkdirSync(screenshots, { recursive: true });

(async () => {
  let browser;
  const errors = [];
  try {
    await mongoose.connect(process.env.MONGO_URI);
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('http://127.0.0.1:5173/reports');
    await expect(page).toHaveURL(/signin/);
    await page.screenshot({ path: path.join(screenshots, '01-signin.png'), fullPage: true });
    async function register(email, role) {
      await page.goto('http://127.0.0.1:5173/signup');
      await page.getByLabel('Username').fill(role === 'admin' ? 'QA Admin' : 'QA Nhan');
      await page.getByLabel('Email address').fill(email);
      await page.getByLabel('Password', { exact: true }).fill(password);
      await page.getByLabel('Role').selectOption(role);
      if (role === 'user') await page.screenshot({ path: path.join(screenshots, '02-signup.png'), fullPage: true });
      await page.getByRole('button', { name: 'Create account', exact: true }).click();
      await expect(page).toHaveURL(/signin/);
      await expect(page.getByRole('status')).toContainText('User registered successfully');
    }
    async function login(email) {
      await page.getByLabel('Email address').fill(email);
      await page.getByLabel('Password', { exact: true }).fill(password);
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await expect(page).toHaveURL(/\/reports$/);
      await expect(page.getByText('Loading your reports…')).toHaveCount(0);
    }
    await register(emails[0], 'user');
    await login(emails[0]);
    await expect(page.getByText('No reports are assigned to you.')).toBeVisible();
    const userJwt = await page.evaluate(() => localStorage.getItem('bugdesk.token'));
    const userId = JSON.parse(Buffer.from(userJwt.split('.')[1], 'base64url')).id;
    await page.screenshot({ path: path.join(screenshots, '03-empty-reports.png'), fullPage: true });
    await page.getByRole('button', { name: 'Sign out' }).click();
    await register(emails[1], 'admin');
    await login(emails[1]);
    await page.getByRole('link', { name: 'Create report', exact: true }).first().click();
    await page.getByLabel('Title').fill(title);
    await page.getByLabel('Description').fill('1. Open checkout.\n2. Click Pay now.\nExpected: payment starts.\nActual: the button does not respond.');
    await page.getByLabel('Project', { exact: true }).fill('Assignment 4 QA');
    await page.getByLabel('Severity', { exact: true }).selectOption('high');
    await page.getByLabel('Assigned To (User ID)').fill(userId);
    await page.screenshot({ path: path.join(screenshots, '04-create-report.png'), fullPage: true });
    await page.getByRole('button', { name: 'Create report', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Report created successfully');
    await page.screenshot({ path: path.join(screenshots, '05-create-success.png'), fullPage: true });
    await page.getByRole('button', { name: 'Sign out' }).click();
    await login(emails[0]);
    await expect(page.getByRole('cell', { name: title, exact: false })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'QA Nhan', exact: false })).toBeVisible();
    await page.screenshot({ path: path.join(screenshots, '06-reports.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByText(title, { exact: true })).toBeVisible();
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Mobile page overflow');
    await page.goto('http://127.0.0.1:5173/reports/create');
    await expect(page.getByText('403 Forbidden')).toBeVisible();
    await page.screenshot({ path: path.join(screenshots, '07-forbidden.png'), fullPage: true });
    const forbidden = await fetch('http://localhost:8002/reports', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userJwt}` }, body: JSON.stringify({ title: 'Blocked', description: 'Blocked', severity: 'low', project: 'QA', assignedTo: userId }) });
    if (forbidden.status !== 403) throw new Error(`Backend non-admin rejection: ${forbidden.status}`);
    await page.getByRole('button', { name: 'Sign out' }).click();
    await register(emails[2], 'user');
    await login(emails[2]);
    await expect(page.getByText('No reports are assigned to you.')).toBeVisible();
    await expect(page.getByText(title, { exact: true })).toHaveCount(0);
    const tokenB = await page.evaluate(() => localStorage.getItem('bugdesk.token'));
    const secondTab = await page.context().newPage();
    await secondTab.goto('http://127.0.0.1:5173/reports');
    await expect(secondTab.getByText('No reports are assigned to you.')).toBeVisible();
    await page.evaluate((jwt) => localStorage.setItem('bugdesk.token', jwt), userJwt);
    await expect(secondTab.getByText(title, { exact: true })).toBeVisible();
    await page.evaluate((jwt) => localStorage.setItem('bugdesk.token', jwt), tokenB);
    await expect(secondTab.getByText('No reports are assigned to you.')).toBeVisible();
    await expect(secondTab.getByText(title, { exact: true })).toHaveCount(0);
    await secondTab.close();
    await page.evaluate((jwt) => {
      const parts = jwt.split('.');
      parts[2] = 'invalid-signature';
      localStorage.setItem('bugdesk.token', parts.join('.'));
    }, userJwt);
    await page.goto('http://127.0.0.1:5173/reports');
    await expect(page).toHaveURL(/signin/);
    await expect(page.getByText('Your session has expired. Please sign in again.')).toBeVisible();
    if (await page.evaluate(() => localStorage.getItem('bugdesk.token'))) throw new Error('401 did not clear token');
    if (errors.length) throw new Error(errors.join('\n'));
    console.log('PASS: real signup, signin, logout, admin creation, populated reports, account isolation, frontend/backend 403, backend 401, mobile layout, real cross-tab account changes, no browser errors.');
  } finally {
    if (browser) await browser.close();
    if (mongoose.connection.readyState === 1) {
      const users = await User.find({ email: { $in: emails } }).select('_id');
      await Report.deleteMany({ title, project: 'Assignment 4 QA', assignedTo: { $in: users.map((u) => u._id) } });
      await User.deleteMany({ email: { $in: emails } });
      await mongoose.disconnect();
      console.log('Removed only QA accounts and the QA report created by this run.');
    }
  }
})().catch((err) => { console.error(err); process.exitCode = 1; });
