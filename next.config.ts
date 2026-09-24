import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Project Pages serves this repo at /nearby. assetPrefix matches basePath
  // so /_next assets resolve there without a second prefix.
  basePath: "/nearby",
  assetPrefix: "/nearby",
  // Emit /about/index.html so GitHub Pages resolves trailing-slash URLs.
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
