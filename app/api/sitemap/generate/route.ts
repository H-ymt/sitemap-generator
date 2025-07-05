import { NextRequest, NextResponse } from "next/server";
import {
  generateSitemapXml,
  generateSampleSitemapEntries,
  validateSitemapXml,
} from "@/app/lib/utils/xml-generator";
import { z } from "zod";

// スキーマ定義
const sitemapEntrySchema = z.object({
  url: z.string().url(),
  lastmod: z.string().optional(),
  changefreq: z
    .enum(["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"])
    .optional(),
  priority: z.number().min(0).max(1).optional(),
});

const sitemapGenerationRequestSchema = z.object({
  baseUrl: z.string().url(),
  pages: z.array(sitemapEntrySchema).min(1),
  includeLastmod: z.boolean().default(true),
  includeChangefreq: z.boolean().default(true),
  includePriority: z.boolean().default(true),
});

const sitemapGenerationResponseSchema = z.object({
  xml: z.string(),
  pageCount: z.number(),
  generatedAt: z.string(),
});

/**
 * POST /api/sitemap/generate
 * サイトマップXMLを生成するAPI
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // リクエストデータのバリデーション
    const validationResult = sitemapGenerationRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation Error",
          message: "リクエストデータが無効です",
          code: 400,
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const requestData = validationResult.data;

    // サイトマップXMLを生成
    const xml = generateSitemapXml(requestData);

    // 生成されたXMLの妥当性チェック
    if (!validateSitemapXml(xml)) {
      return NextResponse.json(
        {
          error: "XML Generation Error",
          message: "生成されたXMLが無効です",
          code: 500,
        },
        { status: 500 }
      );
    }

    // レスポンスデータを構築
    const responseData = {
      xml,
      pageCount: requestData.pages.length,
      generatedAt: new Date().toISOString(),
    };

    // レスポンスデータのバリデーション
    const responseValidation = sitemapGenerationResponseSchema.safeParse(responseData);

    if (!responseValidation.success) {
      return NextResponse.json(
        {
          error: "Response Validation Error",
          message: "レスポンスデータが無効です",
          code: 500,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(responseValidation.data, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "サイトマップ生成中にエラーが発生しました",
        code: 500,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sitemap/generate
 * サンプルサイトマップXMLを生成するAPI（テスト用）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const baseUrl = searchParams.get("baseUrl") || "https://example.com";

    // URL形式のバリデーション
    try {
      new URL(baseUrl);
    } catch {
      return NextResponse.json(
        {
          error: "Invalid URL",
          message: "有効なbaseURLを指定してください",
          code: 400,
        },
        { status: 400 }
      );
    }

    // サンプルデータを生成
    const samplePages = generateSampleSitemapEntries(baseUrl);

    const requestData = {
      baseUrl,
      pages: samplePages,
      includeLastmod: true,
      includeChangefreq: true,
      includePriority: true,
    };

    // サイトマップXMLを生成
    const xml = generateSitemapXml(requestData);

    // レスポンスデータを構築
    const responseData = {
      xml,
      pageCount: samplePages.length,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Sample sitemap generation error:", error);

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "サンプルサイトマップ生成中にエラーが発生しました",
        code: 500,
      },
      { status: 500 }
    );
  }
}
