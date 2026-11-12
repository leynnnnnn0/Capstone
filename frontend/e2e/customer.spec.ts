import { expect, test } from "@playwright/test";

import { mockApi, signInAsCustomer } from "./mock-api";

test.beforeEach(async ({ page, baseURL }) => {
  await mockApi(page);
  await signInAsCustomer(page, baseURL);
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

test("customer appointment details show progress and tabs on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/account/appointments/1");

  const progress = page.getByRole("region", { name: "Appointment progress" });
  const currentStage = progress.locator('[aria-current="step"]');
  await expect(currentStage).toContainText("Confirmed");
  await expect(currentStage.locator("time")).toHaveAttribute("datetime", "2026-05-23T03:00:00.000000Z");
  await expect(page.getByRole("link", { name: "View Work Job" })).toBeVisible();
  await expect(page.getByText("Appointment confirmed.")).toBeVisible();
  await expect(page.getByRole("tab", { name: "Activity" })).toHaveCount(0);

  const quotationTab = page.getByRole("tab", { name: "Quotation" });
  await expect(quotationTab).toHaveAccessibleDescription("Action required");
  const pulse = quotationTab.locator(".bg-red-500");
  await expect(pulse).toBeVisible();
  await quotationTab.click();
  await expect(pulse).toBeHidden();
  await expect(quotationTab.locator("span.bg-red-600")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Quotation", exact: true })).toBeVisible();
  await expect(progress).toBeVisible();
});

test("customer work-job detail shows the current stage and switches between detail tabs", async ({ page }) => {
  await page.goto("/account/work-jobs/1");

  await expect(page.getByRole("heading", { name: "WJ-000001-20260523" })).toBeVisible();
  const progress = page.getByRole("region", { name: "Work job progress" });
  const currentStage = progress.locator('[aria-current="step"]');
  await expect(currentStage).toContainText("In progress");
  await expect(currentStage.locator("time")).toHaveAttribute("datetime", "2026-05-23T05:00:00.000000Z");
  const confirmedStage = progress.getByRole("listitem").first();
  await expect(confirmedStage).toContainText("Confirmed");
  await expect(confirmedStage.locator("time")).toHaveAttribute("datetime", "2026-05-23T04:00:00.000000Z");
  await expect(progress.getByRole("listitem")).toHaveCount(4);
  await expect(page.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("Linked Appointment")).toBeVisible();
  await expect(page.getByRole("tabpanel").getByRole("listitem").first()).toContainText("Installation started.");

  await page.getByRole("tab", { name: "Fabrication" }).click();
  await expect(page.getByRole("heading", { name: "Ready for Installation" })).toBeVisible();

  await page.getByRole("tab", { name: "Quotation" }).click();
  await expect(page.getByRole("heading", { name: "Quotation", exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Quotation" }).press("ArrowRight");
  await expect(page.getByRole("heading", { name: "Payments", exact: true })).toBeVisible();

  await page.getByRole("tab", { name: "Activity" }).click();
  await expect(page.getByRole("tabpanel").getByRole("listitem").first()).toContainText("Installation started.");
  await expect(progress).toBeVisible();
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
