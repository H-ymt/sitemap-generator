"use client";

import { useAtom } from "jotai";
import { urlFormSchema } from "../../lib/schemas/url-schema";
import {
  urlFormAtom,
  updateUrlAtom,
  setUrlErrorAtom,
  setSubmittingAtom,
} from "../../lib/store/url-store";
import { Button } from "../ui/button";

interface UrlInputFormProps {
  onSubmit?: (url: string) => void | Promise<void>;
  placeholder?: string;
  submitButtonText?: string;
}

export default function UrlInputForm({
  onSubmit,
  placeholder = "https://example.com",
  submitButtonText = "サイトマップを生成",
}: UrlInputFormProps) {
  const [urlState] = useAtom(urlFormAtom);
  const [, updateUrl] = useAtom(updateUrlAtom);
  const [, setUrlError] = useAtom(setUrlErrorAtom);
  const [, setSubmitting] = useAtom(setSubmittingAtom);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    updateUrl(inputValue);

    // リアルタイムバリデーション
    if (inputValue.trim()) {
      const result = urlFormSchema.safeParse({ url: inputValue });
      if (!result.success) {
        setUrlError(result.error.errors[0]?.message);
      } else {
        setUrlError(undefined);
      }
    } else {
      setUrlError(undefined);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!urlState.url.trim()) {
      setUrlError("URLを入力してください");
      return;
    }

    const result = urlFormSchema.safeParse({ url: urlState.url });

    if (!result.success) {
      setUrlError(result.error.errors[0]?.message);
      return;
    }

    if (onSubmit) {
      try {
        setSubmitting(true);
        await onSubmit(urlState.url);
      } catch (error) {
        setUrlError("エラーが発生しました。もう一度お試しください。");
        console.error("Form submission error:", error);
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="url-input"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            ウェブサイトのURL
          </label>
          <input
            id="url-input"
            type="url"
            value={urlState.url}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={`
              w-full px-4 py-3 border rounded-lg text-lg
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              transition-colors duration-200
              ${
                urlState.error
                  ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                  : urlState.isValid
                  ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                  : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              }
              dark:text-white placeholder:text-gray-400
            `}
            disabled={urlState.isSubmitting}
            aria-describedby={urlState.error ? "url-error" : undefined}
          />
          {urlState.error && (
            <p
              id="url-error"
              className="text-sm text-red-600 dark:text-red-400 mt-1"
              role="alert"
            >
              {urlState.error}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={!urlState.isValid || urlState.isSubmitting}
          size="lg"
          className="w-full"
        >
          {urlState.isSubmitting ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>処理中...</span>
            </div>
          ) : (
            submitButtonText
          )}
        </Button>
      </form>
    </div>
  );
}
