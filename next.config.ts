import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "21.0.5.16",
    "preview-chat-df0acbcb-6713-4eef-a2ab-09a0a85d6e8c.space-z.ai",
    ".space-z.ai",
  ],
};

export default nextConfig;
