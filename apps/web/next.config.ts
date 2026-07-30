import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Jawny root: watcher/Turbopack nie wychodzi poza apps/web (w korzeniu repo
  // są katalogi z assetami design systemu, których nie ma po co obserwować).
  turbopack: {
    root: path.join(__dirname),
  },
  experimental: {
    webpackMemoryOptimizations: true,
    preloadEntriesOnStart: false,
  },
};

export default nextConfig;
