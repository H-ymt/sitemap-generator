"use client";

import Container from "./components/container";
import UrlInputForm from "./components/forms/url-input-form";

export default function Home() {
  const handleUrlSubmit = async (url: string) => {
    // TODO: Cloudflare Workers APIへのリクエスト処理を実装
    console.log("Submitted URL:", url);

    // 仮の処理時間をシミュレート
    await new Promise((resolve) => setTimeout(resolve, 2000));

    alert(`サイトマップ生成を開始します: ${url}`);

    // try {
    //   const response = await fetch("/api/generate-sitemap", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ url }),
    //   });

    //   const result = await response.json();
    //   // サイトマップ生成結果の処理
    // } catch (error) {
    //   // エラーハンドリング
    // }
  };

  //   const handleUrlSubmit = async (url: string) => {
  //   const sitemap = await generateSitemap(url);
  //   router.push(`/sitemap/${sitemap.id}`);
  // };

  return (
    <Container>
      <div className="py-12 md:py-20">
        <div className="text-center space-y-10">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              サイトマップジェネレーター
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              WebサイトのURLを入力するだけで、自動的にサイトマップXMLを生成します。
              SEO最適化とサイト構造の把握に最適なツールです。
            </p>
          </div>

          <UrlInputForm
            onSubmit={handleUrlSubmit}
            placeholder="https://example.com"
            submitButtonText="サイトマップを生成"
          />

          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>
              ✓ 無料で利用可能 &nbsp;|&nbsp; ✓ XMLファイルをダウンロード &nbsp;|&nbsp; ✓
              SEO最適化済み
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
}
