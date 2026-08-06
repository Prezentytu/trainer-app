import path from "node:path";
import type { NextConfig } from "next";

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
  async headers() {
    return [
      {
        source: "/portal/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
