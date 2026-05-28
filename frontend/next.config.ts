import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_INTERNAL_URL ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.254.183",
    "thankworthy-chuffily-elizebeth.ngrok-free.dev",
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/storage/:path*",
        destination: `${backendUrl}/storage/:path*`,
      },
      {
        source: "/ar/:path*",
        destination: "http://127.0.0.1:5173/ar/:path*",
      },
    ];
  },
};

export default nextConfig;
