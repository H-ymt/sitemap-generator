import { crawlSitemap } from "./crawler";
import { CrawlRequest, CrawlResponse } from "./types";
import { generateSitemapXML, validateSitemapPages } from "./sitemap-generator";
import { SitemapGenerationRequest, SitemapGenerationResponse } from "./sitemap-types";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS設定
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // プリフライトリクエストの処理
    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // ヘルスチェック
      if (path === "/health" && method === "GET") {
        return new Response(
          JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // サイトマップクロール
      if (path === "/api/crawl" && method === "POST") {
        const body = (await request.json()) as CrawlRequest;

        if (!body.url) {
          return new Response(JSON.stringify({ error: "URL is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const result = await crawlSitemap(body.url, body.maxPages);

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // サイトマップ生成
      if (path === "/api/sitemap/generate" && method === "POST") {
        const body = (await request.json()) as SitemapGenerationRequest;

        if (!body.baseUrl || !body.pages) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "baseUrl and pages are required",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // ページの検証
        const validation = validateSitemapPages(body.pages);
        if (!validation.valid) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Validation failed: ${validation.errors.join(", ")}`,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // サイトマップXMLの生成
        const xml = generateSitemapXML(body.pages, {
          includeLastmod: body.includeLastmod ?? true,
          includeChangefreq: body.includeChangefreq ?? true,
          includePriority: body.includePriority ?? true,
        });

        const response: SitemapGenerationResponse = {
          success: true,
          data: {
            xml,
            pageCount: body.pages.length,
            generatedAt: new Date().toISOString(),
          },
        };

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 404エラー
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(
        JSON.stringify({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  },
};

// 環境変数の型定義
interface Env {
  ENVIRONMENT: string;
  NEXTJS_ENV?: string;
}
