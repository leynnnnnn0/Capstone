import { expect, test } from "@playwright/test";

import { mockApi } from "./mock-api";

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test("landing page renders products and primary quote path", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Clear views")).toBeVisible();
  await expect(page.getByText("Sliding Door").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /get a quote/i }).first()).toBeVisible();
});

test("tracking page looks up an appointment reference", async ({ page }) => {
  await page.goto("/track");
  await page.getByLabel(/appointment or work job number/i).fill("APT-000001-20260523");
  await page.getByRole("button", { name: /^track$/i }).click();

  await expect(page.getByText("APT-000001-20260523").first()).toBeVisible();
  await expect(page.getByText("Appointment confirmed.")).toBeVisible();
});

test("customer OTP login moves from contact entry to verification", async ({ page }) => {
  await page.goto("/login");

  await page.getByRole("button", { name: /^email$/i }).click();
  await page.getByLabel(/email address/i).fill("nathaniel@example.com");
  await page.getByRole("button", { name: /send otp/i }).click();

  await expect(page.getByRole("heading", { name: /enter verification code/i })).toBeVisible();
});

test("staff login opens the two-factor challenge when required", async ({ page }) => {
  await page.goto("/staff/login");

  await page.getByLabel(/^email$/i).fill("admin@example.com");
  await page.getByLabel(/^password$/i).fill("Password123!");
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page.getByLabel(/authentication code/i)).toBeVisible();
});

test("stale auth cookies do not block the staff login page", async ({ context, page }) => {
  await context.addCookies([
    { name: "auth_token", value: "expired-token", domain: "127.0.0.1", path: "/" },
    { name: "user_role", value: "admin", domain: "127.0.0.1", path: "/" },
  ]);

  await page.goto("/staff/login");

  await expect(page.getByRole("heading", { name: /sign in to manage sog/i })).toBeVisible();
});
