# [FEATURE] フェーズ 1-2: クローリング API（Cloudflare Workers）の実装

## 概要

Cloudflare Workers 上で動作する Web クローリング API を実装し、指定された URL から内部リンクを抽出する機能を作成する。

## 技術的な要件

- **Cloudflare Workers**: サーバーレス実行環境
- **TypeScript**: 型安全性の確保
- **HTML パーサー**: リンク抽出（cheerio 等）
- **Fetch API**: HTTP リクエスト
- **Zod**: API スキーマバリデーション

## 実装内容

- [ ] Cloudflare Workers プロジェクトの設定
  - [ ] wrangler.toml の設定
  - [ ] TypeScript 設定
  - [ ] 環境変数の設定
- [ ] クローリング機能の実装
  - [ ] HTML コンテンツの取得
  - [ ] 内部リンクの抽出ロジック
  - [ ] 重複排除機能
  - [ ] 相対 URL→ 絶対 URL の変換
- [ ] API エンドポイントの作成
  - [ ] POST /api/crawl エンドポイント
  - [ ] リクエスト/レスポンスの型定義
  - [ ] バリデーション機能
- [ ] エラーハンドリング
  - [ ] ネットワークエラー処理
  - [ ] タイムアウト処理
  - [ ] 不正な HTML 処理
  - [ ] Rate limiting

## 受け入れ条件

- [ ] 有効な URL から内部リンクが正しく抽出される
- [ ] 相対 URL が絶対 URL に正しく変換される
- [ ] 重複 URL が適切に除去される
- [ ] エラー時に適切な HTTP ステータスコードが返される
- [ ] API レスポンスが型安全である
- [ ] Workers 環境で正常に動作する

## API 仕様

```typescript
// POST /api/crawl
interface CrawlRequest {
  url: string;
  maxDepth?: number; // 将来拡張用
  maxPages?: number; // 将来拡張用
}

interface CrawlResponse {
  success: boolean;
  urls: string[];
  totalCount: number;
  errors?: string[];
}
```

## ファイル構成

```
workers/
├── src/
│   ├── index.ts               # Workers メインエントリポイント
│   ├── handlers/
│   │   └── crawl.ts           # クローリングハンドラー
│   ├── lib/
│   │   ├── crawler.ts         # クローリングロジック
│   │   └── url-utils.ts       # URL操作ユーティリティ
│   └── types/
│       └── api.ts             # API型定義
├── wrangler.toml              # Workers設定
└── package.json
```

## 関連する Issue/PR

- 依存: #1 (URL 入力フォーム)
- 後続: #3 (サイトマップ XML 生成)

## 備考

- 初期実装では単一ページのみを対象とする
- 将来的には再帰的クローリングに対応
- セキュリティ対策（悪意のあるサイトへの対応）は後のフェーズで実装
- パフォーマンス最適化は動作確認後に実施
