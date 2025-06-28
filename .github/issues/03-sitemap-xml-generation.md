# [FEATURE] フェーズ 1-3: サイトマップ XML 生成とダウンロード機能

## 概要

抽出された URL からサイトマップ XML を生成し、ユーザーがダウンロードできる機能を実装する。

## 技術的な要件

- **XML 生成**: 標準 sitemap.xml フォーマット準拠
- **TypeScript**: 型安全な XML 生成
- **Next.js API Routes**: XML レスポンス処理
- **ブラウザ API**: ファイルダウンロード機能

## 実装内容

- [ ] サイトマップ XML 生成機能
  - [ ] 標準 XML 形式での出力
  - [ ] URL エンコーディング処理
  - [ ] メタデータの設定（lastmod, priority 等）
  - [ ] 大容量サイトマップ対応
- [ ] XML 生成 API の実装
  - [ ] GET /api/sitemap/{id} エンドポイント
  - [ ] 適切な Content-Type ヘッダー設定
  - [ ] XML 検証機能
- [ ] ダウンロード機能の実装
  - [ ] ブラウザダウンロード機能
  - [ ] ファイル名の自動生成
  - [ ] プログレス表示
- [ ] プレビュー機能
  - [ ] XML 内容の表示
  - [ ] 構文ハイライト
  - [ ] ダウンロード前の確認

## 受け入れ条件

- [ ] 生成された XML が標準仕様に準拠している
- [ ] Google Search Console で検証可能である
- [ ] ダウンロード機能が全ブラウザで動作する
- [ ] 大量 URL（10,000+）でもパフォーマンス問題がない
- [ ] XML 構文エラーがない

## XML 仕様

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2025-06-28</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

## API 仕様

```typescript
// GET /api/sitemap
interface SitemapRequest {
  urls: string[];
  baseUrl: string;
}

interface SitemapResponse {
  xml: string;
  filename: string;
  urlCount: number;
}
```

## ファイル構成

```
app/
├── api/
│   └── sitemap/
│       └── route.ts           # サイトマップ生成API
├── components/
│   ├── sitemap-preview.tsx    # XMLプレビューコンポーネント
│   └── download-button.tsx    # ダウンロードボタン
├── lib/
│   ├── sitemap-generator.ts   # XML生成ロジック
│   └── xml-utils.ts           # XML操作ユーティリティ
└── types/
    └── sitemap.ts             # サイトマップ型定義
```

## 関連する Issue/PR

- 依存: #2 (クローリング API)
- 後続: #4 (進行状況表示)

## 備考

- XML エスケープ処理を忘れずに実装
- 大容量サイトマップの場合はストリーミング処理を検討
- ダウンロードファイル名は「sitemap-{domain}-{timestamp}.xml」形式
- 将来的にはサイトマップインデックス対応も検討
