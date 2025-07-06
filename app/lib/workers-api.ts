// Workers API クライアント
const API_BASE_URL = process.env.NEXT_PUBLIC_WORKER_URL || "http://localhost:8787";

export interface CrawlRequest {
  url: string;
  maxPages?: number;
}

export interface CrawlResponse {
  success: boolean;
  data?: {
    pages: Array<{
      url: string;
      title: string;
      lastmod?: string;
      changefreq?: string;
      priority?: number;
    }>;
    totalPages: number;
    crawledAt: string;
  };
  error?: string;
}

export interface SitemapGenerationRequest {
  baseUrl: string;
  pages: Array<{
    url: string;
    title: string;
    lastmod?: string;
    changefreq?: string;
    priority?: number;
  }>;
  includeLastmod?: boolean;
  includeChangefreq?: boolean;
  includePriority?: boolean;
}

export interface SitemapGenerationResponse {
  success: boolean;
  data?: {
    xml: string;
    pageCount: number;
    generatedAt: string;
  };
  error?: string;
}

class WorkersAPIClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async health(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    return response.json();
  }

  async crawl(request: CrawlRequest): Promise<CrawlResponse> {
    const response = await fetch(`${this.baseUrl}/api/crawl`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Crawl request failed: ${response.status}`);
    }

    return response.json();
  }

  async generateSitemap(
    request: SitemapGenerationRequest
  ): Promise<SitemapGenerationResponse> {
    const response = await fetch(`${this.baseUrl}/api/sitemap/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Sitemap generation failed: ${response.status}`);
    }

    return response.json();
  }
}

// シングルトンインスタンス
export const workersAPI = new WorkersAPIClient();

// 個別のエクスポート関数
export const healthCheck = () => workersAPI.health();
export const crawlSitemap = (request: CrawlRequest) => workersAPI.crawl(request);
export const generateSitemap = (request: SitemapGenerationRequest) =>
  workersAPI.generateSitemap(request);
