import type { NextConfig } from "next";

/**
 * GitHub Pages serves this project from a subpath, so that build needs
 * `output: "export"` and a basePath. Vercel serves from the root and must not
 * get either — hence the env gate. PAGES_BUILD is set only by
 * .github/workflows/pages.yml.
 */
const isPagesBuild = process.env.PAGES_BUILD === "1";
const basePath = isPagesBuild ? "/teach-me-daddy" : "";

const nextConfig: NextConfig = {
  // The floating dev badge sits on top of the bottom tab bar.
  devIndicators: false,

  ...(isPagesBuild
    ? {
        output: "export" as const,
        basePath,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),

  // Read by src/lib/base-path.ts so asset URLs in metadata resolve on both hosts.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
