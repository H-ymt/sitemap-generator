# Sitemap Generator - Copilot Instructions

## プロジェクト概要

このプロジェクトは、Web サイトの URL を入力してサイトマップ XML を自動生成する Web アプリケーションです。Next.js 15 と Cloudflare Workers を使用して構築されています。

## 技術スタック

### フロントエンド

- **Next.js 15** - メインフレームワーク
- **React** - UI ライブラリ
- **TypeScript** - 型安全性の確保
- **Tailwind CSS** - スタイリング（推奨）

### バックエンド・インフラ

- **Cloudflare Workers** - API 処理とクローリング
- **Cloudflare D1** - データベース（履歴管理）
- **Cloudflare KV/Durable Objects** - 必要に応じて使用

### ライブラリ・ツール

- **Zod** - スキーマバリデーション（推奨）
- **Prisma** - D1 対応時の ORM（推奨）
- **Playwright/Puppeteer** - クローリング処理（必要に応じて）

### ホスティング

- **Vercel** または **Cloudflare Pages**

## アーキテクチャ指針

### Cloudflare Workers と Next.js の連携

- API ルートやバックエンド処理は Cloudflare Workers で実装
- フロントエンドは Next.js で構築
- Workers からの API レスポンスを Next.js で消費

### データベース選択

- **Cloudflare D1** を優先使用（Next.js/Workers との親和性が高い）
- 用途に応じて KV や Durable Objects も検討

## 機能要件

### 1. URL 入力フォーム

- サイトマップを生成したい Web サイトの URL を入力
- バリデーション（有効な URL 形式、アクセス可能性チェック）
- TypeScript + Zod でのスキーマ検証

### 2. クローリング＆ページ抽出

- 入力された URL から内部リンクを自動抽出
- Cloudflare Workers 上で独自実装または Playwright/Puppeteer 使用
- 重複排除とエラーハンドリング
- 進行状況の表示（リアルタイム更新）

### 3. サイトマップ（XML）生成

- 抽出したページ一覧から sitemap.xml を自動生成
- XML 形式の標準仕様に準拠
- メタデータ（最終更新日、優先度など）の適切な設定

### 4. サイトマップの視覚表示

- 生成したサイトマップをツリー形式で表示
- ページタイトルと URL の一覧表示
- 階層構造の視覚的表現
- React コンポーネントでの実装

### 5. ダウンロード機能

- 生成した sitemap.xml のダウンロード
- ブラウザの標準ダウンロード機能を使用

### 6. 履歴管理（任意機能）

- 直近の生成履歴を一覧表示
- 全ユーザー共通の履歴（個人認証不要）

## データベース設計（Cloudflare D1）

### テーブル: sitemaps

```sql
CREATE TABLE sitemaps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  page_count INTEGER NOT NULL,
  sitemap_xml TEXT NOT NULL
);
```

## コーディング規約

### TypeScript

- 厳密な型定義を使用
- `any` 型の使用を避ける
- インターフェースとタイプエイリアスを適切に使い分け
- Zod スキーマでのランタイムバリデーション

### React

- 関数コンポーネントを使用
- React Hooks の適切な使用
- カスタムフックでのロジック分離
- Suspense と Error Boundary の活用

#### useEffect の適切な使用

- `useEffect` の乱用を避け、以下の場合のみ使用する：
  - DOM 操作やクリーンアップが必要な副作用
  - 外部システムとの同期（WebSocket、イベントリスナー等）
- データフェッチには `useEffect` ではなく以下を優先する：
  - **Server Components** - サーバーサイドでのデータフェッチ
  - **SWR/TanStack Query** - クライアントサイドでのデータフェッチ
  - **Next.js の fetch API** - キャッシュ機能付きフェッチ

#### ストリーミングデータフェッチ仕様

- **Next.js 15 Streaming SSR** と **React Suspense** を活用したデータフェッチ
- クローリング進行状況の表示には以下の手法を組み合わせる：

  - **Streaming SSR** - 初期データの段階的レンダリング
  - **Suspense** - 非同期コンポーネントの適切な読み込み状態管理
  - **Server-Sent Events (SSE)** - リアルタイム進行状況更新

- 実装パターン：

  ```typescript
  // Next.js 15 Streaming SSR with Suspense
  import { Suspense } from "react";

  // ストリーミング対応のServer Component
  async function SitemapData({ url }: { url: string }) {
    const data = await fetch(`/api/crawl/${url}`, { cache: "no-store" });
    return <SitemapDisplay data={data} />;
  }

  // Suspenseでのラッピング
  function SitemapPage() {
    return (
      <Suspense fallback={<SitemapSkeleton />}>
        <SitemapData url={url} />
      </Suspense>
    );
  }

  // リアルタイム更新用のSSE
  const { progress, status } = useStreamingProgress("/api/crawl/progress");
  ```

- **Streaming SSR** でコンテンツを段階的に配信し、ユーザー体験を向上
- **Suspense** でローディング状態を宣言的に管理
- **SSE** でクローリング進行状況をリアルタイム更新
- 適切なエラーバウンダリとフォールバック UI の実装

### API 設計

- RESTful な URL 設計
- 適切な HTTP ステータスコードの使用
- エラーレスポンスの統一フォーマット
- TypeScript による型安全な API クライアント

#### データフェッチのベストプラクティス

- **避けるべきパターン**：
  ```typescript
  // ❌ 避ける - useEffect での単純なデータフェッチ
  useEffect(() => {
    fetch("/api/data").then(setData);
  }, []);
  ```
- **推奨パターン**：

  ```typescript
  // ✅ 推奨 - Server Components
  async function DataComponent() {
    const data = await fetch("/api/data");
    return <div>{data}</div>;
  }

  // ✅ 推奨 - カスタムフックでの抽象化
  const { data, loading, error } = useSitemapData(url);

  // ✅ 推奨 - SWR/TanStack Query
  const { data } = useSWR("/api/data", fetcher);
  ```

### スタイリング（Tailwind CSS）

- ユーティリティクラスを優先
- カスタムコンポーネントでの再利用性
- レスポンシブデザインの実装
- ダークモード対応（オプション）

## エラーハンドリング

- ネットワークエラーの適切な処理
- クローリング失敗時のフォールバック
- ユーザーフレンドリーなエラーメッセージ
- ログ出力とモニタリング

## パフォーマンス要件

- クローリング処理の最適化
- 大量ページサイトでのメモリ使用量制御
- API レスポンス時間の最適化
- フロントエンドでの適切なローディング状態表示

## セキュリティ要件

- 入力値のサニタイゼーション
- CORS の適切な設定
- Rate limiting の実装
- 悪意のあるサイトへのアクセス制限

## テスト要件

- ユニットテスト（Jest）
- E2E テスト（Playwright 推奨）
- API テストの実装
- クローリング機能のテスト

## デプロイメント

- Cloudflare Workers のデプロイ自動化
- Next.js アプリケーションのビルド最適化
- 環境変数の適切な管理
- CI/CD パイプラインの構築
