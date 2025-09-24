import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.ats.hugo-salazar.com",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};

export default nextConfig;
