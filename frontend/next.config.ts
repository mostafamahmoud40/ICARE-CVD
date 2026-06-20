import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";
import createNextIntlPlugin from "next-intl/plugin";

const projectDir = path.dirname(fileURLToPath(import.meta.url));
const i18nRequestConfig = "./src/i18n/request.ts";

const withNextIntl = createNextIntlPlugin(i18nRequestConfig);

const nextConfig: NextConfig = {
  // Explicit alias so Turbopack/Webpack always resolve next-intl config (see next-intl plugin).
  turbopack: {
    resolveAlias: {
      "next-intl/config": i18nRequestConfig,
    },
  },
  webpack: (config) => {
    config.resolve ??= {};
    config.resolve.alias ??= {};
    config.resolve.alias["next-intl/config"] = path.join(
      projectDir,
      "src/i18n/request.ts",
    );
    return config;
  },
  // Dev-only: allow HMR when the page origin mixes localhost vs 127.0.0.1
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
