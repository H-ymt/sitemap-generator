import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { z } from "zod";

// リクエストスキーマ
const crawlRequestSchema = z.object({
  url: z.string().url(),
  maxDepth: z.number().min(1).max(10).default(2),
  maxPages: z.number().min(1).max(200).default(50),
});

// レスポンス型
interface CrawlPage {
  url: string;
  title?: string;
  lastModified?: string;
  priority: number;
}

class SimpleCrawler {
  private baseUrl: string;
  private visitedUrls: Set<string>;
  private pages: CrawlPage[];
  private maxDepth: number;
  private maxPages: number;

  constructor(baseUrl: string, maxDepth: number = 2, maxPages: number = 50) {
    this.baseUrl = this.normalizeUrl(baseUrl);
    this.visitedUrls = new Set();
    this.pages = [];
    this.maxDepth = maxDepth;
    this.maxPages = maxPages;
  }

  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // パスの末尾のスラッシュを統一的に処理
      let pathname = urlObj.pathname;
      if (pathname.endsWith("/") && pathname.length > 1) {
        pathname = pathname.slice(0, -1);
      }
      return urlObj.origin + pathname;
    } catch {
      throw new Error(`無効なURLです: ${url}`);
    }
  }

  private resolveUrl(baseUrl: string, relativeUrl: string): string {
    try {
      return new URL(relativeUrl, baseUrl).href;
    } catch {
      return "";
    }
  }

  private isSameDomain(url: string): boolean {
    try {
      const baseHostname = new URL(this.baseUrl).hostname;
      const urlHostname = new URL(url).hostname;
      return baseHostname === urlHostname;
    } catch {
      return false;
    }
  }

  private extractLinks(html: string, currentUrl: string): string[] {
    const $ = cheerio.load(html);
    const links: string[] = [];
    const foundLinks: string[] = [];

    $("a[href]").each((_, element) => {
      const href = $(element).attr("href");
      if (!href) return;

      foundLinks.push(href);

      // より柔軟なリンク処理
      let cleanHref = href.trim();

      // JavaScriptリンクやメールリンクをスキップ
      if (
        cleanHref.startsWith("javascript:") ||
        cleanHref.startsWith("mailto:") ||
        cleanHref.startsWith("tel:")
      ) {
        return;
      }

      // フラグメントとクエリパラメータを除去
      cleanHref = cleanHref.split("#")[0].split("?")[0];

      // 空の場合やルートのみの場合をスキップ
      if (!cleanHref || cleanHref === "/" || cleanHref === ".") return;

      const absoluteUrl = this.resolveUrl(currentUrl, cleanHref);
      if (!absoluteUrl) return;

      // 正規化されたURLを取得
      const normalizedUrl = this.normalizeUrl(absoluteUrl);

      if (this.isSameDomain(normalizedUrl) && !this.visitedUrls.has(normalizedUrl)) {
        links.push(normalizedUrl);
      }
    });

    // デバッグ情報を出力
    console.log(
      `Found ${foundLinks.length} raw links, ${links.length} valid links on ${currentUrl}`
    );

    return [...new Set(links)];
  }

  private extractPageMetadata(html: string, url: string): CrawlPage {
    const $ = cheerio.load(html);
    const title = $("title").text().trim() || $("h1").first().text().trim() || "";
    const lastModified =
      $('meta[name="last-modified"]').attr("content") ||
      $('meta[property="article:modified_time"]').attr("content");

    return {
      url: this.normalizeUrl(url),
      title: title || undefined,
      lastModified: lastModified || undefined,
      priority: 0.5,
    };
  }

  private async crawlPage(url: string): Promise<string[]> {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "SitemapGenerator/1.0",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        console.warn(`Failed to fetch ${url}: ${response.status}`);
        return [];
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) {
        console.warn(`Skipping non-HTML content: ${url}`);
        return [];
      }

      const html = await response.text();
      const pageMetadata = this.extractPageMetadata(html, url);
      this.pages.push(pageMetadata);

      return this.extractLinks(html, url);
    } catch (error) {
      console.error(`Error crawling ${url}:`, error);
      return [];
    }
  }

  private async crawlRecursive(urls: string[], depth: number): Promise<void> {
    if (depth > this.maxDepth || this.pages.length >= this.maxPages) {
      console.log(
        `Stopping crawl: depth=${depth}, maxDepth=${this.maxDepth}, pages=${this.pages.length}, maxPages=${this.maxPages}`
      );
      return;
    }

    console.log(`Crawling depth ${depth} with ${urls.length} URLs`);

    const urlsToCrawl = urls.slice(0, this.maxPages - this.pages.length);
    const nextLevelUrls: string[] = [];

    for (const url of urlsToCrawl) {
      if (this.visitedUrls.has(url) || this.pages.length >= this.maxPages) {
        continue;
      }

      console.log(`Crawling: ${url}`);
      this.visitedUrls.add(url);
      const links = await this.crawlPage(url);
      nextLevelUrls.push(...links);

      // 少し待機してサーバーに負荷をかけすぎないように
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    console.log(
      `Depth ${depth} completed. Found ${nextLevelUrls.length} new URLs for next level`
    );

    if (nextLevelUrls.length > 0 && depth < this.maxDepth) {
      await this.crawlRecursive([...new Set(nextLevelUrls)], depth + 1);
    }
  }

  async crawl(): Promise<CrawlPage[]> {
    try {
      await this.crawlRecursive([this.baseUrl], 1);
      return this.pages;
    } catch (error) {
      console.error("Crawl failed:", error);
      throw error;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, maxDepth, maxPages } = crawlRequestSchema.parse(body);

    const crawler = new SimpleCrawler(url, maxDepth, maxPages);
    const pages = await crawler.crawl();

    return NextResponse.json({
      success: true,
      data: {
        baseUrl: url,
        pages: pages,
        totalPages: pages.length,
        crawlTime: 0,
      },
    });
  } catch (error) {
    console.error("Crawl error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "リクエストデータが無効です" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "クロール中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { success: false, error: "URLパラメータが必要です" },
      { status: 400 }
    );
  }

  try {
    const crawler = new SimpleCrawler(url, 2, 10);
    const pages = await crawler.crawl();

    return NextResponse.json({
      success: true,
      data: {
        baseUrl: url,
        pages: pages,
        totalPages: pages.length,
        crawlTime: 0,
      },
    });
  } catch (error) {
    console.error("Crawl error:", error);
    return NextResponse.json(
      { success: false, error: "クロール中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
