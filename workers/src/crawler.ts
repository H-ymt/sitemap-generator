import * as cheerio from "cheerio";
import { CrawlContext, CrawlPage } from "./types/crawler";

export class WebCrawler {
  private context: CrawlContext;

  constructor(baseUrl: string, maxDepth: number = 2, maxPages: number = 50) {
    this.context = {
      baseUrl: this.normalizeUrl(baseUrl),
      visitedUrls: new Set(),
      pages: [],
      maxDepth,
      maxPages,
      currentDepth: 0,
    };
  }

  /**
   * URLを正規化（末尾のスラッシュを削除など）
   */
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.origin + urlObj.pathname.replace(/\/$/, "");
    } catch {
      throw new Error(`無効なURLです: ${url}`);
    }
  }

  /**
   * 相対URLを絶対URLに変換
   */
  private resolveUrl(baseUrl: string, relativeUrl: string): string {
    try {
      return new URL(relativeUrl, baseUrl).href;
    } catch {
      return "";
    }
  }

  /**
   * URLが同一ドメインかチェック
   */
  private isSameDomain(url: string): boolean {
    try {
      const baseHostname = new URL(this.context.baseUrl).hostname;
      const urlHostname = new URL(url).hostname;
      return baseHostname === urlHostname;
    } catch {
      return false;
    }
  }

  /**
   * HTMLからリンクを抽出
   */
  private extractLinks(html: string, currentUrl: string): string[] {
    const $ = cheerio.load(html);
    const links: string[] = [];

    $("a[href]").each((_, element) => {
      const href = $(element).attr("href");
      if (!href) return;

      // フラグメント（#）やクエリパラメータを除去
      const cleanHref = href.split("#")[0].split("?")[0];
      if (!cleanHref || cleanHref === "/") return;

      // 絶対URLに変換
      const absoluteUrl = this.resolveUrl(currentUrl, cleanHref);
      if (!absoluteUrl) return;

      // 同一ドメインかつ未訪問のURLのみ追加
      if (this.isSameDomain(absoluteUrl) && !this.context.visitedUrls.has(absoluteUrl)) {
        links.push(absoluteUrl);
      }
    });

    return [...new Set(links)]; // 重複除去
  }

  /**
   * ページのメタデータを抽出
   */
  private extractPageMetadata(html: string, url: string): CrawlPage {
    const $ = cheerio.load(html);

    // タイトルを取得
    const title = $("title").text().trim() || $("h1").first().text().trim() || "";

    // 最終更新日を取得（meta要素から）
    const lastModified =
      $('meta[name="last-modified"]').attr("content") ||
      $('meta[property="article:modified_time"]').attr("content");

    return {
      url: this.normalizeUrl(url),
      title: title || undefined,
      lastModified: lastModified || undefined,
      priority: 0.5, // デフォルト優先度
    };
  }

  /**
   * 単一ページをクロール
   */
  private async crawlPage(url: string): Promise<string[]> {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "SitemapGenerator/1.0 (+https://sitemap-generator.example.com)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        // タイムアウト設定
        signal: AbortSignal.timeout(10000), // 10秒
      });

      if (!response.ok) {
        console.warn(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
        return [];
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) {
        console.warn(`Skipping non-HTML content: ${url}`);
        return [];
      }

      const html = await response.text();

      // ページメタデータを保存
      const pageMetadata = this.extractPageMetadata(html, url);
      this.context.pages.push(pageMetadata);

      // リンクを抽出して返す
      return this.extractLinks(html, url);
    } catch (error) {
      console.error(`Error crawling ${url}:`, error);
      return [];
    }
  }

  /**
   * 再帰的にクロールを実行
   */
  private async crawlRecursive(urls: string[], depth: number): Promise<void> {
    if (depth > this.context.maxDepth || this.context.pages.length >= this.context.maxPages) {
      return;
    }

    const urlsToCrawl = urls.slice(0, this.context.maxPages - this.context.pages.length);
    const nextLevelUrls: string[] = [];

    // 並列処理でページをクロール（最大5並列）
    const batchSize = 5;
    for (let i = 0; i < urlsToCrawl.length; i += batchSize) {
      const batch = urlsToCrawl.slice(i, i + batchSize);

      const results = await Promise.allSettled(
        batch.map(async (url) => {
          if (
            this.context.visitedUrls.has(url) ||
            this.context.pages.length >= this.context.maxPages
          ) {
            return [];
          }

          this.context.visitedUrls.add(url);
          return await this.crawlPage(url);
        })
      );

      // 成功した結果から次レベルのURLを収集
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          nextLevelUrls.push(...result.value);
        }
      });

      // ページ数制限チェック
      if (this.context.pages.length >= this.context.maxPages) {
        break;
      }
    }

    // 次の深度へ
    if (nextLevelUrls.length > 0 && depth < this.context.maxDepth) {
      await this.crawlRecursive([...new Set(nextLevelUrls)], depth + 1);
    }
  }

  /**
   * クロール開始
   */
  async crawl(): Promise<CrawlPage[]> {
    const startTime = Date.now();

    try {
      // ベースURLをクロール開始
      await this.crawlRecursive([this.context.baseUrl], 1);

      const crawlTime = Date.now() - startTime;
      console.log(
        `Crawl completed in ${crawlTime}ms. Found ${this.context.pages.length} pages.`
      );

      return this.context.pages;
    } catch (error) {
      console.error("Crawl failed:", error);
      throw error;
    }
  }

  /**
   * クロール結果の統計情報を取得
   */
  getStats() {
    return {
      totalPages: this.context.pages.length,
      visitedUrls: this.context.visitedUrls.size,
      baseUrl: this.context.baseUrl,
    };
  }
}
