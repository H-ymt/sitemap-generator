# Sitemap Generator

Web サイトの URL を入力してサイトマップ XML を自動生成する Web アプリケーション

## アーキテクチャ

- **Next.js 15**: フロントエンド（UI/Pages）
- **Cloudflare Workers**: API 処理とクローリング
- **TypeScript**: 型安全性の確保
- **Tailwind CSS**: スタイリング

## 開発環境のセットアップ

### 1. 依存関係のインストール

```bash
# メインプロジェクトの依存関係
pnpm install

# Workers の依存関係
cd workers && pnpm install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成し、以下の内容を設定：

```bash
# Workers API の URL（開発環境）
NEXT_PUBLIC_WORKERS_API_URL=http://localhost:8787

# 本番環境用
CLOUDFLARE_WORKERS_DOMAIN=your-domain.workers.dev
```

### 3. 開発サーバーの起動

#### 全体を同時に起動（推奨）

```bash
pnpm dev:full
```

#### 個別に起動

```bash
# Next.js（フロントエンド）
pnpm dev

# Cloudflare Workers（API）
pnpm workers:dev
```

## デプロイ

### 1. Workers のデプロイ

```bash
# Workers のみデプロイ
pnpm workers:deploy

# または、wrangler コマンドで直接
cd workers && pnpm deploy
```

### 2. Next.js のデプロイ（Cloudflare Pages）

```bash
# Cloudflare Pages へのデプロイ
pnpm cf:deploy

# プレビュー
pnpm cf:preview
```

### 3. 全体のデプロイ

```bash
# Workers と Next.js の両方をデプロイ
pnpm deploy
```

## API 構成

### Cloudflare Workers Endpoints

- `GET /health` - ヘルスチェック
- `POST /api/crawl` - サイトクローリング
- `POST /api/sitemap/generate` - サイトマップ生成

### Next.js API Routes

Next.js の API Routes は使用せず、すべて Cloudflare Workers にプロキシされます。

## テスト

```bash
# E2E テスト
pnpm test:e2e

# テスト UI
pnpm test:e2e:ui

# テストレポート
pnpm test:e2e:report
```

## プロジェクト構成

```
sitemap-generator/
├── app/                    # Next.js アプリケーション
│   ├── components/         # React コンポーネント
│   ├── lib/               # ユーティリティ・API クライアント
│   └── page.tsx           # ページコンポーネント
├── workers/               # Cloudflare Workers
│   ├── src/
│   │   ├── index.ts       # Workers エントリーポイント
│   │   ├── crawler.ts     # クローリング処理
│   │   └── sitemap-generator.ts  # サイトマップ生成
│   └── wrangler.toml      # Workers 設定
├── package.json           # メインプロジェクト設定
└── README.md
```

## 開発のワークフロー

1. **フロントエンド開発**: `app/` 配下で Next.js コンポーネントを開発
2. **API 開発**: `workers/src/` 配下で Cloudflare Workers API を開発
3. **統合テスト**: `pnpm dev:full` で全体を起動してテスト

## 注意事項

- API Routes は Next.js ではなく Cloudflare Workers で処理されます
- 開発時は `http://localhost:8787` で Workers API にアクセス
- 本番環境では `https://your-workers-domain.workers.dev` にアクセス
