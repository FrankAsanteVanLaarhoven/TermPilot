import { expect, test } from "@playwright/test";

test("control tower renders command console", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /Sign in with Grok Bot/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Grok Bot/i })).toBeVisible();
  await page.getByRole("button", { name: /Sign in with Grok Bot/i }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: /Enter console/i }).click();
  await expect(page.getByText("TermPilot", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: /open console/i }).click();
  await expect(page.getByLabel(/Command console/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Reconcile" })).toBeVisible();
});
