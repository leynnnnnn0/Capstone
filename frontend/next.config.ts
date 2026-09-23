import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_INTERNAL_URL ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  allowedDevOrigins: [
    "192.168.254.183",
    "thankworthy-chuffily-elizebeth.ngrok-free.dev",
    "127.0.0.1"
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.ngrok-free.dev",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
      },
      {
        // Product image URLs are stored as the public site URL in production.
        protocol: "https",
        hostname: "sogglassandaluminum.com",
      },
    ],
  },
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
