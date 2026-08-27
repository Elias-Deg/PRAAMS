import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack ignores the stray package-lock.json
  // in the user's home directory (removes the recurring build warning).
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
