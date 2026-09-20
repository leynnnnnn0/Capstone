import { expect, test, type Route } from "@playwright/test";

import { mockApi } from "./mock-api";

test.beforeEach(async ({ page }) => {
  await mockApi(page);
  if (process.env.E2E_DEBUG_REQUESTS) {
    page.on("pageerror", (error) => console.log(error.message));
    page.on("console", (message) => { if (message.type() === "error") console.log(message.text()); });
  }
  const products = Array.from({ length: 101 }, (_, index) => ({
    id: index + 1,
    name: `Quote Product ${index + 1}`,
    description: "Made to order",
    unit: "piece",
    price_per_unit: 100,
    is_active: true,
    categories: [{ id: index === 100 ? 2 : 1, name: index === 100 ? "Windows" : "Doors" }],
    images: [],
    variants: [],
    option_groups: [],
  }));
  await page.route("**/api/v1/products?**", async (route) => {
    const currentPage = Number(new URL(route.request().url()).searchParams.get("page") ?? 1);
    await fulfillJson(route, {
      data: products.slice((currentPage - 1) * 100, currentPage * 100),
      meta: { current_page: currentPage, last_page: 2, per_page: 100, total: 101 },
    });
  });
  await page.route("**/api/v1/categories?**", (route) => fulfillJson(route,
    [{ id: 1, name: "Doors" }, { id: 2, name: "Windows" }],
  ));
});

test("quote picker paginates all products and resets filters to page one", async ({ page }) => {
  await page.goto("/get-quote");
  const cards = page.getByRole("button", { name: /Quote Product/ });
  await expect(cards).toHaveCount(12);
  await expect(page.getByText("Page 1 of 9")).toBeVisible();
  await expect(page.getByRole("button", { name: "Previous", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Page 2 of 9")).toBeVisible();
  await expect(cards.first()).toContainText("Quote Product 13");
  await cards.first().click();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByText("Page 2 of 9")).toBeVisible();

  await page.getByRole("button", { name: "Windows", exact: true }).click();
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText("Quote Product 101");
  await expect(page.getByText("Page 1 of 1")).toBeVisible();
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeDisabled();

  await page.getByRole("button", { name: "All", exact: true }).click();
  await expect(page.getByText("Page 1 of 9")).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByPlaceholder("Search quote products...").fill("Quote Product 101");
  await expect(cards).toHaveCount(1);
  await expect(page.getByText("Page 1 of 1")).toBeVisible();
});

test("quote links can configure products beyond the first API page", async ({ page }) => {
  await page.goto("/get-quote?product=101");
  await expect(page.getByText("Quote Product 101", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "+ Add to Quote", exact: true })).toBeVisible();
});

async function fulfillJson(route: Route, json: unknown) {
  await route.fulfill({
    json,
    headers: {
      "Access-Control-Allow-Origin": route.request().headers().origin ?? "http://127.0.0.1:3000",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}
