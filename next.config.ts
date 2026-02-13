import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 85, 90, 92, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ipgjaodhdeqjrxapjlxx.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
