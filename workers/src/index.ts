import { WebCrawler } from "./crawler";
import { CrawlRequestSchema, ErrorResponseSchema, CrawlResult } from "./types/crawler";

export interface Env {
  // 環境変数やバインディングがあればここに定義
}

/**
 * CORSヘッダーを設定したレスポンスを作成
 */
function createCorsResponse(body: string, status: number = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

/**
 * エラーレスポンスを作成
 */
function createErrorResponse(message: string, code?: string, status: number = 400): Response {
  const errorResponse = ErrorResponseSchema.parse({
    success: false,
    error: message,
    code,
  });

  return createCorsResponse(JSON.stringify(errorResponse), status);
}

/**
 * リクエストのバリデーション
 */
async function validateRequest(request: Request) {
  if (request.method !== "POST") {
    throw new Error("POSTメソッドのみサポートしています");
  }

  const contentType = request.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    throw new Error("Content-Type: application/json が必要です");
  }

  const body = await request.json();
  return CrawlRequestSchema.parse(body);
}

/**
 * メインのクロール処理
 */
async function handleCrawlRequest(request: Request): Promise<Response> {
  const startTime = Date.now();

  try {
    // リクエストのバリデーション
    const { url, maxDepth, maxPages } = await validateRequest(request);

    // クローラーを初期化して実行
    const crawler = new WebCrawler(url, maxDepth, maxPages);
    const pages = await crawler.crawl();
    const stats = crawler.getStats();

    // レスポンスデータを構築
    const response: CrawlResult = {
      success: true,
      data: {
        baseUrl: stats.baseUrl,
        pages: pages,
        totalPages: stats.totalPages,
        crawlTime: Date.now() - startTime,
      },
    };

    return createCorsResponse(JSON.stringify(response));
  } catch (error) {
    console.error("Crawl request failed:", error);

    if (error instanceof Error) {
      // Zodバリデーションエラーの場合
      if (error.name === "ZodError") {
        return createErrorResponse("リクエストデータが無効です", "VALIDATION_ERROR", 400);
      }

      // その他のエラー
      return createErrorResponse(error.message, "CRAWL_ERROR", 500);
    }

    return createErrorResponse("予期しないエラーが発生しました", "UNKNOWN_ERROR", 500);
  }
}

/**
 * OPTIONSリクエスト（CORS preflight）の処理
 */
function handleOptionsRequest(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

/**
 * メインのWorkerエントリーポイント
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight リクエストの処理
    if (request.method === "OPTIONS") {
      return handleOptionsRequest();
    }

    // ルーティング
    switch (url.pathname) {
      case "/api/crawl":
        return await handleCrawlRequest(request);

      case "/":
      case "/health":
        return createCorsResponse(
          JSON.stringify({
            success: true,
            message: "Sitemap Generator Crawler API",
            version: "1.0.0",
            timestamp: new Date().toISOString(),
          })
        );

      default:
        return createErrorResponse("エンドポイントが見つかりません", "NOT_FOUND", 404);
    }
  },
};
