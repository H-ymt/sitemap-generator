"use client";

import { useState } from "react";
import { downloadXmlFile } from "@/app/lib/utils/xml-generator";

interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

interface SitemapGenerationResponse {
  xml: string;
  pageCount: number;
  generatedAt: string;
}

interface SitemapDisplayProps {
  sitemapData: SitemapGenerationResponse;
  onDownload?: () => void;
}

/**
 * サイトマップ表示コンポーネント
 */
export default function SitemapDisplay({ sitemapData, onDownload }: SitemapDisplayProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // XMLファイルをダウンロード
      downloadXmlFile(sitemapData.xml, "sitemap.xml");

      // コールバック実行
      onDownload?.();
    } catch (error) {
      console.error("Download error:", error);
      alert("ダウンロードに失敗しました");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAPIDownload = async () => {
    setIsDownloading(true);
    try {
      // サーバーサイドでのダウンロード処理
      const response = await fetch("/api/sitemap/download", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // XMLファイルをダウンロード
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "sitemap.xml";
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();

      // クリーンアップ
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // コールバック実行
      onDownload?.();
    } catch (error) {
      console.error("API download error:", error);
      alert("ダウンロードに失敗しました");
    } finally {
      setIsDownloading(false);
    }
  };

  // XMLからURL一覧を抽出（表示用）
  const extractUrlsFromXml = (xml: string): SitemapEntry[] => {
    const urls: SitemapEntry[] = [];
    const urlRegex = /<url>([\s\S]*?)<\/url>/g;
    const locRegex = /<loc>(.*?)<\/loc>/;
    const lastmodRegex = /<lastmod>(.*?)<\/lastmod>/;
    const changefreqRegex = /<changefreq>(.*?)<\/changefreq>/;
    const priorityRegex = /<priority>(.*?)<\/priority>/;

    let urlMatch;
    while ((urlMatch = urlRegex.exec(xml)) !== null) {
      const urlContent = urlMatch[1];

      const locMatch = locRegex.exec(urlContent);
      const lastmodMatch = lastmodRegex.exec(urlContent);
      const changefreqMatch = changefreqRegex.exec(urlContent);
      const priorityMatch = priorityRegex.exec(urlContent);

      if (locMatch) {
        urls.push({
          url: locMatch[1],
          lastmod: lastmodMatch?.[1],
          changefreq: changefreqMatch?.[1] as SitemapEntry["changefreq"],
          priority: priorityMatch ? parseFloat(priorityMatch[1]) : undefined,
        });
      }
    }

    return urls;
  };

  const urls = extractUrlsFromXml(sitemapData.xml);

  return (
    <div className="space-y-6">
      {/* サイトマップ情報 */}
      <div className="bg-background/30  text-foreground p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">サイトマップ生成結果</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">ページ数:</span>
            <span className="ml-2 ">{sitemapData.pageCount}</span>
          </div>
          <div>
            <span className="font-medium">生成日時:</span>
            <span className="ml-2">
              {new Date(sitemapData.generatedAt).toLocaleString("ja-JP")}
            </span>
          </div>
          <div>
            <span className="font-medium">ファイルサイズ:</span>
            <span className="ml-2 ">
              {(new Blob([sitemapData.xml]).size / 1024).toFixed(1)} KB
            </span>
          </div>
        </div>
      </div>

      {/* ダウンロードボタン */}
      <div className="flex gap-4">
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="px-6 py-3 bg-blue-600 text-foreground rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isDownloading ? "ダウンロード中..." : "XMLをダウンロード"}
        </button>
        <button
          onClick={handleAPIDownload}
          disabled={isDownloading}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isDownloading ? "処理中..." : "APIでダウンロード"}
        </button>
      </div>

      {/* URL一覧表示 */}
      <div className="bg-foreground p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium mb-4 text-background">サイトマップ一覧</h3>
        <div className="space-y-3">
          {urls.map((entry, index) => (
            <div
              key={index}
              className="border-l-4 border-blue-200 pl-4 py-2 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between break-all">
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline font-medium max-w-2xl"
                >
                  {entry.url}
                </a>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {entry.priority && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      優先度: {entry.priority}
                    </span>
                  )}
                  {entry.changefreq && (
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                      更新頻度: {entry.changefreq}
                    </span>
                  )}
                </div>
              </div>
              {entry.lastmod && (
                <p className="text-sm text-gray-500 mt-1">
                  最終更新: {new Date(entry.lastmod).toLocaleDateString("ja-JP")}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* XML Preview */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium mb-4 text-background">XMLプレビュー</h3>
        <div className="p-4 rounded-lg max-h-96 overflow-auto">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap">{sitemapData.xml}</pre>
        </div>
      </div>
    </div>
  );
}
