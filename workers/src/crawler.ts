import * as cheerio from "cheerio";
import { CrawlPage, CrawlContext } from "./types";

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

  private normalizeUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      return `${parsedUrl.protocol}//${parsedUrl.hostname}${
        parsedUrl.port ? `:${parsedUrl.port}` : ""
      }`;
    } catch (error) {
      throw new Error(`無効なURLです: ${url}`);
    }
  }

  async crawl(): Promise<CrawlPage[]> {
    await this.crawlPage(this.context.baseUrl, 0);
    return this.context.pages;
  }

  private async crawlPage(url: string, depth: number): Promise<void> {
    // 制限チェック
    if (
      depth > this.context.maxDepth ||
      this.context.pages.length >= this.context.maxPages ||
      this.context.visitedUrls.has(url)
    ) {
      return;
    }

    this.context.visitedUrls.add(url);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "SitemapGenerator/1.0",
        },
      });

      if (!response.ok) {
        console.warn(`Failed to fetch ${url}: ${response.status}`);
        return;
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // ページ情報を抽出
      const title = $("title").text().trim();
      const lastModified = response.headers.get("last-modified");

      const page: CrawlPage = {
        url,
        ...(title && { title }),
        ...(lastModified && { lastModified }),
        priority: depth === 0 ? 1.0 : Math.max(0.1, 1.0 - depth * 0.2),
      };

      this.context.pages.push(page);

      // 内部リンクを抽出
      if (depth < this.context.maxDepth) {
        const links = this.extractInternalLinks($, url);

        for (const link of links) {
          if (this.context.pages.length >= this.context.maxPages) {
            break;
          }
          await this.crawlPage(link, depth + 1);
        }
      }
    } catch (error) {
      console.error(`Error crawling ${url}:`, error);
    }
  }

  private extractInternalLinks($: cheerio.CheerioAPI, currentUrl: string): string[] {
    const links: string[] = [];
    const baseHost = new URL(this.context.baseUrl).hostname;

    $("a[href]").each((_, element) => {
      const href = $(element).attr("href");
      if (!href) return;

      try {
        const absoluteUrl = new URL(href, currentUrl);

        // 同じドメインの場合のみ
        if (absoluteUrl.hostname === baseHost) {
          const cleanUrl = `${absoluteUrl.protocol}//${absoluteUrl.hostname}${absoluteUrl.pathname}`;

          if (
            !this.context.visitedUrls.has(cleanUrl) &&
            !links.includes(cleanUrl) &&
            !this.isExcludedPath(absoluteUrl.pathname)
          ) {
            links.push(cleanUrl);
          }
        }
      } catch (error) {
        // 無効なURLは無視
      }
    });

    return links;
  }

  private isExcludedPath(pathname: string): boolean {
    const excludedPatterns = [
      /\.(jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx|zip|rar)$/i,
      /\/(admin|login|register|logout|api)\//,
      /#/,
    ];

    return excludedPatterns.some((pattern) => pattern.test(pathname));
  }

  getStats() {
    return {
      baseUrl: this.context.baseUrl,
      totalPages: this.context.pages.length,
      visitedUrls: this.context.visitedUrls.size,
    };
  }
}

// メイン関数：外部から呼び出し可能
export async function crawlSitemap(
  url: string,
  maxPages: number = 50,
  maxDepth: number = 2
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const crawler = new WebCrawler(url, maxDepth, maxPages);
    const pages = await crawler.crawl();
    const stats = crawler.getStats();

    return {
      success: true,
      data: {
        baseUrl: stats.baseUrl,
        pages: pages,
        totalPages: stats.totalPages,
        crawlTime: Date.now(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "不明なエラーが発生しました",
    };
  }
}
