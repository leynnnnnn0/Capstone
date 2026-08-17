import { expect, test } from "@playwright/test";

import { mockApi, signInAsCustomer } from "./mock-api";

test.beforeEach(async ({ page }) => {
  await mockApi(page);
  await signInAsCustomer(page);
});

test("customer dashboard shows appointment and work-job summaries", async ({ page }) => {
  await page.goto("/account");

  await expect(page.getByText("Welcome back")).toBeVisible();
  await expect(page.getByText("Active Appointments")).toBeVisible();
  await expect(page.getByText("APT-000001-20260523")).toBeVisible();
  await expect(page.getByText("WJ-000001-20260523").first()).toBeVisible();
});

test("customer work-job detail shows linked appointment, payment, quotation, and activity", async ({ page }) => {
  await page.goto("/account/work-jobs/1");

  await expect(page.getByText("WJ-000001-20260523")).toBeVisible();
  await expect(page.getByText("Linked Appointment")).toBeVisible();
  await expect(page.getByText("Payments")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Quotation", exact: true })).toBeVisible();
  await expect(page.getByText("Installation started.")).toBeVisible();
});

test("appointment detail shows its AR measurement summary", async ({ page }) => {
  await page.goto("/account/appointments/1");

  await expect(
    page.getByRole("heading", { name: "AR measurement records" }),
  ).toBeVisible();
  await expect(page.getByText("Living room sliding door")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Start AR measurement" }),
  ).toHaveAttribute("href", "/ar/v2?appointment_id=1");
  await expect(page.getByText(/estimates until an assigned technician approves/i)).toBeVisible();

  await page.getByRole("button", { name: "View summary" }).click();

  await expect(
    page.getByRole("heading", { name: "Measurement summary" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("dialog")
      .getByText("AR estimate — technician verification required"),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Print summary" })).toBeVisible();
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
