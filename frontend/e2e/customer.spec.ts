import { expect, test } from "@playwright/test";

import { mockApi, signInAsCustomer } from "./mock-api";

test.beforeEach(async ({ page }) => {
  await mockApi(page);
  await signInAsCustomer(page);
});

test("customer dashboard shows appointment and work-job summaries", async ({ page }) => {
  await page.goto("/account");

  await expect(page.getByText("Welcome back")).toBeVisible();
  await expect(page.getByRole("button", { name: "Notifications" })).toBeVisible();
  await expect(page.getByText("Active Appointments")).toBeVisible();
  await expect(page.getByText("APT-000001-20260523")).toBeVisible();
  await expect(page.getByText("WJ-000001-20260523").first()).toBeVisible();
});

test("customer can access notifications on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/account");

  const notificationButton = page.getByRole("button", { name: "Notifications" });
  await expect(notificationButton).toBeVisible();
  await notificationButton.click();
  await expect(page.getByText("No notifications yet.")).toBeVisible();
});

test("customer appointment date uses the shared calendar field", async ({ page }) => {
  await page.goto("/account/appointments/new");

  const dateField = page.getByLabel("Preferred Date");
  await expect(dateField).toBeVisible();
  await expect(dateField).toHaveAttribute("type", "button");
  await expect(page.locator('input[type="date"]')).toHaveCount(0);

  await dateField.click();
  const calendar = page.locator('[data-slot="calendar"]');
  await expect(calendar).toBeVisible();
  await calendar.locator('button[data-day]:not([disabled])').nth(1).click();
  await expect(dateField).not.toContainText("Pick a date");

  await page.getByRole("button", { name: "Clear date" }).click();
  await expect(dateField).toContainText("Pick a date");
});

test("customer work-job detail shows linked appointment, payment, quotation, and activity", async ({ page }) => {
  await page.goto("/account/work-jobs/1");

  await expect(page.getByText("WJ-000001-20260523")).toBeVisible();
  await expect(page.getByText("Linked Appointment")).toBeVisible();
  await expect(page.getByText("Payments")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Quotation", exact: true })).toBeVisible();
  await expect(page.getByText("Installation started.")).toBeVisible();
});

test("protected customer pages redirect to login when there is no auth cookie", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await mockApi(page);

  await page.goto("/account");

  await expect(page).toHaveURL(/\/login$/);
  await context.close();
});

test("customer cannot access staff dashboard routes by changing the URL", async ({ page }) => {
  await page.goto("/dashboard/users");

  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByText("Welcome back")).toBeVisible();
});
