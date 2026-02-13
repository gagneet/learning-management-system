import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Disable image optimization in production (serve images directly)
    unoptimized: true,
  },
};

export default nextConfig;
