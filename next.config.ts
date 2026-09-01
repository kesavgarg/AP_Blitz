import type { NextConfig } from "next";

if (!process.env.AUTH_SECRET?.trim()) {
  throw new Error("AUTH_SECRET must be set before building");
}

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcryptjs", "@prisma/client"],
  experimental: {
    serverActions: {
      bodySizeLimit: "200mb",
      allowedOrigins: ["apblitz.com", "www.apblitz.com"],
    },
    proxyClientMaxBodySize: "200mb",
  },
};

export default nextConfig;
