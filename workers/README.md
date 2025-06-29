# Sitemap Crawler API

このディレクトリには、Cloudflare Workers 上で動作する Web クローリング API が含まれています。

## 機能

- 指定された URL から内部リンクを自動抽出
- 相対 URL の絶対 URL への変換
- 重複 URL の除去
- HTML パーサーによるページメタデータ抽出
- 並列処理による高速クローリング

## API エンドポイント

### POST /api/crawl

Web サイトをクロールして内部リンクを抽出します。

**リクエスト:**

```json
{
  "url": "https://example.com",
  "maxDepth": 2,
  "maxPages": 50
}
```

**レスポンス:**

```json
{
  "success": true,
  "data": {
    "baseUrl": "https://example.com",
    "pages": [
      {
        "url": "https://example.com",
        "title": "Example Domain",
        "lastModified": "2025-06-29T00:00:00Z",
        "priority": 0.5
      }
    ],
    "totalPages": 1,
    "crawlTime": 1234
  }
}
```

## 開発

```bash
# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev

# ビルド
pnpm build

# デプロイ
pnpm deploy
```

## テスト

```bash
# ローカル環境でのテスト
curl -X POST http://localhost:8787/api/crawl \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "maxDepth": 1, "maxPages": 10}'
```
