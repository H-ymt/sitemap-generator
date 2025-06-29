import { z } from "zod";

// Request schemas
export const CrawlRequestSchema = z.object({
  url: z.string().url("有効なURLを入力してください"),
  maxDepth: z.number().min(1).max(3).default(2),
  maxPages: z.number().min(1).max(100).default(50),
});

// Response schemas
export const CrawlResultSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      baseUrl: z.string().url(),
      pages: z.array(
        z.object({
          url: z.string().url(),
          title: z.string().optional(),
          lastModified: z.string().optional(),
          priority: z.number().min(0).max(1).default(0.5),
        })
      ),
      totalPages: z.number(),
      crawlTime: z.number(),
    })
    .optional(),
  error: z.string().optional(),
});

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
});

// Types
export type CrawlRequest = z.infer<typeof CrawlRequestSchema>;
export type CrawlResult = z.infer<typeof CrawlResultSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export interface CrawlPage {
  url: string;
  title?: string;
  lastModified?: string;
  priority: number;
}

export interface CrawlContext {
  baseUrl: string;
  visitedUrls: Set<string>;
  pages: CrawlPage[];
  maxDepth: number;
  maxPages: number;
  currentDepth: number;
}
