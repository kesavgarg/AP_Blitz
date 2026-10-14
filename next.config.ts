import type { NextConfig } from "next";

const authSecret = process.env.AUTH_SECRET?.trim() ?? "";
const weakSecrets = new Set(["change-me", "replace-with-a-long-random-string", "secret", "password"]);
if (authSecret.length < 32 || weakSecrets.has(authSecret)) {
  throw new Error("AUTH_SECRET must be a unique random string of at least 32 characters.");
}

const scriptSrc =
  process.env.NODE_ENV === "production"
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

const contentSecurityPolicy = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://i.ytimg.com https://*.cdninstagram.com https://*.fbcdn.net",
  "media-src 'self' blob: https://www.youtube.com",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://www.instagram.com",
  "connect-src 'self' https://fcm.googleapis.com https://*.push.services.mozilla.com https://updates.push.services.mozilla.com",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcryptjs", "@prisma/client", "web-push"],
  experimental: {
    serverActions: {
      bodySizeLimit: "32mb",
    },
    proxyClientMaxBodySize: "32mb",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
