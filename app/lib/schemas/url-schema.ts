import { z } from "zod";

/**
 * URL入力フォームのバリデーションスキーマ
 */
export const urlFormSchema = z.object({
  url: z
    .string()
    .min(1, "URLを入力してください")
    .url("有効なURLを入力してください")
    .refine((url) => {
      try {
        const parsedUrl = new URL(url);
        return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
      } catch {
        return false;
      }
    }, "HTTPまたはHTTPSのURLを入力してください")
    .refine((url) => {
      try {
        const parsedUrl = new URL(url);
        // ローカルホストや内部IPアドレスの制限（セキュリティ）
        const hostname = parsedUrl.hostname;
        return (
          hostname !== "localhost" &&
          hostname !== "127.0.0.1" &&
          !hostname.startsWith("192.168.") &&
          !hostname.startsWith("10.") &&
          !hostname.startsWith("172.")
        );
      } catch {
        return false;
      }
    }, "外部のWebサイトのURLを入力してください"),
});

export type UrlFormData = z.infer<typeof urlFormSchema>;

/**
 * URL入力の状態を管理するスキーマ
 */
export const urlStateSchema = z.object({
  url: z.string().default(""),
  isValid: z.boolean().default(false),
  error: z.string().optional(),
  isSubmitting: z.boolean().default(false),
});

export type UrlState = z.infer<typeof urlStateSchema>;
