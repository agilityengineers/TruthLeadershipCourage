import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Server Actions bodies (file/shipping forms) — keep a comfortable cap.
    serverActions: { bodySizeLimit: "4mb" },
  },
  images: {
    // Brand imagery is served from /public; remote loaders can be added per-tenant later.
    remotePatterns: [],
  },
};

export default nextConfig;
