import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load homepage successfully", async ({ page }) => {
    await page.goto("/");

    // ページが正常に読み込まれることを確認
    await expect(page).toHaveTitle(/サイトマップジェネレーター/);

    // メタ説明の確認（SEO）
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute(
      "content",
      /WebサイトのURLから自動でサイトマップXMLを生成するツール/
    );
  });

  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/");

    // H1タグが1つだけ存在することを確認
    const h1Elements = page.locator("h1");
    await expect(h1Elements).toHaveCount(1);

    // H1の内容を確認
    await expect(h1Elements.first()).toHaveText("サイトマップジェネレーター");
  });

  test("should display trust signals", async ({ page }) => {
    await page.goto("/");

    // Trust signalsの確認
    await expect(page.getByText("✓ 無料で利用可能")).toBeVisible();
    await expect(page.getByText("✓ XMLファイルをダウンロード")).toBeVisible();
    await expect(page.getByText("✓ SEO最適化済み")).toBeVisible();
  });

  test("should have proper document structure for SEO", async ({ page }) => {
    await page.goto("/");

    // 言語属性の確認
    const htmlElement = page.locator("html");
    await expect(htmlElement).toHaveAttribute("lang", "ja");

    // 必要なSEO要素の確認
    await expect(page.locator("title")).toHaveText(/サイトマップジェネレーター/);

    // メタビューポートの確認（レスポンシブ対応）
    const viewportMeta = page.locator('meta[name="viewport"]');
    await expect(viewportMeta).toHaveAttribute("content", /width=device-width/);
  });

  test("should work on mobile devices", async ({ page }) => {
    // モバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // モバイルでも主要要素が表示されることを確認
    await expect(
      page.getByRole("heading", { name: "サイトマップジェネレーター" })
    ).toBeVisible();
    await expect(page.getByLabel("ウェブサイトのURL")).toBeVisible();
    await expect(page.getByRole("button", { name: "サイトマップを生成" })).toBeVisible();
  });
});
