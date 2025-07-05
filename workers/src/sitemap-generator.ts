import { SitemapPage } from "./sitemap-types";

export function generateSitemapXML(
  pages: SitemapPage[],
  options: {
    includeLastmod?: boolean;
    includeChangefreq?: boolean;
    includePriority?: boolean;
  } = {}
): string {
  const { includeLastmod = true, includeChangefreq = true, includePriority = true } = options;

  const header = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  const footer = `</urlset>`;

  const urls = pages
    .map((page) => {
      let urlEntry = `  <url>
    <loc>${escapeXml(page.url)}</loc>`;

      if (includeLastmod && page.lastmod) {
        urlEntry += `
    <lastmod>${escapeXml(page.lastmod)}</lastmod>`;
      }

      if (includeChangefreq && page.changefreq) {
        urlEntry += `
    <changefreq>${escapeXml(page.changefreq)}</changefreq>`;
      }

      if (includePriority && page.priority !== undefined) {
        urlEntry += `
    <priority>${page.priority.toFixed(1)}</priority>`;
      }

      urlEntry += `
  </url>`;

      return urlEntry;
    })
    .join("\n");

  return `${header}\n${urls}\n${footer}`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function validateSitemapPages(pages: SitemapPage[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!Array.isArray(pages)) {
    errors.push("Pages must be an array");
    return { valid: false, errors };
  }

  if (pages.length === 0) {
    errors.push("Pages array cannot be empty");
    return { valid: false, errors };
  }

  if (pages.length > 50000) {
    errors.push("Sitemap cannot contain more than 50,000 URLs");
  }

  pages.forEach((page, index) => {
    if (!page.url) {
      errors.push(`Page ${index + 1}: URL is required`);
    } else {
      try {
        new URL(page.url);
      } catch {
        errors.push(`Page ${index + 1}: Invalid URL format`);
      }
    }

    if (page.priority !== undefined && (page.priority < 0 || page.priority > 1)) {
      errors.push(`Page ${index + 1}: Priority must be between 0.0 and 1.0`);
    }

    if (
      page.changefreq &&
      !["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"].includes(
        page.changefreq
      )
    ) {
      errors.push(`Page ${index + 1}: Invalid changefreq value`);
    }

    if (page.lastmod) {
      const date = new Date(page.lastmod);
      if (isNaN(date.getTime())) {
        errors.push(`Page ${index + 1}: Invalid lastmod date format`);
      }
    }
  });

  return { valid: errors.length === 0, errors };
}
