import { test, expect } from "@playwright/test";

test.describe("URL Input Form", () => {
  test.beforeEach(async ({ page }) => {
    // 各テスト前にホームページへ移動
    await page.goto("/");
  });

  test("should display the main page correctly", async ({ page }) => {
    // ページタイトルの確認
    await expect(page).toHaveTitle(/サイトマップジェネレーター/);

    // メインヘッダーの確認
    const heading = page.getByRole("heading", { name: "サイトマップジェネレーター" });
    await expect(heading).toBeVisible();

    // 説明文の確認
    const description = page.getByText("WebサイトのURLを入力するだけで");
    await expect(description).toBeVisible();

    // URL入力フィールドの確認
    const urlInput = page.getByLabel("ウェブサイトのURL");
    await expect(urlInput).toBeVisible();
    await expect(urlInput).toHaveAttribute("type", "url");

    // 送信ボタンの確認
    const submitButton = page.getByRole("button", { name: "サイトマップを生成" });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeDisabled(); // 初期状態では無効
  });

  test("should show validation errors for invalid URLs", async ({ page }) => {
    const urlInput = page.getByLabel("ウェブサイトのURL");
    const submitButton = page.getByRole("button", { name: "サイトマップを生成" });

    // 無効なURL（文字列）を入力
    await urlInput.fill("invalid-url");
    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(submitButton).toBeDisabled();

    // 空文字をクリア
    await urlInput.clear();
    await expect(page.locator('[role="alert"]')).not.toBeVisible();

    // ローカルホストURL（セキュリティ制限）
    await urlInput.fill("http://localhost:3000");
    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(submitButton).toBeDisabled();

    // プライベートIPアドレス
    await urlInput.fill("http://192.168.1.1");
    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(submitButton).toBeDisabled();

    // 非HTTP/HTTPSプロトコル
    await urlInput.fill("ftp://example.com");
    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(submitButton).toBeDisabled();
  });
  test("should accept valid URLs and enable submit button", async ({ page }) => {
    const urlInput = page.getByLabel("ウェブサイトのURL");
    const submitButton = page.getByRole("button", { name: "サイトマップを生成" });

    // 有効なHTTPS URL
    await urlInput.fill("https://example.com");

    // 少し待機してバリデーションが実行されるのを待つ
    await page.waitForTimeout(500);

    // エラーメッセージが表示されないことを確認
    await expect(page.locator('[role="alert"]')).not.toBeVisible();

    // 送信ボタンが有効になることを確認
    await expect(submitButton).toBeEnabled();

    // 入力フィールドの視覚的フィードバック（緑色のボーダー）を確認
    await expect(urlInput).toHaveClass(/border-green-500/);
  });

  test("should submit form and show loading state", async ({ page }) => {
    const urlInput = page.getByLabel("ウェブサイトのURL");
    const submitButton = page.getByRole("button", { name: "サイトマップを生成" });

    // 有効なURLを入力
    await urlInput.fill("https://example.com");
    await expect(submitButton).toBeEnabled();

    // アラートハンドラーを事前に設定
    const alertPromise = page.waitForEvent("dialog");

    // フォームを送信
    await submitButton.click();

    // まず処理中テキストが表示されるのを待つ
    await expect(page.getByText("処理中...")).toBeVisible();

    // 少し待機してからボタン状態をチェック
    await page.waitForTimeout(100);
    await expect(submitButton).toBeDisabled();

    // スピナーアニメーションを確認
    const spinner = page.locator(".animate-spin");
    await expect(spinner).toBeVisible();

    // アラートが表示されるのを待機
    const dialog = await alertPromise;
    expect(dialog.type()).toBe("alert");
    expect(dialog.message()).toContain("サイトマップ生成を開始します: https://example.com");
    await dialog.accept();

    // ローディングが完了するまで待機
    await expect(page.getByText("処理中...")).not.toBeVisible({ timeout: 10000 });
    await expect(submitButton).toBeEnabled();
  });

  test("should work with different valid URL formats", async ({ page }) => {
    const urlInput = page.getByLabel("ウェブサイトのURL");
    const submitButton = page.getByRole("button", { name: "サイトマップを生成" });

    const validUrls = [
      "https://example.com",
      "http://example.com",
      "https://www.example.com",
      "https://subdomain.example.com",
      "https://example.com/path",
      "https://example.com:8080",
      "https://example.co.jp",
    ];

    for (const url of validUrls) {
      await urlInput.clear();
      await urlInput.fill(url);

      // 各URLで送信ボタンが有効になることを確認
      await expect(submitButton).toBeEnabled();

      // エラーメッセージが表示されないことを確認
      await expect(page.locator('[role="alert"]')).not.toBeVisible();
    }
  });

  test("should be responsive on mobile devices", async ({ page }) => {
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });

    const urlInput = page.getByLabel("ウェブサイトのURL");
    const submitButton = page.getByRole("button", { name: "サイトマップを生成" });

    // 要素が表示されることを確認
    await expect(urlInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // フォームが適切にレイアウトされることを確認
    const inputBoundingBox = await urlInput.boundingBox();
    const buttonBoundingBox = await submitButton.boundingBox();

    if (inputBoundingBox && buttonBoundingBox) {
      // 入力フィールドがボタンより上に配置されていることを確認
      expect(inputBoundingBox.y).toBeLessThan(buttonBoundingBox.y);
    }

    // モバイルでも機能することを確認
    await urlInput.fill("https://example.com");
    await expect(submitButton).toBeEnabled();
  });

  test("should maintain accessibility standards", async ({ page }) => {
    const urlInput = page.getByLabel("ウェブサイトのURL");

    // ラベルとinputの関連付けを確認
    await expect(urlInput).toHaveAttribute("id", "url-input");

    // 無効なURLでエラーメッセージのARIA関連付けを確認
    await urlInput.fill("invalid-url");
    await page.waitForTimeout(500); // バリデーションの完了を待機

    // エラーメッセージが表示されてからARIA属性を確認
    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(urlInput).toHaveAttribute("aria-describedby", "url-error");
  });

  test("should handle keyboard navigation", async ({ page }) => {
    // URL入力フィールドに直接フォーカス
    const urlInput = page.getByLabel("ウェブサイトのURL");
    await urlInput.focus();
    await expect(urlInput).toBeFocused();

    // キーボードで入力
    await page.keyboard.type("https://example.com");
    await expect(urlInput).toHaveValue("https://example.com");

    // 少し待機してバリデーションを完了
    await page.waitForTimeout(500);

    // Tabキーで送信ボタンにフォーカス移動
    await page.keyboard.press("Tab");
    const submitButton = page.getByRole("button", { name: "サイトマップを生成" });
    await expect(submitButton).toBeFocused();

    // アラートハンドラーを設定
    const alertPromise = page.waitForEvent("dialog");

    // Enterキーで送信
    await page.keyboard.press("Enter");
    await expect(page.getByText("処理中...")).toBeVisible();

    // アラートを受け入れ
    const dialog = await alertPromise;
    await dialog.accept();
  });
});
