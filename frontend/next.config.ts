import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.cdn.filesafe.space',
      },
      // Avatars/attachments streamed from the Express backend (dev).
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
      },
      // Avatars/attachments streamed from the deployed Express backend.
      {
        protocol: 'https',
        hostname: 'task-management-odl-backend-rho.vercel.app',
      },
    ],
  },
};

export default nextConfig;
