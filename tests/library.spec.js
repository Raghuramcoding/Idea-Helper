import { expect, test } from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

test("standalone library searches, filters, and paginates all ideas", async ({ page }) => {
  await page.goto(pathToFileURL(resolve("idea-library.html")).href);

  await expect(page.getByRole("heading", { name: "Idea Library" })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Showing 36 of 19,980 ideas");
  await expect(page.locator(".card")).toHaveCount(36);

  await page.getByRole("searchbox", { name: "Search project ideas" }).fill("A Lighter Commute");
  await expect(page.getByRole("status")).toHaveText("Showing 1 of 1 ideas");
  await expect(page.getByRole("heading", { name: "A Lighter Commute" })).toBeVisible();

  const search = page.getByRole("searchbox", { name: "Search project ideas" });
  await search.clear();
  await page.getByLabel("Filter by category").selectOption("Climate");
  await expect(page.getByRole("status")).toHaveText("Showing 36 of 1,065 ideas");
  await page.getByRole("button", { name: "Show more ideas" }).click();
  await expect(page.getByRole("status")).toHaveText("Showing 72 of 1,065 ideas");
  await expect(page.locator(".card")).toHaveCount(72);

  await search.fill("no matching idea");
  await expect(page.getByRole("status")).toHaveText("Showing 0 of 0 ideas");
  await expect(page.getByText("No ideas found. Try another search or category.")).toBeVisible();
});

test("main app keeps the placeholder link and can spin for an idea", async ({ page }) => {
  await page.goto(pathToFileURL(resolve("index.html")).href);

  await expect(page.getByRole("link", { name: "Idea library link" })).toHaveAttribute("href", "about:blank");
  await page.getByRole("button", { name: /Spin for an idea/ }).click();
  await expect(page.locator(".idea-item")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy idea" })).toBeEnabled();

  await page.getByRole("button", { name: "Browse idea library" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Showing 36 of 19,980 ideas");
});

test("main app and standalone library fit a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const file of ["index.html", "idea-library.html"]) {
    await page.goto(pathToFileURL(resolve(file)).href);
    const fitsViewport = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
    );
    expect(fitsViewport, `${file} should not overflow horizontally`).toBe(true);
  }
});
