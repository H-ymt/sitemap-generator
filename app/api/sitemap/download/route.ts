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

/**
 * POST /api/sitemap/download
 * サイトマップXMLをダウンロード用に返すAPI
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

    // XMLファイルとしてダウンロード用のレスポンスを返す
    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Content-Disposition": 'attachment; filename="sitemap.xml"',
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Sitemap download error:", error);

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "サイトマップダウンロード中にエラーが発生しました",
        code: 500,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sitemap/download
 * サンプルサイトマップXMLをダウンロード用に返すAPI（テスト用）
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

    // XMLファイルとしてダウンロード用のレスポンスを返す
    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Content-Disposition": `attachment; filename="sitemap-${
          new URL(baseUrl).hostname
        }.xml"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Sample sitemap download error:", error);

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "サンプルサイトマップダウンロード中にエラーが発生しました",
        code: 500,
      },
      { status: 500 }
    );
  }
}
