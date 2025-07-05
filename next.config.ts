import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // API Routes を Cloudflare Workers にリダイレクト
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination:
          process.env.NODE_ENV === "production"
            ? `https://sitemap-generator-api.${
                process.env.CLOUDFLARE_WORKERS_DOMAIN || "workers.dev"
              }/:path*`
            : "http://localhost:8787/:path*",
      },
    ];
  },

  // 外部API呼び出しを許可
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
