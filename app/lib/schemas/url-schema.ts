import { z } from "zod";

/**
 * URL入力フォームのバリデーションスキーマ
 */
export const urlFormSchema = z.object({
  url: z
    .string()
    .min(1, "URLを入力してください")
    .max(2048, "URLが長すぎます（2048文字以内）")
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

        // ローカルホスト
        if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
          return false;
        }

        // プライベートIPアドレス範囲をチェック
        const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
        const ipMatch = hostname.match(ipv4Regex);

        if (ipMatch) {
          const [, a, b] = ipMatch.map(Number);

          // RFC 1918 プライベートIPアドレス範囲
          if (
            // 10.0.0.0/8
            a === 10 ||
            // 172.16.0.0/12
            (a === 172 && b >= 16 && b <= 31) ||
            // 192.168.0.0/16
            (a === 192 && b === 168) ||
            // リンクローカル 169.254.0.0/16
            (a === 169 && b === 254) ||
            // ループバック 127.0.0.0/8
            a === 127
          ) {
            return false;
          }
        }

        return true;
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
