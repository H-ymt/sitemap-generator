export interface SitemapPage {
  url: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

export interface SitemapGenerationRequest {
  baseUrl: string;
  pages: SitemapPage[];
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
