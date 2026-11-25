import { expect, test } from "@playwright/test";

test("登录页显示邮箱、密码和登录按钮", async ({ page }) => {
  await page.goto("/login");

  await expect(
    page.getByRole("heading", { name: "登录", exact: true }),
  ).toBeVisible();

  await expect(page.getByLabel("电子邮箱")).toBeVisible();
  await expect(page.getByLabel("密码", { exact: true })).toBeVisible();

  await expect(
    page.getByRole("button", { name: "登录", exact: true }),
  ).toBeVisible();
});

test("未登录访问 Dashboard 时跳转到登录页", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);

  await expect(
    page.getByRole("heading", { name: "登录", exact: true }),
  ).toBeVisible();
});