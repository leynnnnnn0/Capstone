import { expect, test } from "@playwright/test";

import { mockApi } from "./mock-api";

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test("landing page renders live products in the editorial collection", async ({ page }) => {
  await page.goto("/");

  const collection = page.getByRole("region", { name: "SOG product collection" });

  await expect(collection.getByText("Sliding Door").first()).toBeVisible();
  await expect(collection.getByText("Vista Slide Sliding Window")).toHaveCount(0);
  await expect(collection.getByRole("img", { name: "Sliding Door product preview" }))
    .toHaveAttribute("src", "/images/landing/windows.jpg");
});

test("about page presents the SOG process and service location", async ({ page }) => {
  await page.goto("/about");

  await expect(page.getByRole("heading", { name: /one team.*from measure to install/i })).toBeVisible();
  await expect(page.getByRole("main").getByText("Prinza Street, General Trias, Cavite")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Responsibility stays with the team." })).toBeVisible();
});

test("contact page exposes verified SOG contact details", async ({ page }) => {
  await page.goto("/contact");

  await expect(page.getByRole("link", { name: /0936 689 7991/ }).first()).toHaveAttribute("href", "tel:+639366897991");
  await expect(page.getByText("SOG Glass-Aluminum Steel Fabrication Services.")).toBeVisible();
  await expect(page.getByText("General Trias, Cavite, Philippines.", { exact: false })).toBeVisible();
});

test("editorial collection uses gallery images when the cover is empty", async ({ page }) => {
  await page.route("**/api/v1/products?**", async (route) => {
    await route.fulfill({ json: { data: [{
      id: 42,
      name: "Database Window",
      cover_image: "",
      images: [{ id: 9, image_url: "/images/landing/windows.jpg" }],
    }] } });
  });
  await page.goto("/");

  const collection = page.getByRole("region", { name: "SOG product collection" });
  await expect(collection.getByRole("img", { name: "Database Window product preview" }))
    .toHaveAttribute("src", "/images/landing/windows.jpg");
});

test("editorial collection does not substitute stock photos for missing images", async ({ page }) => {
  await page.route("**/api/v1/products?**", async (route) => {
    await route.fulfill({ json: { data: [{
      id: 42,
      name: "Database Window",
      cover_image: null,
      images: [],
    }] } });
  });
  await page.goto("/");

  const collection = page.getByRole("region", { name: "SOG product collection" });
  await expect(collection.getByText("Image unavailable")).toBeVisible();
  await expect(collection.getByRole("img")).toHaveCount(0);
  await expect(collection.getByRole("link", { name: "Database Window", exact: true }))
    .toHaveAttribute("href", "/products/42");
});

test("returning from a product restores the catalog scroll position", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.goto("/products");

  const productLink = page.getByRole("link", { name: "View →" });
  await productLink.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 180));

  const catalogScrollY = await page.evaluate(() => window.scrollY);
  expect(catalogScrollY).toBeGreaterThan(0);

  await productLink.click();
  await expect(page).toHaveURL(/\/products\/1$/);

  await page.getByRole("button", { name: "Back" }).click();
  await expect(page).toHaveURL(/\/products$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(catalogScrollY - 2);
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
