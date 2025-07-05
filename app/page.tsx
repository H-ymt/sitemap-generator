"use client";

import { useState } from "react";
import Container from "./components/container";
import UrlInputForm from "./components/forms/url-input-form";
import SitemapDisplay from "./components/sitemap-display";

interface SitemapGenerationResponse {
  xml: string;
  pageCount: number;
  generatedAt: string;
}

export default function Home() {
  const [sitemapData, setSitemapData] = useState<SitemapGenerationResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleUrlSubmit = async (url: string) => {
    setIsGenerating(true);
    setSitemapData(null);

    try {
      // Cloudflare Workersクローラーを試行し、失敗したらNext.js API Routesにフォールバック
      let crawlResponse;
      try {
        crawlResponse = await fetch("http://localhost:8787/api/crawl", {
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

        // Next.jsアプリケーションの404エラーが返される場合はWorkersが動作していない
        if (crawlResponse.status === 404) {
          throw new Error("Workers not available");
        }
      } catch (workersError) {
        console.log("Workers not available, using Next.js API Routes");
        crawlResponse = await fetch("/api/crawl", {
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
      }

      if (!crawlResponse.ok) {
        throw new Error(`Crawl failed: ${crawlResponse.status}`);
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
      const sitemapResponse = await fetch("/api/sitemap/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          baseUrl: url,
          pages: crawlResult.data.pages.map((page) => ({
            url: page.url,
            lastmod: page.lastModified || new Date().toISOString().split("T")[0],
            changefreq: "weekly",
            priority: page.priority || 0.5,
          })),
          includeLastmod: true,
          includeChangefreq: true,
          includePriority: true,
        }),
      });

      if (!sitemapResponse.ok) {
        throw new Error(`Sitemap generation failed: ${sitemapResponse.status}`);
      }

      const result: SitemapGenerationResponse = await sitemapResponse.json();
      setSitemapData(result);
    } catch (error) {
      console.error("Sitemap generation error:", error);

      // エラーの場合、サンプルデータにフォールバック
      console.log("Crawling failed, falling back to sample data...");
      try {
        const response = await fetch(
          `/api/sitemap/generate?baseUrl=${encodeURIComponent(url)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const result: SitemapGenerationResponse = await response.json();
          setSitemapData(result);
          alert("⚠️ 実際のクロールに失敗しました。サンプルデータを表示しています。");
        } else {
          throw error;
        }
      } catch (fallbackError) {
        alert("サイトマップの生成に失敗しました。しばらくしてから再度お試しください。");
        throw fallbackError;
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    console.log("Sitemap downloaded successfully!");
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
