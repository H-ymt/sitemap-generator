// 型定義
interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

interface SitemapGenerationRequest {
  baseUrl: string;
  pages: SitemapEntry[];
  includeLastmod?: boolean;
  includeChangefreq?: boolean;
  includePriority?: boolean;
}

/**
 * XMLの特殊文字をエスケープ
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * ISO 8601形式の日付文字列を生成
 */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * サイトマップXMLを生成
 */
export function generateSitemapXml(request: SitemapGenerationRequest): string {
  const { pages, includeLastmod, includeChangefreq, includePriority } = request;

  const xmlDeclaration = '<?xml version="1.0" encoding="UTF-8"?>';
  const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  const urlsetClose = "</urlset>";

  const urlEntries = pages.map((page: SitemapEntry) => {
    const urlOpen = "  <url>";
    const urlClose = "  </url>";
    const loc = `    <loc>${escapeXml(page.url)}</loc>`;

    const optionalFields: string[] = [];

    if (includeLastmod && page.lastmod) {
      optionalFields.push(`    <lastmod>${escapeXml(page.lastmod)}</lastmod>`);
    }

    if (includeChangefreq && page.changefreq) {
      optionalFields.push(`    <changefreq>${escapeXml(page.changefreq)}</changefreq>`);
    }

    if (includePriority && page.priority !== undefined) {
      optionalFields.push(`    <priority>${page.priority.toFixed(1)}</priority>`);
    }

    return [urlOpen, loc, ...optionalFields, urlClose].join("\n");
  });

  return [
    xmlDeclaration,
    urlsetOpen,
    ...urlEntries,
    urlsetClose,
    "", // 最後に空行を追加
  ].join("\n");
}

/**
 * サンプルサイトマップエントリを生成（テスト用）
 */
export function generateSampleSitemapEntries(baseUrl: string): SitemapEntry[] {
  const currentDate = formatDate(new Date());

  return [
    {
      url: baseUrl,
      lastmod: currentDate,
      changefreq: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastmod: currentDate,
      changefreq: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastmod: currentDate,
      changefreq: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog`,
      lastmod: currentDate,
      changefreq: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/services`,
      lastmod: currentDate,
      changefreq: "monthly",
      priority: 0.8,
    },
  ];
}

/**
 * XMLの妥当性をチェック
 */
export function validateSitemapXml(xml: string): boolean {
  try {
    // 基本的なXML構造チェック
    if (!xml.includes('<?xml version="1.0" encoding="UTF-8"?>')) {
      return false;
    }

    if (!xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) {
      return false;
    }

    if (!xml.includes("</urlset>")) {
      return false;
    }

    // URL要素の存在チェック
    const urlMatches = xml.match(/<url>/g);
    const urlCloseMatches = xml.match(/<\/url>/g);

    if (!urlMatches || !urlCloseMatches || urlMatches.length !== urlCloseMatches.length) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("XML validation error:", error);
    return false;
  }
}

/**
 * XMLファイルのダウンロード用のBlob生成
 */
export function createXmlBlob(xml: string): Blob {
  return new Blob([xml], {
    type: "application/xml;charset=utf-8",
  });
}

/**
 * XMLファイルのダウンロード処理
 */
export function downloadXmlFile(xml: string, filename: string = "sitemap.xml"): void {
  const blob = createXmlBlob(xml);
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();

  // クリーンアップ
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
