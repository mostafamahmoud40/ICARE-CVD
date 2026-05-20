import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ],
  },
};

export default nextConfig;
