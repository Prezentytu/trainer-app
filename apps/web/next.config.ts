import path from "node:path";
import type { NextConfig } from "next";
import { isPublicMarketingHost } from "./lib/siteHost";

const nextConfig: NextConfig = {
  // Jawny root: watcher/Turbopack nie wychodzi poza apps/web (w korzeniu repo
  // są katalogi z assetami design systemu, których nie ma po co obserwować).
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/vi/**",
      },
    ],
  },
  experimental: {
    webpackMemoryOptimizations: true,
    preloadEntriesOnStart: false,
  },
  async redirects() {
    return [{ source: "/odpad", destination: "/ile-tracisz", permanent: true }];
  },
  async headers() {
    const noindex = { key: "X-Robots-Tag", value: "noindex, nofollow" };
    const headers: { source: string; headers: { key: string; value: string }[] }[] = [
      {
        source: "/portal/:path*",
        headers: [noindex],
      },
    ];
    if (!isPublicMarketingHost()) {
      headers.push({
        source: "/:path*",
        headers: [noindex],
      });
    }
    return headers;
  },
};

export default nextConfig;
