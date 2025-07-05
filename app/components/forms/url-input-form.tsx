"use client";

import { useAtom } from "jotai";
import { useCallback, useRef, useEffect } from "react";
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
  showSampleUrls?: boolean;
  disabled?: boolean;
}

export default function UrlInputForm({
  onSubmit,
  placeholder = "https://example.com",
  submitButtonText = "サイトマップを生成",
  showSampleUrls = true,
  disabled = false,
}: UrlInputFormProps) {
  const [urlState] = useAtom(urlFormAtom);
  const [, updateUrl] = useAtom(updateUrlAtom);
  const [, setUrlError] = useAtom(setUrlErrorAtom);
  const [, setSubmitting] = useAtom(setSubmittingAtom);

  // デバウンス用のタイマー参照
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // デバウンス付きバリデーション関数
  const debouncedValidation = useCallback(
    (inputValue: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
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
      }, 300); // 300ms のデバウンス
    },
    [setUrlError]
  );

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    updateUrl(inputValue);

    // デバウンス付きバリデーション
    debouncedValidation(inputValue);
  };

  // サンプルURL選択ハンドラー
  const handleSampleUrlClick = (sampleUrl: string) => {
    updateUrl(sampleUrl);
    debouncedValidation(sampleUrl);
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
        // エラーの詳細に応じたメッセージを表示
        let errorMessage = "エラーが発生しました。もう一度お試しください。";

        if (error instanceof Error) {
          if (error.message.includes("fetch")) {
            errorMessage =
              "ネットワークエラーが発生しました。インターネット接続を確認してください。";
          } else if (error.message.includes("timeout")) {
            errorMessage = "処理がタイムアウトしました。もう一度お試しください。";
          }
        }

        setUrlError(errorMessage);
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
            disabled={urlState.isSubmitting || disabled}
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

        {showSampleUrls && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">サンプルURL:</p>
            <div className="flex flex-wrap gap-2">
              {["https://github.com", "https://stackoverflow.com"].map((sampleUrl) => (
                <button
                  key={sampleUrl}
                  type="button"
                  onClick={() => handleSampleUrlClick(sampleUrl)}
                  className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  disabled={urlState.isSubmitting || disabled}
                >
                  {sampleUrl}
                </button>
              ))}
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={!urlState.isValid || urlState.isSubmitting || disabled}
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
