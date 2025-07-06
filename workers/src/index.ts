import { Hono } from "hono";
import { cors } from "hono/cors";
import { crawlSitemap } from "./crawler";
import { CrawlRequest, CrawlResponse } from "./types";
import { generateSitemapXML, validateSitemapPages } from "./sitemap-generator";
import { SitemapGenerationRequest, SitemapGenerationResponse } from "./sitemap-types";
import { renderHtml } from "./templates/html";

interface Env {
  ENVIRONMENT: string;
  ALLOWED_ORIGINS?: string;
  RATE_LIMIT_WINDOW_MS?: string;
  RATE_LIMIT_MAX_REQUESTS?: string;
  MAX_URLS_PER_SITEMAP?: string;
  MAX_REQUEST_SIZE_MB?: string;
  LOG_LEVEL?: string;
}

type Variables = {
  env: Env;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// CORS設定
app.use(
  "*",
  cors({
    origin: (origin, c) => {
      // 開発環境では全てのオリジンを許可
      if (c.env.ENVIRONMENT === "development") {
        return origin || "*";
      }

      // 本番環境では許可されたオリジンのみ
      const allowedOrigins = (c.env.ALLOWED_ORIGINS || "")
        .split(",")
        .map((o: string) => o.trim());
      if (allowedOrigins.includes(origin || "") || origin === undefined) {
        return origin || "*";
      }
      return null;
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// 環境変数をコンテキストに追加
app.use("*", async (c, next) => {
  c.set("env", c.env);
  await next();
});

// フロントエンドのルーティング
app.get("/", (c) => {
  return c.html(renderHtml());
});

// シンプルなfaviconレスポンス
app.get("/favicon.ico", (c) => {
  return new Response(null, { status: 204 });
});

// API エンドポイント
app.get("/health", (c) => {
  const logLevel = c.env.LOG_LEVEL || "info";
  if (logLevel === "debug") {
    console.log("Health check requested", { timestamp: new Date().toISOString() });
  }
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || "unknown",
  });
});

// サイトマップクロール
app.post("/api/crawl", async (c) => {
  try {
    const body = (await c.req.json()) as CrawlRequest;

    if (!body.url) {
      return c.json({ error: "URL is required" }, 400);
    }

    const result = await crawlSitemap(body.url, body.maxPages);
    return c.json(result);
  } catch (error) {
    console.error("Crawl error:", error);
    return c.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// サイトマップ生成
app.post("/api/sitemap/generate", async (c) => {
  try {
    const body = (await c.req.json()) as SitemapGenerationRequest;

    if (!body.baseUrl || !body.pages) {
      return c.json(
        {
          success: false,
          error: "baseUrl and pages are required",
        },
        400
      );
    }

    // ページの検証
    const validation = validateSitemapPages(body.pages);
    if (!validation.valid) {
      return c.json(
        {
          success: false,
          error: `Validation failed: ${validation.errors.join(", ")}`,
        },
        400
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

    return c.json(response);
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return c.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// 404エラー
app.notFound((c) => {
  return c.json({ error: "Not found" }, 404);
});

// エラーハンドラー
app.onError((err, c) => {
  console.error("Global error:", err);
  return c.json(
    {
      error: "Internal server error",
      message: err.message,
    },
    500
  );
});

export default app;
