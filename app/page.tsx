"use client";

import { useState } from "react";
import Container from "./components/container";
import UrlInputForm from "./components/forms/url-input-form";
import SitemapDisplay from "./components/sitemap-display";

interface SitemapGenerationResponse {
  success: boolean;
  data?: {
    xml: string;
    pageCount: number;
    generatedAt: string;
  };
  error?: string;
}

export default function Home() {
  const [sitemapData, setSitemapData] = useState<SitemapGenerationResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleUrlSubmit = async (url: string) => {
    setIsGenerating(true);
    setSitemapData(null);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_WORKER_URL || "http://localhost:8787";
      const crawlResponse = await fetch(`${apiBaseUrl}/api/crawl`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url,
          maxDepth: 3,
          maxPages: 100,
        }),
      });

      if (!crawlResponse.ok) {
        throw new Error(`クロールに失敗しました: ${crawlResponse.status}`);
      }

      const crawlResult = (await crawlResponse.json()) as {
        success: boolean;
        data?: {
          pages: Array<{
            url: string;
            title?: string;
            lastModified?: string;
            priority: number;
          }>;
        };
        error?: string;
      };

      if (!crawlResult.success) {
        throw new Error(crawlResult.error || "クロールに失敗しました");
      }

      if (!crawlResult.data) {
        throw new Error("クロール結果が空です");
      }

      // クロール結果をサイトマップXMLに変換
      const sitemapRequestData = {
        baseUrl: url,
        pages: crawlResult.data.pages.map((page) => ({
          url: page.url,
          lastmod: page.lastModified || new Date().toISOString().split("T")[0],
          changefreq: "weekly" as const,
          priority: page.priority || 0.5,
        })),
        includeLastmod: true,
        includeChangefreq: true,
        includePriority: true,
      };

      const sitemapResponse = await fetch(`${apiBaseUrl}/api/sitemap/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sitemapRequestData),
      });

      if (!sitemapResponse.ok) {
        const errorText = await sitemapResponse.text();
        throw new Error(
          `サイトマップ生成に失敗しました: ${sitemapResponse.status} - ${errorText}`
        );
      }

      const result: SitemapGenerationResponse = await sitemapResponse.json();

      if (!result.success) {
        throw new Error(result.error || "サイトマップ生成に失敗しました");
      }

      setSitemapData(result);
    } catch (error) {
      console.error("Sitemap generation error:", error);

      let errorMessage = "サイトマップの生成に失敗しました。";

      if (error instanceof Error) {
        if (
          error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError")
        ) {
          errorMessage =
            "ネットワークエラーが発生しました。サーバーが正常に動作しているか確認してください。";
        } else if (error.message.includes("404")) {
          errorMessage =
            "APIエンドポイントに接続できませんでした。サーバーが正常に動作しているか確認してください。";
        } else {
          errorMessage = error.message;
        }
      }

      alert(errorMessage);
      throw error; // フォームコンポーネントでキャッチされる
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    // サイトマップダウンロード完了後の処理
  };

  return (
    <Container>
      <div className="py-12 md:py-20">
        <div className="text-center space-y-10">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              サイトマップジェネレーター
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              WebサイトのURLを入力するだけで、自動的にサイトマップXMLを生成します。
              SEO最適化とサイト構造の把握に最適なツールです。
            </p>
          </div>

          <UrlInputForm
            onSubmit={handleUrlSubmit}
            placeholder="https://example.com"
            submitButtonText={isGenerating ? "生成中..." : "サイトマップを生成"}
            disabled={isGenerating}
          />

          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>
              ✓ 無料で利用可能 &nbsp;|&nbsp; ✓ XMLファイルをダウンロード &nbsp;|&nbsp; ✓
              SEO最適化済み
            </p>
          </div>
        </div>

        {/* サイトマップ表示エリア */}
        {sitemapData && (
          <div className="mt-12">
            <SitemapDisplay sitemapData={sitemapData} onDownload={handleDownload} />
          </div>
        )}
      </div>
    </Container>
  );
}
