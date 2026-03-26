import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.matthausaddy.com",
      },
    ],
  },
};

export default nextConfig;
